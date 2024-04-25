from typing import Any

from flask import Config

from ops_api.ops.auth.authentication_provider.authentication_provider_factory import AuthenticationProviderFactory
from ops_api.ops.auth.decorators import is_user_active


class AuthenticationGateway:
    def __init__(self, config: Config) -> None:
        self.providers = {
            "fakeauth": AuthenticationProviderFactory.create_provider("fakeauth", config),
            "logingov": AuthenticationProviderFactory.create_provider("logingov", config),
            "hhsams": AuthenticationProviderFactory.create_provider("hhsams", config),
        }

    @is_user_active
    def authenticate(self, provider_name, auth_code) -> str:
        return self.providers[provider_name].authenticate(auth_code)

    def get_user_info(self, provider: str, token: str) -> dict[str, Any]:
        return self.providers[provider].get_user_info(token)

    def validate_token(self, provider: str, token: str):
        return self.providers[provider].validate_token(token)
