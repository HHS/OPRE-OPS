from typing import Optional, TypedDict

from flask import current_app
from models.users import User
from sqlalchemy import select


class UserInfoDict(TypedDict):
    sub: str
    email: Optional[str]
    given_name: Optional[str]


def process_user(userinfo: UserInfoDict) -> User:
    user = get_user_from_token(userinfo)
    current_app.logger.debug(f"User Lookup Response: {user}")
    if not user:
        # Create new user
        user = User(
            email=userinfo["email"],
            oidc_id=userinfo["sub"],
        )

        current_app.db_session.add(user)
        current_app.db_session.commit()
    return user


def get_user_from_token(userinfo: UserInfoDict) -> Optional[User]:
    if userinfo:
        stmt = select(User).where(User.oidc_id == userinfo["sub"])
        users = current_app.db_session.execute(stmt).all()
        if users and len(users) == 1:
            return users[0][0]
