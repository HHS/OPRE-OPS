import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError


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

    # `port_for` takes a container port and returns the corresponding host port
    port = docker_services.port_for("db", 54321)
    connection_string = f"postgresql://postgres:local_password@localhost:54321/postgres"  # pragma: allowlist secret
    engine = create_engine(connection_string, echo=True, future=True)
    docker_services.wait_until_responsive(timeout=30.0, pause=0.1, check=lambda: is_responsive(engine))
    return engine
