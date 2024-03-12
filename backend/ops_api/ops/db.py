from __future__ import annotations

from models import *  # noqa: F403, F401
from sqlalchemy import Engine, create_engine, event
from sqlalchemy.orm import Session, mapper, scoped_session, sessionmaker


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
