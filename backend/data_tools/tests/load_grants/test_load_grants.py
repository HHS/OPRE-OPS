import csv

import pytest
from click.testing import CliRunner
from data_tools.src.common.utils import get_or_create_sys_user
from data_tools.src.load_data import main
from data_tools.src.load_grants.utils import GrantData, create_grant_data, create_models, validate_data
from sqlalchemy import and_, text

from models import *  # noqa: F403, F401


def test_create_grant_data():
    test_data = list(csv.DictReader(open("test_csv/grants.tsv"), dialect="excel-tab"))

    assert len(test_data) == 30

    assert create_grant_data(test_data[0]).SYS_GRANTS_ID == 1
    assert create_grant_data(test_data[0]).GRANTS_TITLE == "Community Health Improvement Initiative FY25"
    assert create_grant_data(test_data[0]).SYS_PROJECT_ID == 1
    assert create_grant_data(test_data[0]).OPRE_PROJECT_OFFICER_ID == 500
    assert create_grant_data(test_data[0]).FOA_NBR == "HHS-2025-ACF-OPRE-XX-0000"
    assert create_grant_data(test_data[0]).TOTAL_FUNDING == 1.23
    assert create_grant_data(test_data[0]).GRANTS_START_DATE == date(2024, 10, 1)
    assert create_grant_data(test_data[0]).GRANTS_END_DATE == date(2025, 9, 30)
    assert create_grant_data(test_data[0]).NUMBER_OF_YEARS == 1
    assert create_grant_data(test_data[0]).NUMBER_OF_GRANTS == 1


def test_validate_data():
    test_data = list(csv.DictReader(open("test_csv/grants.tsv"), dialect="excel-tab"))
    assert len(test_data) == 30
    count = sum(1 for data in test_data if validate_data(create_grant_data(data)))
    assert count == 30


def test_create_models_no_grants_title():
    with pytest.raises(TypeError):
        GrantAgreement(
            SYS_GRANTS_ID=1,
        )


@pytest.fixture()
def db_for_grants(loaded_db):
    project_1 = ResearchProject(
        id=1,
        title="Test Project",
        short_title="Test Project",
    )

    project_2 = ResearchProject(
        id=2,
        title="Test Project 2",
        short_title="Test Project 2",
    )

    project_1000 = ResearchProject(
        id=1000,
        title="Test Project 1000",
        short_title="Test Project 1000",
    )

    loaded_db.add(project_1)
    loaded_db.add(project_2)
    loaded_db.add(project_1000)
    loaded_db.commit()

    user = User(
        id=1,
        email="test.user@localhost",
    )

    user_500 = User(
        id=500,
        email="test.user@localhost",
    )

    loaded_db.add(user)
    loaded_db.add(user_500)
    loaded_db.commit()

    yield loaded_db
    loaded_db.rollback()

    loaded_db.execute(text("DELETE FROM grant_agreement"))
    loaded_db.execute(text("DELETE FROM grant_agreement_version"))
    loaded_db.execute(text("DELETE FROM agreement"))
    loaded_db.execute(text("DELETE FROM agreement_version"))
    loaded_db.execute(text("DELETE FROM research_project"))
    loaded_db.execute(text("DELETE FROM research_project_version"))
    loaded_db.execute(text("DELETE FROM project"))
    loaded_db.execute(text("DELETE FROM project_version"))
    loaded_db.execute(text("DELETE FROM ops_user"))
    loaded_db.execute(text("DELETE FROM ops_user_version"))
    loaded_db.execute(text("DELETE FROM ops_db_history"))
    loaded_db.execute(text("DELETE FROM ops_db_history_version"))
    loaded_db.commit()


