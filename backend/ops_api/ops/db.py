from __future__ import annotations

from itertools import chain

from flask import current_app
from flask_jwt_extended import get_current_user
from sqlalchemy import Engine, create_engine, event
from sqlalchemy.orm import Session, mapper, scoped_session, sessionmaker

from models import *  # noqa: F403, F401


def init_db(
    conn_string: str,
) -> tuple[scoped_session[Session | Any], Engine]:  # noqa: F405
    engine = create_engine(conn_string)
    db_session = scoped_session(sessionmaker(autocommit=False, autoflush=False, bind=engine))

    # hack to allow SQLAlchemy v1 style .query access to all models
    BaseModel.query = db_session.query_property()  # noqa: F405

    # add the marshmallow schemas to all the models
    event.listen(mapper, "after_configured", setup_schema(BaseModel))  # noqa: F405

    return db_session, engine


def handle_create_update_by_attrs(session: Session) -> None:
    # This is a short circuit to skip setting created_by and updated_by fields
    # (to be used in tests)
    if current_app.app_context() and current_app.config.get("SKIP_SETTING_CREATED_BY"):
        return

    try:
        user = get_current_user()
        user_id = getattr(user, "id", None)
    except Exception:
        user_id = None

    for obj in chain(session.new, session.dirty, session.deleted):
        if hasattr(obj, "created_by") and not getattr(obj, "created_by"):
            setattr(obj, "created_by", user_id)
        if hasattr(obj, "updated_by"):
            setattr(obj, "updated_by", user_id)
