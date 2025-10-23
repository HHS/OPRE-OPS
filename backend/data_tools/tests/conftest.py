import pytest
from sqlalchemy import event, text
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import Session

from data_tools.src.common.db import init_db
from data_tools.src.common.utils import get_or_create_sys_user
from models import BaseModel
from models.utils import track_db_history_after, track_db_history_before, track_db_history_catch_errors


def is_responsive(db):
    try:
        with db.connect() as connection:
            connection.execute(text("SELECT 1"))
        return True
    except OperationalError:
        return False


@pytest.fixture(scope="session")
def db_service(docker_ip, docker_services):
    """Ensure that DB is up and responsive."""

    connection_string = "postgresql://postgres:local_password@localhost:54321/postgres"  # pragma: allowlist secret
    db_session, engine = init_db(connection_string)
    docker_services.wait_until_responsive(timeout=30.0, pause=0.1, check=lambda: is_responsive(engine))

    BaseModel.metadata.create_all(engine)
    return db_session, engine


@pytest.fixture()
def loaded_db(db_service) -> Session:
    """Get SQLAlchemy Session."""

    db_session, engine = db_service

    @event.listens_for(db_session, "before_commit")
    def receive_before_commit(session: Session):
        sys_user = get_or_create_sys_user(session)
        track_db_history_before(session, sys_user)

    @event.listens_for(db_session, "after_flush")
    def receive_after_flush(session: Session, flush_context):
        sys_user = get_or_create_sys_user(session)
        track_db_history_after(session, sys_user)

    @event.listens_for(engine, "handle_error")
    def receive_error(exception_context):
        track_db_history_catch_errors(exception_context)

    yield db_session

    # cleanup
    db_session.rollback()

    # cleanup history records
    db_session.execute(text("DELETE FROM ops_db_history"))

    db_session.commit()
    db_session.close()
