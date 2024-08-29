from datetime import datetime
from typing import Any, Optional

from authlib.oauth2.rfc6749 import OAuth2Token
from flask import current_app
from flask_jwt_extended import create_access_token, current_user, get_jwt_identity
from sqlalchemy import select
from sqlalchemy.orm import Session

from models import Role, User, UserSession
from models.events import OpsEventType
from ops_api.ops.auth.auth_types import UserInfoDict
from ops_api.ops.auth.authentication_gateway import AuthenticationGateway
from ops_api.ops.auth.exceptions import AuthenticationError
from ops_api.ops.auth.utils import (
    _get_token_and_user_data_from_internal_auth,
    deactivate_all_user_sessions,
    get_all_user_sessions,
    get_latest_user_session,
    get_request_ip_address,
    is_token_expired,
)
from ops_api.ops.utils.events import OpsEventHandler


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

        user_session = _get_or_create_user_session(user, access_token, refresh_token, get_request_ip_address())

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


def logout() -> dict[str, str]:
    with OpsEventHandler(OpsEventType.LOGOUT) as la:
        identity = get_jwt_identity()
        la.metadata.update({"oidc_id": identity})
        # TODO: Process the /logout endpoint for the OIDC Provider here.

        user_sessions = get_all_user_sessions(current_user.id, current_app.db_session)
        deactivate_all_user_sessions(user_sessions)

        return {"message": f"User: {current_user.email} Logged out"}


def refresh() -> dict[str, str]:
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

    latest_user_session = get_latest_user_session(current_user.id, current_app.db_session)

    # if the current access token is not expired, return it
    if not is_token_expired(latest_user_session.access_token, current_app.config["JWT_PRIVATE_KEY"]):
        return {"access_token": latest_user_session.access_token}

    latest_user_session.access_token = access_token
    latest_user_session.last_active_at = datetime.now()
    current_app.db_session.add(latest_user_session)
    current_app.db_session.commit()

    return {"access_token": access_token}


def _get_or_create_user_session(
    user: User,
    access_token: Optional[str] = None,
    refresh_token: Optional[str] = None,
    ip_address: Optional[str] = "127.0.0.1",
) -> UserSession:
    stmt = (
        select(UserSession)
        .where(UserSession.user_id == user.id)
        .order_by(UserSession.created_on.desc())  # type: ignore
    )
    user_sessions = current_app.db_session.execute(stmt).scalars().all()

    # set all other sessions to inactive before creating a new one
    deactivate_all_user_sessions(user_sessions)

    user_session = UserSession(
        user_id=user.id,
        is_active=True,
        ip_address=ip_address,
        access_token=access_token,
        refresh_token=refresh_token,
        last_active_at=datetime.now(),
        created_by=user.id,
        updated_by=user.id,
    )
    current_app.db_session.add(user_session)
    current_app.db_session.commit()

    return user_session


def get_roles(session: Session, **kwargs) -> list[Role]:
    """
    Get all roles that match the given criteria.

    :param session: The database session.
    :param **kwargs: The criteria to filter the roles by.
    :return: The roles that match the criteria.

    """
    stmt = select(Role)

    for key, value in kwargs.items():
        stmt = stmt.where(getattr(Role, key) == value)

    stmt = stmt.order_by(Role.id)

    roles = session.execute(stmt).scalars().all()

    return list(roles)
