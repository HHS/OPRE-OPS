"""Configuration for pytest tests."""

# flake8: noqa: S404,S607,S602
import subprocess
import sys

# Raise soft limit for open files to avoid OSError: [Errno 24] Too many open files
# when running the full suite (many app/session/connection instances per test).
if sys.platform != "win32":
    try:
        import resource

        soft, hard = resource.getrlimit(resource.RLIMIT_NOFILE)
        if soft != resource.RLIM_INFINITY and soft < 4096:
            resource.setrlimit(resource.RLIMIT_NOFILE, (min(4096, hard), hard))
    except (ImportError, OSError, ValueError):
        # resource is Unix-only; setrlimit can fail (permissions, limits). Continue with default.
        pass

from collections.abc import Generator
from datetime import datetime, timezone
from typing import Type

import pytest
from flask import Flask
from flask.testing import FlaskClient
from pytest_docker.plugin import Services
from sqlalchemy import create_engine, delete, text
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
    OpsDBHistory,
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


@pytest.fixture()
def app(db_service) -> Generator[Flask, None, None]:
    """Make and return the flask app."""
    app = create_app()
    yield app

    # Cleanup: dispose of the database engine to free connections
    if hasattr(app, 'engine'):
        app.engine.dispose()


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


@pytest.fixture()
def test_change_request(app: Flask, test_user, test_bli) -> BudgetLineItemChangeRequest:
    session = app.db_session

    # create a change request
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

    session.delete(change_request1)
    session.commit()


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
    docker_services.wait_until_responsive(timeout=120.0, pause=1.0, check=lambda: is_loaded(engine))
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
def loaded_db(app: Flask, app_ctx: None) -> Session:
    """Get SQLAlchemy Session."""

    session = app.db_session

    yield session

    # cleanup
    session.rollback()

    session.execute(delete(OpsDBHistory))

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

    N.B. This user has an SYSTEM_OWNER role whose status is INACTIVE.
    """
    return loaded_db.get(User, 500)


@pytest.fixture()
def test_admin_user(loaded_db) -> User | None:
    """Get a test SYSTEM_OWNER user - also the user associated with the auth_client.

    N.B. This user has a SYSTEM_OWNER role whose status is ACTIVE.
    """
    return loaded_db.get(User, 503)


@pytest.fixture()
def test_division_director(loaded_db) -> User | None:
    """Get a test SYSTEM_OWNER user - also the user associated with the auth_client.

    N.B. This user has a SYSTEM_OWNER role whose status is ACTIVE.
    """
    return loaded_db.get(User, 522)


@pytest.fixture()
def test_non_admin_user(loaded_db) -> User | None:
    """Get a basic test user

    N.B. This user has an non-SYSTEM_OWNER role whose status is ACTIVE.
    """
    return loaded_db.get(User, 521)


@pytest.fixture()
def test_budget_team_user(loaded_db):
    """Get a test budget team user

    N.B. This user has an non-SYSTEM_OWNER role whose status is ACTIVE.
    """
    return loaded_db.get(User, 523)


@pytest.fixture()
def test_vendor(loaded_db) -> Vendor | None:
    """Get a test Vendor."""
    return loaded_db.get(Vendor, 100)


@pytest.fixture()
def test_project(loaded_db) -> Project | None:
    """Get a test Project."""
    return loaded_db.get(Project, 1000)


@pytest.fixture()
def test_can(loaded_db) -> CAN | None:
    """Get a test CAN."""
    return loaded_db.get(CAN, 500)


@pytest.fixture()
def test_cans(loaded_db) -> list[Type[CAN] | None]:
    """Get two test CANs."""
    return [loaded_db.get(CAN, 500), loaded_db.get(CAN, 501)]


@pytest.fixture()
def test_create_can_history_item(loaded_db) -> OpsEvent | None:
    """Get OPS Event item for creation of CAN 500"""
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
    """Get a test BudgetLineItem."""
    return loaded_db.get(BudgetLineItem, 15000)


@pytest.fixture
def utc_today():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT")


@pytest.fixture
def test_can_funding_budget(loaded_db) -> CANFundingBudget | None:
    """Get a test CANFundingBudget."""
    return loaded_db.get(CANFundingBudget, 1)


@pytest.fixture
def test_can_funding_details(loaded_db) -> CANFundingDetails | None:
    """Get a test CANFundingDetail."""
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

    loaded_db.delete(requesting_agency)
    loaded_db.delete(servicing_agency)
    loaded_db.delete(vendor)
    loaded_db.delete(project)
    loaded_db.delete(procurement_shop)
    loaded_db.commit()
