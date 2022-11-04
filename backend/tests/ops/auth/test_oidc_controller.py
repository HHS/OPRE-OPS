from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives.serialization import (
    Encoding,
    NoEncryption,
    PrivateFormat,
)
from django.http import HttpRequest
from ops_api.ops.auth.oidc import OidcController, get_jwt
from ops_api.ops.contexts.application_context import ApplicationContext, TestContext
from rest_framework.request import Request

ApplicationContext.register_context(TestContext)


def test_auth_post_fails():
    data = '{"code":"abc1234"}'
    http_req = HttpRequest()
    http_req.path = "http://localhost:8080/auth"
    http_req.method = "POST"
    http_req.data = data
    req = Request(request=http_req)
    # req = Request("POST","http://localhost:8080/auth",data=data,json=data)
    res = OidcController.post(req)
    assert res == "There was an error."


def test_get_jwt_not_none():
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    print(key)
    encoded = key.private_bytes(
        Encoding.PEM, PrivateFormat.TraditionalOpenSSL, NoEncryption()
    )
    print(encoded)
    assert get_jwt(encoded) is not None
