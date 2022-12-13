from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives.serialization import Encoding
from cryptography.hazmat.primitives.serialization import NoEncryption
from cryptography.hazmat.primitives.serialization import PrivateFormat
from ops.utils.auth import get_jwt
import pytest


def test_auth_post_fails(client):
    data = {"code": "abc1234"}

    res = client.post("/api/v1/auth/login/", json=data)
    assert res.status_code == 400


@pytest.mark.skip(reason="needs CI updating")
def test_get_jwt_not_none(app):
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    encoded = key.private_bytes(
        Encoding.PEM, PrivateFormat.TraditionalOpenSSL, NoEncryption()
    )
    with app.test_request_context("/auth/login", method="POST", data={"code": ""}):
        assert get_jwt(encoded) is not None
