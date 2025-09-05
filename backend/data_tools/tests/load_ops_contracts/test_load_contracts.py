import csv
from datetime import date

import pytest
from click.testing import CliRunner
from data_tools.src.common.utils import get_or_create_sys_user
from data_tools.src.load_data import main
from data_tools.src.load_ops_contracts.utils import ContractData, create_contract_data, create_models, validate_data
from sqlalchemy import and_, text

from models import *  # noqa: F403, F401


def test_create_contract_data():
    test_data = list(csv.DictReader(open("test_csv/ops_contracts.tsv"), dialect="excel-tab"))

    assert len(test_data) == 7

    assert create_contract_data(
        test_data[0]).CONTRACT_NAME == "Contract #1: African American Child and Family Research Center"
    assert create_contract_data(
        test_data[0]).PROJECT_NAME == "Human Services Interoperability Support"
    assert create_contract_data(test_data[0]).SYS_VENDOR_ID == 100
    assert create_contract_data(test_data[0]).CONTRACT_NBR == 'XXXX000000001'
    assert create_contract_data(test_data[0]).TASK_ORDER_NBR is None
    assert create_contract_data(test_data[0]).PO_NBR is None
    assert create_contract_data(
        test_data[0]).ACQUISITION_TYPE == AcquisitionType.FULL_AND_OPEN
    assert create_contract_data(test_data[0]).PSC_CODE == '541690'
    assert create_contract_data(
        test_data[0]).CONTRACT_TYPE == ContractType.FIRM_FIXED_PRICE
    assert create_contract_data(test_data[0]).CONTRACT_START_DATE == date(2043, 6, 13)
    assert create_contract_data(test_data[0]).CONTRACT_END_DATE == date(2044, 6, 13)
    assert create_contract_data(test_data[0]).PSC_CONTRACT_SPECIALIST == 'PSC Contract Specialist'
    assert create_contract_data(test_data[0]).OPRE_COTR is None
    assert create_contract_data(test_data[0]).OPRE_PROJECT_OFFICER == 500
    assert create_contract_data(test_data[0]).OPRE_ALT_PROJECT_OFFICER == 522
    assert create_contract_data(test_data[0]).DESCRIPTION == 'Test description'
    assert create_contract_data(test_data[0]).PROCUREMENT_SHOP == "GCS"
    assert create_contract_data(test_data[0]).AGREEMENT_REASON == AgreementReason.RECOMPETE

def test_validate_data():
    test_data = list(csv.DictReader(open("test_csv/ops_contracts.tsv"), dialect="excel-tab"))
    assert len(test_data) == 7
    count = sum(1 for data in test_data if validate_data(create_contract_data(data)))
    assert count == 7


def test_create_models_no_contract_name():
    with pytest.raises(TypeError):
        ContractData(
            CONTRACT_NBR="HHSXXXXXXX1",
        )