def test_create_models(db_for_grants):
    data = GrantData(
        SYS_GRANTS_ID=1,
        GRANTS_TITLE="Community Health Improvement Initiative FY25",
        SYS_PROJECT_ID=1,
        OPRE_PROJECT_OFFICER_ID=500,
        FOA_NBR="HHS-2025-ACF-OPRE-XX-0000",
        TOTAL_FUNDING=1.23,
        GRANTS_START_DATE="2024-10-01 00:00:00",
        GRANTS_END_DATE="2025-09-30 00:00:00",
        NUMBER_OF_YEARS=1,
        NUMBER_OF_GRANTS=1,
    )

    sys_user = User(
        email="system.admin@localhost",
    )
    create_models(data, sys_user, db_for_grants)

    grant_model = db_for_grants.execute(select(GrantAgreement).where(GrantAgreement.maps_sys_id == 1)).scalar()

    assert grant_model.name == "Community Health Improvement Initiative FY25"
    assert grant_model.maps_sys_id == 1
    assert grant_model.project_id == 1
    assert grant_model.project.title == "Test Project"
    assert grant_model.project_officer_id == 500
    assert grant_model.foa == "HHS-2025-ACF-OPRE-XX-0000"
    assert grant_model.total_funding == Decimal("1.23")
    assert grant_model.start_date == date(2024, 10, 1)
    assert grant_model.end_date == date(2025, 9, 30)
    assert grant_model.number_of_years == 1
    assert grant_model.number_of_grants == 1


def test_main(db_for_grants):
    result = CliRunner().invoke(
        main,
        [
            "--env",
            "pytest_data_tools",
            "--type",
            "grants",
            "--input-csv",
            "test_csv/grants.tsv",
        ],
    )

    assert result.exit_code == 0

    sys_user = User(
        email="system.admin@localhost",
    )

    # make sure the data was loaded
    grant_model = db_for_grants.execute(select(GrantAgreement).where(GrantAgreement.maps_sys_id == 1)).scalar()

    assert grant_model.name == "Community Health Improvement Initiative FY25"
    assert grant_model.maps_sys_id == 1
    assert grant_model.project_id == 1
    assert grant_model.project.title == "Test Project"
    assert grant_model.project_officer_id == 500
    assert grant_model.foa == "HHS-2025-ACF-OPRE-XX-0000"
    assert grant_model.total_funding == Decimal("1.23")
    assert grant_model.start_date == date(2024, 10, 1)
    assert grant_model.end_date == date(2025, 9, 30)
    assert grant_model.number_of_years == 1
    assert grant_model.number_of_grants == 1
    assert grant_model.created_by == sys_user.id
    assert grant_model.updated_by == sys_user.id
    assert grant_model.created_on is not None
    assert grant_model.updated_on is not None

    history_objs = (
        db_for_grants.execute(select(OpsDBHistory).where(OpsDBHistory.class_name == "GrantAgreement")).scalars().all()
    )

    assert len(history_objs) == 30

    grant_1_history = (
        db_for_grants.execute(
            select(OpsDBHistory).where(
                and_(OpsDBHistory.row_key == str(grant_model.id), OpsDBHistory.class_name == "GrantAgreement")
            )
        )
        .scalars()
        .all()
    )
    assert len(grant_1_history) == 1


