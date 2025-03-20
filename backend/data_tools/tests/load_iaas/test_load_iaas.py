import csv
from datetime import date
from decimal import Decimal
from json import load

import pytest
from click.testing import CliRunner
from data_tools.src.common.utils import get_or_create_sys_user
from data_tools.src.load_data import main
from data_tools.src.load_iaas.utils import IAAData, create_iaa_data, create_models, validate_data
from sqlalchemy import and_, select, text

from models import *  # noqa: F403, F401


def test_create_iaa_data():
    test_data = list(csv.DictReader(open("test_csv/iaas.tsv"), dialect="excel-tab"))

    assert len(test_data) == 50

    assert create_iaa_data(test_data[0]).SYS_IAA_ID == 1
    assert create_iaa_data(test_data[0]).IAA_NAME == "Family Support Research"
    assert create_iaa_data(test_data[0]).SYS_PROJECT_ID == 1
    assert create_iaa_data(test_data[0]).SYS_IAA_CUSTOMER_AGENCY_ID == 1
    assert create_iaa_data(test_data[0]).OPRE_POC == "Jennifer Smith"
    assert create_iaa_data(test_data[0]).AGENCY_POC == "Robert Davis"


def test_validate_data():
    test_data = list(csv.DictReader(open("test_csv/iaas.tsv"), dialect="excel-tab"))
    assert len(test_data) == 50
    count = sum(1 for data in test_data if validate_data(create_iaa_data(data)))
    assert count == 50


def test_create_models_no_iaa_name():
    with pytest.raises(TypeError):
        IAAData(
            SYS_IAA_ID=1,
        )


@pytest.fixture()
def db_for_iaas(loaded_db):
    project_1 = ResearchProject(
        id=1,
        title="Test Project",
        short_title="Test Project",
    )

    loaded_db.add(project_1)
    loaded_db.commit()

    agency_500 = IAACustomerAgency(
        id=500,
        name="Test Agency",
    )

    loaded_db.add(agency_500)
    loaded_db.commit()

    yield loaded_db
    loaded_db.rollback()

    loaded_db.execute(text("DELETE FROM iaa_agreement"))
    loaded_db.execute(text("DELETE FROM iaa_agreement_version"))
    loaded_db.execute(text("DELETE FROM agreement"))
    loaded_db.execute(text("DELETE FROM agreement_version"))
    loaded_db.execute(text("DELETE FROM research_project"))
    loaded_db.execute(text("DELETE FROM research_project_version"))
    loaded_db.execute(text("DELETE FROM project"))
    loaded_db.execute(text("DELETE FROM project_version"))
    loaded_db.execute(text("DELETE FROM iaa_customer_agency"))
    loaded_db.execute(text("DELETE FROM iaa_customer_agency_version"))
    loaded_db.execute(text("DELETE FROM ops_user"))
    loaded_db.execute(text("DELETE FROM ops_user_version"))
    loaded_db.execute(text("DELETE FROM ops_db_history"))
    loaded_db.execute(text("DELETE FROM ops_db_history_version"))
    loaded_db.commit()


def test_create_models(db_for_iaas):
    data = IAAData(
        SYS_IAA_ID=1,
        IAA_NAME="Family Support Research",
        SYS_PROJECT_ID=1,
        SYS_IAA_CUSTOMER_AGENCY_ID=500,
        OPRE_POC="Jane Doe",
        AGENCY_POC="John Smith",
    )

    sys_user = User(
        email="system.admin@localhost",
    )
    create_models(data, sys_user, db_for_iaas)

    iaa_model = db_for_iaas.execute(select(IaaAgreement).where(IaaAgreement.maps_sys_id == 1)).scalar()

    assert iaa_model.name == "Family Support Research"
    assert iaa_model.maps_sys_id == 1
    assert iaa_model.project_id == 1
    assert iaa_model.project.title == "Test Project"
    assert iaa_model.iaa_customer_agency_id == 500
    assert iaa_model.iaa_customer_agency.name == "Test Agency"
    assert iaa_model.opre_poc == "Jane Doe"
    assert iaa_model.agency_poc == "John Smith"


def test_main(db_for_iaas):
    result = CliRunner().invoke(
        main,
        [
            "--env",
            "pytest_data_tools",
            "--type",
            "iaas",
            "--input-csv",
            "test_csv/iaas.tsv",
        ],
    )

    assert result.exit_code == 0

    sys_user = User(
        email="system.admin@localhost",
    )

    # make sure the data was loaded
    iaa_model = db_for_iaas.execute(select(IaaAgreement).where(IaaAgreement.maps_sys_id == 1)).scalar()

    assert iaa_model.name == "Family Support Research"
    assert iaa_model.maps_sys_id == 1
    assert iaa_model.project_id == 1
    assert iaa_model.project.title == "Test Project"
    assert iaa_model.iaa_customer_agency_id is None
    assert iaa_model.opre_poc == "Jennifer Smith"
    assert iaa_model.agency_poc == "Robert Davis"
    assert iaa_model.created_by == sys_user.id
    assert iaa_model.updated_by == sys_user.id
    assert iaa_model.created_on is not None
    assert iaa_model.updated_on is not None

    history_objs = (
        db_for_iaas.execute(select(OpsDBHistory).where(OpsDBHistory.class_name == "IaaAgreement")).scalars().all()
    )

    assert len(history_objs) == 50

    iaa_1_history = (
        db_for_iaas.execute(
            select(OpsDBHistory).where(
                and_(OpsDBHistory.row_key == str(iaa_model.id), OpsDBHistory.class_name == "IaaAgreement")
            )
        )
        .scalars()
        .all()
    )
    assert len(iaa_1_history) == 1


