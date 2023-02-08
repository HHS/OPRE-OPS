import time
import uuid

import pytest
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives.asymmetric import rsa
from ops.utils.auth import create_oauth_jwt


@pytest.mark.skip(reason="Need to clean up auth a bit")
def test_get_jwt_no_key(app):
    with app.test_request_context("/auth/login", method="POST", data={"code": ""}):
        jwt = create_oauth_jwt()
        assert jwt is not None
        assert len(str(jwt)) == 738


@pytest.mark.skip(reason="Need to clean up auth a bit")
@pytest.mark.usefixtures("app_ctx")
def test_get_jwt_is_valid_jws():
    key = rsa.generate_private_key(backend=default_backend(), public_exponent=65537, key_size=2048)

    header = {"alg": "RS256"}
    payload = {
        "iss": "client_id",
        "sub": "client_id",
        "aud": "https://some.endpoint.test",
        "jti": str(uuid.uuid4()),
        "exp": int(time.time()) + 300,
    }
    jws = create_oauth_jwt(key, header, payload)
    print(f"jws: {jws}")
    assert jws is not None
