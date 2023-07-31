import json
import time
import uuid
from abc import ABC, abstractmethod
from typing import Optional

import requests
from authlib.integrations.requests_client import OAuth2Session
from authlib.jose import JsonWebToken, JWTClaims
from authlib.jose import jwt as jose_jwt
from flask import current_app
from ops_api.ops.utils.auth import get_jwks


class AuthenticationProvider(ABC):
    def __init__(self, config_name, key) -> None:
        self.config = None
        self.client_id = self.config["client_id"]
        self.server_metadata_url = self.config["server_metadata_url"]
        self.user_info_url = self.config["user_info_url"]
        self.client_kwargs = self.config["client_kwargs"]
        self.aud = self.config["aud"]
        self.redirect_uri = self.config["redirect_uri"] or None
        self.token_url = self.config["token_endpoint"] or None
        self.key = key
        self.scope = self.client_kwargs["scope"]

    @abstractmethod
    def authenticate(self, auth_code):
        pass

    @abstractmethod
    def get_user_info(self, token):
        pass

    @abstractmethod
    def validate_token(self, token):
        pass

    def create_oauth_jwt(
        self,
        key: Optional[str] = None,
        header: Optional[str] = None,
        payload: Optional[str] = None,
    ) -> str:
        """
        Returns an Access Token JWS from the configured OAuth Client
        :param key: OPTIONAL - Private Key used for encoding the JWS
        :param header: OPTIONAL - JWS Header containing algorithm type
        :param payload: OPTIONAL - Contains the JWS payload
        :return: JsonWebSignature
        """
        jwt_private_key = key or current_app.config.get("JWT_PRIVATE_KEY")
        if not jwt_private_key:
            raise NotImplementedError

        expire = current_app.config["JWT_ACCESS_TOKEN_EXPIRES"]
        _payload = payload or {
            "iss": self.client_id,
            "sub": self.client_id,
            "aud": self.aud,
            "jti": str(uuid.uuid4()),
            "exp": int(time.time()) + expire.seconds,
            "sso": "hhsams",
        }
        _header = header or {"alg": "RS256"}
        jws = jose_jwt.encode(header=_header, payload=_payload, key=jwt_private_key)
        return jws


class FakeAuthPrivider(AuthenticationProvider):
    def __init__(self, config_name, key) -> None:
        pass

    def authenticate(self, auth_code):
        fakeUsers = {
            "admin": {
                "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTY4OTcwMDQxOSwianRpIjoiYmE3ZmZhNmMtOWZiNy00NzQxLTkzMTYtZTVlZThiOGVhMzkxIiwidHlwZSI6ImFjY2VzcyIsInN1YiI6IjAwMDAwMDAwLTAwMDAtMTExMS1hMTExLTAwMDAwMDAwMDAxOCIsIm5iZiI6MTY4OTcwMDQxOSwiZXhwIjoxOTg5NzM2NDE5fQ.qazM0iIZW-cDnNlIeC2dB5CE9P_-49T48TcKhdaj0jX4EMo-t01GMvWW0JIMmvsE4kj_yC3I2_r-HEwLL85z0jSiKEO7C_Nzgj4XgXvA_awlAA8e0Bny4pRol_wHKGEZIzIttZUaYgm8QewUC4uS1-vW92mvEH6dgDpChSlrI8Ao5352ydIeYBMQcOXDIIPRtupYjBBTTfafv87gsNDUoo4GUO53tFM_VApQl3UFxEzqkYKY9hc_TjiZMVK9OyF7uSA_4ICaF1hHnZvB6sQHTW3GcrUGvhwJ76JYnJTCPUcAmNkGlPSuwidq9ybl5sCYp1LWMigQJ50pQL2HngUMcA",
            },
            "basic_user": {
                "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTY4OTcwMDQxOSwianRpIjoiYmE3ZmZhNmMtOWZiNy00NzQxLTkzMTYtZTVlZThiOGVhMzkxIiwidHlwZSI6ImFjY2VzcyIsInN1YiI6IjAwMDAwMDAwLTAwMDAtMTExMS1hMTExLTAwMDAwMDAwMDAxOSIsIm5iZiI6MTY4OTcwMDQxOSwiZXhwIjoxOTg5NzM2NDE5fQ.Vj8vjnSSiay_XbZH3xyt0qpMUh3YEso0pfER2bAt08Lara1rsji9WdIzPljSfZMiOl0c565Rrw0oKiXFeyjZNFKpubZ8IVN-POiu9j1X8-Iw7cxIwg8gMElraSEHTz23JRSNWKmAOtre9s0wMiCfYk7kStFwvEYErQfpZjVYpTmVkgK4I4s1P4S8Z_h5BuMFGs-92_z50bIY9-ANHlNNGs0r9dut6Ta64HxOiP3mhJQFeZBazhBrXaw-5QesN9Tvo5pftvIpW2xYg3umicB5Y2LXV1uQKFC3WZ_hZekYbBoJoIiXwPJIT9LvTVhM_nAwgd16XKXNwfkQnpESwPTmcQ",
            },
            "new_user": {
                "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTY4OTcwMDQxOSwianRpIjoiYmE3ZmZhNmMtOWZiNy00NzQxLTkzMTYtZTVlZThiOGVhMzkxIiwidHlwZSI6ImFjY2VzcyIsInN1YiI6IjAwMDAwMDAwLTAwMDAtMTExMS1hMTExLTk5OTAwMDAwMDAwMCIsIm5iZiI6MTY4OTcwMDQxOSwiZXhwIjoxOTg5NzM2NDE5fQ.c_vTIVsZgjazU4TDKXjru7OymUjPuqy6Wkbq-sS2at791zXcAAX9ykfGkL17GpbaUqng8dZT_ja_aLwcFN7-53kEk4MSEITN0qISQwsEnDDdq522HxzJ5v2quIylZbw-HkzIIBLwQw6qEnhlBUeqof2TyHmevCgGwcrZaUMhz8CaBFJn26r5nppfbGCIQOwT5D_jeH33DSQPjUJg4h6kfP2gtb7zyLUMbn0HmIwdK8A6FstBI6wo3QIx-rvpxx9brVF140D73YVYeextvrjTUoNdJZ1TQSoExWoPCCTHHwNA0bvZ552jhRVmXCxR6X7-JBNccWiKOiroWffIdG8L8Q",
                "is_new_user": True,  # Indicates this is a new user, so prompt for registration
            },
        }
        return fakeUsers[auth_code].value

    def get_user_info(self, token):
        header = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/json",
        }
        try:
            user_jwt = requests.get(
                self.user_info_url,
                headers=header,
            ).content.decode("utf-8")
            user_data = user_jwt
            return json.loads(user_data)
        except Exception as e:
            current_app.logger.exception(e)
            return None

    def validate_token(self, token):
        return True


