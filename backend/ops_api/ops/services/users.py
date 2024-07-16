from sqlalchemy.orm import Session
from werkzeug.exceptions import NotFound

from models import User


def get_user(id: int, session: Session) -> User | None:
    return session.get(User, id)


def update_user(session: Session, data: dict) -> User:
    """
    Update a user with the given data.

    :param session: The database session.
    :param data: The data to update the user with.
    :return: The updated user.

    N.B. The data param should contain the user ID as the key "id".
    """
    user_id = data.get("id")
    user: User | None = session.get(User, user_id)

    if not user:
        raise NotFound(f"User {user_id} not found")

    updated_user = User(**data)

    updated_user = session.merge(updated_user)

    session.commit()
    return updated_user
