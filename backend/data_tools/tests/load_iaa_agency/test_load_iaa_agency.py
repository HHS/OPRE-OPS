# flake8: noqa F405
import csv
from json import load

import pytest
from click.testing import CliRunner
from data_tools.src.common.utils import get_or_create_sys_user
from data_tools.src.load_data import main
from data_tools.src.load_iaa_agency.utils import IAAAgencyData, create_iaa_agency_data, create_models, validate_data
from sqlalchemy import and_, select, text

from models import *


@pytest.fixture()
def db_for_iaa_agency(loaded_db):
    yield loaded_db

    # Cleanup
    loaded_db.execute(text("DELETE FROM iaa_customer_agency"))
    loaded_db.execute(text("DELETE FROM iaa_customer_agency_version"))
    loaded_db.execute(text("DELETE FROM object_class_code"))
    loaded_db.execute(text("DELETE FROM object_class_code_version"))
    loaded_db.execute(text("DELETE FROM ops_db_history"))
    loaded_db.execute(text("DELETE FROM ops_db_history_version"))


@pytest.fixture()
def db_for_iaa_agency_with_class_code(db_for_iaa_agency):

    object_class_code = db_for_iaa_agency.get(ObjectClassCode, 500)

    if not object_class_code:
        object_class_code = ObjectClassCode(
            id=500,
            code="25309",
        )

        db_for_iaa_agency.add(object_class_code)
        db_for_iaa_agency.commit()

    yield db_for_iaa_agency

    # Cleanup
    db_for_iaa_agency.execute(text("DELETE FROM iaa_customer_agency"))
    db_for_iaa_agency.execute(text("DELETE FROM iaa_customer_agency_version"))
    db_for_iaa_agency.execute(text("DELETE FROM object_class_code"))
    db_for_iaa_agency.execute(text("DELETE FROM object_class_code_version"))


def test_create_iaa_agency_data():
    test_data = list(csv.DictReader(open("test_csv/iaa_customer_agency.tsv"), dialect="excel-tab"))

    assert len(test_data) > 0

    # Check first agency data
    assert create_iaa_agency_data(test_data[0]).SYS_IAA_CUSTOMER_AGENCY_ID == 35
    assert create_iaa_agency_data(test_data[0]).CUSTOMER_AGENCY_NAME == "CDC Office of Health Statistics"
    assert create_iaa_agency_data(test_data[0]).CUSTOMER_AGENCY_NBR == "90078"
    assert create_iaa_agency_data(test_data[0]).CUSTOMER_DUNS == "X91556291"
    assert create_iaa_agency_data(test_data[0]).OBJECT_CLASS_CODE == 25309


    # Check last agency in list
    last_idx = len(test_data) - 1
    assert create_iaa_agency_data(test_data[last_idx]).SYS_IAA_CUSTOMER_AGENCY_ID == 84
    assert create_iaa_agency_data(test_data[last_idx]).CUSTOMER_AGENCY_NAME == "Treasury Financial Services"
    assert create_iaa_agency_data(test_data[last_idx]).CUSTOMER_AGENCY_NBR == "TFM667"
    assert create_iaa_agency_data(test_data[last_idx]).CUSTOMER_DUNS == "X93219876"
    assert create_iaa_agency_data(test_data[last_idx]).OBJECT_CLASS_CODE == 25309



def test_validate_data():
    test_data = list(csv.DictReader(open("test_csv/iaa_customer_agency.tsv"), dialect="excel-tab"))
    assert len(test_data) > 0
    count = sum(1 for data in test_data if validate_data(create_iaa_agency_data(data)))
    assert count == len(test_data)


def test_no_agency_id():
    with pytest.raises(ValueError):
        IAAAgencyData(
            SYS_IAA_CUSTOMER_AGENCY_ID="",
            CUSTOMER_AGENCY_NAME="Test Agency",
        )


def test_create_models(db_for_iaa_agency_with_class_code):
    data = IAAAgencyData(
        SYS_IAA_CUSTOMER_AGENCY_ID=1,
        CUSTOMER_AGENCY_NAME="Test Federal Agency",
        CUSTOMER_AGENCY_NBR="TFA",
        CUSTOMER_DUNS="123456789",
        OBJECT_CLASS_CODE=25309,
    )

    sys_user = User(
        email="system.admin@localhost",
    )
    create_models(data, sys_user, db_for_iaa_agency_with_class_code)

    agency_model = db_for_iaa_agency_with_class_code.get(IAACustomerAgency, 1)

    assert agency_model.id == 1
    assert agency_model.name == "Test Federal Agency"
    assert agency_model.customer_duns == "123456789"
    assert agency_model.object_class_code.code == 25309
    assert agency_model.customer_agency_nbr == "TFA"
    assert agency_model.created_by == sys_user.id
    assert agency_model.updated_by == sys_user.id
    assert agency_model.created_on is not None
    assert agency_model.updated_on is not None


