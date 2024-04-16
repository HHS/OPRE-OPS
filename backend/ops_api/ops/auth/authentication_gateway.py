from functools import wraps
from typing import Any

from flask import current_app, request

from models import UserStatus
from ops_api.ops.auth.authentication import FakeAuthProvider, HhsAmsProvider, LoginGovProvider
from ops_api.ops.utils.user import get_user_from_token


class NotActiveUserError(Exception):
    """
    Exception to raise when the user is not active.
    """

    pass


def is_user_active(f):
    """
    Decorator to check if the user is active.
    """

    @wraps(f)
    def decorated(*args, **kwargs):
        token = f(*args, **kwargs)

        auth_gateway = AuthenticationGateway(current_app.config.get("JWT_PRIVATE_KEY"))

        provider = request.json.get("provider")
        user_info = auth_gateway.get_user_info(provider, token.get("access_token"))
        if not user_info:
            raise NotActiveUserError(f"Unable to get user_info for token={token}")

        user = get_user_from_token(user_info)
        if not user or user.status != UserStatus.ACTIVE:
            raise NotActiveUserError(f"User with token={token} is not active")

        return token

    return decorated


class AuthenticationGateway:
    def __init__(self, key) -> None:
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
