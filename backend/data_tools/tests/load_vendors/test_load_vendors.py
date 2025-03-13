# flake8: noqa F405
import csv

import pytest
from click.testing import CliRunner
from data_tools.src.common.utils import get_or_create_sys_user
from data_tools.src.load_data import main
from data_tools.src.load_vendors.utils import VendorData, create_models, create_vendor_data, validate_data
from sqlalchemy import and_, select, text

from models import *


@pytest.fixture()
def db_with_cleanup(loaded_db):
    yield loaded_db

    # Cleanup
    loaded_db.execute(text("DELETE FROM vendor"))
    loaded_db.execute(text("DELETE FROM vendor_version"))
    loaded_db.execute(text("DELETE FROM ops_db_history"))
    loaded_db.execute(text("DELETE FROM ops_db_history_version"))


def test_create_vendor_data():
    test_data = list(csv.DictReader(open("test_csv/vendors.tsv"), dialect="excel-tab"))

    assert len(test_data) == 32

    # Assuming first vendor has ID 1001 and name "Vendor One"
    assert create_vendor_data(test_data[0]).SYS_VENDOR_ID == 1
    assert create_vendor_data(test_data[0]).VENDOR_NAME == "Acme Solutions Inc"
    assert create_vendor_data(test_data[0]).DUNS == 123456789
    assert create_vendor_data(test_data[0]).ADDRESS == "789 Innovation Way, Suite 400, Techville, CA 90210"
    assert create_vendor_data(test_data[0]).HEAD_OF_CONTRACT == "John Smith"
    assert create_vendor_data(test_data[0]).PHONE_NBR == "555-123-4567"
    assert create_vendor_data(test_data[0]).EMAIL == "jsmith@acmesolutions.com"
    assert create_vendor_data(test_data[0]).STATUS is True

    # Assuming last vendor in list has different properties
    last_idx = len(test_data) - 1
    assert create_vendor_data(test_data[last_idx]).SYS_VENDOR_ID == 32
    assert create_vendor_data(test_data[last_idx]).VENDOR_NAME == "Tektra Solutions"
    assert create_vendor_data(test_data[last_idx]).DUNS == 12345677
    assert create_vendor_data(test_data[last_idx]).ADDRESS == "789 Solution Dr, Kansas City, MO 64101"
    assert create_vendor_data(test_data[last_idx]).HEAD_OF_CONTRACT == "Natalie Baker"
    assert create_vendor_data(test_data[last_idx]).PHONE_NBR == "555-123-4567"
    assert create_vendor_data(test_data[last_idx]).EMAIL == "nbaker@tektrasol.com"
    assert create_vendor_data(test_data[last_idx]).STATUS is False


def test_validate_data():
    test_data = list(csv.DictReader(open("test_csv/vendors.tsv"), dialect="excel-tab"))
    assert len(test_data) > 0
    count = sum(1 for data in test_data if validate_data(create_vendor_data(data)))
    assert count == len(test_data)


def test_no_vendor_id():
    with pytest.raises(ValueError):
        VendorData(
            SYS_VENDOR_ID="",
            VENDOR_NAME="Test Vendor",
        )


def test_create_models(db_with_cleanup):
    data = VendorData(
        SYS_VENDOR_ID=1,
        VENDOR_NAME="Test Vendor Inc.",
        DUNS=123456789,
        ADDRESS="123 Main St, City, State 12345",
        HEAD_OF_CONTRACT="John Doe",
        PHONE_NBR="555-123-4567",
        EMAIL="contact@testvendor.com",
        STATUS="ACTIVE",
    )

    sys_user = User(
        email="system.admin@localhost",
    )
    create_models(data, sys_user, db_with_cleanup)

    vendor_model = db_with_cleanup.get(Vendor, 1)

    assert vendor_model.id == 1
    assert vendor_model.name == "Test Vendor Inc."
    assert vendor_model.duns == "123456789"
    assert vendor_model.active is True
    assert vendor_model.created_by == sys_user.id
    assert vendor_model.created_on is not None
    assert vendor_model.updated_on is not None
    assert vendor_model.updated_by == sys_user.id


