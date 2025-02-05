import csv

import pytest
from click.testing import CliRunner
from data_tools.src.common.utils import get_or_create_sys_user
from data_tools.src.load_contracts.main import main
from data_tools.src.load_contracts.utils import (
    ContractData,
    create_contract_data,
    create_models,
    validate_all,
    validate_data,
)
from sqlalchemy import and_, text

from models import *  # noqa: F403, F401


def test_create_contract_data():
    test_data = list(csv.DictReader(open("test_csv/contracts.tsv"), dialect="excel-tab"))

    assert len(test_data) == 6

    assert create_contract_data(test_data[0]).SYS_CONTRACT_ID == 1
    assert create_contract_data(test_data[0]).SYS_PROJECT_ID == 1
    assert create_contract_data(test_data[0]).SYS_VENDOR_ID == 1
    assert create_contract_data(test_data[0]).CONTRACT_NBR == "HHSXXXXXXX1"
    assert create_contract_data(test_data[0]).TASK_ORDER_NBR == "HHSYYYYYY1"
    assert create_contract_data(test_data[0]).PO_NBR == "HHSZZZZZ1"
    assert create_contract_data(test_data[0]).ACQUISITION_TYPE == AcquisitionType.FULL_AND_OPEN
    assert create_contract_data(test_data[0]).PSC_CODE == "541690"
    assert create_contract_data(test_data[0]).CONTRACT_TYPE == ContractType.TIME_AND_MATERIALS
    assert create_contract_data(test_data[0]).CONTRACT_START_DATE == date(2000, 9, 30)
    assert create_contract_data(test_data[0]).CONTRACT_END_DATE == date(2010, 9, 30)
    assert create_contract_data(test_data[0]).PSC_CONTRACT_SPECIALIST == "John Doe"
    assert create_contract_data(test_data[0]).OPRE_COTR == 1
    assert create_contract_data(test_data[0]).OPRE_PROJECT_OFFICER == 1


def test_validate_data():
    test_data = list(csv.DictReader(open("test_csv/contracts.tsv"), dialect="excel-tab"))
    assert len(test_data) == 6
    count = sum(1 for data in test_data if validate_data(create_contract_data(data)))
    assert count == 6


def test_create_models_no_contract_name():
    with pytest.raises(TypeError):
        ContractData(
            SYS_CONTRACT_ID=1,
        )


@pytest.fixture()
def db_for_contracts(loaded_db):
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

    loaded_db.add(project_1)
    loaded_db.add(project_2)
    loaded_db.commit()

    vendor_1 = Vendor(
        id=1,
        name="Test Vendor",
        duns="123456789",
    )

    vendor_2 = Vendor(
        id=2,
        name="Test Vendor 2",
        duns="987654321",
    )

    loaded_db.add(vendor_1)
    loaded_db.add(vendor_2)
    loaded_db.commit()

    user = User(
        id=1,
        email="test.user@localhost",
    )

    loaded_db.add(user)
    loaded_db.commit()

    yield loaded_db
    loaded_db.rollback()

    loaded_db.execute(text("DELETE FROM contract_agreement"))
    loaded_db.execute(text("DELETE FROM contract_agreement_version"))
    loaded_db.execute(text("DELETE FROM agreement"))
    loaded_db.execute(text("DELETE FROM agreement_version"))
    loaded_db.execute(text("DELETE FROM vendor"))
    loaded_db.execute(text("DELETE FROM vendor_version"))
    loaded_db.execute(text("DELETE FROM research_project"))
    loaded_db.execute(text("DELETE FROM research_project_version"))
    loaded_db.execute(text("DELETE FROM project"))
    loaded_db.execute(text("DELETE FROM project_version"))
    loaded_db.execute(text("DELETE FROM ops_user"))
    loaded_db.execute(text("DELETE FROM ops_user_version"))
    loaded_db.execute(text("DELETE FROM ops_db_history"))
    loaded_db.execute(text("DELETE FROM ops_db_history_version"))
    loaded_db.commit()


