import json
import time
import uuid
from abc import ABC, abstractmethod
from typing import Optional

import requests
from authlib.integrations.requests_client import OAuth2Session
from authlib.jose import JsonWebToken, JWTClaims
from flask import Config, current_app

from ops_api.ops.auth.utils import create_oauth_jwt, get_jwks


class AuthenticationProviderFactory:
    @staticmethod
    def create_provider(provider_name, key):
        if provider_name == "fakeauth":
            return FakeAuthProvider(provider_name, key)
        elif provider_name == "logingov":
            return LoginGovProvider(provider_name, key)
        elif provider_name == "hhsams":
            return HhsAmsProvider(provider_name, key)
        else:
            raise NotImplementedError


class AuthenticationProvider(ABC):
    def __init__(self, config: Config) -> None:
        self.config = config
        # self.client_id = self.config["client_id"]
        # self.server_metadata_url = self.config["server_metadata_url"]
        # self.user_info_url = self.config["user_info_url"]
        # self.client_kwargs = self.config["client_kwargs"]
        # self.aud = self.config["aud"] if "aud" in self.config else None
        # self.redirect_uri = self.config["redirect_uri"] or None
        # self.token_url = self.config["token_endpoint"] or None
        # self.key = key
        # self.scope = self.client_kwargs["scope"]

    @abstractmethod
    def authenticate(self, auth_code):
        pass

    @abstractmethod
    def get_user_info(self, token):
        pass

    @abstractmethod
    def validate_token(self, token):
        pass


class FakeAuthProvider(AuthenticationProvider):
    def __init__(self, config_name, key) -> None:
        self.fakeUsers = {
            "admin_user": {
                "first_name": "Admin",
                "last_name": "Demo",
                "email": "admin.demo@email.com",
                "sub": "00000000-0000-1111-a111-000000000018",
            },
            "division_director": {
                "first_name": "Dave",
                "last_name": "Director",
                "email": "dave.director@email.com",
                "sub": "00000000-0000-1111-a111-000000000020",
            },
            "cor_user": {
                "first_name": "COR",
                "last_name": "User",
                "email": "cor.user@email.com",
                "sub": "00000000-0000-1111-a111-000000000021",
            },
            "basic_user": {
                "first_name": "User",
                "last_name": "Demo",
                "email": "user.demo@email.com",
                "sub": "00000000-0000-1111-a111-000000000019",
            },
            "new_user": {
                "first_name": "New",
                "last_name": "User",
                "email": "user.new@email.com",
                "sub": "00000000-0000-1111-a111-000000000017",
            },
        }

    def authenticate(self, auth_code):
        # This simply simulates authenticating to an OIDC provider, by returning the auth_code as the token
        # This uses the auth_code to lookup the user details in the get_user_info method
        # This is only for testing purposes
        return {"access_token": auth_code}

    def get_user_info(self, token):
        return self.fakeUsers[token]

    def validate_token(self, token):
        return True


class LoginGovProvider(AuthenticationProvider):
    def __init__(self, config_name, key) -> None:
        self.config = current_app.config["AUTHLIB_OAUTH_CLIENTS"][config_name]
        self.client_id = self.config["client_id"]

    def authenticate(self, auth_code):
        client = OAuth2Session(
            client_id=self.config["client_id"],
            scope=self.config["client_kwargs"]["scope"],
            redirect_uri=self.config["redirect_uri"],
        )
        expires = current_app.config["JWT_ACCESS_TOKEN_EXPIRES"]
        payload = {
            "iss": self.client_id,
            "sub": self.client_id,
            "aud": self.config["aud"],
            "jti": str(uuid.uuid4()),
            "exp": int(time.time()) + expires.seconds,
            "sso": "logingov",
        }
        provider_jwt = create_oauth_jwt("logingov", current_app.config, payload=payload)

        token = client.fetch_token(
            self.config["token_endpoint"],
            client_assertion=provider_jwt,
            client_assertion_type="urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
            grant_type="authorization_code",
            code=auth_code,
        )
        return token

    def get_user_info(self, token):
        header = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/json",
        }
        try:
            user_jwt = requests.get(
                self.config["user_info_url"],
                headers=header,
            ).content.decode("utf-8")
            return json.loads(user_jwt)
        except Exception as e:
            current_app.logger.exception(e)
            return None

    def validate_token(self, token):
        return True


class HhsAmsProvider(AuthenticationProvider):
    def __init__(self, config_name, key) -> None:
        self.config = current_app.config["AUTHLIB_OAUTH_CLIENTS"][config_name]
        self.client_id = self.config["client_id"]

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
            jwks = get_jwks(self.config["server_metadata_url"])
            claims = jwt.decode(payload, jwks, claims_options=claims_options)
            return claims
        except Exception as e:
            current_app.logger.exception(e)
            raise e

    def authenticate(self, auth_code):
        client = OAuth2Session(
            client_id=self.config["client_id"],
            scope=self.config["client_kwargs"]["scope"],
            redirect_uri=self.config["redirect_uri"],
        )
        expires = current_app.config["JWT_ACCESS_TOKEN_EXPIRES"]
        payload = {
            "iss": self.client_id,
            "sub": self.client_id,
            "aud": self.config["aud"],
            "jti": str(uuid.uuid4()),
            "exp": int(time.time()) + expires.seconds,
            "sso": "hhsams",
        }
        provider_jwt = create_oauth_jwt("hhsams", current_app.config, payload=payload)
        token = client.fetch_token(
            self.config["token_endpoint"],
            client_assertion=provider_jwt,
            client_assertion_type="urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
            grant_type="authorization_code",
            code=auth_code,
        )
        return token

    def get_user_info(self, token):
        header = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/json",
        }
        try:
            user_jwt = requests.get(
                self.config["user_info_url"],
                headers=header,
            ).content.decode("utf-8")
            user_data = self.decode_user(payload=user_jwt)
            return user_data
        except Exception as e:
            current_app.logger.exception(e)
            return None

    def validate_token(self, token):
        return True
