from typing import Optional, TypedDict

from flask import current_app
from models.users import Role, User
from sqlalchemy import or_, select
from sqlalchemy.orm import load_only


class UserInfoDict(TypedDict):
    sub: str
    email: Optional[str]
    given_name: Optional[str]


def register_user(userinfo: UserInfoDict) -> User:
    user = get_user_from_token(userinfo)
    current_app.logger.debug(f"User Lookup Response: {user}")
    if not user:
        # Create new user
        # Default to an 'unassigned' role.
        current_app.logger.debug("Creating new user")
        try:
            # Find the role with the matching permission
            role = current_app.db_session.query(Role).options(load_only(Role.name)).filter_by(name="unassigned").one()
            user = User(
                email=userinfo["email"],
                oidc_id=userinfo["sub"],
                # hhs_id=(userinfo["hhsid"] if userinfo["hhsid"] is not None else None),
                # first_name=userinfo["given_name"],
                # last_name=userinfo["family_name"],
                roles=[role],
            )

            current_app.db_session.add(user)
            current_app.db_session.commit()
            return user, True
        except Exception as e:
            current_app.logger.debug(f"User Creation Error: {e}")
            current_app.db_session.rollback()
            return None, False


def get_user_from_token(userinfo: UserInfoDict) -> Optional[User]:
    current_app.logger.debug("Getting User from Token")
    if userinfo is None:
        return None
    try:
        stmt = select(User).where(
            or_(User.oidc_id == userinfo["sub"], User.email == userinfo["email"])  # or User.hhs_id == userinfo["hhsid"]
        )
        users = current_app.db_session.execute(stmt).all()
        if users and len(users) == 1:
            return users[0][0]
    except Exception as e:
        current_app.logger.debug(f"User Lookup Error: {e}")
        return None
