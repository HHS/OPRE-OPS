"""Configuration for pytest tests.

Supports two execution modes:
- Sequential: `pipenv run pytest` (uses pytest-docker for container lifecycle)
- Parallel: `pipenv run pytest -n auto` (xdist workers share one Docker instance,
  each gets its own database cloned from the seeded template)
"""

# flake8: noqa: S404,S607,S602
import os
import subprocess
import sys
import time
import timeit

# Raise soft limit for open files to avoid OSError: [Errno 24] Too many open files
# when running the full suite (many app/session/connection instances per test).
if sys.platform != "win32":
    try:
        import resource

        soft, hard = resource.getrlimit(resource.RLIMIT_NOFILE)
        if soft != resource.RLIM_INFINITY and soft < 4096:
            resource.setrlimit(resource.RLIMIT_NOFILE, (min(4096, hard), hard))
    except (ImportError, OSError, ValueError) as exc:
        import warnings

        warnings.warn(f"Could not raise RLIMIT_NOFILE to 4096: {exc}", stacklevel=1)

from collections.abc import Generator
from datetime import datetime, timezone
from typing import Type

import pytest
from filelock import FileLock
from flask import Flask
from flask.testing import FlaskClient
from sqlalchemy import create_engine, event, text
from sqlalchemy.engine import Engine
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import Session

from models import (
    CAN,
    AgreementAgency,
    BudgetLineItem,
    BudgetLineItemChangeRequest,
    CANFundingBudget,
    CANFundingDetails,
    ChangeRequestStatus,
    OpsEvent,
    ProcurementShop,
    Project,
    ResearchProject,
    User,
    Vendor,
)
from ops_api.ops import create_app
from ops_api.tests.auth_client import PowerUserAuthClient
from tests.auth_client import (
    AuthClient,
    BasicUserAuthClient,
    BudgetTeamAuthClient,
    Division6DirectorAuthClient,
    DivisionDirectorAuthClient,
    NoPermsAuthClient,
    SystemOwnerAuthClient,
)

# ---------------------------------------------------------------------------
# Docker / database infrastructure
# ---------------------------------------------------------------------------

COMPOSE_FILE = os.path.join(os.path.dirname(__file__), "docker-compose.yml")
DOCKER_PROJECT_NAME = "pytest-ops-api"


def pytest_sessionfinish(session, exitstatus):
    """Tear down Docker containers after xdist controller finishes.

    In sequential mode, pytest-docker handles teardown. In xdist mode, the
    controller process (not a worker) tears down the shared containers.
    """
    # Skip if this is a worker process
    if os.environ.get("PYTEST_XDIST_WORKER"):
        return

    # Only tear down if xdist was actually used
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
            connection.execute(text("SELECT 1;"))
        return True
    except OperationalError:
        return False


def is_loaded(db: Engine) -> bool:
    try:
        if is_responsive(db):
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


