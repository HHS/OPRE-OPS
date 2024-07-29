from flask import current_app
from sqlalchemy import select
from sqlalchemy.orm import Session

from models import Role, User


def is_admin(user: User, session: Session = None) -> bool:
    if not session:
        session = current_app.db_session

    admin_role = session.execute(select(Role).where(Role.name == "admin")).scalar_one()
    return admin_role in user.roles


def is_user_admin(user: User, session: Session = None) -> bool:
    if not session:
        session = current_app.db_session

    user_admin_role = session.execute(select(Role).where(Role.name == "USER_ADMIN")).scalar_one()
    return user_admin_role in user.roles
