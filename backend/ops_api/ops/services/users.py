from sqlalchemy import select
from sqlalchemy.orm import Session
from werkzeug.exceptions import Forbidden, NotFound

from models import Role, User
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
    """
    user_id = kwargs.get("id")
    request_user = kwargs.get("request_user")
    data = kwargs.get("data", {})

    if not data:
        raise RuntimeError("No data provided to update user.")

    if "id" in data and user_id != data.get("id"):
        raise Forbidden("User ID does not match ID in data.")

    get_user(session, id=user_id)  # Ensure user exists

    if not is_user_admin(request_user):
        raise Forbidden("You do not have permission to update this user.")

    if "roles" in data:
        data["roles"] = [
            session.scalar(select(Role).where(Role.name == role_name)) for role_name in data.get("roles", [])
        ]
    data["id"] = data.get("id", user_id)
    updated_user = User(**data)

    updated_user = session.merge(updated_user)

    session.commit()
    return updated_user


def get_users(session: Session, **kwargs) -> list[User]:
    stmt = select(User)

    for key, value in kwargs.items():
        stmt = stmt.where(getattr(User, key) == value)

    stmt = stmt.order_by(User.id)

    users = session.execute(stmt).scalars().all()

    return list(users)
