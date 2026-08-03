from flask import Flask, current_app
from sqlalchemy import select
from sqlalchemy.orm import Session

from models import Role, User
from models.users import SYSTEM_ADMIN_OIDC_ID


def is_user_admin(user: User, session: Session = None) -> bool:
    if not session:
        session = current_app.db_session

    user_admin_role = session.execute(select(Role).where(Role.name == "USER_ADMIN")).scalar_one()
    return user_admin_role in user.roles


def is_super_user(user: User, app_context: Flask) -> bool:
    super_user_role = app_context.db_session.execute(
        select(Role).where(Role.name.ilike(app_context.config.get("SUPER_USER", "SUPER_USER")))
    ).scalar_one_or_none()

    if not super_user_role:
        return False

    return super_user_role in user.roles


def is_budget_team(user: User) -> bool:
    return "BUDGET_TEAM" in (role.name for role in user.roles)


def get_sys_user(session: Session) -> User:
    """
    Get or create the system user.

    Args:
        session: SQLAlchemy session object
    Returns:
        None
    """
    user = session.execute(select(User).where(User.oidc_id == SYSTEM_ADMIN_OIDC_ID)).scalar_one_or_none()

    return user
