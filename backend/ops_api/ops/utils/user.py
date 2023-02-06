from typing import Optional, TypedDict

from ops.models.base import db
from ops.models.users import User


class UserInfoDict(TypedDict):
    sub: str
    email: Optional[str]
    given_name: Optional[str]


def process_user(userinfo: UserInfoDict) -> User:
    user = User.query.filter_by(oidc_id=userinfo["sub"]).one_or_none()
    print(f"User Lookup Response: {user}")
    if not user:
        # Create new user
        user = User(
            id=userinfo["sub"],
            email=userinfo["email"],
            oidc_id=userinfo["sub"],
        )

        db.session.add(user)
        db.session.commit()
    return user
