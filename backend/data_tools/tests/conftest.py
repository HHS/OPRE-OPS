"""Configuration for pytest tests.

Supports two execution modes:
- Sequential: `pipenv run pytest` (uses pytest-docker for container lifecycle)
- Parallel: `pipenv run pytest -n auto` (xdist workers share one Docker instance,
  each gets its own database cloned from the seeded template)
"""

# flake8: noqa: S404,S607,S602
import os
import subprocess
import time
import timeit
from collections.abc import Generator

import pytest
from filelock import FileLock
from sqlalchemy import create_engine, event, text
from sqlalchemy.engine import Engine
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import Session, configure_mappers

from data_tools.src.common.db import init_db
from data_tools.src.common.utils import get_or_create_sys_user
from models import BaseModel
from models.utils import track_db_history_after, track_db_history_before, track_db_history_catch_errors

# ---------------------------------------------------------------------------
# Docker / database infrastructure
# ---------------------------------------------------------------------------

COMPOSE_FILE = os.path.join(os.path.dirname(__file__), "docker-compose.yml")
DOCKER_PROJECT_NAME = "pytest-data-tools"


def pytest_sessionfinish(session, exitstatus):
    """Tear down Docker containers after xdist controller finishes."""
    if os.environ.get("PYTEST_XDIST_WORKER"):
        return

    if session.config.pluginmanager.has_plugin("dsession"):
        try:
            subprocess.run(
                f"docker compose -f {COMPOSE_FILE} -p {DOCKER_PROJECT_NAME} down -v",
                shell=True,
                check=True,
                capture_output=True,
            )
        except subprocess.CalledProcessError:
            pass


def is_responsive(db: Engine) -> bool:
    try:
        with db.connect() as connection:
            connection.execute(text("SELECT 1"))
        return True
    except OperationalError:
        return False


def _wait_for_db(engine: Engine, timeout: float = 60.0, pause: float = 0.5) -> None:
    ref = timeit.default_timer()
    while (timeit.default_timer() - ref) < timeout:
        if is_responsive(engine):
            return
        time.sleep(pause)
    raise TimeoutError("Timed out waiting for database to be responsive.")


def _docker_compose(cmd: str) -> None:
    subprocess.run(
        f"docker compose -f {COMPOSE_FILE} -p {DOCKER_PROJECT_NAME} {cmd}",
        shell=True,
        check=True,
    )


# Provide worker_id fixture if pytest-xdist is not installed
try:
    import xdist  # noqa: F401
except ImportError:

    @pytest.fixture(scope="session")
    def worker_id():
        return "master"


# --- pytest-docker fixtures (used in sequential mode only) ---


@pytest.fixture(scope="session")
def docker_cleanup() -> str:
    return "down -v"


@pytest.fixture(scope="session")
def docker_compose_command() -> str:
    return "docker compose"


@pytest.fixture(scope="session")
def docker_compose_project_name() -> str:
    return DOCKER_PROJECT_NAME


# ---------------------------------------------------------------------------
# db_service — the core fixture that provides a per-worker database engine
# ---------------------------------------------------------------------------


