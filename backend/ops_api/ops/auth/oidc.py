from http import HTTPStatus

from authlib.integrations.django_client import OAuth
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView


oauth = OAuth()


class OidcController(APIView):
    permission_classes = [AllowAny]

    @staticmethod
    def post(request: Request):
        callback_url = request.data["callbackUrl"]
        state = request.data["state"]
        pkce_code_verifier = request.data["pkceCodeVerifier"]

        print(
            f"Got an OIDC request with the callback URL of {callback_url} and a state of {state}"
        )

        token = oauth.logingov.fetch_access_token(redirect_uri=callback_url, code_verifier=pkce_code_verifier)
        print(token)

        return Response({"jwt": "OPS-specific JWT"}, status=HTTPStatus.OK)
