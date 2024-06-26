"""Configuration for pytest tests."""

import subprocess
from collections.abc import Generator

import pytest
from flask import Flask
from flask.testing import FlaskClient
from pytest_docker.plugin import Services
from sqlalchemy import create_engine, delete, text
from sqlalchemy.engine import Engine
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import Session

from models import OpsDBHistory, OpsEvent, Project, User, Vendor
from ops_api.ops import create_app
from tests.auth_client import AuthClient, NoPermsAuthClient


@pytest.fixture()
def app(db_service) -> Generator[Flask, None, None]:
    """Make and return the flask app."""
    app = create_app({"TESTING": True})
    yield app


@pytest.fixture()
def client(app: Flask, loaded_db) -> FlaskClient:  # type: ignore [type-arg]
    """Get a test client for flask."""
    app.testing = True
    app.test_client_class = FlaskClient
    return app.test_client()


@pytest.fixture()
def auth_client(app: Flask) -> FlaskClient:  # type: ignore [type-arg]
    """Get the authenticated test client for flask."""
    app.testing = True
    app.test_client_class = AuthClient
    return app.test_client()


@pytest.fixture()
def no_perms_auth_client(app: Flask) -> FlaskClient:  # type: ignore [type-arg]
    """Get the authenticated test client for flask."""
    app.testing = True
    app.test_client_class = NoPermsAuthClient
    return app.test_client()


def is_responsive(db: Engine) -> bool:
    """Check if the DB is responsive."""
    try:
        with db.connect() as connection:
            connection.execute(text("SELECT 1;"))
        return True
    except OperationalError:
        return False


def is_loaded(db: Engine) -> bool:
    """Check if the DB is up."""
    try:
        if is_responsive(db):
            # This will wait until the data-import is complete
            result = subprocess.run(
                'docker ps -f "name=pytest-data-import" -a | grep "Exited (0)"',
                shell=True,
                check=True,
            )
            print(f"result: {result}")
            return True
    except subprocess.CalledProcessError:
        return False
    else:
        return False


@pytest.fixture(scope="session")
def db_service(docker_ip: str, docker_services: Services) -> Engine:
    """Ensure that DB is up and responsive."""

    connection_string = f"postgresql://postgres:local_password@{docker_ip}:5432/postgres"  # pragma: allowlist secret
    engine = create_engine(connection_string, echo=True, future=True)
    docker_services.wait_until_responsive(timeout=40.0, pause=1.0, check=lambda: is_loaded(engine))
    return engine


# If you need the 'test container' to stick around, change this to return False
@pytest.fixture(scope="session")
def docker_cleanup() -> str:
    """Return the command to shut down docker compose."""
    # return False
    return "down -v"


# Overwrite the default 'docker-compose' command with the v2 'docker compose' command.
@pytest.fixture(scope="session")
def docker_compose_command() -> str:
    """Return the command for docker compose."""
    return "docker compose"


@pytest.fixture()
def loaded_db(app: Flask, app_ctx: None, auth_client: FlaskClient) -> Session:
    """Get SQLAlchemy Session."""

    session = app.db_session

    yield session

    # cleanup
    session.rollback()

    session.execute(delete(OpsDBHistory))
    session.execute(delete(OpsEvent))

    session.commit()
    session.close()


@pytest.fixture()
def app_ctx(app: Flask) -> Generator[None, None, None]:
    """Activate the ApplicationContext for the flask app."""
    with app.app_context():
        yield


@pytest.fixture()
def test_user(loaded_db) -> User | None:
    """Get a test user.

    N.B. This user has an ADMIN role whose status is INACTIVE.
    """
    return loaded_db.get(User, 500)


@pytest.fixture()
def test_admin_user(loaded_db) -> User | None:
    """Get a test admin user - also the user associated with the auth_client.

    N.B. This user has an ADMIN role whose status is ACTIVE.
    """
    return loaded_db.get(User, 503)


@pytest.fixture()
def test_vendor(loaded_db) -> Vendor | None:
    """Get a test Vendor."""
    return loaded_db.get(Vendor, 100)


@pytest.fixture()
def test_project(loaded_db) -> Project | None:
    """Get a test Project."""
    return loaded_db.get(Project, 1000)
