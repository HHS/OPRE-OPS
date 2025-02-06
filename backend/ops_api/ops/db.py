from __future__ import annotations

from itertools import chain

from flask import Config, current_app
from flask_jwt_extended import current_user
from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import scoped_session, sessionmaker

from models import *  # noqa: F403, F401


def init_db(config: Config) -> tuple[scoped_session[Session | Any], Engine]:  # noqa: F405
    echo = config["SQLALCHEMY_ECHO"]
    logger.info(f"SQLALCHEMY_ECHO: {echo}")  # noqa: F405
    engine = create_engine(config["SQLALCHEMY_DATABASE_URI"], echo=echo)
    db_session = scoped_session(sessionmaker(autocommit=False, autoflush=False, bind=engine))

    # hack to allow SQLAlchemy v1 style .query access to all models
    BaseModel.query = db_session.query_property()  # noqa: F405

    return db_session, engine


def handle_create_update_by_attrs(session: Session) -> None:  # noqa: F405
    # This is a short circuit to skip setting created_by and updated_by fields
    # (to be used in tests)
    if current_app.app_context() and current_app.config.get("SKIP_SETTING_CREATED_BY"):
        return

    try:
        user_id = getattr(current_user, "id", None)
    except RuntimeError:
        user_id = None  # current_user may not be available in some contexts

    for obj in session.new:
        if hasattr(obj, "created_by"):
            setattr(obj, "created_by", user_id)

    for obj in chain(session.new, session.dirty, session.deleted):
        if hasattr(obj, "updated_by"):
            setattr(obj, "updated_by", user_id)
