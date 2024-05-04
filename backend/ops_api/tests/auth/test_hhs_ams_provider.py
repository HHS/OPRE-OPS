import json
import os
from datetime import timedelta
from unittest.mock import MagicMock

import pytest
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from flask import Config

from ops_api.ops.auth.authentication_provider.hhs_ams_provider import HhsAmsProvider


@pytest.fixture()
def config() -> Config:
    config = Config({})
    config.from_mapping(
        {
            "AUTHLIB_OAUTH_CLIENTS": {
                "hhs_ams": {
                    "client_id": "client_id",
                    "server_metadata_url": "https://some.endpoint.test",
                    "client_kwargs": {
                        "scope": "openid",
                    },
                    "redirect_uri": "https://some.endpoint.test",
                    "aud": "https://some.endpoint.test",
                    "token_endpoint": "https://some.endpoint.test",
                    "user_info_url": "https://some.endpoint.test",
                }
            },
            "JWT_ACCESS_TOKEN_EXPIRES": timedelta(minutes=300),
            "JWT_PRIVATE_KEY": os.getenv("JWT_PRIVATE_KEY"),
        }
    )
    return config


def test_create_provider(config):
    provider = HhsAmsProvider("hhs_ams", config)
    assert provider.client_id == "client_id"
    assert provider.provider_name == "hhs_ams"
    assert provider.config == config
    assert provider.client_id == config["AUTHLIB_OAUTH_CLIENTS"]["hhs_ams"]["client_id"]
    assert provider.server_metadata_url == config["AUTHLIB_OAUTH_CLIENTS"]["hhs_ams"]["server_metadata_url"]
    assert provider.scope == config["AUTHLIB_OAUTH_CLIENTS"]["hhs_ams"]["client_kwargs"]["scope"]
    assert provider.redirect_uri == config["AUTHLIB_OAUTH_CLIENTS"]["hhs_ams"]["redirect_uri"]
    assert provider.JWT_ACCESS_TOKEN_EXPIRES == config["JWT_ACCESS_TOKEN_EXPIRES"]
    assert provider.aud == config["AUTHLIB_OAUTH_CLIENTS"]["hhs_ams"]["aud"]
    assert provider.token_endpoint == config["AUTHLIB_OAUTH_CLIENTS"]["hhs_ams"]["token_endpoint"]
    assert provider.user_info_url == config["AUTHLIB_OAUTH_CLIENTS"]["hhs_ams"]["user_info_url"]


def test_decode_user(config, mocker):
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
        "sso": "hhs_ams",
        "name": "John Doe",
        "email": "john.doe@example.com",
    }
    from authlib.jose import jwt as jose_jwt

    jws = jose_jwt.encode(header={"alg": "RS256"}, payload=payload, key=private_key)

    # Test the decode_user method
    provider = HhsAmsProvider("hhs_ams", config)
    claims = provider.decode_user(jws)

    assert claims["iss"] == "https://sso-stage.acf.hhs.gov/auth/realms/ACF-SSO"
    assert claims["sub"] == "44fe2c7a-e9c5-43ec-87e9-3de78d2d3a11"
    assert claims["aud"] == "https://sso-stage.acf.hhs.gov/auth/realms/ACF-SSO"
    assert claims["jti"] == "f7f3b3b7-3b7d-4b7b-8b7b-7b7b7b7b7b7b"
    assert claims["exp"] == 1632710400
    assert claims["sso"] == "hhs_ams"
    assert claims["name"] == "John Doe"
    assert claims["email"] == "john.doe@example.com"


def test_authenticate(app_ctx, config, mocker):
    # mock member method fetch_token on the HhsAmsProvider class
    mock_fetch_token = mocker.patch(
        "ops_api.ops.auth.authentication_provider.hhs_ams_provider.HhsAmsProvider.fetch_token"
    )
    mock_fetch_token.return_value = MagicMock()
    provider = HhsAmsProvider("hhs_ams", config)
    token = provider.authenticate("1234")
    assert token is not None