@pytest.fixture(scope="session")
def db_service(request, worker_id, tmp_path_factory) -> Generator[tuple[Session, Engine], None, None]:
    """Provide a database session and engine.

    Sequential mode (worker_id == "master"):
        Uses pytest-docker to manage container lifecycle normally.

    Parallel mode (xdist workers):
        Coordinates Docker startup via file lock. Each worker clones the seeded
        database for full isolation.
    """
    docker_ip = "127.0.0.1"
    port = "54321"
    admin_url = f"postgresql://postgres:local_password@{docker_ip}:{port}/postgres"  # pragma: allowlist secret

    if worker_id == "master":
        # Sequential mode — delegate to pytest-docker fixtures
        docker_services = request.getfixturevalue("docker_services")
        engine = create_engine(admin_url, isolation_level="AUTOCOMMIT")
        docker_services.wait_until_responsive(timeout=60.0, pause=0.5, check=lambda: is_responsive(engine))

        connection_string = (
            f"postgresql://postgres:local_password@{docker_ip}:{port}/postgres"  # pragma: allowlist secret
        )
        db_session, engine = init_db(connection_string)
        BaseModel.metadata.create_all(engine)

        yield db_session, engine
        engine.dispose()
        return

    # --- xdist worker mode ---
    root_tmp = tmp_path_factory.getbasetemp().parent
    lock = root_tmp / "docker_startup.lock"
    flag = root_tmp / "docker_started"

    with FileLock(str(lock)):
        if not flag.exists():
            _docker_compose("up --build -d")
            flag.write_text("started")

    admin_engine = create_engine(admin_url, isolation_level="AUTOCOMMIT", pool_pre_ping=True)
    _wait_for_db(admin_engine)

    # Create tables on the base database (once) so workers can clone it.
    template_lock = root_tmp / "template_create.lock"
    template_flag = root_tmp / "template_created"
    with FileLock(str(template_lock)):
        if not template_flag.exists():
            configure_mappers()
            base_engine = create_engine(admin_url)
            BaseModel.metadata.create_all(base_engine)
            base_engine.dispose()
            template_flag.write_text("created")

    # Clone the database for this worker.
    # worker_id comes from xdist (always "gw0", "gw1", etc.) — safe for DDL interpolation.
    db_name = f"test_{worker_id}"
    clone_lock = root_tmp / "db_clone.lock"
    with FileLock(str(clone_lock)):
        with admin_engine.connect() as conn:
            conn.execute(
                text(
                    "SELECT pg_terminate_backend(pid) "
                    "FROM pg_stat_activity "
                    "WHERE datname = 'postgres' AND pid <> pg_backend_pid()"
                )
            )
            conn.execute(text(f"DROP DATABASE IF EXISTS {db_name}"))
            conn.execute(text(f"CREATE DATABASE {db_name} TEMPLATE postgres"))

    worker_url = f"postgresql://postgres:local_password@{docker_ip}:{port}/{db_name}"  # pragma: allowlist secret
    db_session, engine = init_db(worker_url)

    yield db_session, engine

    engine.dispose()
    with admin_engine.connect() as conn:
        conn.execute(
            text(
                f"SELECT pg_terminate_backend(pid) "
                f"FROM pg_stat_activity "
                f"WHERE datname = '{db_name}' AND pid <> pg_backend_pid()"
            )
        )
        conn.execute(text(f"DROP DATABASE IF EXISTS {db_name}"))
    admin_engine.dispose()


# ---------------------------------------------------------------------------
# Database session with SAVEPOINT isolation
# ---------------------------------------------------------------------------


@pytest.fixture()
def loaded_db(db_service, monkeypatch) -> Generator[Session, None, None]:
    """Provide a DB session wrapped in a transaction that rolls back after each test.

    Uses a SAVEPOINT so that application code calling session.commit() does not
    actually persist changes — everything is rolled back at the end of the test.

    Also patches the CLI's init_db_from_config so that CliRunner-based tests
    reuse this session (and thus participate in the SAVEPOINT rollback).
    """
    db_session, engine = db_service

    db_session.remove()

    connection = engine.connect()
    transaction = connection.begin()

    db_session.configure(bind=connection)
    connection.begin_nested()

    @event.listens_for(db_session, "after_transaction_end")
    def restart_savepoint(sess, trans):
        if trans.nested and not trans._parent.nested:
            connection.begin_nested()

    @event.listens_for(db_session, "before_commit")
    def receive_before_commit(session: Session):
        sys_user = get_or_create_sys_user(session)
        track_db_history_before(session, sys_user)

    @event.listens_for(db_session, "after_flush")
    def receive_after_flush(session: Session, flush_context):
        sys_user = get_or_create_sys_user(session)
        track_db_history_after(session, sys_user)

    # Patch CLI so CliRunner tests use this session instead of creating a new DB connection.
    monkeypatch.setattr(
        "data_tools.src.load_data.init_db_from_config",
        lambda config: (engine, BaseModel.metadata),
    )
    monkeypatch.setattr(
        "data_tools.src.load_data.setup_triggers",
        lambda session, sys_user: None,
    )

    class _CliSessionProxy:
        """Stand-in for scoped_session that yields the test session to CLI code."""

        def __init__(self, *args, **kwargs):
            pass

        def __call__(self):
            return self

        def __enter__(self):
            return db_session()

        def __exit__(self, *args):
            pass

        def __getattr__(self, name):
            return getattr(db_session, name)

    monkeypatch.setattr("data_tools.src.load_data.scoped_session", _CliSessionProxy)

    yield db_session

    event.remove(db_session, "after_transaction_end", restart_savepoint)
    event.remove(db_session, "before_commit", receive_before_commit)
    event.remove(db_session, "after_flush", receive_after_flush)
    db_session.remove()
    transaction.rollback()
    connection.close()
