from typing import Optional, TypedDict

from ops.models.users import User
from ops.utils import db


class UserInfoDict(TypedDict):
    sub: str
    email: Optional[str]
    given_name: Optional[str]


def process_user(userinfo: UserInfoDict) -> User:
    user = User.query.filter_by(email=userinfo["email"]).one_or_none()
    print(f"User: {user}")
    if not user:
        # Create new user
        user = User(
            email=userinfo["email"],
            username=userinfo["sub"],
            first_name=userinfo["given_name"],
        )

        db.session.add(user)
        db.session.commit()
        print(f"User: {user}")
    return user
