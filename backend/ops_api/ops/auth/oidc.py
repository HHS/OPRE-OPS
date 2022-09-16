from http import HTTPStatus

from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView


class OidcController(APIView):
    permission_classes = [AllowAny]

    @staticmethod
    def post(request: Request):
        callback_url = request.data["callbackUrl"]
        state = request.data["state"]

        print(
            f"Got an OIDC request with the callback URL of {callback_url} and a state of {state}"
        )

        return Response({"jwt": "OPS-specific JWT"}, status=HTTPStatus.OK)
