from datetime import datetime
from typing import Optional, TypedDict

from ops.user.models import User
from ops.utils import db


class UserDict(TypedDict):
    id: int
    oidc_id: str
    username: str
    email: str
    first_name: Optional[str]
    is_active: bool
    is_staff: bool
    is_superuser: bool
    date_joined: Optional[datetime]
    role: str


class UserInfoDict(TypedDict):
    sub: str
    email: Optional[str]
    given_name: Optional[str]


def user_dumper(user: User) -> UserDict:
    return {
        "id": user.id,
        "oidc_id": user.oidc_id,
        "username": user.username,
        "email": user.email,
        "first_name": user.first_name,
        "is_active": user.is_active,
        "is_staff": user.is_staff,
        "is_superuser": user.is_superuser,
        "date_joined": user.date_joined,
        "role": user.role,
    }


def process_user(userinfo: UserInfoDict) -> User:
    # TODO: Is this even used?
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
