from typing import cast

from models import Role, User, UserStatus
from sqlalchemy import ColumnElement, select
from sqlalchemy.orm import Session
from werkzeug.exceptions import BadRequest, Forbidden, NotFound

from ops_api.ops.auth.utils import deactivate_all_user_sessions, get_all_user_sessions
from ops_api.ops.utils.users import is_user_admin


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

        user_sessions = get_all_user_sessions(user_id, session)
        deactivate_all_user_sessions(user_sessions)

    if "roles" in data:
        data["roles"] = [
            session.scalar(select(Role).where(Role.name == role_name))
            for role_name in data.get("roles", [])
        ]
    data["id"] = data.get("id", user_id)
    updated_user = User(**data)

    updated_user = session.merge(updated_user)

    session.commit()
    return updated_user


def get_users(session: Session, **kwargs) -> list[User]:
    """
    Get all users that match the given criteria.

    :param session: The database session.
    :param **kwargs: The criteria to filter the users by.
    :return: The users that match the criteria.

    """
    stmt = select(User)

    for key, value in kwargs.items():
        if key == "roles":
            stmt = stmt.where(User.roles.any(Role.name.in_(value)))
        else:
            stmt = stmt.where(cast(ColumnElement[bool], getattr(User, key)) == value)

    stmt = stmt.order_by(User.id)

    users = session.execute(stmt).scalars().all()

    return list(users)


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
        data["roles"] = [
            session.scalar(select(Role).where(Role.name == role_name))
            for role_name in data.get("roles", [])
        ]
    new_user = User(**data)

    session.add(new_user)
    session.commit()
    return new_user
