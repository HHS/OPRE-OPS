from typing import cast

from sqlalchemy import ColumnElement, select
from sqlalchemy.orm import Session
from werkzeug.exceptions import BadRequest, Forbidden, NotFound

from models import Role, User, UserStatus
from ops_api.ops.auth.utils import deactivate_all_user_sessions, get_all_active_user_sessions
from ops_api.ops.utils.users import is_user_admin

READ_ONLY_ROLE = "READ_ONLY"
SYSTEM_ADMIN_EMAIL = "system.admin@email.com"


def resolve_roles(session: Session, role_names: list[str]) -> list[Role]:
    """
    Resolve a list of role names to Role objects, enforcing role-combination rules.

    Business Rules:
    - The READ_ONLY role cannot be combined with any other role.
    """
    if READ_ONLY_ROLE in role_names and len(role_names) > 1:
        raise BadRequest("The READ_ONLY role cannot be combined with other roles.")

    resolved_roles = []
    for role_name in role_names:
        role = session.scalar(select(Role).where(Role.name == role_name))
        if role is None:
            raise BadRequest(f"Role '{role_name}' does not exist.")
        resolved_roles.append(role)
    return resolved_roles


def get_user(session: Session, **kwargs) -> User:
    id = kwargs.get("id")
    user: User | None = session.get(User, id)

    if not user:
        raise NotFound(f"User {id} not found")

    return user


def update_user(session: Session, **kwargs) -> User:
    """
    Update a user with the given data.

    :param session: The database session.
    :param **kwargs: The data to update the user with.
    :return: The updated user.

    N.B. One of the kwargs must be "id" to identify the user to update.

    N.B. kwargs.data is a dict[str, str | int | list[str]]

    N.B. Only USER_ADMIN role can update users
    """
    user_id = kwargs.get("id")
    request_user = kwargs.get("request_user")
    data = kwargs.get("data", {})

    if not data:
        raise BadRequest("No data provided to update user.")

    if "id" in data and user_id != data.get("id"):
        raise BadRequest("User ID does not match ID in data.")

    get_user(session, id=user_id)  # Ensure user exists

    if not is_user_admin(request_user):
        raise BadRequest("You do not have permission to update this user.")

    if data.get("status") in [UserStatus.INACTIVE, UserStatus.LOCKED]:
        if user_id == request_user.id:
            raise BadRequest("You cannot deactivate yourself.")

        user_sessions = get_all_active_user_sessions(user_id, session)
        deactivate_all_user_sessions(user_sessions)

    if "roles" in data:
        data["roles"] = resolve_roles(session, data.get("roles", []))
    data["id"] = data.get("id", user_id)
    updated_user = User(**data)

    updated_user = session.merge(updated_user)

    session.commit()
    return updated_user


def get_users(session: Session, **kwargs) -> list[User]:
    """
    Get all users that match the given criteria.

    :param session: The database session.
    :param exclude_read_only: Whether to exclude read-only users.
    :param exclude_system_admin: Whether to exclude the System Admin ETL user.
    :param **kwargs: The criteria to filter the users by.
    :return: The users that match the criteria.

    Business Rules:
    - Users with READ_ONLY role are excluded from the response
    - The System Admin ETL user can optionally be excluded from the response

    """
    stmt = select(User)

    exclude_read_only = kwargs.pop("exclude_read_only", False)
    exclude_system_admin = kwargs.pop("exclude_system_admin", False)

    for key, value in kwargs.items():
        if key == "roles":
            stmt = stmt.where(User.roles.any(Role.name.in_(value)))
        else:
            stmt = stmt.where(cast(ColumnElement[bool], getattr(User, key)) == value)

    if exclude_read_only:
        stmt = stmt.where(~User.roles.any(Role.name == READ_ONLY_ROLE))

    if exclude_system_admin:
        stmt = stmt.where(User.email != SYSTEM_ADMIN_EMAIL)

    stmt = stmt.order_by(User.id)

    users = session.execute(stmt).scalars().all()

    return users


def create_user(session: Session, **kwargs) -> User:
    """
    Create a user with the given data.

    :param session: The database session.
    :param **kwargs: The data to create the user with.
    :return: The created user.

    N.B. Only USER_ADMIN role can create users
    """
    data = kwargs.get("data", {})
    request_user = kwargs.get("request_user")

    if not data:
        raise RuntimeError("No data provided to create user.")

    if not is_user_admin(request_user):
        raise Forbidden("You do not have permission to create a user.")

    if "roles" in data:
        data["roles"] = resolve_roles(session, data.get("roles", []))
    new_user = User(**data)

    session.add(new_user)
    session.commit()
    return new_user
