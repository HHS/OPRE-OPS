from __future__ import annotations

from itertools import chain

from flask import Config, current_app
from flask_jwt_extended import current_user
from loguru import logger
from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import Session, scoped_session, sessionmaker
from typing_extensions import Any

from models.base import BaseModel


def init_db(
    config: Config,
) -> tuple[scoped_session[Session | Any], Engine]:
    echo = config["SQLALCHEMY_ECHO"]
    logger.info(f"SQLALCHEMY_ECHO: {echo}")

    # Get pool settings from config (with defaults)
    pool_size = config.get("SQLALCHEMY_POOL_SIZE", 10)
    max_overflow = config.get("SQLALCHEMY_MAX_OVERFLOW", 10)
    pool_timeout = config.get("SQLALCHEMY_POOL_TIMEOUT", 30)
    pool_recycle = config.get("SQLALCHEMY_POOL_RECYCLE", 3600)
    pool_pre_ping = config.get("SQLALCHEMY_POOL_PRE_PING", True)

    logger.info(
        f"Database pool config: size={pool_size}, max_overflow={max_overflow}"
    )

    engine = create_engine(
        config["SQLALCHEMY_DATABASE_URI"],
        echo=echo,
        pool_size=pool_size,
        max_overflow=max_overflow,
        pool_timeout=pool_timeout,
        pool_recycle=pool_recycle,
        pool_pre_ping=pool_pre_ping,
    )
    db_session = scoped_session(
        sessionmaker(autocommit=False, autoflush=False, bind=engine)
    )

    # hack to allow SQLAlchemy v1 style .query access to all models
    BaseModel.query = db_session.query_property()

    return db_session, engine


def handle_create_update_by_attrs(session: Session) -> None:
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
            obj.created_by = user_id

    for obj in chain(session.new, session.dirty, session.deleted):
        if hasattr(obj, "updated_by"):
            obj.updated_by = user_id
