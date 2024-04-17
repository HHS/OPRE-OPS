from abc import ABC, abstractmethod
from functools import wraps
from typing import Callable, Optional

from flask import Response, current_app
from flask_jwt_extended import get_current_user, get_jwt_identity, jwt_required
from sqlalchemy import select

from models.users import User
from ops_api.ops.auth.auth_enum import Permission, PermissionType
from ops_api.ops.auth.exceptions import ExtraCheckError
from ops_api.ops.utils.errors import error_simulator
from ops_api.ops.utils.response import make_response_with_headers


class AuthorizationProvider(ABC):
    @abstractmethod
    def is_authorized(self, user_id: str, permission: str):
        pass


class BasicAuthorizationPrivider(AuthorizationProvider):
    def __init__(self, authirized_users: list[str] = []):
        self.authorized_users = authirized_users

    def is_authorized(self, oidc_id: str, permission: str) -> bool:
        stmt = select(User).where(User.oidc_id == oidc_id)
        users = current_app.db_session.execute(stmt).all()
        if users and len(users) == 1:
            user = users[0][0]

            user_permissions = set(p for role in user.roles for p in role.permissions[1:-1].split(","))
            if permission in user_permissions:
                return True

        return False


class OAuthAuthorizationProvider(AuthorizationProvider):
    def __init__(self, oauth_client_id: str, oauth_client_secret: str):
        self.oauth_client_id = oauth_client_id
        self.oauth_client_secret = oauth_client_secret

    def is_authorized(self, oidc_id: str, permission: str) -> bool:
        # This could be used if we end up rolling our own OAuth Provider
        # Use the OAuth client ID and secret to check if the user is authorized
        # using the appropriate API calls.
        return True


class OpaAuthorizationProvider(AuthorizationProvider):
    def __init__(self, policy: str, opa_url: str = ""):
        self.policy = policy
        self.opa_url = opa_url

    def is_authorized(self, oidc_id: str, permission: str) -> bool:
        # Make a call to the OPA API, passing along the policy you want to
        # check against
        # TODO: implement me
        return True


class AuthorizationGateway:
    """
    Authoriztion Gateway for easily swapping out different Authorization Providers

    :usage init:
        auth_gateway = AuthorizationGateway(BasicAuthorizationPrivider())

    :usage authorize:
        if auth_gateway.authorize(user_id, permission):
            #allowed access
    """

    def __init__(self, authorization_provider: AuthorizationProvider) -> None:
        """
        Create the AuthorizationGateway instance. You can either pass a flask application
        in directly here to register this extension with the flask app, or
        call init_app after creating this object (in a factory pattern).

        :param authorization_provider:
            The Authorization Provider class to use
        """
        self.authorization_provider = authorization_provider

    def is_authorized(self, oidc_id, permission):
        return self.authorization_provider.is_authorized(oidc_id, permission)

    def authorize(self, oidc_id: str, permission: str) -> bool:
        """
        Will do a lookup based on the provided oidc_id, and check whether that
        user's role contains those permissions.
        For now this is simply a basic string lookup/comparison.

        Args:
            oidc_id (str): User OIDC_ID (sub from JWT)
            permission (list[str]): list of strings, for the allowed permissions

        Returns:
            bool: Basic pass/fail check.
        """
        if not self.is_authorized(oidc_id, permission):
            # TODO Perform a logging action, so we can audit this invalid
            # authorization attempt somewhere.
            # raise ValueError("User is not authorized")
            return False
        # If the user is authorized, do any necessary authorization tasks here
        # For example, logging the user in, setting session data, etc.
        # ...

        # Return a success message
        # print(f"User {oidc_id} has been authorized for {permission}")
        return True


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
