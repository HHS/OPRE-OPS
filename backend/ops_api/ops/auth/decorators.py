from datetime import datetime, timedelta
from functools import wraps
from typing import Callable, Optional

from flask import Response, current_app, request
from flask_jwt_extended import current_user, jwt_required

from models import User, UserStatus
from ops_api.ops.auth.auth_types import Permission, PermissionType
from ops_api.ops.auth.authorization_providers import _check_role
from ops_api.ops.auth.exceptions import ExtraCheckError, InvalidUserSessionError, NotActiveUserError
from ops_api.ops.auth.utils import (
    deactivate_all_user_sessions,
    get_all_user_sessions,
    get_bearer_token,
    get_latest_user_session,
    get_user_from_userinfo,
)
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

        auth_gateway = AuthenticationGateway(current_app.config)

        provider = request.json.get("provider")
        user_info = auth_gateway.get_user_info(provider, token.get("access_token"))
        if not user_info:
            raise NotActiveUserError(f"Unable to get user_info for token={token}")

        user = get_user_from_userinfo(user_info, current_app.db_session)
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
                if _check_role(self.permission_type, self.permission):
                    response = func(*args, **kwargs)

                else:
                    response = make_response_with_headers({}, 401)

            except ExtraCheckError as e:
                response = make_response_with_headers(e.response_data, 400)

            return response

        return wrapper


def check_user_session(f):
    """
    Decorator to check if the user has a valid user session.
    """

    @wraps(f)
    def decorated(*args, **kwargs):
        check_user_session_function(current_user)

        return f(*args, **kwargs)

    return decorated


def check_user_session_function(user: User):
    """
    Function to check if the user has a valid user session.

    A user session is considered valid if:
    1. The user has an active user session.
    2. The access token in the request is the same as the latest user session access token.
    3. The last_accessed_at field of the latest user session is not more than a configurable threshold ago.
    """
    user_sessions = get_all_user_sessions(user.id, current_app.db_session)
    latest_user_session = get_latest_user_session(user.id, current_app.db_session)
    # Check if the latest user session is active
    if not latest_user_session or not latest_user_session.is_active:
        deactivate_all_user_sessions(user_sessions)
        raise InvalidUserSessionError(f"User with id={user.id} does not have an active user session")
    # Check if the access token in the request is the same as the latest user session access token
    bearer_token = get_bearer_token()
    if bearer_token:
        access_token = bearer_token.replace("Bearer", "").strip()

        if access_token != latest_user_session.access_token:
            deactivate_all_user_sessions(user_sessions)
            raise InvalidUserSessionError(f"User with id={user.id} is using an invalid access token")
    # Check if the last_accessed_at field of the latest user session is not more than a configurable threshold ago
    if check_last_active_at(latest_user_session):
        deactivate_all_user_sessions(user_sessions)
        raise InvalidUserSessionError(f"User with id={user.id} has not accessed the system for more than the threshold")
    # Update the last_accessed_at field of the latest user session (if this isn't only touching /notification)
    if "notification" not in request.endpoint:
        # If last_accessed_at is more than 30 minutes ago, then throw an exception
        latest_user_session.last_active_at = datetime.now()
        current_app.db_session.add(latest_user_session)
        current_app.db_session.commit()


def check_last_active_at(latest_user_session, threshold_in_seconds=None):
    """
    Return True if the last_active_at field of the latest user session is more than threshold_in_seconds ago.
    """
    final_threshold_in_seconds = (
        threshold_in_seconds or current_app.config.get("USER_SESSION_EXPIRATION", timedelta(minutes=30)).total_seconds()
    )
    current_app.logger.info(
        f"Checking if latest_user_session.last_active_at={latest_user_session.last_active_at} is more than "
        f"{final_threshold_in_seconds} seconds ago"
    )
    return (datetime.now() - latest_user_session.last_active_at).total_seconds() > final_threshold_in_seconds
