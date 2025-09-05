import csv
import os

import pytest
from click.testing import CliRunner
from data_tools.src.common.utils import get_or_create_sys_user
from data_tools.src.load_data import main
from data_tools.src.load_roles.utils import (
    RoleData,
    create_role_data,
    transform,
    upsert_role,
    validate_all,
    validate_data,
)
from sqlalchemy import select, text

from models import OpsEvent, OpsEventStatus, OpsEventType, Role

file_path = os.path.join(os.path.dirname(__file__), "../../test_csv/roles.tsv")


@pytest.fixture()
def db_with_sys_user(loaded_db):
    sys_user = get_or_create_sys_user(loaded_db)
    yield loaded_db, sys_user

    # Cleanup
    loaded_db.execute(text("DELETE FROM role"))
    loaded_db.execute(text("DELETE FROM role_version"))
    loaded_db.execute(text("DELETE FROM ops_event"))
    loaded_db.execute(text("DELETE FROM ops_event_version"))
    loaded_db.commit()


def test_create_role_data_valid():
    row = {"NAME": "TEST_ROLE", "PERMISSIONS": "GET_USER,PUT_USER"}
    role_data = create_role_data(row)
    assert role_data.NAME == "TEST_ROLE"
    assert role_data.PERMISSIONS == ['GET_USER', 'PUT_USER']


def test_create_role_data_missing_name():
    with pytest.raises(ValueError):
        create_role_data({"NAME": "", "PERMISSIONS": "GET_USER"})


def test_validate_data_pass():
    data = RoleData(NAME="ROLE_X", PERMISSIONS="GET_USER")
    assert validate_data(data) is True


def test_validate_data_fail():
    with pytest.raises(ValueError):
        RoleData(NAME="", PERMISSIONS="GET_USER")


def test_validate_all():
    data = [
        RoleData(NAME="R1", PERMISSIONS="GET_USER"),
        RoleData(NAME="R2", PERMISSIONS="PUT_USER")
    ]
    assert validate_all(data) is True


def test_upsert_role_creates_new_role(db_with_sys_user):
    db, sys_user = db_with_sys_user

    raw_permissions = "GET_AGREEMENT,PUT_AGREEMENT"

    data = RoleData(NAME="TEST_ROLE_CREATE", PERMISSIONS=raw_permissions)
    upsert_role(data, db, sys_user)

    role = db.execute(select(Role).where(Role.name == "TEST_ROLE_CREATE")).scalar_one()
    assert role is not None

    # This matches the parsed list from __post_init__
    assert set(role.permissions) == set(raw_permissions.split(","))

    event = db.execute(select(OpsEvent).where(OpsEvent.event_type == OpsEventType.CREATE_ROLE)).scalar_one()
    assert event.event_status == OpsEventStatus.SUCCESS


def test_upsert_role_updates_existing_role(db_with_sys_user):
    db, sys_user = db_with_sys_user

    # First insert
    data1 = RoleData(NAME="TEST_ROLE_UPDATE", PERMISSIONS="GET_USER")
    upsert_role(data1, db, sys_user)

    # Then update
    data2 = RoleData(NAME="TEST_ROLE_UPDATE", PERMISSIONS="GET_USER,PUT_USER")
    upsert_role(data2, db, sys_user)

    # Confirm role data
    role = db.execute(select(Role).where(Role.name == "TEST_ROLE_UPDATE")).scalar_one()
    assert set(role.permissions) == {"GET_USER", "PUT_USER"}

    # Confirm two events were created
    events = db.execute(
        select(OpsEvent).where(
            OpsEvent.event_details["role"].astext == "TEST_ROLE_UPDATE"
        ).order_by(OpsEvent.id)  # ensure consistent order
    ).scalars().all()

    assert len(events) == 2

    # Confirm the first was CREATE_ROLE, the second was UPDATE_ROLE
    assert events[0].event_type == OpsEventType.CREATE_ROLE
    assert events[1].event_type == OpsEventType.UPDATE_ROLE


def test_transform_function(db_with_sys_user):
    db, sys_user = db_with_sys_user

    with open(file_path, newline="") as f:
        reader = csv.DictReader(f, dialect="excel-tab")
        transform(reader, db, sys_user)

    roles = db.execute(select(Role)).scalars().all()
    assert len(roles) == 2
    names = [r.name for r in roles]
    assert "TEST_TEMPORARY_YEAR_END" in names
    assert "TEST_MAIN_ADMIN" in names

    role = db.execute(select(Role).where(Role.name == "TEST_TEMPORARY_YEAR_END")).scalar_one()
    assert isinstance(role.permissions, list)
    assert all(isinstance(p, str) for p in role.permissions)


def test_main_roles_cli(db_with_sys_user):
    db, sys_user = db_with_sys_user

    result = CliRunner().invoke(
        main,
        [
            "--env", "pytest_data_tools",
            "--type", "roles",
            "--input-csv", file_path,
        ],
    )

    assert result.exit_code == 0

    roles = db.execute(select(Role)).scalars().all()
    assert len(roles) == 2
    role_names = [r.name for r in roles]
    assert "TEST_TEMPORARY_YEAR_END" in role_names
    assert "TEST_MAIN_ADMIN" in role_names

    test_role = db.execute(select(Role).where(Role.name == "TEST_MAIN_ADMIN")).scalar_one()
    assert isinstance(test_role.permissions, list)
