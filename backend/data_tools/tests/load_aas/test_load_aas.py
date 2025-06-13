import csv
from datetime import date
from decimal import Decimal
from json import load

import pytest
from click.testing import CliRunner
from data_tools.src.common.utils import get_or_create_sys_user
from data_tools.src.load_aas.utils import AAData, create_aa_data, create_models, validate_data
from data_tools.src.load_data import main
from sqlalchemy import and_, select, text

from models import *  # noqa: F403, F401


def test_create_aa_data():
    test_data = list(csv.DictReader(open("test_csv/aas.tsv"), dialect="excel-tab"))

    assert len(test_data) == 4

    assert create_aa_data(test_data[0]).SYS_AA_ID == 1
    assert create_aa_data(test_data[0]).AA_NAME == "Family Support Research"
    assert create_aa_data(test_data[0]).SYS_PROJECT_ID == 1
    assert create_aa_data(test_data[0]).PROC_SHOP_ID == 1
    assert create_aa_data(test_data[0]).OPRE_PROJECT_OFFICER == 1
    assert create_aa_data(test_data[0]).OPRE_ALT_PROJECT_OFFICER == 2


def test_validate_data():
    test_data = list(csv.DictReader(open("test_csv/aas.tsv"), dialect="excel-tab"))
    assert len(test_data) == 4
    count = sum(1 for data in test_data if validate_data(create_aa_data(data)))
    assert count == 4


def test_create_models_no_aa_name():
    with pytest.raises(TypeError):
        AAData(
            SYS_AA_ID=1,
        )


@pytest.fixture()
def db_for_aas(loaded_db):
    project_officer_1 = User(
        id=1,
        email="project.officer1@localhost",
    )
    loaded_db.add(project_officer_1)

    project_officer_2 = User(
        id=2,
        email="project.officer2@localhost",
    )
    loaded_db.add(project_officer_2)
    loaded_db.commit()

    project_1 = ResearchProject(
        id=1,
        title="Test Project",
        short_title="Test Project",
    )

    loaded_db.add(project_1)

    project_2 = ResearchProject(
        id=2,
        title="Yet Another Test Project",
        short_title="Experimental Project",
    )

    loaded_db.add(project_2)

    proc_shop_1 = ProcurementShop(
        id=13,
        name="Test Procurement Shop",
        abbr="TLA",
    )

    loaded_db.add(proc_shop_1)
    loaded_db.commit()

    yield loaded_db
    loaded_db.rollback()

    loaded_db.execute(text("DELETE FROM iaa_aa_agreement"))
    loaded_db.execute(text("DELETE FROM iaa_aa_agreement_version"))
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


def test_create_models(db_for_aas):
    data = AAData(
        SYS_AA_ID=1,
        AA_NAME="Family Support Research",
        SYS_PROJECT_ID=1,
        PROC_SHOP_ID=1,
        CONTRACT_START_DATE='2024-10-01',
        CONTRACT_END_DATE='2025-09-30',
        OPRE_PROJECT_OFFICER=1,
        OPRE_ALT_PROJECT_OFFICER=2
    )

    sys_user = User(
        email="system.admin@localhost",
    )
    create_models(data, sys_user, db_for_aas)

    aa_model = db_for_aas.execute(select(IaaAaAgreement).where(IaaAaAgreement.id == 1)).scalar()

    assert aa_model.name == "Family Support Research"
    assert aa_model.id == 1
    assert aa_model.project_id == 1
    assert aa_model.start_date == '2024-10-01'
    assert aa_model.end_date == '2025-09-30'
    assert aa_model.awarding_entity_id == 1
    assert aa_model.project_officer_id == 2
    assert aa_model.alternate_project_officer_id == 2


def test_main(db_for_aas):
    result = CliRunner().invoke(
        main,
        [
            "--env",
            "pytest_data_tools",
            "--type",
            "aas",
            "--input-csv",
            "test_csv/aas.tsv",
        ],
    )

    assert result.exit_code == 0

    sys_user = User(
        email="system.admin@localhost",
    )

    # make sure the data was loaded
    aa_model = db_for_aas.execute(select(IaaAaAgreement).where(IaaAaAgreement.id == 1)).scalar()

    assert aa_model.name == "Family Support Research"
    assert aa_model.id == 1
    assert aa_model.project_id == 1
    assert aa_model.start_date == '2024-10-01'
    assert aa_model.end_date == '2025-09-30'
    assert aa_model.awarding_entity_id == 1
    assert aa_model.project_officer_id == 2
    assert aa_model.alternate_project_officer_id == 2

    history_objs = (
        db_for_aas.execute(select(OpsDBHistory).where(OpsDBHistory.class_name == "IaaAaAgreement")).scalars().all()
    )

    assert len(history_objs) == 4

    aa_1_history = (
        db_for_aas.execute(
            select(OpsDBHistory).where(
                and_(OpsDBHistory.row_key == str(aa_model.id), OpsDBHistory.class_name == "IaaAaAgreement")
            )
        )
        .scalars()
        .all()
    )
    assert len(aa_1_history) == 1