def _wait_for_db(engine: Engine, timeout: float = 120.0, pause: float = 1.0) -> None:
    ref = timeit.default_timer()
    while (timeit.default_timer() - ref) < timeout:
        if is_loaded(engine):
            return
        time.sleep(pause)
    raise TimeoutError("Timed out waiting for database to be seeded.")


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
def db_service(request, worker_id, tmp_path_factory) -> Generator[Engine, None, None]:
    """Provide a database engine.

    Sequential mode (worker_id == "master"):
        Uses pytest-docker to manage container lifecycle normally.

    Parallel mode (xdist workers):
        Coordinates Docker startup via file lock. Each worker clones the seeded
        database for full isolation.
    """
    docker_ip = "127.0.0.1"
    admin_url = f"postgresql://postgres:local_password@{docker_ip}:5432/postgres"  # pragma: allowlist secret

    if worker_id == "master":
        # Sequential mode — delegate to pytest-docker fixtures
        docker_services = request.getfixturevalue("docker_services")
        admin_engine = create_engine(admin_url, isolation_level="AUTOCOMMIT")
        docker_services.wait_until_responsive(timeout=120.0, pause=1.0, check=lambda: is_loaded(admin_engine))

        engine = create_engine(
            f"postgresql://ops:ops@{docker_ip}:5432/postgres",  # pragma: allowlist secret
            echo=True,
        )
        yield engine
        engine.dispose()
        admin_engine.dispose()
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

    # Create a dedicated template DB (once) so workers don't contend on 'postgres'.
    template_db = "ops_test_template"
    template_lock = root_tmp / "template_create.lock"
    template_flag = root_tmp / "template_created"
    with FileLock(str(template_lock)):
        if not template_flag.exists():
            with admin_engine.connect() as conn:
                conn.execute(
                    text(
                        "SELECT pg_terminate_backend(pid) "
                        "FROM pg_stat_activity "
                        "WHERE datname = 'postgres' AND pid <> pg_backend_pid()"
                    )
                )
                conn.execute(text(f"DROP DATABASE IF EXISTS {template_db}"))
                conn.execute(text(f"CREATE DATABASE {template_db} TEMPLATE postgres"))
                conn.execute(text(f"GRANT ALL PRIVILEGES ON DATABASE {template_db} TO ops"))
            template_flag.write_text("created")

    # Clone from the template for this worker (no connections to contend with).
    # worker_id comes from xdist (always "gw0", "gw1", etc.) — safe for DDL interpolation.
    db_name = f"test_{worker_id}"
    clone_lock = root_tmp / "db_clone.lock"
    with FileLock(str(clone_lock)):
        with admin_engine.connect() as conn:
            conn.execute(
                text(
                    f"SELECT pg_terminate_backend(pid) "
                    f"FROM pg_stat_activity "
                    f"WHERE datname = '{template_db}' AND pid <> pg_backend_pid()"
                )
            )
            conn.execute(text(f"DROP DATABASE IF EXISTS {db_name}"))
            conn.execute(text(f"CREATE DATABASE {db_name} TEMPLATE {template_db}"))
            conn.execute(text(f"GRANT ALL PRIVILEGES ON DATABASE {db_name} TO ops"))

    worker_url = f"postgresql://ops:ops@{docker_ip}:5432/{db_name}"  # pragma: allowlist secret
    engine = create_engine(worker_url, echo=False)

    yield engine

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
# Flask app fixtures
# ---------------------------------------------------------------------------


@pytest.fixture()
def app(db_service) -> Generator[Flask, None, None]:
    """Make and return the flask app, bound to this worker's database."""
    app = create_app()

    # Override the engine/session to use the worker-specific database.
    # Don't dispose db_service — it's session-scoped and shared across tests.
    if str(app.engine.url) != str(db_service.url):
        app.engine.dispose()
        app.engine = db_service
        app.db_session.configure(bind=db_service)

    yield app


@pytest.fixture()
def app_ctx(app: Flask) -> Generator[None, None, None]:
    """Activate the ApplicationContext for the flask app."""
    with app.app_context():
        yield


@pytest.fixture()
def client(app: Flask) -> FlaskClient:  # type: ignore [type-arg]
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


@pytest.fixture()
def basic_user_auth_client(app: Flask) -> FlaskClient:
    """Get a user with just the basic user permissions and not SYSTEM_OWNER perms."""
    app.testing = True
    app.test_client_class = BasicUserAuthClient
    return app.test_client()


@pytest.fixture()
def budget_team_auth_client(app: Flask) -> FlaskClient:
    """Get a user with just the budget team permissions and not SYSTEM_OWNER perms."""
    app.testing = True
    app.test_client_class = BudgetTeamAuthClient
    return app.test_client()


@pytest.fixture()
def division_director_auth_client(app: Flask) -> FlaskClient:
    app.testing = True
    app.test_client_class = DivisionDirectorAuthClient
    return app.test_client()


@pytest.fixture()
def division_6_director_auth_client(app: Flask) -> FlaskClient:
    app.testing = True
    app.test_client_class = Division6DirectorAuthClient
    return app.test_client()


@pytest.fixture()
def system_owner_auth_client(app: Flask) -> FlaskClient:
    app.testing = True
    app.test_client_class = SystemOwnerAuthClient
    return app.test_client()


@pytest.fixture()
def power_user_auth_client(app: Flask) -> FlaskClient:
    app.testing = True
    app.test_client_class = PowerUserAuthClient
    return app.test_client()


# ---------------------------------------------------------------------------
# Database session with SAVEPOINT isolation
# ---------------------------------------------------------------------------


@pytest.fixture()
def loaded_db(app: Flask, app_ctx: None) -> Generator[Session, None, None]:
    """Provide a DB session wrapped in a transaction that rolls back after each test.

    Uses a SAVEPOINT so that application code calling session.commit() does not
    actually persist changes — everything is rolled back at the end of the test.
    """
    session = app.db_session
    connection = app.engine.connect()
    transaction = connection.begin()

    session.configure(bind=connection)
    connection.begin_nested()

    @event.listens_for(session, "after_transaction_end")
    def restart_savepoint(sess, trans):
        if trans.nested and not trans._parent.nested:
            connection.begin_nested()

    yield session

    event.remove(session, "after_transaction_end", restart_savepoint)
    session.close()
    transaction.rollback()
    connection.close()
    session.configure(bind=app.engine)


