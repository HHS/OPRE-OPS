import time
import uuid

import pytest
from authlib.jose import jwt
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives.asymmetric import rsa
from flask import current_app
from flask_jwt_extended import create_access_token

from models.users import User
from ops_api.ops.utils.auth import create_oauth_jwt
from ops_api.ops.utils.authorization import AuthorizationGateway, AuthorizationProvider

key = rsa.generate_private_key(backend=default_backend(), public_exponent=65537, key_size=2048)


def test_get_jwt_no_key(app):
    with app.test_request_context("/auth/login", method="POST", data={"provider": "fakeauth", "code": ""}):
        jwt1 = create_oauth_jwt(
            "fakeauth",
            key,
            {"alg": "RS256"},
            {
                "sub": "1234567890",
                "name": "John Doe",
                "admin": "true",
                "iat": 1516239022,
            },
        )
        print(jwt)
        assert jwt is not None
        assert len(str(jwt1)) == 477

        decoded = jwt.decode(jwt1, key.public_key())
        assert decoded["sub"] == "1234567890"


@pytest.mark.skip(reason="Need to clean up auth a bit")
@pytest.mark.usefixtures("app_ctx")
def test_get_jwt_is_valid_jws():
    header = {"alg": "RS256"}
    payload = {
        "iss": "client_id",
        "sub": "client_id",
        "aud": "https://some.endpoint.test",
        "jti": str(uuid.uuid4()),
        "exp": int(time.time()) + 300,
    }
    jws = create_oauth_jwt("fakeauth", key, header, payload)
    print(f"jws: {jws}")
    assert jws is not None


@pytest.mark.skip("Need to work out better key management for TESTS")
@pytest.mark.usefixtures("app_ctx")
def test_create_access_token(loaded_db, app):
    user = loaded_db.session.get(User, "00000000-0000-1111-a111-000000000001")
    access_token = create_access_token(identity=user)
    pub_key = current_app.config.get("JWT_PUBLIC_KEY")
    decoded = jwt.decode(access_token, pub_key)
    assert decoded["sub"] == user.oidc_id


@pytest.mark.usefixtures("app_ctx")
def test_authorization_gateway_authorize_successful(mocker):
    class MockAuthorizationProvider(AuthorizationProvider):
        def is_authorized(self, user_id: str, permission: list[str]):
            return True

    mock_basic_provider = MockAuthorizationProvider()
    mocker.patch.object(mock_basic_provider, "is_authorized")
    authorization_gateway = AuthorizationGateway(mock_basic_provider)
    result = authorization_gateway.authorize("1234-5432-1234", ["can_read", "portfolio_read"])
    assert result is True