def test_create_models_upsert(db_for_aas):
    sys_user = get_or_create_sys_user(db_for_aas)

    data_1 = AAData(
        SYS_AA_ID=1,
        AA_NAME="Family Support Research",
        SYS_PROJECT_ID=1,
        PROC_SHOP_ID=1,
        CONTRACT_START_DATE='2024-10-01',
        CONTRACT_END_DATE='2025-09-30',
        OPRE_PROJECT_OFFICER=1,
        OPRE_ALT_PROJECT_OFFICER=2
    )

    # update the IAA name
    data_2 = AAData(
        SYS_AA_ID=1,
        AA_NAME="Family Support Research Renamed",
        SYS_PROJECT_ID=1,
        PROC_SHOP_ID=1,
        CONTRACT_START_DATE='2024-10-01',
        CONTRACT_END_DATE='2025-09-30',
        OPRE_PROJECT_OFFICER=1,
        OPRE_ALT_PROJECT_OFFICER=2
    )

    create_models(data_1, sys_user, db_for_aas)

    # make sure the data was loaded
    aa_model = db_for_aas.execute(select(IaaAaAgreement).where(IaaAaAgreement.id == 100)).scalar()

    assert aa_model.name == "Family Support Research"
    assert aa_model.id == 1
    assert aa_model.project_id == 1
    assert aa_model.start_date == '2024-10-01'
    assert aa_model.end_date == '2025-09-30'
    assert aa_model.awarding_entity_id == 1
    assert aa_model.project_officer_id == 2
    assert aa_model.alternate_project_officer_id == 2
    assert aa_model.created_by == sys_user.id
    assert aa_model.updated_by == sys_user.id
    assert aa_model.created_on is not None
    assert aa_model.updated_on is not None

    # make sure the version records were created
    assert aa_model.versions[0].name == "Family Support Research"
    assert aa_model.versions[0].id == 1
    assert aa_model.versions[0].project_id == 1
    assert aa_model.versions[0].start_date == '2024-10-01'
    assert aa_model.versions[0].end_date == '2025-09-30'
    assert aa_model.versions[0].awarding_entity_id == 1
    assert aa_model.versions[0].project_officer_id == 2
    assert aa_model.versions[0].alternate_project_officer_id == 2
    assert aa_model.versions[0].created_by == sys_user.id
    assert aa_model.versions[0].updated_by == sys_user.id
    assert aa_model.versions[0].created_on is not None
    assert aa_model.versions[0].updated_on is not None

    # make sure the history records are created
    history_record = db_for_aas.execute(
        select(OpsDBHistory).where(OpsDBHistory.class_name == "IaaAaAgreement").order_by(OpsDBHistory.created_on.desc())
    ).scalar()
    assert history_record is not None
    assert history_record.event_type == OpsDBHistoryType.NEW
    assert history_record.row_key == str(aa_model.id)
    assert history_record.created_by == sys_user.id

    # upsert the same data - change the IAA name
    create_models(data_2, sys_user, db_for_aas)

    # make sure the data was loaded
    aa_model = db_for_aas.execute(select(IaaAaAgreement).where(IaaAaAgreement.id == 1)).scalar()

    assert aa_model.name == "Family Support Research Renamed"
    assert aa_model.maps_sys_id == 100
    assert aa_model.project_id == 1
    assert aa_model.start_date == '2024-10-01'
    assert aa_model.end_date == '2025-09-30'
    assert aa_model.awarding_entity_id == 1
    assert aa_model.project_officer_id == 2
    assert aa_model.alternate_project_officer_id == 2
    assert aa_model.created_by == sys_user.id
    assert aa_model.updated_by == sys_user.id
    assert aa_model.created_on is not None
    assert aa_model.updated_on is not None

    # make sure the version records were created
    assert aa_model.versions[1].name == "Family Support Research Renamed"
    assert aa_model.versions[1].id == 1
    assert aa_model.versions[1].project_id == 1
    assert aa_model.versions[1].start_date == '2024-10-01'
    assert aa_model.versions[1].end_date == '2025-09-30'
    assert aa_model.versions[1].awarding_entity_id == 1
    assert aa_model.versions[1].project_officer_id == 2
    assert aa_model.versions[1].alternate_project_officer_id == 2
    assert aa_model.versions[1].created_by == sys_user.id
    assert aa_model.versions[1].updated_by == sys_user.id
    assert aa_model.versions[1].created_on is not None
    assert aa_model.versions[1].updated_on is not None

    # make sure the history records are created
    history_record = db_for_aas.execute(
        select(OpsDBHistory).where(OpsDBHistory.class_name == "IaaAaAgreement").order_by(OpsDBHistory.created_on.desc())
    ).scalar()
    assert history_record is not None
    assert history_record.event_type == OpsDBHistoryType.UPDATED
    assert history_record.row_key == str(aa_model.id)
    assert history_record.created_by == sys_user.id
