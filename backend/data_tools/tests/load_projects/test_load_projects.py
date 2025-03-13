import csv

import pytest
from click.testing import CliRunner
from data_tools.src.common.utils import get_or_create_sys_user
from data_tools.src.load_data import main
from data_tools.src.load_projects.utils import ProjectData, create_models, create_project_data, validate_data
from sqlalchemy import and_, text

from models import *  # noqa: F403, F401


def test_create_project_data():
    test_data = list(csv.DictReader(open("test_csv/projects_latest.tsv"), dialect="excel-tab"))

    assert len(test_data) == 15

    assert create_project_data(test_data[0]).SYS_PROJECT_ID == 1
    assert create_project_data(test_data[0]).PROJECT_TITLE == "Human Services Interoperability Support"
    assert create_project_data(test_data[0]).PROJECT_TYPE == "RESEARCH"
    assert create_project_data(test_data[0]).PROJECT_SHORT_TITLE == "HSS"
    assert (
        "This contract will conduct interoperability activities"
        in create_project_data(test_data[0]).PROJECT_DESCRIPTION
    )

    assert create_project_data(test_data[13]).SYS_PROJECT_ID == 14
    assert create_project_data(test_data[13]).PROJECT_TITLE == "Support Project #1"
    assert create_project_data(test_data[13]).PROJECT_TYPE == "ADMINISTRATIVE_AND_SUPPORT"
    assert create_project_data(test_data[13]).PROJECT_SHORT_TITLE == "SP1"
    assert create_project_data(test_data[13]).PROJECT_DESCRIPTION is None


def test_validate_data():
    test_data = list(csv.DictReader(open("test_csv/projects_latest.tsv"), dialect="excel-tab"))
    assert len(test_data) == 15
    count = sum(1 for data in test_data if validate_data(create_project_data(data)))
    assert count == 15


def test_validate_all():
    test_data = list(csv.DictReader(open("test_csv/projects_invalid.tsv"), dialect="excel-tab"))
    assert len(test_data) == 3
    with pytest.raises(ValueError):
        [create_project_data(data) for data in test_data]


def test_no_project_title():
    with pytest.raises(ValueError):
        ProjectData(
            SYS_PROJECT_ID=1,
            PROJECT_TITLE="",
            PROJECT_TYPE="RESEARCH",
            PROJECT_SHORT_TITLE="",
            PROJECT_DESCRIPTION="",
        )


def test_no_project_type():
    with pytest.raises(ValueError):
        ProjectData(
            SYS_PROJECT_ID=1,
            PROJECT_TITLE="Project Title",
            PROJECT_TYPE="",
            PROJECT_SHORT_TITLE="",
            PROJECT_DESCRIPTION="",
        )


def test_create_models(loaded_db):
    data = ProjectData(
        SYS_PROJECT_ID=1,
        PROJECT_TITLE="Human Services Interoperability Support",
        PROJECT_TYPE="RESEARCH",
        PROJECT_SHORT_TITLE="HSS",
        PROJECT_DESCRIPTION="This contract will conduct interoperability activities",
    )

    sys_user = User(
        email="system.admin@localhost",
    )
    create_models(data, sys_user, loaded_db)

    project_model = loaded_db.get(Project, 1)

    assert project_model.id == 1

    # Cleanup
    loaded_db.execute(text("DELETE FROM research_project"))
    loaded_db.execute(text("DELETE FROM research_project_version"))
    loaded_db.execute(text("DELETE FROM administrative_and_support_project"))
    loaded_db.execute(text("DELETE FROM administrative_and_support_project_version"))
    loaded_db.execute(text("DELETE FROM project"))
    loaded_db.execute(text("DELETE FROM project_version"))
    loaded_db.execute(text("DELETE FROM ops_db_history"))
    loaded_db.execute(text("DELETE FROM ops_db_history_version"))


