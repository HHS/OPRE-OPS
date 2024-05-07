from flask import Config

from ops_api.ops.auth.authentication_provider.authentication_provider import AuthenticationProvider
from ops_api.ops.auth.authentication_provider.fake_auth_provider import FakeAuthProvider
from ops_api.ops.auth.authentication_provider.hhs_ams_provider import HhsAmsProvider
from ops_api.ops.auth.authentication_provider.login_gov_provider import LoginGovProvider


class AuthenticationProviderFactory:
    @staticmethod
    def create_provider(provider_name: str, config: Config) -> AuthenticationProvider:
        if provider_name == "fakeauth":
            return FakeAuthProvider(provider_name, config)
        elif provider_name == "logingov":
            return LoginGovProvider(provider_name, config)
        elif provider_name == "hhsams":
            return HhsAmsProvider(provider_name, config)
        else:
            raise NotImplementedError(f"Provider {provider_name} not implemented")
