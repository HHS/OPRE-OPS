import csv

import pytest
from click.testing import CliRunner
from data_tools.environment.dev import DevConfig
from data_tools.src.common.utils import get_or_create_sys_user
from data_tools.src.import_static_data.import_data import get_config
from data_tools.src.load_users.main import main
from data_tools.src.load_users.utils import UserData, create_models, create_user_data, validate_all, validate_data
from sqlalchemy import text

from models import *  # noqa: F403, F401


@pytest.fixture()
def db_with_divisions(loaded_db):
    division = loaded_db.get(Division, 999)

    if not division:
        division = Division(
            id=999,
            name="Fake Division",
            abbreviation="FD",
        )
        loaded_db.merge(division)
        loaded_db.commit()

    yield loaded_db


@pytest.fixture()
def db_with_roles(db_with_divisions):
    role_1 = Role(
        id=1,
        name="role_1",
    )

    role_2 = Role(
        id=2,
        name="role_2",
    )

    db_with_divisions.add_all([role_1, role_2])
    db_with_divisions.commit()

    yield db_with_divisions

    db_with_divisions.execute(text("DELETE FROM role"))
    db_with_divisions.execute(text("DELETE FROM role_version"))
    db_with_divisions.commit()

    # Cleanup
    db_with_divisions.execute(text("DELETE FROM ops_user"))
    db_with_divisions.execute(text("DELETE FROM ops_user_version"))
    db_with_divisions.execute(text("DELETE FROM ops_db_history"))
    db_with_divisions.execute(text("DELETE FROM ops_db_history_version"))


def test_get_config_default():
    assert isinstance(get_config(), DevConfig)


def test_create_user_data():
    test_data = list(csv.DictReader(open("test_csv/users.tsv"), dialect="excel-tab"))

    assert len(test_data) == 29

    assert create_user_data(test_data[0]).SYS_USER_ID == 1
    assert create_user_data(test_data[0]).EMAIL == "chris.fortunato@example.com"
    assert create_user_data(test_data[0]).STATUS == "INACTIVE"
    assert create_user_data(test_data[0]).ROLES == ["user"]
    assert create_user_data(test_data[0]).DIVISION == "CC"


def test_validate_data():
    test_data = list(csv.DictReader(open("test_csv/users.tsv"), dialect="excel-tab"))
    assert len(test_data) == 29
    count = sum(1 for data in test_data if validate_data(create_user_data(data)))
    assert count == 29


def test_validate_all():
    test_data = list(csv.DictReader(open("test_csv/users.tsv"), dialect="excel-tab"))
    assert len(test_data) == 29
    user_data = [create_user_data(data) for data in test_data]
    assert validate_all(user_data) is True


def test_create_models_no_email():
    with pytest.raises(ValueError):
        UserData(
            SYS_USER_ID=1,
            EMAIL=None,
            STATUS="INACTIVE",
            ROLES=["user"],
            DIVISION="CC",
        )

    with pytest.raises(ValueError):
        UserData(
            SYS_USER_ID=1,
            EMAIL="",
            STATUS="INACTIVE",
            ROLES=["user"],
            DIVISION="CC",
        )


def test_create_models(db_with_roles):
    data = UserData(
        SYS_USER_ID=1,
        EMAIL="user.demo@email.com",
        STATUS="INACTIVE",
        ROLES="role_1, role_2",
        DIVISION="FD",
    )

    sys_user = User(
        email="system.admin@localhost",
    )

    roles = list(db_with_roles.execute(select(Role)).scalars().all())
    divisions = list(db_with_roles.execute(select(Division)).scalars().all())

    create_models(data, sys_user, db_with_roles, roles, divisions)

    user_model = db_with_roles.get(User, 1)

    assert user_model.id == 1
    assert user_model.email == "user.demo@email.com"
    assert user_model.status == UserStatus.INACTIVE
    assert user_model.roles == roles
    assert user_model.division == 999

    # Cleanup
    db_with_roles.execute(text("DELETE FROM user_role"))
    db_with_roles.execute(text("DELETE FROM user_role_version"))
    db_with_roles.execute(text("DELETE FROM ops_user"))
    db_with_roles.execute(text("DELETE FROM ops_user_version"))
    db_with_roles.execute(text("DELETE FROM ops_db_history"))
    db_with_roles.execute(text("DELETE FROM ops_db_history_version"))


