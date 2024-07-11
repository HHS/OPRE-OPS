from sqlalchemy.orm import Session

from models import User


def get_user(id: int, session: Session) -> User | None:
    return session.get(User, id)
