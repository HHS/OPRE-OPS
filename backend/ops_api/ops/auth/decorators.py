from functools import wraps

from flask import current_app, request

from models import UserStatus
from ops_api.ops.auth.exceptions import NotActiveUserError
from ops_api.ops.utils.user import get_user_from_token


def is_user_active(f):
    """
    Decorator to check if the user is active.
    """

    @wraps(f)
    def decorated(*args, **kwargs):
        token = f(*args, **kwargs)

        from ops_api.ops.auth.authentication_gateway import AuthenticationGateway

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
