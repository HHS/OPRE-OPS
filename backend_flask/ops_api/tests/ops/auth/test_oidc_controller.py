from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives.serialization import (
    Encoding,
    NoEncryption,
    PrivateFormat,
)


def test_auth_post_fails(client):
    data = {"code": "abc1234"}

    res = client.post("http://localhost:8080/auth/login", json=data)
    assert res == "There was an error."


# def test_get_jwt_not_none():
#     key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
#     print(key)
#     encoded = key.private_bytes(
#         Encoding.PEM, PrivateFormat.TraditionalOpenSSL, NoEncryption()
#     )
#     print(encoded)
#     assert get_jwt(encoded) is not None
