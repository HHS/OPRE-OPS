from http import HTTPStatus
import os

from authlib.integrations.django_client import OAuth
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView


oauth = OAuth()
oauth.register(
    "google",
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_id=os.getenv("OIDC_CLIENT_ID"),
    client_secret=os.getenv("OIDC_CLIENT_SECRET"),
    client_kwargs={"scope": "openid"},
)


class OidcController(APIView):
    permission_classes = [AllowAny]

    @staticmethod
    def post(request: Request):
        callback_url = request.data["callbackUrl"]
        state = request.data["state"]

        print(
            f"Got an OIDC request with the callback URL of {callback_url} and a state of {state}"
        )

        # This isn't quite right because this request isn't the actual callback
        token = oauth.google.fetch_access_token(redirect_uri=callback_url)

        return Response({"jwt": "OPS-specific JWT"}, status=HTTPStatus.OK)
