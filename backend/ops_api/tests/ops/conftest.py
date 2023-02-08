import os
import subprocess
from datetime import datetime

# from datetime import date, datetime
from subprocess import CalledProcessError

import pytest
from flask.testing import FlaskClient
from flask_jwt_extended import create_access_token
from models.users import User
from ops_api.ops import create_app, db
from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError

# from sqlalchemy.orm import Session

# TEST_DB_NAME = "testdb"


class AuthClient(FlaskClient):
    def open(self, *args, **kwargs):
        user = User(
            id="00000000-0000-1111-a111-000000000004",
            oidc_id="00000000-0000-1111-a111-000000000004",
            email="unit-test@ops-api.gov",
            first_name="Unit",
            last_name="Test",
            date_joined=datetime.now(),
            updated=datetime.now(),
            role="Admin",
            division=1,
        )
        access_token = create_access_token(identity=user)
        kwargs.setdefault("headers", {"Authorization": f"Bearer {access_token}"})
        return super().open(*args, **kwargs)


@pytest.mark.usefixtures("db_service")
@pytest.fixture()
def app():
    app
    yield create_app({"TESTING": True})


@pytest.fixture()
def client(app, loaded_db):
    return app.test_client()


@pytest.fixture()
def auth_client(app):
    app.testing = True
    # builder = EnvironBuilder(auth=access_token)
    # env = builder.get_environ()
    app.test_client_class = AuthClient
    return app.test_client()


def is_responsive(db):
    try:
        with db.connect() as connection:
            connection.execute(text("SELECT 1;"))
        return True
    except OperationalError:
        return False


def is_loaded(db):
    try:
        if is_responsive(db):
            # This will wait until the data-import is complete
            result = subprocess.run(
                'docker ps -f "name=pytest-data-import" -a | grep "Exited (0)"', shell=True, check=True
            )
            print(f"result: {result}")
            return True
    except CalledProcessError:
        return False


@pytest.fixture(scope="session")
def db_service(docker_ip, docker_services):
    """Ensure that DB is up and responsive."""

    connection_string = "postgresql://postgres:local_password@localhost:5433/postgres"  # pragma: allowlist secret
    engine = create_engine(connection_string, echo=True, future=True)
    docker_services.wait_until_responsive(timeout=40.0, pause=1.0, check=lambda: is_responsive(engine))
    return engine


# If you need the test container to stick around, change this to return False
@pytest.fixture(scope="session")
def docker_cleanup():
    return True


@pytest.fixture(scope="session")
def docker_compose_file(pytestconfig):
    return os.path.join(str(pytestconfig.rootdir), "docker-compose.yml")


# def pytest_addoption(parser):
#     parser.addoption(
#         "--dburl",
#         action="store",
#         default=f"sqlite:///{TEST_DB_NAME}.db",
#         help="url of the database to use for tests",
#     )


@pytest.fixture()
def loaded_db(app):
    # Using the db_session fixture, we have a session, with a SQLAlchemy db_engine
    # binding.
    with app.app_context():
        yield db


@pytest.fixture()
def app_ctx(app):
    with app.app_context():
        yield
