from __future__ import annotations

from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import Session, scoped_session, sessionmaker

from models import *  # noqa: F403, F401


def init_db(
    conn_string: str,
) -> tuple[scoped_session[Session | Any], Engine]:  # noqa: F405
    engine = create_engine(conn_string)
    db_session = scoped_session(sessionmaker(autocommit=False, autoflush=False, bind=engine))

    # add the marshmallow schemas to all the models
    setup_schema(BaseModel)()

    return db_session, engine
