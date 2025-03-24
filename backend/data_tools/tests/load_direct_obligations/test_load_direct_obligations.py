import csv
from datetime import date
from decimal import Decimal
from json import load

import pytest
from click.testing import CliRunner
from data_tools.src.common.utils import get_or_create_sys_user
from data_tools.src.load_data import main
from data_tools.src.load_direct_obligations.utils import (
    DirectObligationData,
    create_direct_obligation_data,
    create_models,
    validate_data,
)
from sqlalchemy import and_, select, text

from models import *  # noqa: F403, F401


def test_create_direct_obligation_data():
    test_data = list(csv.DictReader(open("test_csv/direct_obligations.tsv"), dialect="excel-tab"))

    assert len(test_data) == 51

    assert create_direct_obligation_data(test_data[0]).SYS_DIRECT_OBLIGATION_ID == 1
    assert create_direct_obligation_data(test_data[0]).DIRECT_OBLIGATION_NAME == "Interest Payments"
    assert create_direct_obligation_data(test_data[0]).SYS_PROJECT_ID == 1


def test_validate_data():
    test_data = list(csv.DictReader(open("test_csv/direct_obligations.tsv"), dialect="excel-tab"))
    assert len(test_data) == 51
    count = sum(1 for data in test_data if validate_data(create_direct_obligation_data(data)))
    assert count == 51


def test_create_models_no_direct_obligation_name():
    with pytest.raises(TypeError):
        DirectObligationData(
            SYS_DIRECT_OBLIGATION_ID=1,
        )


@pytest.fixture()
def db_for_direct_obligations(loaded_db):
    project_1 = ResearchProject(
        id=1,
        title="Test Project",
        short_title="Test Project",
    )

    loaded_db.add(project_1)
    loaded_db.commit()

    yield loaded_db
    loaded_db.rollback()

    loaded_db.execute(text("DELETE FROM direct_agreement"))
    loaded_db.execute(text("DELETE FROM direct_agreement_version"))
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


def test_create_models(db_for_direct_obligations):
    data = DirectObligationData(
        SYS_DIRECT_OBLIGATION_ID=1,
        DIRECT_OBLIGATION_NAME="Research Support Services",
        SYS_PROJECT_ID=1,
    )

    sys_user = User(
        email="system.admin@localhost",
    )
    create_models(data, sys_user, db_for_direct_obligations)

    direct_obligation_model = db_for_direct_obligations.execute(
        select(DirectAgreement).where(DirectAgreement.maps_sys_id == 1)
    ).scalar()

    assert direct_obligation_model.name == "Research Support Services"
    assert direct_obligation_model.maps_sys_id == 1
    assert direct_obligation_model.project_id == 1
    assert direct_obligation_model.project.title == "Test Project"


def test_main(db_for_direct_obligations):
    result = CliRunner().invoke(
        main,
        [
            "--env",
            "pytest_data_tools",
            "--type",
            "direct_obligations",
            "--input-csv",
            "test_csv/direct_obligations.tsv",
        ],
    )

    assert result.exit_code == 0

    sys_user = User(
        email="system.admin@localhost",
    )

    # make sure the data was loaded
    direct_obligation_model = db_for_direct_obligations.execute(
        select(DirectAgreement).where(DirectAgreement.maps_sys_id == 1)
    ).scalar()

    assert direct_obligation_model.name == "Interest Payments"
    assert direct_obligation_model.maps_sys_id == 1
    assert direct_obligation_model.project_id == 1
    assert direct_obligation_model.project.title == "Test Project"
    assert direct_obligation_model.created_by == sys_user.id
    assert direct_obligation_model.updated_by == sys_user.id
    assert direct_obligation_model.created_on is not None
    assert direct_obligation_model.updated_on is not None

    history_objs = (
        db_for_direct_obligations.execute(select(OpsDBHistory).where(OpsDBHistory.class_name == "DirectAgreement"))
        .scalars()
        .all()
    )

    assert len(history_objs) == 51

    direct_obligation_1_history = (
        db_for_direct_obligations.execute(
            select(OpsDBHistory).where(
                and_(
                    OpsDBHistory.row_key == str(direct_obligation_model.id),
                    OpsDBHistory.class_name == "DirectAgreement",
                )
            )
        )
        .scalars()
        .all()
    )
    assert len(direct_obligation_1_history) == 1


