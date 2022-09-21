from http import HTTPStatus

from authlib.integrations.django_client import OAuth
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
        callback_url = request.data["callbackUrl"]
        # state = request.data["state"]
        code = request.data.get("code")
        code_challenge = request.data.get("code_challenge")

        pkce_code_verifier = request.data["pkceCodeVerifier"]

        print(
            f"Got an OIDC request with the callback URL of {callback_url} and code of {code}"
        )

        token = oauth.logingov.fetch_access_token(
            code_verifier=pkce_code_verifier,
            grant_type="authorization_code",
            code=code,
        )
        print(token)

        return Response({"jwt": "OPS-specific JWT"}, status=HTTPStatus.OK)
