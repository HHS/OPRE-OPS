import time
import uuid
from typing import Optional

import requests
from authlib.integrations.requests_client import OAuth2Session
from authlib.jose import JsonWebToken, JWTClaims
from authlib.oauth2.rfc6749 import OAuth2Token
from flask import Config, current_app

from ops_api.ops.auth.auth_types import UserInfoDict
from ops_api.ops.auth.authentication_provider.authentication_provider import AuthenticationProvider
from ops_api.ops.auth.utils import create_oauth_jwt, get_jwks


class HhsAmsProvider(AuthenticationProvider):
    def __init__(self, provider_name: str, config: Config) -> None:
        self.provider_name = provider_name
        self.config = config

        self.client_id = config["AUTHLIB_OAUTH_CLIENTS"][self.provider_name]["client_id"]
        self.server_metadata_url = config["AUTHLIB_OAUTH_CLIENTS"][self.provider_name]["server_metadata_url"]
        self.scope = config["AUTHLIB_OAUTH_CLIENTS"][self.provider_name]["client_kwargs"]["scope"]
        self.redirect_uri = config["AUTHLIB_OAUTH_CLIENTS"][self.provider_name]["redirect_uri"]
        self.JWT_ACCESS_TOKEN_EXPIRES = config["JWT_ACCESS_TOKEN_EXPIRES"]
        self.aud = config["AUTHLIB_OAUTH_CLIENTS"][self.provider_name]["aud"]
        self.token_endpoint = config["AUTHLIB_OAUTH_CLIENTS"][self.provider_name]["token_endpoint"]
        self.user_info_url = config["AUTHLIB_OAUTH_CLIENTS"][self.provider_name]["user_info_url"]

    def decode_user(
        self,
        payload: Optional[str] = None,
    ) -> dict[str, str]:
        try:
            claims_options = {
                "iss": {
                    "essential": True,
                    "values": self.client_id,
                },
                "jti": {"validate": JWTClaims.validate_jti},
                "exp": {"validate": JWTClaims.validate_exp},
            }
            jwt = JsonWebToken(["RS256"])
            jwks = get_jwks(self.server_metadata_url)
            claims = jwt.decode(payload, jwks, claims_options=claims_options)
            return claims
        except Exception as e:
            current_app.logger.exception(e)
            raise e

    def authenticate(self, auth_code: str) -> OAuth2Token:
        client = OAuth2Session(
            client_id=self.client_id,
            scope=self.scope,
            redirect_uri=self.redirect_uri,
        )
        expires = self.JWT_ACCESS_TOKEN_EXPIRES
        payload = {
            "iss": self.client_id,
            "sub": self.client_id,
            "aud": self.aud,
            "jti": str(uuid.uuid4()),
            "exp": int(time.time()) + expires.seconds,
            "sso": self.provider_name,
        }
        provider_jwt = create_oauth_jwt(self.provider_name, self.config, payload=payload)
        current_app.logger.info(f"Provider JWT: {provider_jwt}")
        token = client.fetch_token(
            self.token_endpoint,
            client_assertion=provider_jwt,
            client_assertion_type="urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
            grant_type="authorization_code",
            code=auth_code,
        )
        return token

    def get_user_info(self, token: OAuth2Token) -> UserInfoDict | None:
        header = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/json",
        }
        try:
            user_jwt = requests.get(
                self.user_info_url,
                headers=header,
            ).content.decode("utf-8")
            user_data = self.decode_user(payload=user_jwt)
            return user_data
        except Exception as e:
            current_app.logger.exception(e)
            return None

    def validate_token(self, token):
        return True