@pytest.fixture()
def db_for_contracts(loaded_db):
    project_1 = ResearchProject(
        id=1,
        title="Human Services Interoperability Support",
        short_title="Human Services Interoperability Support",
    )

    loaded_db.add(project_1)
    loaded_db.commit()

    vendor_1 = Vendor(
        id=100,
        name="Test Vendor",
        duns="123456789",
    )

    vendor_2 = Vendor(
        id=101,
        name="Test Vendor 2",
        duns="987654321",
    )

    vendor_3 = Vendor(
        id=102,
        name="Test Vendor 3",
        duns="555555555",
    )

    loaded_db.add(vendor_1)
    loaded_db.add(vendor_2)
    loaded_db.add(vendor_3)
    loaded_db.commit()

    user_500 = User(
        id=500,
        email="test.user@localhost",
    )

    user_503 = User(
        id=503,
        email="cotr.user@localhost",
    )

    user_520 = User(
        id=520,
        email="project.officer@localhost",
    )

    user_522 = User(
        id=522,
        email="alt.project.officer@localhost",
    )

    loaded_db.add(user_500)
    loaded_db.add(user_503)
    loaded_db.add(user_520)
    loaded_db.add(user_522)
    loaded_db.commit()

    product_service_code = ProductServiceCode(
        name='Other Scientific and Technical Consulting Services',
        description='Other Scientific and Technical Consulting Services',
        naics='541690',
    )

    loaded_db.add(product_service_code)
    loaded_db.commit()

    procurement_shop = ProcurementShop(
        abbr="GCS",
        name="Grants and Contracts Services",
    )

    loaded_db.add(procurement_shop)
    loaded_db.commit()

    yield loaded_db
    loaded_db.rollback()

    loaded_db.execute(text("DELETE FROM contract_agreement"))
    loaded_db.execute(text("DELETE FROM contract_agreement_version"))
    loaded_db.execute(text("DELETE FROM agreement"))
    loaded_db.execute(text("DELETE FROM agreement_version"))
    loaded_db.execute(text("DELETE FROM product_service_code"))
    loaded_db.execute(text("DELETE FROM product_service_code_version"))
    loaded_db.execute(text("DELETE FROM procurement_shop"))
    loaded_db.execute(text("DELETE FROM procurement_shop_version"))
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
        PROJECT_NAME="Human Services Interoperability Support",
        SYS_VENDOR_ID=100,
        CONTRACT_NBR="HHSXXXXXXX1",
        TASK_ORDER_NBR="HHSYYYYYY1",
        PO_NBR="HHSZZZZZ1",
        ACQUISITION_TYPE=AcquisitionType.FULL_AND_OPEN.name,
        PSC_CODE="541690",
        CONTRACT_TYPE=ContractType.TIME_AND_MATERIALS.name,
        CONTRACT_START_DATE="2000-09-30",
        CONTRACT_END_DATE="2010-09-30",
        PSC_CONTRACT_SPECIALIST="John Doe",
        OPRE_COTR=500,
        OPRE_PROJECT_OFFICER=500,
        OPRE_ALT_PROJECT_OFFICER=522,
        DESCRIPTION="Test description",
        PROCUREMENT_SHOP="GCS",
        AGREEMENT_REASON=AgreementReason.RECOMPETE.name,
    )

    sys_user = User(
        email="system.admin@localhost",
    )
    create_models(data, sys_user, db_for_contracts)

    contract_model = db_for_contracts.execute(
        select(ContractAgreement).where(ContractAgreement.name == "Test Contract")
    ).scalar()

    assert contract_model.name == "Test Contract"
    assert contract_model.project.title == "Human Services Interoperability Support"
    assert contract_model.vendor.name == "Test Vendor"
    assert contract_model.contract_number == "HHSXXXXXXX1"
    assert contract_model.task_order_number == "HHSYYYYYY1"
    assert contract_model.po_number == "HHSZZZZZ1"
    assert contract_model.acquisition_type == AcquisitionType.FULL_AND_OPEN
    assert contract_model.product_service_code.naics == 541690
    assert contract_model.contract_type == ContractType.TIME_AND_MATERIALS
    assert contract_model.start_date == date(2000, 9, 30)
    assert contract_model.end_date == date(2010, 9, 30)
    assert contract_model.psc_contract_specialist == "John Doe"
    assert contract_model.cotr_id == 500
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
            "--type",
            "ops_contracts",
            "--input-csv",
            "test_csv/ops_contracts.tsv",
        ],
    )

    assert result.exit_code == 0

    sys_user = User(
        email="system.admin@localhost",
    )

    # make sure the data was loaded
    contract_model = db_for_contracts.execute(
        select(ContractAgreement).where(ContractAgreement.name == "Contract #1: African American Child and Family Research Center")
    ).scalar()

    assert contract_model.name == "Contract #1: African American Child and Family Research Center"
    assert contract_model.project.title == "Human Services Interoperability Support"
    assert contract_model.vendor.name == "Test Vendor"
    assert contract_model.contract_number == 'XXXX000000001'
    assert contract_model.task_order_number is None
    assert contract_model.po_number is None
    assert contract_model.acquisition_type == AcquisitionType.FULL_AND_OPEN
    assert contract_model.product_service_code.naics == 541690
    assert contract_model.contract_type == ContractType.FIRM_FIXED_PRICE
    assert contract_model.start_date == date(2043, 6, 13)
    assert contract_model.end_date == date(2044, 6, 13)
    assert contract_model.psc_contract_specialist == 'PSC Contract Specialist'
    assert contract_model.cotr_id is None
    assert contract_model.project_officer_id == 500
    assert contract_model.alternate_project_officer_id == 522
    assert contract_model.description == 'Test description'
    assert contract_model.awarding_entity_id == db_for_contracts.execute(
        select(ProcurementShop).where(ProcurementShop.abbr == "GCS")
    ).scalar().id
    assert contract_model.agreement_reason == AgreementReason.RECOMPETE
    assert contract_model.created_by == sys_user.id
    assert contract_model.updated_by == sys_user.id
    assert contract_model.created_on is not None
    assert contract_model.updated_on is not None

    history_objs = (
        db_for_contracts.execute(select(OpsDBHistory).where(OpsDBHistory.class_name == "ContractAgreement"))
        .scalars()
        .all()
    )
    assert len(history_objs) == 7

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
        PROJECT_NAME="Human Services Interoperability Support",
        SYS_VENDOR_ID=100,
        CONTRACT_NBR="HHSXXXXXXX1",
        TASK_ORDER_NBR="HHSYYYYYY1",
        PO_NBR="HHSZZZZZ1",
        ACQUISITION_TYPE=AcquisitionType.FULL_AND_OPEN.name,
        PSC_CODE="541690",
        CONTRACT_TYPE=ContractType.TIME_AND_MATERIALS.name,
        CONTRACT_START_DATE="2000-09-30",
        CONTRACT_END_DATE="2010-09-30",
        PSC_CONTRACT_SPECIALIST="John Doe",
        OPRE_COTR=500,
        OPRE_PROJECT_OFFICER=500,
        OPRE_ALT_PROJECT_OFFICER=522,
        DESCRIPTION="Test description",
        PROCUREMENT_SHOP="GCS",
        AGREEMENT_REASON=AgreementReason.RECOMPETE.name,
    )

    data_2 = ContractData(
        CONTRACT_NAME="Test Contract",
        PROJECT_NAME="Human Services Interoperability Support",
        SYS_VENDOR_ID=100,
        CONTRACT_NBR="HHSXXXXXXX2",
        TASK_ORDER_NBR="HHSYYYYYY1",
        PO_NBR="HHSZZZZZ1",
        ACQUISITION_TYPE=AcquisitionType.FULL_AND_OPEN.name,
        PSC_CODE="541690",
        CONTRACT_TYPE=ContractType.TIME_AND_MATERIALS.name,
        CONTRACT_START_DATE="2000-09-30",
        CONTRACT_END_DATE="2010-09-30",
        PSC_CONTRACT_SPECIALIST="John Doe Sr.",
        OPRE_COTR=500,
        OPRE_PROJECT_OFFICER=500,
        OPRE_ALT_PROJECT_OFFICER=522,
        DESCRIPTION="Test description",
        PROCUREMENT_SHOP="GCS",
        AGREEMENT_REASON=AgreementReason.RECOMPETE.name,
    )

    create_models(data_1, sys_user, db_for_contracts)

    # make sure the data was loaded
    contract_model = db_for_contracts.execute(
        select(ContractAgreement).where(ContractAgreement.name == "Test Contract")
    ).scalar()

    assert contract_model.name == "Test Contract"
    assert contract_model.project.title == "Human Services Interoperability Support"
    assert contract_model.vendor.name == "Test Vendor"
    assert contract_model.contract_number == "HHSXXXXXXX1"
    assert contract_model.task_order_number == "HHSYYYYYY1"
    assert contract_model.po_number == "HHSZZZZZ1"
    assert contract_model.acquisition_type == AcquisitionType.FULL_AND_OPEN
    assert contract_model.product_service_code.naics == 541690
    assert contract_model.contract_type == ContractType.TIME_AND_MATERIALS
    assert contract_model.start_date == date(2000, 9, 30)
    assert contract_model.end_date == date(2010, 9, 30)
    assert contract_model.psc_contract_specialist == "John Doe"
    assert contract_model.cotr_id == 500
    assert contract_model.created_by == sys_user.id
    assert contract_model.updated_by == sys_user.id
    assert contract_model.created_on is not None
    assert contract_model.updated_on is not None

    # make sure the version records were created
    assert contract_model.versions[0].name == "Test Contract"
    assert contract_model.versions[0].contract_number == "HHSXXXXXXX1"
    assert contract_model.versions[0].vendor_id == db_for_contracts.execute(
        select(Vendor.id).where(Vendor.name == "Test Vendor")).scalar_one_or_none()
    assert contract_model.versions[0].project_id == db_for_contracts.execute(
    select(Project.id).where(Project.title == "Human Services Interoperability Support")).scalar_one_or_none()
    assert contract_model.versions[0].task_order_number == "HHSYYYYYY1"
    assert contract_model.versions[0].po_number == "HHSZZZZZ1"
    assert contract_model.versions[0].acquisition_type == AcquisitionType.FULL_AND_OPEN
    assert contract_model.versions[0].contract_type == ContractType.TIME_AND_MATERIALS
    assert contract_model.versions[0].start_date == date(2000, 9, 30)
    assert contract_model.versions[0].end_date == date(2010, 9, 30)
    assert contract_model.versions[0].psc_contract_specialist == "John Doe"
    assert contract_model.versions[0].cotr_id == 500
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

    # upsert the same data with a different contract number and specialist name
    create_models(data_2, sys_user, db_for_contracts)

    # make sure the data was loaded
    contract_model = db_for_contracts.execute(
        select(ContractAgreement).where(ContractAgreement.name == "Test Contract")
    ).scalar()

    assert contract_model.name == "Test Contract"
    assert contract_model.project.title == "Human Services Interoperability Support"
    assert contract_model.vendor.name == "Test Vendor"
    assert contract_model.contract_number == "HHSXXXXXXX2"
    assert contract_model.task_order_number == "HHSYYYYYY1"
    assert contract_model.po_number == "HHSZZZZZ1"
    assert contract_model.acquisition_type == AcquisitionType.FULL_AND_OPEN
    assert contract_model.product_service_code.naics == 541690
    assert contract_model.contract_type == ContractType.TIME_AND_MATERIALS
    assert contract_model.start_date == date(2000, 9, 30)
    assert contract_model.end_date == date(2010, 9, 30)
    assert contract_model.psc_contract_specialist == "John Doe Sr."
    assert contract_model.cotr_id == 500
    assert contract_model.created_by == sys_user.id
    assert contract_model.updated_by == sys_user.id
    assert contract_model.created_on is not None
    assert contract_model.updated_on is not None

    # make sure the version records were created
    assert contract_model.versions[1].name == "Test Contract"
    assert contract_model.versions[1].contract_number == "HHSXXXXXXX2"
    assert contract_model.versions[1].vendor_id == db_for_contracts.execute(
        select(Vendor.id).where(Vendor.name == "Test Vendor")).scalar_one_or_none()
    assert contract_model.versions[1].project_id == db_for_contracts.execute(
        select(Project.id).where(Project.title == "Human Services Interoperability Support")).scalar_one_or_none()
    assert contract_model.versions[1].task_order_number == "HHSYYYYYY1"
    assert contract_model.versions[1].po_number == "HHSZZZZZ1"
    assert contract_model.versions[1].acquisition_type == AcquisitionType.FULL_AND_OPEN
    assert contract_model.versions[1].contract_type == ContractType.TIME_AND_MATERIALS
    assert contract_model.versions[1].start_date == date(2000, 9, 30)
    assert contract_model.versions[1].end_date == date(2010, 9, 30)
    assert contract_model.versions[1].psc_contract_specialist == "John Doe Sr."
    assert contract_model.versions[1].cotr_id == 500
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
