from authlib.oauth2.rfc6749 import OAuth2Token
from flask import Config

from ops_api.ops.auth.auth_types import UserInfoDict
from ops_api.ops.auth.authentication_provider.authentication_provider_factory import AuthenticationProviderFactory
from ops_api.ops.auth.decorators import is_user_active


class AuthenticationGateway:
    def __init__(self, config: Config) -> None:
        for provider in config["AUTHLIB_OAUTH_CLIENTS"]:
            if provider not in ["fakeauth", "logingov", "hhsams"]:
                raise ValueError(f"Invalid provider {provider}")
        self.providers = {
            provider: AuthenticationProviderFactory.create_provider(provider, config)
            for provider in config["AUTHLIB_OAUTH_CLIENTS"]
        }

    @is_user_active
    def authenticate(self, provider_name, auth_code) -> OAuth2Token | None:
        """
        Authenticate with the provider and return a valid JWT.

        This uses the auth_code from the first step of authentication to get a token from the provider.
        """
        return self.providers[provider_name].authenticate(auth_code)

    def get_user_info(self, provider: str, token: str) -> UserInfoDict | None:
        """
        Get user info from the provider using the token.
        """
        return self.providers[provider].get_user_info(token)

    def validate_token(self, provider: str, token: str):
        return self.providers[provider].validate_token(token)