def test_main(db_with_cleanup):
    result = CliRunner().invoke(
        main,
        [
            "--env",
            "pytest_data_tools",
            "--type",
            "vendors",
            "--input-csv",
            "test_csv/vendors.tsv",
        ],
    )

    assert result.exit_code == 0

    sys_user = get_or_create_sys_user(db_with_cleanup)

    # make sure the data was loaded
    vendor_1 = db_with_cleanup.get(Vendor, 1)
    assert vendor_1.id == 1
    assert vendor_1.name == "Acme Solutions Inc"
    assert vendor_1.duns == "123456789"
    assert vendor_1.active is True
    assert vendor_1.created_by == sys_user.id
    assert vendor_1.updated_by == sys_user.id
    assert vendor_1.created_on is not None
    assert vendor_1.updated_on is not None


    vendor_2 = db_with_cleanup.get(Vendor, 2)
    assert vendor_2.id == 2
    assert vendor_2.name == "Widgets Inc"
    assert vendor_2.duns == "987654321"
    assert vendor_2.active is False
    assert vendor_2.created_by == sys_user.id
    assert vendor_2.updated_by == sys_user.id
    assert vendor_2.created_on is not None
    assert vendor_2.updated_on is not None

    history_objs = (
        db_with_cleanup.execute(select(OpsDBHistory).where(OpsDBHistory.class_name == "Vendor")).scalars().all()
    )
    assert len(history_objs) > 0

    vendor_1_history = (
        db_with_cleanup.execute(
            select(OpsDBHistory).where(and_(OpsDBHistory.row_key == "1", OpsDBHistory.class_name == "Vendor"))
        )
        .scalars()
        .all()
    )
    assert len(vendor_1_history) > 0


def test_create_models_upsert(db_with_cleanup):
    sys_user = get_or_create_sys_user(db_with_cleanup)

    # new vendor with ID
    data_1 = VendorData(
        SYS_VENDOR_ID=1001,
        VENDOR_NAME="New Test Vendor",
        DUNS=123456789,
        ADDRESS="123 Main St, City, State 12345",
        HEAD_OF_CONTRACT="John Doe",
        PHONE_NBR="555-123-4567",
        EMAIL="contact@testvendor.com",
        STATUS="ACTIVE",
    )

    create_models(data_1, sys_user, db_with_cleanup)

    # make sure the data was loaded
    vendor_1 = db_with_cleanup.get(Vendor, 1001)
    assert vendor_1.id == 1001
    assert vendor_1.name == "New Test Vendor"
    assert vendor_1.duns == "123456789"
    assert vendor_1.active is True
    assert vendor_1.created_by == sys_user.id

    # make sure the version records were created
    assert vendor_1.versions[0].name == "New Test Vendor"
    assert vendor_1.versions[0].duns == "123456789"
    assert vendor_1.versions[0].active is True
    assert vendor_1.versions[0].created_by == sys_user.id

    # make sure the history records are created
    history_record = db_with_cleanup.execute(
        select(OpsDBHistory).where(OpsDBHistory.class_name == "Vendor").order_by(OpsDBHistory.created_on.desc())
    ).scalar()
    assert history_record is not None
    assert history_record.event_type == OpsDBHistoryType.NEW
    assert history_record.row_key == "1001"
    assert history_record.created_by == sys_user.id

    # upsert the same data - change the name
    data_2 = VendorData(
        SYS_VENDOR_ID=1001,
        VENDOR_NAME="Updated Test Vendor",
        DUNS=123456789,
        ADDRESS="123 Main St, City, State 12345",
        HEAD_OF_CONTRACT="John Doe",
        PHONE_NBR="555-123-4567",
        EMAIL="contact@testvendor.com",
        STATUS="ACTIVE",
    )
    create_models(data_2, sys_user, db_with_cleanup)

    vendor_1 = db_with_cleanup.get(Vendor, 1001)
    assert vendor_1.name == "Updated Test Vendor"
    assert vendor_1.duns == "123456789"
    assert vendor_1.active is True
    assert vendor_1.created_by == sys_user.id

    # upsert the same data - change the DUNS
    data_3 = VendorData(
        SYS_VENDOR_ID=1001,
        VENDOR_NAME="Updated Test Vendor",
        DUNS=987654321,
        ADDRESS="123 Main St, City, State 12345",
        HEAD_OF_CONTRACT="John Doe",
        PHONE_NBR="555-123-4567",
        EMAIL="contact@testvendor.com",
        STATUS="ACTIVE",
    )
    create_models(data_3, sys_user, db_with_cleanup)

    vendor_1 = db_with_cleanup.get(Vendor, 1001)
    assert vendor_1.name == "Updated Test Vendor"
    assert vendor_1.duns == "987654321"
    assert vendor_1.active is True
    assert vendor_1.created_by == sys_user.id
