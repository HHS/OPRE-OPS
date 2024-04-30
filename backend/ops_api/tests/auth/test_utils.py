import time
import uuid
from uuid import UUID

import pytest
from authlib.jose import jwt
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives.asymmetric import rsa
from flask import current_app
from flask_jwt_extended import create_access_token
from sqlalchemy import select

from models.users import User
from ops_api.ops.auth.authorization_providers import AuthorizationGateway
from ops_api.ops.auth.exceptions import NotActiveUserError
from ops_api.ops.auth.utils import create_oauth_jwt, register_user

key = rsa.generate_private_key(backend=default_backend(), public_exponent=65537, key_size=2048)


def test_get_jwt_no_key(app):
    with app.test_request_context("/auth/login", method="POST", data={"provider": "fakeauth", "code": ""}):
        jwt1 = create_oauth_jwt(
            "fakeauth",
            app.config,
            key=key,
            header={"alg": "RS256"},
            payload={
                "sub": "1234567890",
                "name": "John Doe",
                "admin": "true",
                "iat": 1516239022,
            },
        )
        assert jwt is not None
        assert len(str(jwt1)) == 477

        decoded = jwt.decode(jwt1, key.public_key())
        assert decoded["sub"] == "1234567890"


@pytest.mark.skip(reason="Need to clean up auth a bit")
@pytest.mark.usefixtures("app_ctx")
def test_get_jwt_is_valid_jws(app):
    header = {"alg": "RS256"}
    payload = {
        "iss": "client_id",
        "sub": "client_id",
        "aud": "https://some.endpoint.test",
        "jti": str(uuid.uuid4()),
        "exp": int(time.time()) + 300,
    }
    jws = create_oauth_jwt("fakeauth", app.config, key=key, header=header, payload=payload)
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
    class MockAuthorizationProvider:
        def is_authorized(self, user_id: str, permission: list[str]):
            return True

    mock_basic_provider = MockAuthorizationProvider()
    mocker.patch.object(mock_basic_provider, "is_authorized")
    authorization_gateway = AuthorizationGateway(mock_basic_provider)
    result = authorization_gateway.authorize("1234-5432-1234", ["can_read", "portfolio_read"])
    assert result is True


@pytest.fixture()
def user_with_no_oidc_id(loaded_db):
    user = User(
        oidc_id=None,
        email="user@example.com",
        first_name="User",
        last_name="Example",
    )
    loaded_db.add(user)
    loaded_db.commit()
    yield user

    loaded_db.delete(user)
    loaded_db.commit()


def test_register_user(user_with_no_oidc_id, loaded_db):
    # test happy path
    user, new_user = register_user(
        {
            "email": "admin.demo@email.com",
            "sub": "00000000-0000-1111-a111-000000000018",
            "given_name": "Admin",
        }
    )
    assert user is not None
    assert new_user is False
    assert user.email == "admin.demo@email.com"

    # test user with no oidc_id
    stmt = select(User).where(User.email == "user@example.com")
    user = loaded_db.scalars(stmt).one_or_none()
    assert user is not None
    assert user.oidc_id is None

    user, new_user = register_user(
        {
            "email": "user@example.com",
            "sub": "9b5b5b5e-5288-401d-8267-a80605cce16f",
            "given_name": "Admin",
        }
    )
    assert user is not None
    assert new_user is False
    assert user.email == "user@example.com"
    stmt = select(User).where(User.email == "user@example.com")
    user = loaded_db.scalars(stmt).one_or_none()
    assert user is not None
    assert user.oidc_id == UUID("9b5b5b5e-5288-401d-8267-a80605cce16f")

    # test new user
    with pytest.raises(NotActiveUserError):
        register_user(
            {
                "email": "new_user@example.com",
                "sub": "0a513599-c178-4db8-a968-bd3543a8678f",
                "given_name": "New User",
            }
        )
        stmt = select(User).where(User.email == "new_user@example.com")
        user = loaded_db.scalars(stmt).one_or_none()
        assert user is not None
        assert user.oidc_id == UUID("0a513599-c178-4db8-a968-bd3543a8678f")

    # TODO: generate a real JWT token and test the register_user function for creating a new user