def test_create_models_upsert(db_for_grants):
    sys_user = get_or_create_sys_user(db_for_grants)

    data_1 = GrantData(
        SYS_GRANTS_ID=1,
        GRANTS_TITLE="Community Health Improvement Initiative FY25",
        SYS_PROJECT_ID=1,
        OPRE_PROJECT_OFFICER_ID=500,
        FOA_NBR="HHS-2025-ACF-OPRE-XX-0000",
        TOTAL_FUNDING=1.23,
        GRANTS_START_DATE="2024-10-01 00:00:00",
        GRANTS_END_DATE="2025-09-30 00:00:00",
        NUMBER_OF_YEARS=1,
        NUMBER_OF_GRANTS=1,
    )

    # update the grants title
    data_2 = GrantData(
        SYS_GRANTS_ID=1,
        GRANTS_TITLE="Community Health Improvement Initiative FY25 Updated",
        SYS_PROJECT_ID=1,
        OPRE_PROJECT_OFFICER_ID=500,
        FOA_NBR="HHS-2025-ACF-OPRE-XX-0000",
        TOTAL_FUNDING=1.23,
        GRANTS_START_DATE="2024-10-01 00:00:00",
        GRANTS_END_DATE="2025-09-30 00:00:00",
        NUMBER_OF_YEARS=1,
        NUMBER_OF_GRANTS=1,
    )

    create_models(data_1, sys_user, db_for_grants)

    # make sure the data was loaded
    grant_model = db_for_grants.execute(select(GrantAgreement).where(GrantAgreement.maps_sys_id == 1)).scalar()

    assert grant_model.name == "Community Health Improvement Initiative FY25"
    assert grant_model.maps_sys_id == 1
    assert grant_model.project_id == 1
    assert grant_model.project.title == "Test Project"
    assert grant_model.project_officer_id == 500
    assert grant_model.foa == "HHS-2025-ACF-OPRE-XX-0000"
    assert grant_model.total_funding == Decimal("1.23")
    assert grant_model.start_date == date(2024, 10, 1)
    assert grant_model.end_date == date(2025, 9, 30)
    assert grant_model.number_of_years == 1
    assert grant_model.number_of_grants == 1
    assert grant_model.created_by == sys_user.id
    assert grant_model.updated_by == sys_user.id
    assert grant_model.created_on is not None
    assert grant_model.updated_on is not None

    # make sure the version records were created
    assert grant_model.versions[0].name == "Community Health Improvement Initiative FY25"
    assert grant_model.versions[0].maps_sys_id == 1
    assert grant_model.versions[0].project_id == 1
    assert grant_model.versions[0].project_officer_id == 500
    assert grant_model.versions[0].foa == "HHS-2025-ACF-OPRE-XX-0000"
    assert grant_model.versions[0].total_funding == Decimal("1.23")
    assert grant_model.versions[0].start_date == date(2024, 10, 1)
    assert grant_model.versions[0].end_date == date(2025, 9, 30)
    assert grant_model.versions[0].number_of_years == 1
    assert grant_model.versions[0].number_of_grants == 1
    assert grant_model.versions[0].created_by == sys_user.id
    assert grant_model.versions[0].updated_by == sys_user.id
    assert grant_model.versions[0].created_on is not None
    assert grant_model.versions[0].updated_on is not None

    # make sure the history records are created
    history_record = db_for_grants.execute(
        select(OpsDBHistory).where(OpsDBHistory.class_name == "GrantAgreement").order_by(OpsDBHistory.created_on.desc())
    ).scalar()
    assert history_record is not None
    assert history_record.event_type == OpsDBHistoryType.NEW
    assert history_record.row_key == str(grant_model.id)
    assert history_record.created_by == sys_user.id

    # upsert the same data - change the grant title
    create_models(data_2, sys_user, db_for_grants)

    # make sure the data was loaded
    grant_model = db_for_grants.execute(select(GrantAgreement).where(GrantAgreement.maps_sys_id == 1)).scalar()

    assert grant_model.name == "Community Health Improvement Initiative FY25 Updated"
    assert grant_model.maps_sys_id == 1
    assert grant_model.project_id == 1
    assert grant_model.project.title == "Test Project"
    assert grant_model.project_officer_id == 500
    assert grant_model.foa == "HHS-2025-ACF-OPRE-XX-0000"
    assert grant_model.total_funding == Decimal("1.23")
    assert grant_model.start_date == date(2024, 10, 1)
    assert grant_model.end_date == date(2025, 9, 30)
    assert grant_model.number_of_years == 1
    assert grant_model.number_of_grants == 1
    assert grant_model.created_by == sys_user.id
    assert grant_model.updated_by == sys_user.id
    assert grant_model.created_on is not None
    assert grant_model.updated_on is not None

    #
    # make sure the version records were created
    assert grant_model.versions[1].name == "Community Health Improvement Initiative FY25 Updated"
    assert grant_model.versions[1].maps_sys_id == 1
    assert grant_model.versions[1].project_id == 1
    assert grant_model.versions[1].project_officer_id == 500
    assert grant_model.versions[1].foa == "HHS-2025-ACF-OPRE-XX-0000"
    assert grant_model.versions[1].total_funding == Decimal("1.23")
    assert grant_model.versions[1].start_date == date(2024, 10, 1)
    assert grant_model.versions[1].end_date == date(2025, 9, 30)
    assert grant_model.versions[1].number_of_years == 1
    assert grant_model.versions[1].number_of_grants == 1
    assert grant_model.versions[1].created_by == sys_user.id
    assert grant_model.versions[1].updated_by == sys_user.id
    assert grant_model.versions[1].created_on is not None
    assert grant_model.versions[1].updated_on is not None

    #
    # make sure the history records are created
    history_record = db_for_grants.execute(
        select(OpsDBHistory).where(OpsDBHistory.class_name == "GrantAgreement").order_by(OpsDBHistory.created_on.desc())
    ).scalar()
    assert history_record is not None
    assert history_record.event_type == OpsDBHistoryType.UPDATED
    assert history_record.row_key == str(grant_model.id)
    assert history_record.created_by == sys_user.id
