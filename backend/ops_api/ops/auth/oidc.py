import datetime
from http import HTTPStatus
import time
import traceback
import uuid

from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth import get_user_model
import requests
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from ops_api.ops.contexts.application_context import ApplicationContext
from ops_api.ops.users.models import User


# Logout
# https://idp.int.identitysandbox.gov/openid_connect/logout?client_id=urn:gov:gsa:openidconnect.profiles:sp:sso:hhs_acf:opre_ops&post_logout_redirect_uri=http://localhost:3000
class OidcController(APIView):
    permission_classes = [AllowAny]

    @staticmethod
    def post(request: Request) -> Response:

        code = request.data.get("code")

        print(f"Got an OIDC request with the code of {code}")
        try:
            token = (
                ApplicationContext.get_context()
                .auth_library()
                .fetch_access_token(
                    client_assertion=get_jwt(),
                    client_assertion_type="urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
                    grant_type="authorization_code",
                    code=code,
                )
            )
            print(type(token))
            print(token)
            header = {"Authorization": f'Bearer {token["access_token"]}'}
            user_data = requests.get(
                "https://idp.int.identitysandbox.gov/api/openid_connect/userinfo",
                headers=header,
            ).json()
            print(user_data)

            # Generate internal backend-JWT
            # - user meta data
            # - endpoints validate backend-JWT
            #   - refesh - within 15 min - also include a call to login.gov /refresh
            #   - invalid JWT
            # - create backend-JWT endpoints /refesh /validate (drf-simplejwt)

            # See if user exists
            user = process_user(user_data)  # Refactor me
            user.auth_token = str(token)
            user.last_login = datetime.datetime.now()
            user.save()

            authenticate(request, username=user_data["sub"])
            refresh = RefreshToken.for_user(user)
            return Response(
                {
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                },
                status=HTTPStatus.OK,
            )
        except Exception as err:
            traceback.print_exc()
            return Response(
                {"error": f"An error occured: {err}"}, status=HTTPStatus.FORBIDDEN
            )


class BlacklistTokenUpdateView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = ()

    def post(self, request):
        try:
            refresh_token = request.data["refresh_token"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except Exception as e:
            print(e)
            traceback.print_exception()
            return Response(status=status.HTTP_400_BAD_REQUEST)


def get_jwt(key=settings.JWT_PRIVATE_KEY):

    if not key:
        raise NotImplementedError

    client_id = settings.AUTHLIB_OAUTH_CLIENTS["logingov"]["client_id"]
    payload = {
        "iss": client_id,
        "sub": client_id,
        "aud": "https://idp.int.identitysandbox.gov/api/openid_connect/token",
        "jti": str(uuid.uuid4()),
        "exp": int(time.time()) + 300,
    }
    header = {"alg": "RS256"}
    jws = ApplicationContext.get_context().jwt_library().encode(header, payload, key)

    return jws


def process_user(userinfo) -> User:
    if userinfo is None:
        return None
    try:
        return get_user_model().objects.get(email=userinfo["email"])
    except (User.DoesNotExist, AttributeError, TypeError):
        # Create new user
        return get_user_model().objects.create_user(
            fname="", lname="", email=userinfo["email"], uuid=userinfo["sub"]
        )