# ---------------------------------------------------------------------------
# Test data fixtures
# ---------------------------------------------------------------------------


@pytest.fixture()
def test_change_request(app: Flask, test_user, test_bli) -> BudgetLineItemChangeRequest:
    session = app.db_session

    change_request1 = BudgetLineItemChangeRequest()
    change_request1.status = ChangeRequestStatus.IN_REVIEW
    change_request1.budget_line_item_id = test_bli.id
    change_request1.agreement_id = 1
    change_request1.created_by = test_user.id
    change_request1.managing_division_id = 1
    change_request1.requested_change_data = {"key": "value"}
    session.add(change_request1)
    session.commit()

    yield change_request1

    # No manual cleanup needed — SAVEPOINT rollback handles it


@pytest.fixture()
def test_user(loaded_db) -> User | None:
    """N.B. This user has an SYSTEM_OWNER role whose status is INACTIVE."""
    return loaded_db.get(User, 500)


@pytest.fixture()
def test_admin_user(loaded_db) -> User | None:
    """N.B. This user has a SYSTEM_OWNER role whose status is ACTIVE."""
    return loaded_db.get(User, 503)


@pytest.fixture()
def test_division_director(loaded_db) -> User | None:
    return loaded_db.get(User, 522)


@pytest.fixture()
def test_non_admin_user(loaded_db) -> User | None:
    """N.B. This user has a non-SYSTEM_OWNER role whose status is ACTIVE."""
    return loaded_db.get(User, 521)


@pytest.fixture()
def test_budget_team_user(loaded_db):
    """N.B. This user has a non-SYSTEM_OWNER role whose status is ACTIVE."""
    return loaded_db.get(User, 523)


@pytest.fixture()
def test_vendor(loaded_db) -> Vendor | None:
    return loaded_db.get(Vendor, 100)


@pytest.fixture()
def test_project(loaded_db) -> Project | None:
    return loaded_db.get(Project, 1000)


@pytest.fixture()
def test_can(loaded_db) -> CAN | None:
    return loaded_db.get(CAN, 500)


@pytest.fixture()
def test_cans(loaded_db) -> list[Type[CAN] | None]:
    return [loaded_db.get(CAN, 500), loaded_db.get(CAN, 501)]


@pytest.fixture()
def test_create_can_history_item(loaded_db) -> OpsEvent | None:
    return loaded_db.get(OpsEvent, 1)


@pytest.fixture()
def unadded_can():
    new_can = CAN(
        portfolio_id=6,
        number="G998235",
        description="Test CAN created by unit tests",
        nick_name="My nick name",
    )
    return new_can


@pytest.fixture()
def test_bli(loaded_db) -> BudgetLineItem | None:
    return loaded_db.get(BudgetLineItem, 15000)


@pytest.fixture
def utc_today():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT")


@pytest.fixture
def test_can_funding_budget(loaded_db) -> CANFundingBudget | None:
    return loaded_db.get(CANFundingBudget, 1)


@pytest.fixture
def test_can_funding_details(loaded_db) -> CANFundingDetails | None:
    return loaded_db.get(CANFundingDetails, 1)


@pytest.fixture()
def db_for_aa_agreement(loaded_db):
    requesting_agency = AgreementAgency(
        name="Test Requesting Agency",
        abbreviation="TTA",
        requesting=True,
        servicing=False,
    )

    servicing_agency = AgreementAgency(
        name="Test Servicing Agency",
        abbreviation="TSA",
        requesting=False,
        servicing=True,
    )

    vendor = Vendor(
        name="Test Vendor",
        duns="123456789",
    )

    project = ResearchProject(
        title="Test Project for AA Agreement",
        description="This is a test project for AA agreement.",
    )

    procurement_shop = ProcurementShop(
        name="Test Procurement Shop",
        abbr="TPS",
    )

    loaded_db.add(requesting_agency)
    loaded_db.add(servicing_agency)
    loaded_db.add(vendor)
    loaded_db.add(project)
    loaded_db.add(procurement_shop)
    loaded_db.commit()

    yield loaded_db

    # No manual cleanup needed — SAVEPOINT rollback handles it
