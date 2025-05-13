import csv

import pytest
from click.testing import CliRunner
from data_tools.src.common.utils import get_or_create_sys_user
from data_tools.src.load_data import main
from data_tools.src.load_roles.utils import RoleData, create_models, create_role_data, validate_data
from sqlalchemy import and_, text

from models import *  # noqa: F403, F401


def test_create_role_data():
    test_data = list(csv.DictReader(open("test_csv/roles.tsv"), dialect="excel-tab"))

    assert len(test_data) == 2

    assert create_role_data(test_data[0]).ROLE_ID == 5
    assert create_role_data(test_data[0]).ROLE_NAME == "BUDGET_TEAM"
    assert create_role_data(test_data[0]).PERMISSIONS == {'GET_AGREEMENT','PUT_AGREEMENT','PATCH_AGREEMENT'}


    assert create_role_data(test_data[1]).ROLE_ID == 4
    assert create_role_data(test_data[1]).ROLE_NAME == "USER_ADMIN"
    assert create_role_data(test_data[1]).PERMISSIONS == {'POST_USER'}



def test_validate_data():
    test_data = list(csv.DictReader(open("test_csv/roles.tsv"), dialect="excel-tab"))
    assert len(test_data) == 2
    count = sum(1 for data in test_data if validate_data(create_role_data(data)))
    assert count == 2


def test_validate_all():
    test_data = list(csv.DictReader(open("test_csv/roles.tsv"), dialect="excel-tab"))
    assert len(test_data) == 2
    with pytest.raises(ValueError):
        [create_role_data(data) for data in test_data]


def test_no_role_name():
    with pytest.raises(ValueError):
        RoleData(
            ROLE_ID=1,
            ROLE_NAME="",
            PERMISSIONS="GET_AGREEMENT",
        )


def test_no_role_permission():
    with pytest.raises(ValueError):
        RoleData(
            ROLE_ID=2,
            ROLE_NAME="The Best Role",
            PERMISSIONS="",
        )


def test_create_models(loaded_db):
    data = RoleData(
        ROLE_ID=3,
        ROLE_NAME="POBLANO",
        PERMISSIONS="GET_BUDGET_LINE_ITEM",
    )

    sys_user = User(
        email="system.admin@localhost",
    )
    create_models(data, sys_user, loaded_db)

    role_model = loaded_db.get(Role, 3)

    assert role_model.id == 3

    # Cleanup
    loaded_db.execute(text("DELETE FROM role"))
    loaded_db.execute(text("DELETE FROM role_version"))
    loaded_db.execute(text("DELETE FROM ops_db_history"))
    loaded_db.execute(text("DELETE FROM ops_db_history_version"))


def test_main(loaded_db):
    result = CliRunner().invoke(
        main,
        [
            "--env",
            "pytest_data_tools",
            "--type",
            "roles",
            "--input-csv",
            "test_csv/roles.tsv",
        ],
    )

    assert result.exit_code == 0

    # make sure the data was loaded
    role_1 = loaded_db.get(Role, 4)
    assert role_1.id == 4

    role_2 = loaded_db.get(Role, 5)
    assert role_2.id == 5

    history_objs = (
        loaded_db.execute(select(OpsDBHistory).where(OpsDBHistory.class_name == "Role")).scalars().all()
    )
    assert len(history_objs) == 2

    role_1_history = (
        loaded_db.execute(
            select(OpsDBHistory).where(and_(OpsDBHistory.row_key == "1", OpsDBHistory.class_name == "Role"))
        )
        .scalars()
        .all()
    )
    assert len(role_1_history) == 1

    # Cleanup
    loaded_db.execute(text("DELETE FROM role"))
    loaded_db.execute(text("DELETE FROM role_version"))
    loaded_db.execute(text("DELETE FROM ops_db_history"))
    loaded_db.execute(text("DELETE FROM ops_db_history_version"))


def test_create_models_upsert(loaded_db):
    sys_user = get_or_create_sys_user(loaded_db)

    # new role and id
    data_1 = RoleData(
        ROLE_NAME="Super User",
        PERMISSIONS="PUT_BUDGET_LINE_ITEM,PATCH_BUDGET_LINE_ITEM,POST_BUDGET_LINE_ITEM",
    )

    create_models(data_1, sys_user, loaded_db)

    # make sure the data was loaded
    # role_1 = loaded_db.get(Role, 1)
    role_1 = loaded_db.execute(
        select(Role).where(Role.name == "Super User")
    ).scalar()
    # assert project_1.id == 1
    new_id = role_1.id
    assert role_1.name == "Super User"
    assert role_1.permissions == "PUT_BUDGET_LINE_ITEM,PATCH_BUDGET_LINE_ITEM,POST_BUDGET_LINE_ITEM"
    assert role_1.created_by == sys_user.id

    # make sure the version records were created
    assert role_1.versions[0].name == "Super User"
    assert role_1.versions[0].permissions == "PUT_BUDGET_LINE_ITEM,PATCH_BUDGET_LINE_ITEM,POST_BUDGET_LINE_ITEM"
    assert role_1.versions[0].created_by == sys_user.id

    # make sure the history records are created
    history_record = loaded_db.execute(
        select(OpsDBHistory)
        .where(OpsDBHistory.class_name == "Role")
        .order_by(OpsDBHistory.created_on.desc())
    ).scalar()
    assert history_record is not None
    assert history_record.event_type == OpsDBHistoryType.NEW
    assert history_record.row_key == str(new_id)
    assert history_record.created_by == sys_user.id

    # upsert the same data - change the name
    data_2 = RoleData(
        ROLE_ID=new_id,
        ROLE_NAME="Less Super of a User",
        PERMISSIONS="PUT_BUDGET_LINE_ITEM,PATCH_BUDGET_LINE_ITEM,POST_BUDGET_LINE_ITEM",
    )
    create_models(data_2, sys_user, loaded_db)

    role_1 = loaded_db.get(Role, new_id)
    assert role_1.name == "Less Super of a User"
    assert role_1.permissions == "PUT_BUDGET_LINE_ITEM,PATCH_BUDGET_LINE_ITEM,POST_BUDGET_LINE_ITEM"
    assert role_1.created_by == sys_user.id

    # upsert the same data - change the short permissions
    data_3 = RoleData(
        ROLE_ID=new_id,
        ROLE_HAME="Less Super of a User",
        PERMISSIONS="GET_CHANGE_REQUEST,PUT_CHANGE_REQUEST,PATCH_CHANGE_REQUEST,POST_CHANGE_REQUEST,GET_CHANGE_REQUEST_REVIEW",
    )
    create_models(data_3, sys_user, loaded_db)

    role_1 = loaded_db.get(Role, new_id)
    assert role_1.name == "Less Super of a User"
    assert role_1.permissions == "GET_CHANGE_REQUEST,PUT_CHANGE_REQUEST,PATCH_CHANGE_REQUEST,POST_CHANGE_REQUEST,GET_CHANGE_REQUEST_REVIEW"
    assert role_1.created_by == sys_user.id

    # Cleanup
    loaded_db.execute(text("DELETE FROM role"))
    loaded_db.execute(text("DELETE FROM role_version"))
    loaded_db.execute(text("DELETE FROM ops_db_history"))
    loaded_db.execute(text("DELETE FROM ops_db_history_version"))
