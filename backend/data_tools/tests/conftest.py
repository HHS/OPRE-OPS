import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import Session, scoped_session, sessionmaker

from models import BaseModel


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
    engine = create_engine(connection_string, echo=True, future=True)
    docker_services.wait_until_responsive(timeout=30.0, pause=0.1, check=lambda: is_responsive(engine))
    return engine


@pytest.fixture()
def loaded_db(db_service) -> Session:
    """Get SQLAlchemy Session."""

    BaseModel.metadata.drop_all(db_service)
    BaseModel.metadata.create_all(db_service)

    session = scoped_session(sessionmaker(autocommit=False, autoflush=False, bind=db_service))

    yield session

    # cleanup
    session.rollback()

    session.commit()
    session.close()