def test_main(loaded_db):
    result = CliRunner().invoke(
        main,
        [
            "--env",
            "pytest_data_tools",
            "--type",
            "projects",
            "--input-csv",
            "test_csv/projects_latest.tsv",
        ],
    )

    assert result.exit_code == 0

    # make sure the data was loaded
    project_1 = loaded_db.get(ResearchProject, 1)
    assert project_1.id == 1

    project_2 = loaded_db.get(ResearchProject, 2)
    assert project_2.id == 2

    history_objs = (
        loaded_db.execute(select(OpsDBHistory).where(OpsDBHistory.class_name == "ResearchProject")).scalars().all()
    )
    assert len(history_objs) == 13

    project_1_history = (
        loaded_db.execute(
            select(OpsDBHistory).where(and_(OpsDBHistory.row_key == "1", OpsDBHistory.class_name == "ResearchProject"))
        )
        .scalars()
        .all()
    )
    assert len(project_1_history) == 1

    # Cleanup
    loaded_db.execute(text("DELETE FROM research_project"))
    loaded_db.execute(text("DELETE FROM research_project_version"))
    loaded_db.execute(text("DELETE FROM administrative_and_support_project"))
    loaded_db.execute(text("DELETE FROM administrative_and_support_project_version"))
    loaded_db.execute(text("DELETE FROM project"))
    loaded_db.execute(text("DELETE FROM project_version"))
    loaded_db.execute(text("DELETE FROM ops_db_history"))
    loaded_db.execute(text("DELETE FROM ops_db_history_version"))


def test_create_models_upsert(loaded_db):
    sys_user = get_or_create_sys_user(loaded_db)

    # new project and id
    data_1 = ProjectData(
        PROJECT_TITLE="New Research Project",
        PROJECT_TYPE="RESEARCH",
        PROJECT_SHORT_TITLE="XXX",
        PROJECT_DESCRIPTION="This contract will conduct interoperability activities",
    )

    create_models(data_1, sys_user, loaded_db)

    # make sure the data was loaded
    # project_1 = loaded_db.get(ResearchProject, 1)
    project_1 = loaded_db.execute(
        select(ResearchProject).where(ResearchProject.title == "New Research Project")
    ).scalar()
    # assert project_1.id == 1
    new_id = project_1.id
    assert project_1.title == "New Research Project"
    assert project_1.short_title == "XXX"
    assert project_1.description == "This contract will conduct interoperability activities"
    assert project_1.created_by == sys_user.id

    # make sure the version records were created
    assert project_1.versions[0].title == "New Research Project"
    assert project_1.versions[0].short_title == "XXX"
    assert project_1.versions[0].description == "This contract will conduct interoperability activities"
    assert project_1.versions[0].created_by == sys_user.id

    # make sure the history records are created
    history_record = loaded_db.execute(
        select(OpsDBHistory)
        .where(OpsDBHistory.class_name == "ResearchProject")
        .order_by(OpsDBHistory.created_on.desc())
    ).scalar()
    assert history_record is not None
    assert history_record.event_type == OpsDBHistoryType.NEW
    assert history_record.row_key == str(new_id)
    assert history_record.created_by == sys_user.id

    # upsert the same data - change the title
    data_2 = ProjectData(
        SYS_PROJECT_ID=new_id,
        PROJECT_TITLE="Human Services Interoperability Support Updated",
        PROJECT_TYPE="RESEARCH",
        PROJECT_SHORT_TITLE="XXX",
        PROJECT_DESCRIPTION="This contract will conduct interoperability activities",
    )
    create_models(data_2, sys_user, loaded_db)

    project_1 = loaded_db.get(ResearchProject, new_id)
    assert project_1.title == "Human Services Interoperability Support Updated"
    assert project_1.short_title == "XXX"
    assert project_1.description == "This contract will conduct interoperability activities"
    assert project_1.created_by == sys_user.id

    # upsert the same data - change the short title
    data_3 = ProjectData(
        SYS_PROJECT_ID=new_id,
        PROJECT_TITLE="Human Services Interoperability Support Updated",
        PROJECT_TYPE="RESEARCH",
        PROJECT_SHORT_TITLE="YYY",
        PROJECT_DESCRIPTION="This contract will conduct interoperability activities",
    )
    create_models(data_3, sys_user, loaded_db)

    project_1 = loaded_db.get(ResearchProject, new_id)
    assert project_1.title == "Human Services Interoperability Support Updated"
    assert project_1.short_title == "YYY"
    assert project_1.description == "This contract will conduct interoperability activities"
    assert project_1.created_by == sys_user.id

    # Cleanup
    loaded_db.execute(text("DELETE FROM research_project"))
    loaded_db.execute(text("DELETE FROM research_project_version"))
    loaded_db.execute(text("DELETE FROM administrative_and_support_project"))
    loaded_db.execute(text("DELETE FROM administrative_and_support_project_version"))
    loaded_db.execute(text("DELETE FROM project"))
    loaded_db.execute(text("DELETE FROM project_version"))
    loaded_db.execute(text("DELETE FROM ops_db_history"))
    loaded_db.execute(text("DELETE FROM ops_db_history_version"))