class LoginGovProvider(AuthenticationProvider):
    def __init__(self, config_name, key) -> None:
        self.config = current_app.config["AUTHLIB_OAUTH_CLIENTS"][config_name]
        self.client_id = self.config["client_id"]
        self.server_metadata_url = self.config["server_metadata_url"]
        self.user_info_url = self.config["user_info_url"]
        self.client_kwargs = self.config["client_kwargs"]
        self.aud = self.config["aud"]
        self.redirect_uri = self.config["redirect_uri"] or None
        self.token_url = self.config["token_endpoint"] or None
        self.key = key
        self.scope = self.client_kwargs["scope"]

    def authenticate(self, auth_code):
        client = OAuth2Session(
            client_id=self.config["client_id"],
            scope=self.scope,
            redirect_uri=self.config["redirect_uri"],
        )
        provider_jwt = super().create_oauth_jwt()
        current_app.logger.debug(f"provider_jwt={provider_jwt}")

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
            current_app.logger.debug(f"header={header}")
            current_app.logger.debug(f"user_info_url={self.user_info_url}")
            user_jwt = requests.get(
                self.user_info_url,
                headers=header,
            ).content.decode("utf-8")
            current_app.logger.debug(f"user_jwt_response={user_jwt}")
            return user_jwt
        except Exception as e:
            current_app.logger.exception(e)
            return None

    def validate_token(self, token):
        return True


class HhsAmsProvider(AuthenticationProvider):
    def __init__(self, config_name, key) -> None:
        self.config = current_app.config["AUTHLIB_OAUTH_CLIENTS"][config_name]
        self.client_id = self.config["client_id"]
        self.server_metadata_url = self.config["server_metadata_url"]
        self.user_info_url = self.config["user_info_url"]
        self.client_kwargs = self.config["client_kwargs"]
        self.aud = self.config["aud"]
        self.redirect_uri = self.config["redirect_uri"] or None
        self.token_url = self.config["token_endpoint"] or None
        self.key = key
        self.scope = self.client_kwargs["scope"]

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
            # current_app.logger.debug(f"jwks={jwks}")
            claims = jwt.decode(payload, jwks, claims_options=claims_options)
            return claims
        except Exception as e:
            current_app.logger.exception(e)
            raise e

    def get_jwks(self):
        provider_uris = json.loads(
            requests.get(
                self.server_metadata_url,
                headers={"Accept": "application/json"},
            ).content.decode("utf-8")
        )
        jwks_uri = provider_uris["jwks_uri"]
        jwks = requests.get(jwks_uri).content.decode("utf-8")
        return jwks

    def authenticate(self, auth_code):
        client = OAuth2Session(
            client_id=self.config["client_id"],
            scope=self.scope,
            redirect_uri=self.config["redirect_uri"],
        )
        provider_jwt = super().create_oauth_jwt()
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
            # current_app.logger.debug(f"get_user_info: header={header}")
            user_jwt = requests.get(
                self.user_info_url,
                headers=header,
            ).content.decode("utf-8")
            # current_app.logger.debug(f"get_user_info: user_jwt_response={user_jwt}")
            user_data = self.decode_user(payload=user_jwt)
            return user_data
        except Exception as e:
            current_app.logger.exception(e)
            return None

    def validate_token(self, token):
        return True


class AuthenticationGateway:
    def __init__(self, key) -> None:
        self.providers = {
            "fakeauth": FakeAuthPrivider("fakeauth", "devkey"),
            "logingov": LoginGovProvider("logingov", key),
            "hhsams": HhsAmsProvider("hhsams", key),
        }

    def authenticate(self, provider_name, auth_code):
        return self.providers[provider_name].authenticate(auth_code)

    def get_user_info(self, provider: str, token: str):
        return self.providers[provider].get_user_info(token)

    def validate_token(self, provider: str, token: str):
        return self.providers[provider].validate_token(token)
