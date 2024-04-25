from typing import Any

from ops_api.ops.auth.authentication_providers import FakeAuthProvider, HhsAmsProvider, LoginGovProvider
from ops_api.ops.auth.decorators import is_user_active


class AuthenticationGateway:
    def __init__(self, key) -> None:
        # TODO: This should use the config file and call a factory to create the providers
        self.providers = {
            "fakeauth": FakeAuthProvider("fakeauth", "devkey"),
            "logingov": LoginGovProvider("logingov", key),
            "hhsams": HhsAmsProvider("hhsams", key),
        }

    @is_user_active
    def authenticate(self, provider_name, auth_code) -> str:
        return self.providers[provider_name].authenticate(auth_code)

    def get_user_info(self, provider: str, token: str) -> dict[str, Any]:
        return self.providers[provider].get_user_info(token)

    def validate_token(self, provider: str, token: str):
        return self.providers[provider].validate_token(token)