def test_create_models(db_for_contracts):
    data = ContractData(
        CONTRACT_NAME="Test Contract",
        SYS_CONTRACT_ID=1,
        SYS_PROJECT_ID=1,
        SYS_VENDOR_ID=1,
        CONTRACT_NBR="HHSXXXXXXX1",
        TASK_ORDER_NBR="HHSYYYYYY1",
        PO_NBR="HHSZZZZZ1",
        ACQUISITION_TYPE=AcquisitionType.FULL_AND_OPEN.name,
        PSC_CODE="541690",
        CONTRACT_TYPE=ContractType.TIME_AND_MATERIALS.name,
        CONTRACT_START_DATE="2000-09-30 00:00:00",
        CONTRACT_END_DATE="2010-09-30 00:00:00",
        PSC_CONTRACT_SPECIALIST="John Doe",
        OPRE_COTR=1,
        OPRE_PROJECT_OFFICER=1,
    )

    sys_user = User(
        email="system.admin@localhost",
    )
    create_models(data, sys_user, db_for_contracts)

    contract_model = db_for_contracts.execute(
        select(ContractAgreement).where(ContractAgreement.maps_sys_id == 1)
    ).scalar()

    assert contract_model.id == 1
    assert contract_model.name == "Test Contract"
    assert contract_model.maps_sys_id == 1
    assert contract_model.contract_number == "HHSXXXXXXX1"
    assert contract_model.vendor_id == 1
    assert contract_model.vendor.name == "Test Vendor"
    assert contract_model.project_id == 1
    assert contract_model.project.title == "Test Project"
    assert contract_model.task_order_number == "HHSYYYYYY1"
    assert contract_model.po_number == "HHSZZZZZ1"
    assert contract_model.acquisition_type == AcquisitionType.FULL_AND_OPEN
    assert contract_model.contract_type == ContractType.TIME_AND_MATERIALS
    assert contract_model.start_date == date(2000, 9, 30)
    assert contract_model.end_date == date(2010, 9, 30)
    assert contract_model.psc_contract_specialist == "John Doe"
    assert contract_model.cotr_id == 1
    assert contract_model.created_by == sys_user.id
    assert contract_model.updated_by == sys_user.id
    assert contract_model.created_on is not None
    assert contract_model.updated_on is not None


def test_main(db_for_contracts):
    result = CliRunner().invoke(
        main,
        [
            "--env",
            "pytest_data_tools",
            "--input-csv",
            "test_csv/contracts.tsv",
        ],
    )

    assert result.exit_code == 0

    sys_user = User(
        email="system.admin@localhost",
    )

    # make sure the data was loaded
    contract_model = db_for_contracts.execute(
        select(ContractAgreement).where(ContractAgreement.maps_sys_id == 1)
    ).scalar()

    assert contract_model.name == "Test Contract #1"
    assert contract_model.maps_sys_id == 1
    assert contract_model.contract_number == "HHSXXXXXXX1"
    assert contract_model.vendor_id == 1
    assert contract_model.vendor.name == "Test Vendor"
    assert contract_model.project_id == 1
    assert contract_model.project.title == "Test Project"
    assert contract_model.task_order_number == "HHSYYYYYY1"
    assert contract_model.po_number == "HHSZZZZZ1"
    assert contract_model.acquisition_type == AcquisitionType.FULL_AND_OPEN
    assert contract_model.contract_type == ContractType.TIME_AND_MATERIALS
    assert contract_model.start_date == date(2000, 9, 30)
    assert contract_model.end_date == date(2010, 9, 30)
    assert contract_model.psc_contract_specialist == "John Doe"
    assert contract_model.cotr_id == 1
    assert contract_model.created_by == sys_user.id
    assert contract_model.updated_by == sys_user.id
    assert contract_model.created_on is not None
    assert contract_model.updated_on is not None

    contract_model = db_for_contracts.execute(
        select(ContractAgreement).where(ContractAgreement.maps_sys_id == 2)
    ).scalar()

    assert contract_model.name == "Test Contract Without A Project"
    assert contract_model.maps_sys_id == 2
    assert contract_model.contract_number == "HHSXXXXXXX1"
    assert contract_model.vendor_id == 1
    assert contract_model.vendor.name == "Test Vendor"
    assert contract_model.project_id is None
    assert contract_model.task_order_number == "HHSYYYYYY1"
    assert contract_model.po_number == "HHSZZZZZ1"
    assert contract_model.acquisition_type == AcquisitionType.FULL_AND_OPEN
    assert contract_model.contract_type == ContractType.TIME_AND_MATERIALS
    assert contract_model.start_date == date(2000, 9, 30)
    assert contract_model.end_date == date(2010, 9, 30)
    assert contract_model.psc_contract_specialist == "John Doe"
    assert contract_model.cotr_id == 1
    assert contract_model.created_by == sys_user.id
    assert contract_model.updated_by == sys_user.id
    assert contract_model.created_on is not None
    assert contract_model.updated_on is not None

    history_objs = (
        db_for_contracts.execute(select(OpsDBHistory).where(OpsDBHistory.class_name == "ContractAgreement"))
        .scalars()
        .all()
    )
    assert len(history_objs) == 6

    contract_1_history = (
        db_for_contracts.execute(
            select(OpsDBHistory).where(
                and_(OpsDBHistory.row_key == str(contract_model.id), OpsDBHistory.class_name == "ContractAgreement")
            )
        )
        .scalars()
        .all()
    )
    assert len(contract_1_history) == 1


