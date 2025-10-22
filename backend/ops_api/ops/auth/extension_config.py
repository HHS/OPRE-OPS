from typing import Optional

from flask import current_app
from flask_jwt_extended import JWTManager
from sqlalchemy import select

from models import User

jwtMgr = JWTManager()


@jwtMgr.user_identity_loader
def user_identity_lookup(user: User) -> str:
    return user.oidc_id


@jwtMgr.user_lookup_loader
def user_lookup_callback(_jwt_header: dict, jwt_data: dict) -> Optional[User]:
    identity = jwt_data["sub"]
    stmt = select(User).where(User.oidc_id == identity)
    return current_app.db_session.scalars(stmt).one_or_none()
