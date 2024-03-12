from typing import Optional, TypedDict

from flask import current_app
from sqlalchemy import select
from sqlalchemy.orm import load_only

from models.users import Role, User


class UserInfoDict(TypedDict):
    sub: str
    email: Optional[str]
    given_name: Optional[str]


def register_user(userinfo: UserInfoDict) -> User:
    user = get_user_from_token(userinfo)
    if user:
        return user, False
    else:
        # Create new user
        # Default to an 'unassigned' role.
        current_app.logger.debug("Creating new user")
        try:
            # Find the role with the matching permission
            role = current_app.db_session.query(Role).options(load_only(Role.name)).filter_by(name="unassigned").one()
            user = User(
                email=userinfo["email"],
                oidc_id=userinfo["sub"],
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
    if userinfo is None:
        return None
    try:
        stmt = select(User).where((User.oidc_id == userinfo["sub"]))
        users = current_app.db_session.execute(stmt).all()
        if users and len(users) == 1:
            return users[0][0]
    except Exception as e:
        current_app.logger.debug(f"User Lookup Error: {e}")
        return None
