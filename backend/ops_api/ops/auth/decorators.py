from functools import wraps
from typing import Callable, Optional

from flask import Response, current_app, request
from flask_jwt_extended import jwt_required

from models import UserStatus
from ops_api.ops.auth.auth_types import Permission, PermissionType
from ops_api.ops.auth.authorization_providers import _check_extra, _check_groups, _check_role
from ops_api.ops.auth.exceptions import ExtraCheckError, NotActiveUserError
from ops_api.ops.auth.utils import get_user_from_sub
from ops_api.ops.utils.errors import error_simulator
from ops_api.ops.utils.response import make_response_with_headers


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

        user = get_user_from_sub(user_info.get("sub"))
        if not user or user.status != UserStatus.ACTIVE:
            raise NotActiveUserError(f"User with token={token} is not active")

        return token

    return decorated


class is_authorized:
    def __init__(
        self,
        permission_type: PermissionType,
        permission: Permission,
        extra_check: Optional[Callable[..., bool]] = None,
        groups: Optional[list[str]] = None,
    ) -> None:
        """Checks for if the user is authorized to use this endpoint. The order of authorizations is as follows:
        Role -> Group -> Extra.

        If the user has the correct role permission, then the user is authorized.
        Else if the user has the correct group the user is authorized.
        Else if the user passes the extra validation check that is defined, the user is authorized.
        Else the user is not authorized.

        Args:
            permission_type: The permission "verb" (GET, PUT, PATCH, etc)
            permission: The permission "noun" (USER, AGREEMENT, BUDGET_LINE_ITEM, etc)
            group: If given, the list of groups authorized to use this endpoint.
            extra_check: If given, a function that accepts the same parameters as the decorated function/method, and
                returns a boolean value, which does additional custom checking to see if the user is authorized.
        """
        self.permission_type = permission_type
        self.permission = permission
        self.extra_check = extra_check
        self.groups = groups

    def __call__(self, func: Callable) -> Callable:
        @wraps(func)
        @jwt_required()
        @error_simulator
        def wrapper(*args, **kwargs) -> Response:
            try:
                if (
                    _check_role(self.permission_type, self.permission)
                    or _check_groups(self.groups)
                    or _check_extra(self.extra_check, args, kwargs)
                ):
                    response = func(*args, **kwargs)

                else:
                    response = make_response_with_headers({}, 401)

            except ExtraCheckError as e:
                response = make_response_with_headers(e.response_data, 400)

            return response

        return wrapper