def test_create_models_upsert(db_for_contracts):
    sys_user = get_or_create_sys_user(db_for_contracts)

    data_1 = ContractData(
        CONTRACT_NAME="Test Contract",
        SYS_CONTRACT_ID=1,
        SYS_PROJECT_ID=1,
        SYS_VENDOR_ID=1,
        CONTRACT_NBR="HHSXXXXXXX1",
        TASK_ORDER_NBR="HHSYYYYYY1",
        PO_NBR="HHSZZZZZ1",
        ACQUISITION_TYPE=AcquisitionType.FULL_AND_OPEN.name,
        PSC_CODE="541690",
        CONTRACT_TYPE=ContractType.TIME_AND_MATERIALS.name,
        CONTRACT_START_DATE="2000-09-30 00:00:00",
        CONTRACT_END_DATE="2010-09-30 00:00:00",
        PSC_CONTRACT_SPECIALIST="John Doe",
        OPRE_COTR=1,
        OPRE_PROJECT_OFFICER=1,
    )

    data_2 = ContractData(
        CONTRACT_NAME="Test Contract Updated",
        SYS_CONTRACT_ID=1,
        SYS_PROJECT_ID=1,
        SYS_VENDOR_ID=1,
        CONTRACT_NBR="HHSXXXXXXX1",
        TASK_ORDER_NBR="HHSYYYYYY1",
        PO_NBR="HHSZZZZZ1",
        ACQUISITION_TYPE=AcquisitionType.FULL_AND_OPEN.name,
        PSC_CODE="541690",
        CONTRACT_TYPE=ContractType.TIME_AND_MATERIALS.name,
        CONTRACT_START_DATE="2000-09-30 00:00:00",
        CONTRACT_END_DATE="2010-09-30 00:00:00",
        PSC_CONTRACT_SPECIALIST="John Doe",
        OPRE_COTR=1,
        OPRE_PROJECT_OFFICER=1,
    )

    data_3 = ContractData(
        CONTRACT_NAME="Test Contract Updated",
        SYS_CONTRACT_ID=1,
        SYS_PROJECT_ID=2,
        SYS_VENDOR_ID=1,
        CONTRACT_NBR="HHSXXXXXXX1",
        TASK_ORDER_NBR="HHSYYYYYY1",
        PO_NBR="HHSZZZZZ1",
        ACQUISITION_TYPE=AcquisitionType.FULL_AND_OPEN.name,
        PSC_CODE="541690",
        CONTRACT_TYPE=ContractType.TIME_AND_MATERIALS.name,
        CONTRACT_START_DATE="2000-09-30 00:00:00",
        CONTRACT_END_DATE="2010-09-30 00:00:00",
        PSC_CONTRACT_SPECIALIST="John Doe",
        OPRE_COTR=1,
        OPRE_PROJECT_OFFICER=1,
    )

    data_4 = ContractData(
        CONTRACT_NAME="Test Contract Updated",
        SYS_CONTRACT_ID=1,
        SYS_PROJECT_ID=2,
        SYS_VENDOR_ID=2,
        CONTRACT_NBR="HHSXXXXXXX1",
        TASK_ORDER_NBR="HHSYYYYYY1",
        PO_NBR="HHSZZZZZ1",
        ACQUISITION_TYPE=AcquisitionType.FULL_AND_OPEN.name,
        PSC_CODE="541690",
        CONTRACT_TYPE=ContractType.TIME_AND_MATERIALS.name,
        CONTRACT_START_DATE="2000-09-30 00:00:00",
        CONTRACT_END_DATE="2010-09-30 00:00:00",
        PSC_CONTRACT_SPECIALIST="John Doe",
        OPRE_COTR=1,
        OPRE_PROJECT_OFFICER=1,
    )

    create_models(data_1, sys_user, db_for_contracts)

    # make sure the data was loaded
    contract_model = db_for_contracts.execute(
        select(ContractAgreement).where(ContractAgreement.maps_sys_id == 1)
    ).scalar()

    assert contract_model.name == "Test Contract"
    assert contract_model.maps_sys_id == 1
    assert contract_model.contract_number == "HHSXXXXXXX1"
    assert contract_model.vendor_id == 1
    assert contract_model.vendor.name == "Test Vendor"
    assert contract_model.project_id == 1
    assert contract_model.project.title == "Test Project"
    assert contract_model.task_order_number == "HHSYYYYYY1"
    assert contract_model.po_number == "HHSZZZZZ1"
    assert contract_model.acquisition_type == AcquisitionType.FULL_AND_OPEN
    assert contract_model.contract_type == ContractType.TIME_AND_MATERIALS
    assert contract_model.start_date == date(2000, 9, 30)
    assert contract_model.end_date == date(2010, 9, 30)
    assert contract_model.psc_contract_specialist == "John Doe"
    assert contract_model.cotr_id == 1
    assert contract_model.created_by == sys_user.id
    assert contract_model.updated_by == sys_user.id
    assert contract_model.created_on is not None
    assert contract_model.updated_on is not None

    # make sure the version records were created
    assert contract_model.versions[0].name == "Test Contract"
    assert contract_model.versions[0].contract_number == "HHSXXXXXXX1"
    assert contract_model.versions[0].vendor_id == 1
    assert contract_model.versions[0].project_id == 1
    assert contract_model.versions[0].task_order_number == "HHSYYYYYY1"
    assert contract_model.versions[0].po_number == "HHSZZZZZ1"
    assert contract_model.versions[0].acquisition_type == AcquisitionType.FULL_AND_OPEN
    assert contract_model.versions[0].contract_type == ContractType.TIME_AND_MATERIALS
    assert contract_model.versions[0].start_date == date(2000, 9, 30)
    assert contract_model.versions[0].end_date == date(2010, 9, 30)
    assert contract_model.versions[0].psc_contract_specialist == "John Doe"
    assert contract_model.versions[0].cotr_id == 1
    assert contract_model.versions[0].created_by == sys_user.id
    assert contract_model.versions[0].updated_by == sys_user.id
    assert contract_model.versions[0].created_on is not None
    assert contract_model.versions[0].updated_on is not None

    # make sure the history records are created
    history_record = db_for_contracts.execute(
        select(OpsDBHistory)
        .where(OpsDBHistory.class_name == "ContractAgreement")
        .order_by(OpsDBHistory.created_on.desc())
    ).scalar()
    assert history_record is not None
    assert history_record.event_type == OpsDBHistoryType.NEW
    assert history_record.row_key == str(contract_model.id)
    assert history_record.created_by == sys_user.id

    # upsert the same data - change the Contract Name
    create_models(data_2, sys_user, db_for_contracts)

    # make sure the data was loaded
    contract_model = db_for_contracts.execute(
        select(ContractAgreement).where(ContractAgreement.maps_sys_id == 1)
    ).scalar()

    assert contract_model.name == "Test Contract Updated"
    assert contract_model.maps_sys_id == 1
    assert contract_model.contract_number == "HHSXXXXXXX1"
    assert contract_model.vendor_id == 1
    assert contract_model.vendor.name == "Test Vendor"
    assert contract_model.project_id == 1
    assert contract_model.project.title == "Test Project"
    assert contract_model.task_order_number == "HHSYYYYYY1"
    assert contract_model.po_number == "HHSZZZZZ1"
    assert contract_model.acquisition_type == AcquisitionType.FULL_AND_OPEN
    assert contract_model.contract_type == ContractType.TIME_AND_MATERIALS
    assert contract_model.start_date == date(2000, 9, 30)
    assert contract_model.end_date == date(2010, 9, 30)
    assert contract_model.psc_contract_specialist == "John Doe"
    assert contract_model.cotr_id == 1
    assert contract_model.created_by == sys_user.id
    assert contract_model.updated_by == sys_user.id
    assert contract_model.created_on is not None
    assert contract_model.updated_on is not None

    # make sure the version records were created
    assert contract_model.versions[1].name == "Test Contract Updated"
    assert contract_model.versions[1].contract_number == "HHSXXXXXXX1"
    assert contract_model.versions[1].vendor_id == 1
    assert contract_model.versions[1].project_id == 1
    assert contract_model.versions[1].task_order_number == "HHSYYYYYY1"
    assert contract_model.versions[1].po_number == "HHSZZZZZ1"
    assert contract_model.versions[1].acquisition_type == AcquisitionType.FULL_AND_OPEN
    assert contract_model.versions[1].contract_type == ContractType.TIME_AND_MATERIALS
    assert contract_model.versions[1].start_date == date(2000, 9, 30)
    assert contract_model.versions[1].end_date == date(2010, 9, 30)
    assert contract_model.versions[1].psc_contract_specialist == "John Doe"
    assert contract_model.versions[1].cotr_id == 1
    assert contract_model.versions[1].created_by == sys_user.id
    assert contract_model.versions[1].updated_by == sys_user.id
    assert contract_model.versions[1].created_on is not None
    assert contract_model.versions[1].updated_on is not None

    # make sure the history records are created
    history_record = db_for_contracts.execute(
        select(OpsDBHistory)
        .where(OpsDBHistory.class_name == "ContractAgreement")
        .order_by(OpsDBHistory.created_on.desc())
    ).scalar()
    assert history_record is not None
    assert history_record.event_type == OpsDBHistoryType.UPDATED
    assert history_record.row_key == str(contract_model.id)
    assert history_record.created_by == sys_user.id

    # upsert the same data - change the Project ID
    create_models(data_3, sys_user, db_for_contracts)

    # make sure the data was loaded
    contract_model = db_for_contracts.execute(
        select(ContractAgreement).where(ContractAgreement.maps_sys_id == 1)
    ).scalar()

    assert contract_model.name == "Test Contract Updated"
    assert contract_model.maps_sys_id == 1
    assert contract_model.contract_number == "HHSXXXXXXX1"
    assert contract_model.vendor_id == 1
    assert contract_model.vendor.name == "Test Vendor"
    assert contract_model.project_id == 2
    assert contract_model.project.title == "Test Project 2"
    assert contract_model.task_order_number == "HHSYYYYYY1"
    assert contract_model.po_number == "HHSZZZZZ1"
    assert contract_model.acquisition_type == AcquisitionType.FULL_AND_OPEN
    assert contract_model.contract_type == ContractType.TIME_AND_MATERIALS
    assert contract_model.start_date == date(2000, 9, 30)
    assert contract_model.end_date == date(2010, 9, 30)
    assert contract_model.psc_contract_specialist == "John Doe"
    assert contract_model.cotr_id == 1
    assert contract_model.created_by == sys_user.id
    assert contract_model.updated_by == sys_user.id
    assert contract_model.created_on is not None
    assert contract_model.updated_on is not None

    # make sure the version records were created
    assert contract_model.versions[2].name == "Test Contract Updated"
    assert contract_model.versions[2].contract_number == "HHSXXXXXXX1"
    assert contract_model.versions[2].vendor_id == 1
    assert contract_model.versions[2].project_id == 2
    assert contract_model.versions[2].task_order_number == "HHSYYYYYY1"
    assert contract_model.versions[2].po_number == "HHSZZZZZ1"
    assert contract_model.versions[2].acquisition_type == AcquisitionType.FULL_AND_OPEN
    assert contract_model.versions[2].contract_type == ContractType.TIME_AND_MATERIALS
    assert contract_model.versions[2].start_date == date(2000, 9, 30)
    assert contract_model.versions[2].end_date == date(2010, 9, 30)
    assert contract_model.versions[2].psc_contract_specialist == "John Doe"
    assert contract_model.versions[2].cotr_id == 1
    assert contract_model.versions[2].created_by == sys_user.id
    assert contract_model.versions[2].updated_by == sys_user.id
    assert contract_model.versions[2].created_on is not None
    assert contract_model.versions[2].updated_on is not None

    # make sure the history records are created
    history_record = db_for_contracts.execute(
        select(OpsDBHistory)
        .where(OpsDBHistory.class_name == "ContractAgreement")
        .order_by(OpsDBHistory.created_on.desc())
    ).scalar()
    assert history_record is not None
    assert history_record.event_type == OpsDBHistoryType.UPDATED
    assert history_record.row_key == str(contract_model.id)
    assert history_record.created_by == sys_user.id

    # upsert the same data - change the Vendor ID
    create_models(data_4, sys_user, db_for_contracts)

    # make sure the data was loaded
    contract_model = db_for_contracts.execute(
        select(ContractAgreement).where(ContractAgreement.maps_sys_id == 1)
    ).scalar()

    assert contract_model.name == "Test Contract Updated"
    assert contract_model.maps_sys_id == 1
    assert contract_model.contract_number == "HHSXXXXXXX1"
    assert contract_model.vendor_id == 2
    assert contract_model.vendor.name == "Test Vendor 2"
    assert contract_model.project_id == 2
    assert contract_model.project.title == "Test Project 2"
    assert contract_model.task_order_number == "HHSYYYYYY1"
    assert contract_model.po_number == "HHSZZZZZ1"
    assert contract_model.acquisition_type == AcquisitionType.FULL_AND_OPEN
    assert contract_model.contract_type == ContractType.TIME_AND_MATERIALS
    assert contract_model.start_date == date(2000, 9, 30)
    assert contract_model.end_date == date(2010, 9, 30)
    assert contract_model.psc_contract_specialist == "John Doe"
    assert contract_model.cotr_id == 1
    assert contract_model.created_by == sys_user.id
    assert contract_model.updated_by == sys_user.id
    assert contract_model.created_on is not None
    assert contract_model.updated_on is not None

    # make sure the version records were created
    assert contract_model.versions[3].name == "Test Contract Updated"
    assert contract_model.versions[3].contract_number == "HHSXXXXXXX1"
    assert contract_model.versions[3].vendor_id == 2
    assert contract_model.versions[3].project_id == 2
    assert contract_model.versions[3].task_order_number == "HHSYYYYYY1"
    assert contract_model.versions[3].po_number == "HHSZZZZZ1"
    assert contract_model.versions[3].acquisition_type == AcquisitionType.FULL_AND_OPEN
    assert contract_model.versions[3].contract_type == ContractType.TIME_AND_MATERIALS
    assert contract_model.versions[3].start_date == date(2000, 9, 30)
    assert contract_model.versions[3].end_date == date(2010, 9, 30)
    assert contract_model.versions[3].psc_contract_specialist == "John Doe"
    assert contract_model.versions[3].cotr_id == 1
    assert contract_model.versions[3].created_by == sys_user.id
    assert contract_model.versions[3].updated_by == sys_user.id
    assert contract_model.versions[3].created_on is not None
    assert contract_model.versions[3].updated_on is not None

    # make sure the history records are created
    history_record = db_for_contracts.execute(
        select(OpsDBHistory)
        .where(OpsDBHistory.class_name == "ContractAgreement")
        .order_by(OpsDBHistory.created_on.desc())
    ).scalar()
    assert history_record is not None
    assert history_record.event_type == OpsDBHistoryType.UPDATED
    assert history_record.row_key == str(contract_model.id)
    assert history_record.created_by == sys_user.id
