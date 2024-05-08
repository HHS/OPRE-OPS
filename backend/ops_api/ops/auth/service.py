from datetime import datetime
from typing import Any, Optional, Union

from authlib.oauth2.rfc6749 import OAuth2Token
from flask import Response, current_app, request
from flask_jwt_extended import create_access_token, current_user, get_jwt_identity
from sqlalchemy import select

from models import User, UserSession
from models.events import OpsEventType
from ops_api.ops.auth.auth_types import UserInfoDict
from ops_api.ops.auth.authentication_gateway import AuthenticationGateway
from ops_api.ops.auth.exceptions import AuthenticationError
from ops_api.ops.auth.utils import _get_token_and_user_data_from_internal_auth, is_token_expired
from ops_api.ops.utils.events import OpsEventHandler
from ops_api.ops.utils.response import make_response_with_headers


def login(code: str, provider: str) -> dict[str, Any]:
    auth_gateway = AuthenticationGateway(current_app.config)

    with OpsEventHandler(OpsEventType.LOGIN_ATTEMPT) as la:
        token: OAuth2Token = auth_gateway.authenticate(provider, code)

        if not token:
            raise AuthenticationError(f"Failed to authenticate with provider {provider} using auth code {code}")

        user_data: UserInfoDict = auth_gateway.get_user_info(provider, token["access_token"].strip())

        (
            access_token,
            refresh_token,
            user,
        ) = _get_token_and_user_data_from_internal_auth(user_data, current_app.config, current_app.db_session)

        user_session = _get_or_create_user_session(user, access_token, refresh_token)

        la.metadata.update(
            {
                "user": user.to_dict(),
                "access_token": user_session.access_token,
                "refresh_token": user_session.refresh_token,
                "oidc_access_token": token,
                "session_id": user_session.id,
            }
        )

    response = {
        "access_token": user_session.access_token,
        "refresh_token": user_session.refresh_token,
        "user": user,
    }

    return response


def logout() -> Union[Response, tuple[str, int]]:
    with OpsEventHandler(OpsEventType.LOGOUT) as la:
        try:
            identity = get_jwt_identity()
            la.metadata.update({"oidc_id": identity})
            # TODO: Process the /logout endpoint for the OIDC Provider here.

            user_session = _get_or_create_user_session(current_user)
            if user_session.is_active:
                user_session.is_active = False
                user_session.last_active_at = datetime.now()
                current_app.db_session.add(user_session)
                current_app.db_session.commit()

            return make_response_with_headers({"message": f"User {identity} Logged out"})
        except RuntimeError:
            return make_response_with_headers({"message": "Logged out"})


def refresh() -> Response:
    additional_claims = {"roles": []}
    current_app.logger.debug(f"user {current_user}")
    if current_user.roles:
        additional_claims["roles"] = [role.name for role in current_user.roles]

    access_token = create_access_token(
        identity=current_user,
        expires_delta=current_app.config.get("JWT_ACCESS_TOKEN_EXPIRES"),
        additional_claims=additional_claims,
        fresh=False,
    )

    user_session = _get_or_create_user_session(current_user)

    # if the current access token is not expired, return it
    if not is_token_expired(user_session.access_token, current_app.config["JWT_PRIVATE_KEY"]):
        return make_response_with_headers({"access_token": user_session.access_token})

    user_session.access_token = access_token
    user_session.last_active_at = datetime.now()
    current_app.db_session.add(user_session)
    current_app.db_session.commit()

    return make_response_with_headers({"access_token": access_token})


def _get_or_create_user_session(
    user: User, access_token: Optional[str] = None, refresh_token: Optional[str] = None
) -> UserSession:
    stmt = (
        select(UserSession).where(UserSession.user_id == user.id).order_by(UserSession.created_on.desc())
    )  # type: ignore
    user_sessions = current_app.db_session.execute(stmt).scalars().all()
    latest_user_session = user_sessions[0] if user_sessions else None

    if latest_user_session and latest_user_session.is_active:
        return latest_user_session
    else:
        # set all other sessions to inactive before creating a new one
        _deactivate_all_user_sessions(user_sessions)

        user_session = UserSession(
            user_id=user.id,
            is_active=True,
            ip_address=request.remote_addr,
            access_token=access_token,
            refresh_token=refresh_token,
            last_active_at=datetime.now(),
        )
        current_app.db_session.add(user_session)
        current_app.db_session.commit()

        return user_session


def _deactivate_all_user_sessions(user_sessions):
    active_sessions = [session for session in user_sessions if session.is_active]
    for session in active_sessions:
        session.is_active = False
        current_app.db_session.add(session)
    current_app.db_session.commit()
