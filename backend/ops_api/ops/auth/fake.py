from http import HTTPStatus
import time
import uuid

from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from ops_api.ops.contexts.application_context import ApplicationContext


class FakeController(APIView):
    permission_classes = [AllowAny]

    @staticmethod
    def post(request: Request) -> Response:
        """
        We're just making stuff up

        Returns:
            Response: Fake response
        """

        return Response({"jwt": "OPS-specific JWT"}, status=HTTPStatus.OK)


def get_jwt():

    key = "fake_key_1234567890"

    client_id = "abc123xyz890"
    payload = {
        "iss": client_id,
        "sub": client_id,
        "aud": "https://fake.ops.local",
        "jti": str(uuid.uuid4()),
        "exp": int(time.time()) + 300,
    }
    header = {"alg": "RS256"}
    jws = ApplicationContext.get_context().jwt_library().encode(header, payload, key)

    return jws
