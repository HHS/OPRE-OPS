from sqlalchemy import select
from sqlalchemy.orm import Session
from werkzeug.exceptions import Forbidden, NotFound

from models import Role, User


def get_user(session: Session, **kwargs) -> User | None:
    return session.get(User, kwargs.get("id"))


def update_user(session: Session, **kwargs) -> User:
    """
    Update a user with the given data.

    :param session: The database session.
    :param **kwargs: The data to update the user with.
    :return: The updated user.

    N.B. One of the kwargs must be "id" to identify the user to update.

    N.B. kwargs.data is a dict[str, str | int | list[str]]
    """
    user_id = kwargs.get("id")
    data = kwargs.get("data", {})

    if not data:
        raise RuntimeError("No data provided to update user.")

    if user_id != data.get("id"):
        raise Forbidden("User ID does not match ID in data.")

    user: User | None = session.get(User, user_id)

    if not user:
        raise NotFound(f"User {user_id} not found")

    data["roles"] = [session.scalar(select(Role).where(Role.name == role_name)) for role_name in data.get("roles", [])]
    updated_user = User(**data)

    updated_user = session.merge(updated_user)

    session.commit()
    return updated_user
