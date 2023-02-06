import time
import uuid

from ops.utils.auth import get_jwt
import pytest


@pytest.mark.skip(reason="Need to clean up auth a bit")
def test_get_jwt_no_key(app):
    with app.test_request_context("/auth/login", method="POST", data={"code": ""}):
        jwt = get_jwt()
        assert jwt is not None
        assert len(str(jwt)) == 738


@pytest.mark.usefixtures("app_ctx")
def test_get_jwt_is_valid_jws():
    private_key = ""  # TODO: Generate a dynamic key here instead of storing a static one.

    header = {"alg": "RS256"}
    payload = {
        "iss": "client_id",
        "sub": "client_id",
        "aud": "https://idp.int.identitysandbox.gov/api/openid_connect/token",
        "jti": str(uuid.uuid4()),
        "exp": int(time.time()) + 300,
    }
    jws = get_jwt(private_key, header, payload)
    print(f"jws: {jws}")
    assert jws is not None
