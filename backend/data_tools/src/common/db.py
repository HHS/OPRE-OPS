from __future__ import annotations

from data_tools.environment.types import DataToolsConfig
from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import Session, scoped_session, sessionmaker

from models import *  # noqa: F403, F401
from models import BaseModel
from models.utils import track_db_history_after, track_db_history_before, track_db_history_catch_errors


def init_db(
    conn_string: str,
) -> tuple[scoped_session[Session | Any], Engine]:  # noqa: F405
    engine = create_engine(conn_string)

    db_session = scoped_session(sessionmaker(autocommit=False, autoflush=False, bind=engine))

    setup_schema(BaseModel)()

    return db_session, engine

def setup_triggers(session: scoped_session[Session | Any], sys_user: User) -> None:

    @event.listens_for(session, "before_commit")
    def receive_before_commit(session: Session):
        track_db_history_before(session, sys_user)

    @event.listens_for(session, "after_flush")
    def receive_after_flush(session: Session, flush_context):
        track_db_history_after(session, sys_user)

    @event.listens_for(session.get_bind(), "handle_error")
    def receive_error(exception_context):
        track_db_history_catch_errors(exception_context)

    return None


def init_db_from_config(
    config: DataToolsConfig, db: Optional[Engine] = None
) -> tuple[sqlalchemy.engine.Engine, sqlalchemy.MetaData]:
    if not db:
        _, engine = init_db(config.db_connection_string)
    else:
        engine = db
    return engine, BaseModel.metadata