def test_create_models_upsert(db_for_direct_obligations):
    sys_user = get_or_create_sys_user(db_for_direct_obligations)

    data_1 = DirectObligationData(
        SYS_DIRECT_OBLIGATION_ID=100,
        DIRECT_OBLIGATION_NAME="Research Support Services",
        SYS_PROJECT_ID=1,
    )

    # update the Direct Obligation name
    data_2 = DirectObligationData(
        SYS_DIRECT_OBLIGATION_ID=100,
        DIRECT_OBLIGATION_NAME="Research Support Services Updated",
        SYS_PROJECT_ID=1,
    )

    create_models(data_1, sys_user, db_for_direct_obligations)

    # make sure the data was loaded
    direct_obligation_model = db_for_direct_obligations.execute(
        select(DirectAgreement).where(DirectAgreement.maps_sys_id == 100)
    ).scalar()

    assert direct_obligation_model.name == "Research Support Services"
    assert direct_obligation_model.maps_sys_id == 100
    assert direct_obligation_model.project_id == 1
    assert direct_obligation_model.project.title == "Test Project"
    assert direct_obligation_model.created_by == sys_user.id
    assert direct_obligation_model.updated_by == sys_user.id
    assert direct_obligation_model.created_on is not None
    assert direct_obligation_model.updated_on is not None

    # make sure the version records were created
    assert direct_obligation_model.versions[0].name == "Research Support Services"
    assert direct_obligation_model.versions[0].maps_sys_id == 100
    assert direct_obligation_model.versions[0].project_id == 1
    assert direct_obligation_model.versions[0].created_by == sys_user.id
    assert direct_obligation_model.versions[0].updated_by == sys_user.id
    assert direct_obligation_model.versions[0].created_on is not None
    assert direct_obligation_model.versions[0].updated_on is not None

    # make sure the history records are created
    history_record = db_for_direct_obligations.execute(
        select(OpsDBHistory)
        .where(OpsDBHistory.class_name == "DirectAgreement")
        .order_by(OpsDBHistory.created_on.desc())
    ).scalar()
    assert history_record is not None
    assert history_record.event_type == OpsDBHistoryType.NEW
    assert history_record.row_key == str(direct_obligation_model.id)
    assert history_record.created_by == sys_user.id

    # upsert the same data - change the Direct Obligation name and payee
    create_models(data_2, sys_user, db_for_direct_obligations)

    # make sure the data was loaded
    direct_obligation_model = db_for_direct_obligations.execute(
        select(DirectAgreement).where(DirectAgreement.maps_sys_id == 100)
    ).scalar()

    assert direct_obligation_model.name == "Research Support Services Updated"
    assert direct_obligation_model.maps_sys_id == 100
    assert direct_obligation_model.project_id == 1
    assert direct_obligation_model.project.title == "Test Project"
    assert direct_obligation_model.created_by == sys_user.id
    assert direct_obligation_model.updated_by == sys_user.id
    assert direct_obligation_model.created_on is not None
    assert direct_obligation_model.updated_on is not None

    # make sure the version records were created
    assert direct_obligation_model.versions[1].name == "Research Support Services Updated"
    assert direct_obligation_model.versions[1].maps_sys_id == 100
    assert direct_obligation_model.versions[1].project_id == 1
    assert direct_obligation_model.versions[1].created_by == sys_user.id
    assert direct_obligation_model.versions[1].updated_by == sys_user.id
    assert direct_obligation_model.versions[1].created_on is not None
    assert direct_obligation_model.versions[1].updated_on is not None

    # make sure the history records are created
    history_record = db_for_direct_obligations.execute(
        select(OpsDBHistory)
        .where(OpsDBHistory.class_name == "DirectAgreement")
        .order_by(OpsDBHistory.created_on.desc())
    ).scalar()
    assert history_record is not None
    assert history_record.event_type == OpsDBHistoryType.UPDATED
    assert history_record.row_key == str(direct_obligation_model.id)
    assert history_record.created_by == sys_user.id
