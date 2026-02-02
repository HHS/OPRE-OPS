import json
from unittest.mock import MagicMock

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa

from ops_api.ops.auth.authentication_provider.hhs_ams_provider import HhsAmsProvider


def test_create_provider(app, app_ctx):
    provider = HhsAmsProvider("hhsams", app.config)
    assert provider.provider_name == "hhsams"
    assert provider.config == app.config
    assert provider.client_id == app.config["AUTHLIB_OAUTH_CLIENTS"]["hhsams"]["client_id"]
    assert provider.server_metadata_url == app.config["AUTHLIB_OAUTH_CLIENTS"]["hhsams"]["server_metadata_url"]
    assert provider.scope == app.config["AUTHLIB_OAUTH_CLIENTS"]["hhsams"]["client_kwargs"]["scope"]
    assert provider.redirect_uri == app.config["AUTHLIB_OAUTH_CLIENTS"]["hhsams"]["redirect_uri"]
    assert provider.JWT_ACCESS_TOKEN_EXPIRES == app.config["JWT_ACCESS_TOKEN_EXPIRES"]
    assert provider.aud == app.config["AUTHLIB_OAUTH_CLIENTS"]["hhsams"]["aud"]
    assert provider.token_endpoint == app.config["AUTHLIB_OAUTH_CLIENTS"]["hhsams"]["token_endpoint"]
    assert provider.user_info_url == app.config["AUTHLIB_OAUTH_CLIENTS"]["hhsams"]["user_info_url"]


def test_decode_user(app, mocker, app_ctx):
    # Generate a public/private key pair for testing
    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    public_key = (
        private_key.public_key()
        .public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo,
        )
        .decode("utf-8")
    )

    # Create a JWKS to return from the mock
    jwks = {
        "iss": "https://sso-stage.acf.hhs.gov/auth/realms/ACF-SSO",
        "jti": "f7f3b3b7-3b7d-4b7b-8b7b-7b7b7b7b7b7b",
        "exp": 1632710400,
        "keys": [public_key],
    }

    mock_get_jwks = mocker.patch("ops_api.ops.auth.authentication_provider.hhs_ams_provider.get_jwks")
    mock_get_jwks.return_value = json.dumps(jwks)

    # Create a JWT containing user information
    payload = {
        "iss": "https://sso-stage.acf.hhs.gov/auth/realms/ACF-SSO",
        "sub": "44fe2c7a-e9c5-43ec-87e9-3de78d2d3a11",
        "aud": "https://sso-stage.acf.hhs.gov/auth/realms/ACF-SSO",
        "jti": "f7f3b3b7-3b7d-4b7b-8b7b-7b7b7b7b7b7b",
        "exp": 1632710400,
        "sso": "hhsams",
        "name": "John Doe",
        "email": "john.doe@example.com",
    }
    from authlib.jose import jwt as jose_jwt

    jws = jose_jwt.encode(header={"alg": "RS256"}, payload=payload, key=private_key)

    # Test the decode_user method
    provider = HhsAmsProvider("hhsams", app.config)
    claims = provider.decode_user(jws)

    assert claims["iss"] == "https://sso-stage.acf.hhs.gov/auth/realms/ACF-SSO"
    assert claims["sub"] == "44fe2c7a-e9c5-43ec-87e9-3de78d2d3a11"
    assert claims["aud"] == "https://sso-stage.acf.hhs.gov/auth/realms/ACF-SSO"
    assert claims["jti"] == "f7f3b3b7-3b7d-4b7b-8b7b-7b7b7b7b7b7b"
    assert claims["exp"] == 1632710400
    assert claims["sso"] == "hhsams"
    assert claims["name"] == "John Doe"
    assert claims["email"] == "john.doe@example.com"


def test_authenticate(app, mocker, app_ctx):
    # mock member method fetch_token on the HhsAmsProvider class
    mock_fetch_token = mocker.patch(
        "ops_api.ops.auth.authentication_provider.hhs_ams_provider.HhsAmsProvider.fetch_token"
    )
    # mock create_oauth_jwt method
    # N.B. This currently fails in GHA because the key is not being passed in correctly but is not
    # a problem in local testing
    mocker.patch("ops_api.ops.auth.authentication_provider.hhs_ams_provider.create_oauth_jwt")
    mock_fetch_token.return_value = MagicMock()
    provider = HhsAmsProvider("hhsams", app.config)
    token = provider.authenticate("1234")
    assert token is not None