def test_create_models_without_id(db_with_roles):
    data = UserData(
        EMAIL="user.demo@email.com",
        STATUS="INACTIVE",
        ROLES="role_1, role_2",
        DIVISION="FD",
    )

    sys_user = User(
        email="system.admin@localhost",
    )

    roles = list(db_with_roles.execute(select(Role)).scalars().all())
    divisions = list(db_with_roles.execute(select(Division)).scalars().all())

    create_models(data, sys_user, db_with_roles, roles, divisions)

    user_model = db_with_roles.get(User, 500)

    assert user_model.id == 500
    assert user_model.email == "user.demo@email.com"
    assert user_model.status == UserStatus.INACTIVE
    assert user_model.roles == roles
    assert user_model.division == 999

    # Cleanup
    db_with_roles.execute(text("DELETE FROM user_role"))
    db_with_roles.execute(text("DELETE FROM user_role_version"))
    db_with_roles.execute(text("DELETE FROM ops_user"))
    db_with_roles.execute(text("DELETE FROM ops_user_version"))
    db_with_roles.execute(text("DELETE FROM ops_db_history"))
    db_with_roles.execute(text("DELETE FROM ops_db_history_version"))


def test_main(db_with_roles):
    result = CliRunner().invoke(
        main,
        [
            "--env",
            "pytest_data_tools",
            "--input-csv",
            "test_csv/users.tsv",
        ],
    )

    assert result.exit_code == 0

    # make sure the data was loaded
    user_1 = db_with_roles.get(User, 1)
    assert user_1 is not None

    history_objs = db_with_roles.execute(select(OpsDBHistory).where(OpsDBHistory.class_name == "User")).scalars().all()
    assert len(history_objs) == 29

    event_objs = (
        db_with_roles.execute(select(OpsEvent).where(OpsEvent.event_type == OpsEventType.CREATE_USER)).scalars().all()
    )
    assert len(event_objs) > 29

    # Cleanup
    db_with_roles.execute(text("DELETE FROM user_role"))
    db_with_roles.execute(text("DELETE FROM user_role_version"))
    db_with_roles.execute(text("DELETE FROM ops_user"))
    db_with_roles.execute(text("DELETE FROM ops_user_version"))
    db_with_roles.execute(text("DELETE FROM ops_db_history"))
    db_with_roles.execute(text("DELETE FROM ops_db_history_version"))


def test_create_models_upsert(db_with_roles):
    sys_user = get_or_create_sys_user(db_with_roles)

    data_1 = UserData(
        SYS_USER_ID=1,
        EMAIL="user.demo@email.com",
        STATUS="INACTIVE",
        ROLES="role_1, role_2",
        DIVISION="FD",
    )

    data_2 = UserData(
        SYS_USER_ID=1,
        EMAIL="user.demo.updated@email.com",
        STATUS="ACTIVE",
        ROLES="role_1",
        DIVISION="FD",
    )

    roles = list(db_with_roles.execute(select(Role)).scalars().all())
    divisions = list(db_with_roles.execute(select(Division)).scalars().all())

    create_models(data_1, sys_user, db_with_roles, roles, divisions)

    # make sure the data was loaded
    user_1 = db_with_roles.get(User, 1)
    assert user_1 is not None

    # make sure the version records were created
    assert user_1.versions[0].email == "user.demo@email.com"
    assert user_1.versions[0].status == UserStatus.INACTIVE
    assert [rv.id for rv in user_1.versions[0].roles] == [r.id for r in roles]
    assert user_1.versions[0].division == 999
    assert user_1.versions[0].created_by == sys_user.id

    # make sure the history records are created
    history_record = db_with_roles.execute(
        select(OpsDBHistory).where(OpsDBHistory.class_name == "User").order_by(OpsDBHistory.created_on.desc())
    ).scalar()
    assert history_record is not None
    assert history_record.event_type == OpsDBHistoryType.NEW
    assert history_record.row_key == "1"
    assert history_record.created_by == sys_user.id

    # upsert the same data
    create_models(data_2, sys_user, db_with_roles, roles, divisions)

    # make sure the data was loaded
    user_1 = db_with_roles.get(User, 1)
    assert user_1 is not None

    assert user_1.email == "user.demo.updated@email.com"
    assert user_1.status == UserStatus.ACTIVE
    assert user_1.roles == [roles[0]]
    assert user_1.division == 999

    assert user_1.versions[1].email == "user.demo.updated@email.com"
    assert user_1.versions[1].status == UserStatus.ACTIVE
    assert [rv.id for rv in user_1.versions[1].roles] == [roles[0].id]
    assert user_1.versions[1].division == 999
    assert user_1.versions[1].created_by == sys_user.id

    # Cleanup
    db_with_roles.execute(text("DELETE FROM user_role"))
    db_with_roles.execute(text("DELETE FROM user_role_version"))
    db_with_roles.execute(text("DELETE FROM ops_user"))
    db_with_roles.execute(text("DELETE FROM ops_user_version"))
    db_with_roles.execute(text("DELETE FROM ops_db_history"))
    db_with_roles.execute(text("DELETE FROM ops_db_history_version"))