def test_create_models_upsert(db_for_iaas):
    sys_user = get_or_create_sys_user(db_for_iaas)

    data_1 = IAAData(
        SYS_IAA_ID=100,
        IAA_NAME="Family Support Research",
        SYS_PROJECT_ID=1,
        SYS_IAA_CUSTOMER_AGENCY_ID=500,
        OPRE_POC="Jane Doe",
        AGENCY_POC="John Smith",
    )

    # update the IAA name
    data_2 = IAAData(
        SYS_IAA_ID=100,
        IAA_NAME="Family Support Research Updated",
        SYS_PROJECT_ID=1,
        SYS_IAA_CUSTOMER_AGENCY_ID=500,
        OPRE_POC="Jane Doe",
        AGENCY_POC="John Smith",
    )

    create_models(data_1, sys_user, db_for_iaas)

    # make sure the data was loaded
    iaa_model = db_for_iaas.execute(select(IaaAgreement).where(IaaAgreement.maps_sys_id == 100)).scalar()

    assert iaa_model.name == "Family Support Research"
    assert iaa_model.maps_sys_id == 100
    assert iaa_model.project_id == 1
    assert iaa_model.project.title == "Test Project"
    assert iaa_model.iaa_customer_agency_id == 500
    assert iaa_model.iaa_customer_agency.name == "Test Agency"
    assert iaa_model.opre_poc == "Jane Doe"
    assert iaa_model.agency_poc == "John Smith"
    assert iaa_model.created_by == sys_user.id
    assert iaa_model.updated_by == sys_user.id
    assert iaa_model.created_on is not None
    assert iaa_model.updated_on is not None

    # make sure the version records were created
    assert iaa_model.versions[0].name == "Family Support Research"
    assert iaa_model.versions[0].maps_sys_id == 100
    assert iaa_model.versions[0].project_id == 1
    assert iaa_model.versions[0].iaa_customer_agency_id == 500
    assert iaa_model.versions[0].opre_poc == "Jane Doe"
    assert iaa_model.versions[0].agency_poc == "John Smith"
    assert iaa_model.versions[0].created_by == sys_user.id
    assert iaa_model.versions[0].updated_by == sys_user.id
    assert iaa_model.versions[0].created_on is not None
    assert iaa_model.versions[0].updated_on is not None

    # make sure the history records are created
    history_record = db_for_iaas.execute(
        select(OpsDBHistory).where(OpsDBHistory.class_name == "IaaAgreement").order_by(OpsDBHistory.created_on.desc())
    ).scalar()
    assert history_record is not None
    assert history_record.event_type == OpsDBHistoryType.NEW
    assert history_record.row_key == str(iaa_model.id)
    assert history_record.created_by == sys_user.id

    # upsert the same data - change the IAA name
    create_models(data_2, sys_user, db_for_iaas)

    # make sure the data was loaded
    iaa_model = db_for_iaas.execute(select(IaaAgreement).where(IaaAgreement.maps_sys_id == 100)).scalar()

    assert iaa_model.name == "Family Support Research Updated"
    assert iaa_model.maps_sys_id == 100
    assert iaa_model.project_id == 1
    assert iaa_model.project.title == "Test Project"
    assert iaa_model.iaa_customer_agency_id == 500
    assert iaa_model.iaa_customer_agency.name == "Test Agency"
    assert iaa_model.opre_poc == "Jane Doe"
    assert iaa_model.agency_poc == "John Smith"
    assert iaa_model.created_by == sys_user.id
    assert iaa_model.updated_by == sys_user.id
    assert iaa_model.created_on is not None
    assert iaa_model.updated_on is not None

    # make sure the version records were created
    assert iaa_model.versions[1].name == "Family Support Research Updated"
    assert iaa_model.versions[1].maps_sys_id == 100
    assert iaa_model.versions[1].project_id == 1
    assert iaa_model.versions[1].iaa_customer_agency_id == 500
    assert iaa_model.versions[1].opre_poc == "Jane Doe"
    assert iaa_model.versions[1].agency_poc == "John Smith"
    assert iaa_model.versions[1].created_by == sys_user.id
    assert iaa_model.versions[1].updated_by == sys_user.id
    assert iaa_model.versions[1].created_on is not None
    assert iaa_model.versions[1].updated_on is not None

    # make sure the history records are created
    history_record = db_for_iaas.execute(
        select(OpsDBHistory).where(OpsDBHistory.class_name == "IaaAgreement").order_by(OpsDBHistory.created_on.desc())
    ).scalar()
    assert history_record is not None
    assert history_record.event_type == OpsDBHistoryType.UPDATED
    assert history_record.row_key == str(iaa_model.id)
    assert history_record.created_by == sys_user.id