def test_main(db_for_iaa_agency_with_class_code):
    result = CliRunner().invoke(
        main,
        [
            "--env",
            "pytest_data_tools",
            "--type",
            "iaa_agency",
            "--input-csv",
            "test_csv/iaa_customer_agency.tsv",
        ],
    )

    assert result.exit_code == 0

    sys_user = get_or_create_sys_user(db_for_iaa_agency_with_class_code)

    # Check the first agency was loaded
    agency_1 = db_for_iaa_agency_with_class_code.get(IAACustomerAgency, 35)
    assert agency_1.id == 35
    assert agency_1.name == "CDC Office of Health Statistics"
    assert agency_1.object_class_code.code == 25309
    assert agency_1.customer_agency_nbr == "90078"
    assert agency_1.customer_duns == "X91556291"
    assert agency_1.created_by == sys_user.id
    assert agency_1.updated_by == sys_user.id
    assert agency_1.created_on is not None
    assert agency_1.updated_on is not None

    # Check history records were created
    history_objs = (
        db_for_iaa_agency_with_class_code.execute(select(OpsDBHistory).where(OpsDBHistory.class_name == "IAACustomerAgency")).scalars().all()
    )
    assert len(history_objs) > 0

    agency_1_history = (
        db_for_iaa_agency_with_class_code.execute(
            select(OpsDBHistory).where(and_(OpsDBHistory.row_key == "35", OpsDBHistory.class_name == "IAACustomerAgency"))
        )
        .scalars()
        .all()
    )
    assert len(agency_1_history) > 0


def test_create_models_upsert(db_for_iaa_agency_with_class_code):
    sys_user = get_or_create_sys_user(db_for_iaa_agency_with_class_code)

    # Create new agency
    data_1 = IAAAgencyData(
        SYS_IAA_CUSTOMER_AGENCY_ID=1001,
        CUSTOMER_AGENCY_NAME="Test Federal Agency",
        CUSTOMER_AGENCY_NBR="TFA",
        CUSTOMER_DUNS="123456789",
        OBJECT_CLASS_CODE=25309,
    )

    create_models(data_1, sys_user, db_for_iaa_agency_with_class_code)

    agency_1 = db_for_iaa_agency_with_class_code.get(IAACustomerAgency, 1001)
    assert agency_1.name == "Test Federal Agency"
    assert agency_1.customer_duns == "123456789"
    assert agency_1.object_class_code.code == 25309
    assert agency_1.customer_agency_nbr == "TFA"
    assert agency_1.created_by == sys_user.id
    assert agency_1.updated_by == sys_user.id
    assert agency_1.created_on is not None
    assert agency_1.updated_on is not None

    # Check version records
    assert agency_1.versions[0].name == "Test Federal Agency"
    assert agency_1.versions[0].customer_duns == "123456789"
    assert agency_1.versions[0].object_class_code.code == 25309
    assert agency_1.versions[0].customer_agency_nbr == "TFA"
    assert agency_1.versions[0].created_by == sys_user.id
    assert agency_1.versions[0].updated_by == sys_user.id


    # Check history records
    history_record = db_for_iaa_agency_with_class_code.execute(
        select(OpsDBHistory).where(OpsDBHistory.class_name == "IAACustomerAgency").order_by(OpsDBHistory.created_on.desc())
    ).scalar()
    assert history_record is not None
    assert history_record.event_type == OpsDBHistoryType.NEW
    assert history_record.row_key == "1001"
    assert history_record.created_by == sys_user.id

    # Update agency name
    data_2 = IAAAgencyData(
        SYS_IAA_CUSTOMER_AGENCY_ID=1001,
        CUSTOMER_AGENCY_NAME="Updated Test Federal Agency",
        CUSTOMER_AGENCY_NBR="TFA",
        CUSTOMER_DUNS="123456789",
        OBJECT_CLASS_CODE=25309,
    )
    create_models(data_2, sys_user, db_for_iaa_agency_with_class_code)

    agency_1 = db_for_iaa_agency_with_class_code.get(IAACustomerAgency, 1001)
    assert agency_1.name == "Updated Test Federal Agency"
    assert agency_1.customer_duns == "123456789"
    assert agency_1.object_class_code.code == 25309
    assert agency_1.customer_agency_nbr == "TFA"
    assert agency_1.created_by == sys_user.id
    assert agency_1.updated_by == sys_user.id
    assert agency_1.created_on is not None
    assert agency_1.updated_on is not None

    # Update duns
    data_3 = IAAAgencyData(
        SYS_IAA_CUSTOMER_AGENCY_ID=1001,
        CUSTOMER_AGENCY_NAME="Updated Test Federal Agency",
        CUSTOMER_AGENCY_NBR="TFA",
        CUSTOMER_DUNS="XX3456789",
        OBJECT_CLASS_CODE=25309,
    )
    create_models(data_3, sys_user, db_for_iaa_agency_with_class_code)

    agency_1 = db_for_iaa_agency_with_class_code.get(IAACustomerAgency, 1001)
    assert agency_1.name == "Updated Test Federal Agency"
    assert agency_1.customer_duns == "XX3456789"
    assert agency_1.object_class_code.code == 25309
    assert agency_1.customer_agency_nbr == "TFA"
    assert agency_1.created_by == sys_user.id
    assert agency_1.updated_by == sys_user.id
    assert agency_1.created_on is not None
    assert agency_1.updated_on is not None
