from functools import wraps
from typing import Callable, Optional

from authlib.jose import JsonWebToken
from flask import Response
from flask_jwt_extended import get_current_user, get_jwt_identity, jwt_required

from ops_api.ops.auth.auth_enum import Permission, PermissionType
from ops_api.ops.auth.authorization import AuthorizationGateway, BasicAuthorizationPrivider
from ops_api.ops.auth.utils import get_jwks
from ops_api.ops.utils.errors import error_simulator
from ops_api.ops.utils.response import make_response_with_headers


def decode_user(
    payload: Optional[str] = None,
    provider: Optional[str] = None,
) -> dict[str, str]:
    # TODO: Determine which claims we want to validate when decoding a user from the provider
    #       beyond just the signature. Should these be universal for any claims (global)?
    # ex: validate the JTI, validate the expiration, validate the si
    # claims_options = {
    #     "iss": {
    #         "essential": True,
    #         "values": current_app.config["AUTHLIB_OAUTH_CLIENTS"][provider]["client_id"],
    #     },
    #     "jti": {"validate": JWTClaims.validate_jti},
    #     "exp": {"validate": JWTClaims.validate_exp},
    # }
    jwt = JsonWebToken(["RS256"])
    # claims = jwt.decode(payload, get_jwks(provider), claims_options=claims_options)
    claims = jwt.decode(payload, get_jwks(provider))
    return claims


class ExtraCheckError(Exception):
    """Exception used to handle errors from the extra check function that can be passed
    into @is_authorized().
    """

    def __init__(self, response_data):
        super().__init__()
        self.response_data = response_data


def _check_role(permission_type: PermissionType, permission: Permission) -> bool:
    auth_gateway = AuthorizationGateway(BasicAuthorizationPrivider())
    identity = get_jwt_identity()
    return auth_gateway.is_authorized(identity, f"{permission_type.name}_{permission.name}".upper())


def _check_groups(groups: Optional[list[str]]) -> bool:
    auth_group = False
    if groups is not None:
        user = get_current_user()
        auth_group = len(set(groups) & {g.name for g in user.groups}) > 0
    return auth_group


def _check_extra(extra_check: Optional[Callable[..., bool]], args, kwargs) -> bool:
    valid = False
    if extra_check is not None:
        valid = extra_check(*args, **kwargs)
    return valid


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
