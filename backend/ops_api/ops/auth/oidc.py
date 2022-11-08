from http import HTTPStatus
import time
import uuid

from django.conf import settings
from ops_api.ops.contexts.application_context import ApplicationContext
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView


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
            print(token)
            return Response({"jwt": "OPS-specific JWT"}, status=HTTPStatus.OK)
        except Exception:
            return "There was an error."


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
