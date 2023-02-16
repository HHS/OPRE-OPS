import subprocess

# from datetime import date, datetime
from subprocess import CalledProcessError

import pytest
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from ops_api.ops import create_app, db
from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError
from tests.ops.auth_client import AuthClient


@pytest.mark.usefixtures("db_service")
@pytest.fixture()
def app(db_service):
    app = create_app({"TESTING": True})
    yield app


@pytest.fixture()
def client(app, loaded_db):
    return app.test_client()


@pytest.fixture()
def auth_client(app):
    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    public_key = private_key.public_key().public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    )
    app.config.update(JWT_PRIVATE_KEY=private_key, JWT_PUBLIC_KEY=public_key)
    app.testing = True
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
                'docker ps -f "name=pytest-data-import" -a | grep "Exited (0)"',
                shell=True,
                check=True,
            )
            print(f"result: {result}")
            return True
    except CalledProcessError:
        return False


@pytest.fixture(scope="session")
def db_service(docker_ip, docker_services):
    """Ensure that DB is up and responsive."""

    connection_string = f"postgresql://postgres:local_password@{docker_ip}:5432/postgres"  # pragma: allowlist secret
    engine = create_engine(connection_string, echo=True, future=True)
    docker_services.wait_until_responsive(timeout=40.0, pause=1.0, check=lambda: is_loaded(engine))
    return engine


# If you need the 'test container' to stick around, change this to return False
@pytest.fixture(scope="session")
def docker_cleanup():
    # return False
    return "down -v"


# Overwrite the default 'docker-compose' command with the v2 'docker compose' command.
@pytest.fixture(scope="session")
def docker_compose_command():
    return "docker compose"


# @pytest.fixture(scope="session")
# def docker_compose_file(pytestconfig):
#     compose_file = os.path.join(str(pytestconfig.rootdir),"../../", "docker-compose.yml")
#     print(f"docker-compose-path: {compose_file}")
#     return compose_file


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
