from http import HTTPStatus
import time
import uuid

from authlib.integrations.django_client import OAuth
from authlib.jose import jwt
from django.conf import settings
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView


oauth = OAuth()
oauth.register("logingov")


class OidcController(APIView):
    permission_classes = [AllowAny]

    @staticmethod
    def post(request: Request):
        print(f"request.data = {request.data}")

        code = request.data.get("code")

        print(f"Got an OIDC request with the code of {code}")

        token = oauth.logingov.fetch_access_token(
            client_assertion=OidcController.get_jwt(),
            client_assertion_type="urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
            grant_type="authorization_code",
            code=code,
        )
        print(token)

        return Response({"jwt": "OPS-specific JWT"}, status=HTTPStatus.OK)

    @staticmethod
    def get_jwt():

        key_path = (
            settings.BASE_DIR / ".." / "ops" / "management" / "key" / "dev_only.pem"
        )
        with key_path.open("rb") as f:
            key = f.read()

        header = {"alg": "RS256"}
        client_id = "urn:gov:gsa:openidconnect.profiles:sp:sso:hhs_acf:opre_ops_jwt"
        payload = {
            "iss": client_id,
            "sub": client_id,
            "aud": "https://idp.int.identitysandbox.gov/api/openid_connect/token",
            "jti": str(uuid.uuid4()),
            "exp": int(time.time()) + 300,
        }
        jws = jwt.encode(header, payload, key)

        return jws
