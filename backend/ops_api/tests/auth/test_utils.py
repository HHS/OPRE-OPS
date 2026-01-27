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
from ops_api.ops.auth.utils import create_oauth_jwt, get_user

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
def test_get_jwt_is_valid_jws(app, app_ctx):
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
def test_create_access_token(loaded_db, app, app_ctx):
    user = loaded_db.session.get(User, "00000000-0000-1111-a111-000000000001")
    access_token = create_access_token(identity=user)
    pub_key = current_app.config.get("JWT_PUBLIC_KEY")
    decoded = jwt.decode(access_token, pub_key)
    assert decoded["sub"] == user.oidc_id


def test_authorization_gateway_authorize_successful(mocker, app_ctx):
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


@pytest.fixture()
def hhsams_user_info():
    yield {
        "sub": "6b3f72cb-0c04-4eff-94b3-fa012f63a9c6",
        "aud": "1aba44a4-4fd3-4d8b-a4bc-d8afecc6abb7",
        "email_verified": True,
        "hhsid": "9765836011",
        "IAL": 3,
        "name": "JOHN DOE",
        "iss": "https://sso-stage.acf.hhs.gov/auth/realms/ACF-SSO",
        "preferred_username": "john.doe@acf.hhs.gov",
        "AAL": 3,
        "given_name": "JOHN",
        "family_name": "DOE",
        "email": "john.doe@acf.hhs.gov",
    }


def test_get_user(user_with_no_oidc_id, loaded_db):
    # test happy path
    user = get_user(
        {
            "email": "admin.demo@email.com",
            "sub": "00000000-0000-1111-a111-000000000018",
            "given_name": "Admin",
        },
        loaded_db,
    )
    assert user is not None
    assert user.email == "admin.demo@email.com"

    # test user with no oidc_id
    stmt = select(User).where(User.email == "user@example.com")  # type: ignore
    user = loaded_db.scalars(stmt).one_or_none()
    assert user is not None
    assert user.oidc_id is None

    user = get_user(
        {
            "email": "user@example.com",
            "sub": "9b5b5b5e-5288-401d-8267-a80605cce16f",
            "given_name": "Admin",
        },
        loaded_db,
    )
    assert user is not None
    assert user.email == "user@example.com"
    stmt = select(User).where(User.email == "user@example.com")  # type: ignore
    user = loaded_db.scalars(stmt).one_or_none()
    assert user is not None
    assert user.oidc_id == UUID("9b5b5b5e-5288-401d-8267-a80605cce16f")


def test_get_user_info_set(loaded_db, hhsams_user_info):
    user = User(oidc_id=UUID(hhsams_user_info["sub"]), email="replace me")
    loaded_db.add(user)
    loaded_db.commit()

    user = get_user(hhsams_user_info, loaded_db)
    assert user is not None
    assert user.oidc_id == UUID(hhsams_user_info["sub"])
    assert user.email == hhsams_user_info["email"]
    assert user.first_name == hhsams_user_info["given_name"]
    assert user.last_name == hhsams_user_info["family_name"]
    assert user.hhs_id == hhsams_user_info["hhsid"]

    # cleanup
    loaded_db.delete(user)
    loaded_db.commit()
