from typing import Optional, TypedDict

from flask import current_app
from models.users import User


class UserInfoDict(TypedDict):
    sub: str
    email: Optional[str]
    given_name: Optional[str]


def process_user(userinfo: UserInfoDict) -> User:
    user = User.query.filter_by(oidc_id=userinfo["sub"]).one_or_none()
    current_app.logger.debug(f"User Lookup Response: {user}")
    if not user:
        # Create new user
        user = User(
            email=userinfo["email"],
            oidc_id=userinfo["sub"],
        )

        from ops_api.ops import db

        db.session.add(user)
        db.session.commit()
    return user
