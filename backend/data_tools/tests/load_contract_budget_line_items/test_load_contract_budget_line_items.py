import csv

import pytest
from click.testing import CliRunner
from data_tools.src.common.utils import get_or_create_sys_user
from data_tools.src.load_contract_budget_lines.utils import (
    BudgetLineItemData,
    create_budget_line_item_data,
    create_models,
    get_clin,
    get_invoice,
    get_mod,
    get_requisition,
    get_sc,
    validate_data,
)
from sqlalchemy import and_, text

from models import *  # noqa: F403, F401


def test_create_budget_line_data():
    test_data = list(csv.DictReader(open("./test_csv/contract_budget_lines.tsv"), dialect="excel-tab"))

    # Check record count
    assert len(test_data) == 1
    record = test_data[0]

    # Create contract data object
    contract_data = create_budget_line_item_data(record)

    # System ID assertions
    assert contract_data.SYS_CONTRACT_ID == 1
    assert contract_data.SYS_BUDGET_ID == 1
    assert contract_data.SYS_TYPE_OF_MODE_ID == ModType.NEW
    assert contract_data.SYS_CAN_ID == 1
    assert contract_data.SYS_CLIN_ID == 1

    # Reference number assertions
    assert contract_data.REQUISITION_NBR == "1"
    assert contract_data.MOD_NBR == "0000"
    assert contract_data.PSC_FEE_DOC_NBR == "1"
    assert contract_data.PSC_FEE_PYMT_REF_NBR == "1"

    # Date assertions
    assert contract_data.EXTEND_POP_TO == date(2025, 10, 2)
    assert contract_data.ZERO_REQUISITION_DATE == date(2025, 1, 11)
    assert contract_data.REQUISITION_DATE == date(2025, 1, 12)
    assert contract_data.OBLIGATION_DATE == date(2024, 11, 12)
    assert contract_data.PERF_START_DATE == date(2024, 10, 1)
    assert contract_data.PERF_END_DATE == date(2025, 9, 30)
    assert contract_data.DATE_NEEDED == date(2025, 9, 30)
    assert contract_data.POP_START_DATE == date(2024, 10, 1)
    assert contract_data.POP_END_DATE == date(2025, 9, 30)

    # Status and flags
    assert contract_data.CERTIFIED == True
    assert contract_data.CLOSED == False
    assert contract_data.STATUS == BudgetLineItemStatus.OBLIGATED
    assert contract_data.ON_HOLD == False

    # Financial data
    assert contract_data.OBJECT_CLASS_CODE == 25103
    assert contract_data.AMOUNT == 123.45
    assert contract_data.OVERWRITE_PSC_FEE_RATE == 0.01

    # Description fields
    assert contract_data.LINE_DESCRIPTION == "Line Description #1"
    assert contract_data.COMMENTS == "Comment #1"
    assert contract_data.CLIN_NAME == "SC1"
    assert contract_data.CLIN == "1"


def test_validate_data():
    test_data = list(csv.DictReader(open("./test_csv/contract_budget_lines.tsv"), dialect="excel-tab"))
    assert len(test_data) == 1
    count = sum(1 for data in test_data if validate_data(create_budget_line_item_data(data)))
    assert count == 1


def test_create_models_no_contract_id():
    with pytest.raises(ValueError):
        BudgetLineItemData(
            SYS_CONTRACT_ID=None,
        )


@pytest.fixture()
def db_for_test(loaded_db):
    contract = ContractAgreement(
        id=1,
        name="Test Contract",
        maps_sys_id=1,
    )

    loaded_db.add(contract)
    loaded_db.commit()

    user = User(
        id=1,
        email="test.user@localhost",
    )

    loaded_db.add(user)
    loaded_db.commit()

    yield loaded_db
    loaded_db.rollback()

    loaded_db.execute(text("DELETE FROM requisition"))
    loaded_db.execute(text("DELETE FROM requisition_version"))
    loaded_db.execute(text("DELETE FROM invoice"))
    loaded_db.execute(text("DELETE FROM invoice_version"))
    loaded_db.execute(text("DELETE FROM budget_line_item"))
    loaded_db.execute(text("DELETE FROM budget_line_item_version"))
    loaded_db.execute(text("DELETE FROM agreement_mod"))
    loaded_db.execute(text("DELETE FROM agreement_mod_version"))
    loaded_db.execute(text("DELETE FROM can"))
    loaded_db.execute(text("DELETE FROM can_version"))
    loaded_db.execute(text("DELETE FROM services_component"))
    loaded_db.execute(text("DELETE FROM services_component_version"))
    loaded_db.execute(text("DELETE FROM contract_agreement"))
    loaded_db.execute(text("DELETE FROM contract_agreement_version"))
    loaded_db.execute(text("DELETE FROM agreement"))
    loaded_db.execute(text("DELETE FROM agreement_version"))
    loaded_db.execute(text("DELETE FROM ops_user"))
    loaded_db.execute(text("DELETE FROM ops_user_version"))
    loaded_db.execute(text("DELETE FROM ops_db_history"))
    loaded_db.execute(text("DELETE FROM ops_db_history_version"))
    loaded_db.commit()


def test_create_models(db_for_test):
    division = Division(
        id=1,
        name="Test Division",
        abbreviation="TD",
    )

    portfolio = Portfolio(
        id=1,
        name="Test Portfolio",
        division_id=1,
    )

    can = CAN(
        id=1,
        number="Test CAN",
        portfolio_id=1,
    )

    object_class_code = ObjectClassCode(
        id=1,
        code="25103",
        description="Test Object Class Code",
    )

    db_for_test.add(object_class_code)
    db_for_test.add(division)
    db_for_test.add(portfolio)
    db_for_test.add(can)
    db_for_test.commit()

    data = BudgetLineItemData(
        SYS_CONTRACT_ID=1,
        SYS_BUDGET_ID=1,
        SYS_TYPE_OF_MODE_ID=ModType.NEW.value,
        SYS_CAN_ID=1,
        SYS_CLIN_ID=1,
        REQUISITION_NBR="1",
        MOD_NBR="0000",
        PSC_FEE_DOC_NBR="1",
        PSC_FEE_PYMT_REF_NBR="1",
        EXTEND_POP_TO="2025-10-02",
        ZERO_REQUISITION_NBR="1",
        ZERO_REQUISITION_DATE="2025-01-11",
        REQUISITION_DATE="2025-01-12",
        OBLIGATION_DATE="2024-11-12",
        PERF_START_DATE="2024-10-01",
        PERF_END_DATE="2025-09-30",
        DATE_NEEDED="2025-09-30",
        POP_START_DATE="2024-10-01",
        POP_END_DATE="2025-09-30",
        CERTIFIED=True,
        CLOSED=False,
        STATUS=BudgetLineItemStatus.OBLIGATED.name,
        ON_HOLD=False,
        OBJECT_CLASS_CODE=25103,
        AMOUNT=123.45,
        OVERWRITE_PSC_FEE_RATE=0.01,
        LINE_DESCRIPTION="Line Description #1",
        COMMENTS="Comment #1",
        CLIN_NAME="SC1",
        CLIN="1",
        INVOICE_LINE_NBR="1",
        REQUISITION_GROUP="1",
        REQUISITION_CHECK="Yes",
    )

    sys_user = User(
        email="system.admin@localhost",
    )

    create_models(data, sys_user, db_for_test)

    bli_model = db_for_test.execute(
        select(BudgetLineItem).join(ContractAgreement).where(ContractAgreement.maps_sys_id == 1)
    ).scalar()

    assert bli_model.id == 1
    assert bli_model.agreement_id == 1
    assert bli_model.line_description == "Line Description #1"
    assert bli_model.comments == "Comment #1"
    assert bli_model.can_id == 1
    assert bli_model.services_component.id == 1
    assert bli_model.services_component.number == 1
    assert bli_model.services_component.optional is False
    assert bli_model.services_component.description == "SC1"
    assert bli_model.services_component.period_start == date(2024, 10, 1)
    assert bli_model.services_component.period_end == date(2025, 9, 30)
    assert bli_model.services_component.sub_component is None
    assert bli_model.clin.id == 1
    assert bli_model.clin.number == 1
    assert bli_model.clin.name == "SC1"
    assert bli_model.clin.pop_start_date == date(2024, 10, 1)
    assert bli_model.clin.pop_end_date == date(2025, 9, 30)
    assert bli_model.amount == Decimal("123.45")
    assert bli_model.status == BudgetLineItemStatus.OBLIGATED
    assert bli_model.on_hold is False
    assert bli_model.certified is True
    assert bli_model.closed is False
    assert bli_model.closed_by is None
    assert bli_model.closed_by_user is None
    assert bli_model.closed_date is None
    assert bli_model.is_under_current_resolution is False
    assert bli_model.date_needed == date(2025, 9, 30)
    assert bli_model.extend_pop_to == date(2025, 10, 2)
    assert bli_model.start_date == date(2024, 10, 1)
    assert bli_model.end_date == date(2025, 9, 30)
    assert bli_model.proc_shop_fee_percentage == Decimal("0.01")
    assert bli_model.invoice.id == 1
    assert bli_model.invoice.invoice_line_number == 1
    assert bli_model.requisition.id == 1
    assert bli_model.requisition.zero_number == "1"
    assert bli_model.requisition.zero_date == date(2025, 1, 11)
    assert bli_model.requisition.number == "1"
    assert bli_model.requisition.date == date(2025, 1, 12)
    assert bli_model.requisition.group == 1
    assert bli_model.requisition.check == "Yes"
    assert bli_model.object_class_code.id == 1
    assert bli_model.object_class_code.code == 25103
    assert bli_model.object_class_code.description == "Test Object Class Code"
    assert bli_model.mod.id == 1
    assert bli_model.mod.number == "0000"
    assert bli_model.mod.mod_type == ModType.NEW
    assert bli_model.mod.agreement_id == 1
    assert bli_model.doc_received is False
    assert bli_model.psc_fee_doc_number == "1"
    assert bli_model.psc_fee_pymt_ref_nbr == "1"
    assert bli_model.obligation_date == date(2024, 11, 12)
    assert bli_model.created_by == sys_user.id
    assert bli_model.updated_by == sys_user.id
    assert bli_model.created_on is not None
    assert bli_model.updated_on is not None
    assert bli_model.display_name == "BL 1"
    assert bli_model.portfolio_id == 1
    assert bli_model.fiscal_year == 2025


# def test_main(db_for_contracts):
#     result = CliRunner().invoke(
#         main,
#         [
#             "--env",
#             "pytest_data_tools",
#             "--input-csv",
#             "test_csv/contracts.tsv",
#         ],
#     )
#
#     assert result.exit_code == 0
#
#     sys_user = User(
#         email="system.admin@localhost",
#     )
#
#     # make sure the data was loaded
#     contract_model = db_for_contracts.execute(
#         select(ContractAgreement).where(ContractAgreement.maps_sys_id == 1)
#     ).scalar()
#
#     assert contract_model.name == "Test Contract #1"
#     assert contract_model.maps_sys_id == 1
#     assert contract_model.contract_number == "HHSXXXXXXX1"
#     assert contract_model.vendor_id == 100
#     assert contract_model.vendor.name == "Test Vendor 100"
#     assert contract_model.project_id == 1000
#     assert contract_model.project.title == "Test Project 1000"
#     assert contract_model.task_order_number == "HHSYYYYYY1"
#     assert contract_model.po_number == "HHSZZZZZ1"
#     assert contract_model.acquisition_type == AcquisitionType.FULL_AND_OPEN
#     assert contract_model.contract_type == ContractType.TIME_AND_MATERIALS
#     assert contract_model.start_date == date(2000, 9, 30)
#     assert contract_model.end_date == date(2010, 9, 30)
#     assert contract_model.psc_contract_specialist == "John Doe"
#     assert contract_model.cotr_id == 500
#     assert contract_model.created_by == sys_user.id
#     assert contract_model.updated_by == sys_user.id
#     assert contract_model.created_on is not None
#     assert contract_model.updated_on is not None
#
#     contract_model = db_for_contracts.execute(
#         select(ContractAgreement).where(ContractAgreement.maps_sys_id == 2)
#     ).scalar()
#
#     assert contract_model.name == "Test Contract Without A Project"
#     assert contract_model.maps_sys_id == 2
#     assert contract_model.contract_number == "HHSXXXXXXX1"
#     assert contract_model.vendor_id == 100
#     assert contract_model.vendor.name == "Test Vendor 100"
#     assert contract_model.project_id is None
#     assert contract_model.task_order_number == "HHSYYYYYY1"
#     assert contract_model.po_number == "HHSZZZZZ1"
#     assert contract_model.acquisition_type == AcquisitionType.FULL_AND_OPEN
#     assert contract_model.contract_type == ContractType.TIME_AND_MATERIALS
#     assert contract_model.start_date == date(2000, 9, 30)
#     assert contract_model.end_date == date(2010, 9, 30)
#     assert contract_model.psc_contract_specialist == "John Doe"
#     assert contract_model.cotr_id == 500
#     assert contract_model.created_by == sys_user.id
#     assert contract_model.updated_by == sys_user.id
#     assert contract_model.created_on is not None
#     assert contract_model.updated_on is not None
#
#     history_objs = (
#         db_for_contracts.execute(select(OpsDBHistory).where(OpsDBHistory.class_name == "ContractAgreement"))
#         .scalars()
#         .all()
#     )
#     assert len(history_objs) == 6
#
#     contract_1_history = (
#         db_for_contracts.execute(
#             select(OpsDBHistory).where(
#                 and_(OpsDBHistory.row_key == str(contract_model.id), OpsDBHistory.class_name == "ContractAgreement")
#             )
#         )
#         .scalars()
#         .all()
#     )
#     assert len(contract_1_history) == 1
#
#
# def test_create_models_upsert(db_for_contracts):
#     sys_user = get_or_create_sys_user(db_for_contracts)
#
#     data_1 = ContractData(
#         CONTRACT_NAME="Test Contract",
#         SYS_CONTRACT_ID=1,
#         SYS_PROJECT_ID=1,
#         SYS_VENDOR_ID=1,
#         CONTRACT_NBR="HHSXXXXXXX1",
#         TASK_ORDER_NBR="HHSYYYYYY1",
#         PO_NBR="HHSZZZZZ1",
#         ACQUISITION_TYPE=AcquisitionType.FULL_AND_OPEN.name,
#         PSC_CODE="541690",
#         CONTRACT_TYPE=ContractType.TIME_AND_MATERIALS.name,
#         CONTRACT_START_DATE="2000-09-30 00:00:00",
#         CONTRACT_END_DATE="2010-09-30 00:00:00",
#         PSC_CONTRACT_SPECIALIST="John Doe",
#         OPRE_COTR=1,
#         OPRE_PROJECT_OFFICER=1,
#     )
#
#     data_2 = ContractData(
#         CONTRACT_NAME="Test Contract Updated",
#         SYS_CONTRACT_ID=1,
#         SYS_PROJECT_ID=1,
#         SYS_VENDOR_ID=1,
#         CONTRACT_NBR="HHSXXXXXXX1",
#         TASK_ORDER_NBR="HHSYYYYYY1",
#         PO_NBR="HHSZZZZZ1",
#         ACQUISITION_TYPE=AcquisitionType.FULL_AND_OPEN.name,
#         PSC_CODE="541690",
#         CONTRACT_TYPE=ContractType.TIME_AND_MATERIALS.name,
#         CONTRACT_START_DATE="2000-09-30 00:00:00",
#         CONTRACT_END_DATE="2010-09-30 00:00:00",
#         PSC_CONTRACT_SPECIALIST="John Doe",
#         OPRE_COTR=1,
#         OPRE_PROJECT_OFFICER=1,
#     )
#
#     data_3 = ContractData(
#         CONTRACT_NAME="Test Contract Updated",
#         SYS_CONTRACT_ID=1,
#         SYS_PROJECT_ID=2,
#         SYS_VENDOR_ID=1,
#         CONTRACT_NBR="HHSXXXXXXX1",
#         TASK_ORDER_NBR="HHSYYYYYY1",
#         PO_NBR="HHSZZZZZ1",
#         ACQUISITION_TYPE=AcquisitionType.FULL_AND_OPEN.name,
#         PSC_CODE="541690",
#         CONTRACT_TYPE=ContractType.TIME_AND_MATERIALS.name,
#         CONTRACT_START_DATE="2000-09-30 00:00:00",
#         CONTRACT_END_DATE="2010-09-30 00:00:00",
#         PSC_CONTRACT_SPECIALIST="John Doe",
#         OPRE_COTR=1,
#         OPRE_PROJECT_OFFICER=1,
#     )
#
#     data_4 = ContractData(
#         CONTRACT_NAME="Test Contract Updated",
#         SYS_CONTRACT_ID=1,
#         SYS_PROJECT_ID=2,
#         SYS_VENDOR_ID=2,
#         CONTRACT_NBR="HHSXXXXXXX1",
#         TASK_ORDER_NBR="HHSYYYYYY1",
#         PO_NBR="HHSZZZZZ1",
#         ACQUISITION_TYPE=AcquisitionType.FULL_AND_OPEN.name,
#         PSC_CODE="541690",
#         CONTRACT_TYPE=ContractType.TIME_AND_MATERIALS.name,
#         CONTRACT_START_DATE="2000-09-30 00:00:00",
#         CONTRACT_END_DATE="2010-09-30 00:00:00",
#         PSC_CONTRACT_SPECIALIST="John Doe",
#         OPRE_COTR=1,
#         OPRE_PROJECT_OFFICER=1,
#     )
#
#     create_models(data_1, sys_user, db_for_contracts)
#
#     # make sure the data was loaded
#     contract_model = db_for_contracts.execute(
#         select(ContractAgreement).where(ContractAgreement.maps_sys_id == 1)
#     ).scalar()
#
#     assert contract_model.name == "Test Contract"
#     assert contract_model.maps_sys_id == 1
#     assert contract_model.contract_number == "HHSXXXXXXX1"
#     assert contract_model.vendor_id == 1
#     assert contract_model.vendor.name == "Test Vendor"
#     assert contract_model.project_id == 1
#     assert contract_model.project.title == "Test Project"
#     assert contract_model.task_order_number == "HHSYYYYYY1"
#     assert contract_model.po_number == "HHSZZZZZ1"
#     assert contract_model.acquisition_type == AcquisitionType.FULL_AND_OPEN
#     assert contract_model.contract_type == ContractType.TIME_AND_MATERIALS
#     assert contract_model.start_date == date(2000, 9, 30)
#     assert contract_model.end_date == date(2010, 9, 30)
#     assert contract_model.psc_contract_specialist == "John Doe"
#     assert contract_model.cotr_id == 1
#     assert contract_model.created_by == sys_user.id
#     assert contract_model.updated_by == sys_user.id
#     assert contract_model.created_on is not None
#     assert contract_model.updated_on is not None
#
#     # make sure the version records were created
#     assert contract_model.versions[0].name == "Test Contract"
#     assert contract_model.versions[0].contract_number == "HHSXXXXXXX1"
#     assert contract_model.versions[0].vendor_id == 1
#     assert contract_model.versions[0].project_id == 1
#     assert contract_model.versions[0].task_order_number == "HHSYYYYYY1"
#     assert contract_model.versions[0].po_number == "HHSZZZZZ1"
#     assert contract_model.versions[0].acquisition_type == AcquisitionType.FULL_AND_OPEN
#     assert contract_model.versions[0].contract_type == ContractType.TIME_AND_MATERIALS
#     assert contract_model.versions[0].start_date == date(2000, 9, 30)
#     assert contract_model.versions[0].end_date == date(2010, 9, 30)
#     assert contract_model.versions[0].psc_contract_specialist == "John Doe"
#     assert contract_model.versions[0].cotr_id == 1
#     assert contract_model.versions[0].created_by == sys_user.id
#     assert contract_model.versions[0].updated_by == sys_user.id
#     assert contract_model.versions[0].created_on is not None
#     assert contract_model.versions[0].updated_on is not None
#
#     # make sure the history records are created
#     history_record = db_for_contracts.execute(
#         select(OpsDBHistory)
#         .where(OpsDBHistory.class_name == "ContractAgreement")
#         .order_by(OpsDBHistory.created_on.desc())
#     ).scalar()
#     assert history_record is not None
#     assert history_record.event_type == OpsDBHistoryType.NEW
#     assert history_record.row_key == str(contract_model.id)
#     assert history_record.created_by == sys_user.id
#
#     # upsert the same data - change the Contract Name
#     create_models(data_2, sys_user, db_for_contracts)
#
#     # make sure the data was loaded
#     contract_model = db_for_contracts.execute(
#         select(ContractAgreement).where(ContractAgreement.maps_sys_id == 1)
#     ).scalar()
#
#     assert contract_model.name == "Test Contract Updated"
#     assert contract_model.maps_sys_id == 1
#     assert contract_model.contract_number == "HHSXXXXXXX1"
#     assert contract_model.vendor_id == 1
#     assert contract_model.vendor.name == "Test Vendor"
#     assert contract_model.project_id == 1
#     assert contract_model.project.title == "Test Project"
#     assert contract_model.task_order_number == "HHSYYYYYY1"
#     assert contract_model.po_number == "HHSZZZZZ1"
#     assert contract_model.acquisition_type == AcquisitionType.FULL_AND_OPEN
#     assert contract_model.contract_type == ContractType.TIME_AND_MATERIALS
#     assert contract_model.start_date == date(2000, 9, 30)
#     assert contract_model.end_date == date(2010, 9, 30)
#     assert contract_model.psc_contract_specialist == "John Doe"
#     assert contract_model.cotr_id == 1
#     assert contract_model.created_by == sys_user.id
#     assert contract_model.updated_by == sys_user.id
#     assert contract_model.created_on is not None
#     assert contract_model.updated_on is not None
#
#     # make sure the version records were created
#     assert contract_model.versions[1].name == "Test Contract Updated"
#     assert contract_model.versions[1].contract_number == "HHSXXXXXXX1"
#     assert contract_model.versions[1].vendor_id == 1
#     assert contract_model.versions[1].project_id == 1
#     assert contract_model.versions[1].task_order_number == "HHSYYYYYY1"
#     assert contract_model.versions[1].po_number == "HHSZZZZZ1"
#     assert contract_model.versions[1].acquisition_type == AcquisitionType.FULL_AND_OPEN
#     assert contract_model.versions[1].contract_type == ContractType.TIME_AND_MATERIALS
#     assert contract_model.versions[1].start_date == date(2000, 9, 30)
#     assert contract_model.versions[1].end_date == date(2010, 9, 30)
#     assert contract_model.versions[1].psc_contract_specialist == "John Doe"
#     assert contract_model.versions[1].cotr_id == 1
#     assert contract_model.versions[1].created_by == sys_user.id
#     assert contract_model.versions[1].updated_by == sys_user.id
#     assert contract_model.versions[1].created_on is not None
#     assert contract_model.versions[1].updated_on is not None
#
#     # make sure the history records are created
#     history_record = db_for_contracts.execute(
#         select(OpsDBHistory)
#         .where(OpsDBHistory.class_name == "ContractAgreement")
#         .order_by(OpsDBHistory.created_on.desc())
#     ).scalar()
#     assert history_record is not None
#     assert history_record.event_type == OpsDBHistoryType.UPDATED
#     assert history_record.row_key == str(contract_model.id)
#     assert history_record.created_by == sys_user.id
#
#     # upsert the same data - change the Project ID
#     create_models(data_3, sys_user, db_for_contracts)
#
#     # make sure the data was loaded
#     contract_model = db_for_contracts.execute(
#         select(ContractAgreement).where(ContractAgreement.maps_sys_id == 1)
#     ).scalar()
#
#     assert contract_model.name == "Test Contract Updated"
#     assert contract_model.maps_sys_id == 1
#     assert contract_model.contract_number == "HHSXXXXXXX1"
#     assert contract_model.vendor_id == 1
#     assert contract_model.vendor.name == "Test Vendor"
#     assert contract_model.project_id == 2
#     assert contract_model.project.title == "Test Project 2"
#     assert contract_model.task_order_number == "HHSYYYYYY1"
#     assert contract_model.po_number == "HHSZZZZZ1"
#     assert contract_model.acquisition_type == AcquisitionType.FULL_AND_OPEN
#     assert contract_model.contract_type == ContractType.TIME_AND_MATERIALS
#     assert contract_model.start_date == date(2000, 9, 30)
#     assert contract_model.end_date == date(2010, 9, 30)
#     assert contract_model.psc_contract_specialist == "John Doe"
#     assert contract_model.cotr_id == 1
#     assert contract_model.created_by == sys_user.id
#     assert contract_model.updated_by == sys_user.id
#     assert contract_model.created_on is not None
#     assert contract_model.updated_on is not None
#
#     # make sure the version records were created
#     assert contract_model.versions[2].name == "Test Contract Updated"
#     assert contract_model.versions[2].contract_number == "HHSXXXXXXX1"
#     assert contract_model.versions[2].vendor_id == 1
#     assert contract_model.versions[2].project_id == 2
#     assert contract_model.versions[2].task_order_number == "HHSYYYYYY1"
#     assert contract_model.versions[2].po_number == "HHSZZZZZ1"
#     assert contract_model.versions[2].acquisition_type == AcquisitionType.FULL_AND_OPEN
#     assert contract_model.versions[2].contract_type == ContractType.TIME_AND_MATERIALS
#     assert contract_model.versions[2].start_date == date(2000, 9, 30)
#     assert contract_model.versions[2].end_date == date(2010, 9, 30)
#     assert contract_model.versions[2].psc_contract_specialist == "John Doe"
#     assert contract_model.versions[2].cotr_id == 1
#     assert contract_model.versions[2].created_by == sys_user.id
#     assert contract_model.versions[2].updated_by == sys_user.id
#     assert contract_model.versions[2].created_on is not None
#     assert contract_model.versions[2].updated_on is not None
#
#     # make sure the history records are created
#     history_record = db_for_contracts.execute(
#         select(OpsDBHistory)
#         .where(OpsDBHistory.class_name == "ContractAgreement")
#         .order_by(OpsDBHistory.created_on.desc())
#     ).scalar()
#     assert history_record is not None
#     assert history_record.event_type == OpsDBHistoryType.UPDATED
#     assert history_record.row_key == str(contract_model.id)
#     assert history_record.created_by == sys_user.id
#
#     # upsert the same data - change the Vendor ID
#     create_models(data_4, sys_user, db_for_contracts)
#
#     # make sure the data was loaded
#     contract_model = db_for_contracts.execute(
#         select(ContractAgreement).where(ContractAgreement.maps_sys_id == 1)
#     ).scalar()
#
#     assert contract_model.name == "Test Contract Updated"
#     assert contract_model.maps_sys_id == 1
#     assert contract_model.contract_number == "HHSXXXXXXX1"
#     assert contract_model.vendor_id == 2
#     assert contract_model.vendor.name == "Test Vendor 2"
#     assert contract_model.project_id == 2
#     assert contract_model.project.title == "Test Project 2"
#     assert contract_model.task_order_number == "HHSYYYYYY1"
#     assert contract_model.po_number == "HHSZZZZZ1"
#     assert contract_model.acquisition_type == AcquisitionType.FULL_AND_OPEN
#     assert contract_model.contract_type == ContractType.TIME_AND_MATERIALS
#     assert contract_model.start_date == date(2000, 9, 30)
#     assert contract_model.end_date == date(2010, 9, 30)
#     assert contract_model.psc_contract_specialist == "John Doe"
#     assert contract_model.cotr_id == 1
#     assert contract_model.created_by == sys_user.id
#     assert contract_model.updated_by == sys_user.id
#     assert contract_model.created_on is not None
#     assert contract_model.updated_on is not None
#
#     # make sure the version records were created
#     assert contract_model.versions[3].name == "Test Contract Updated"
#     assert contract_model.versions[3].contract_number == "HHSXXXXXXX1"
#     assert contract_model.versions[3].vendor_id == 2
#     assert contract_model.versions[3].project_id == 2
#     assert contract_model.versions[3].task_order_number == "HHSYYYYYY1"
#     assert contract_model.versions[3].po_number == "HHSZZZZZ1"
#     assert contract_model.versions[3].acquisition_type == AcquisitionType.FULL_AND_OPEN
#     assert contract_model.versions[3].contract_type == ContractType.TIME_AND_MATERIALS
#     assert contract_model.versions[3].start_date == date(2000, 9, 30)
#     assert contract_model.versions[3].end_date == date(2010, 9, 30)
#     assert contract_model.versions[3].psc_contract_specialist == "John Doe"
#     assert contract_model.versions[3].cotr_id == 1
#     assert contract_model.versions[3].created_by == sys_user.id
#     assert contract_model.versions[3].updated_by == sys_user.id
#     assert contract_model.versions[3].created_on is not None
#     assert contract_model.versions[3].updated_on is not None
#
#     # make sure the history records are created
#     history_record = db_for_contracts.execute(
#         select(OpsDBHistory)
#         .where(OpsDBHistory.class_name == "ContractAgreement")
#         .order_by(OpsDBHistory.created_on.desc())
#     ).scalar()
#     assert history_record is not None
#     assert history_record.event_type == OpsDBHistoryType.UPDATED
#     assert history_record.row_key == str(contract_model.id)
#     assert history_record.created_by == sys_user.id


def test_get_sc_create_new(db_for_test):
    """
    Test creating a new ServicesComponent for the BLI.
    """
    sc = get_sc(
        BudgetLineItemData(
            SYS_CONTRACT_ID=1,
            CLIN_NAME="SC1",
        ),
        db_for_test,
    )
    assert sc is not None
    assert sc.number == 1
    assert sc.sub_component is None
    assert sc.optional is False

    sc = get_sc(
        BudgetLineItemData(
            SYS_CONTRACT_ID=1,
            CLIN_NAME="OSC1",
        ),
        db_for_test,
    )
    assert sc is not None
    assert sc.number == 1
    assert sc.sub_component is None
    assert sc.optional is True

    sc = get_sc(
        BudgetLineItemData(
            SYS_CONTRACT_ID=1,
            CLIN_NAME="OY1",
        ),
        db_for_test,
    )
    assert sc is not None
    assert sc.number == 1
    assert sc.sub_component is None
    assert sc.optional is True


def test_get_sc_get_existing(db_for_test):
    """
    Test getting an existing ServicesComponent for the BLI.
    """
    existing_sc = ServicesComponent(
        number=1,
        contract_agreement_id=1,
        optional=False,
    )
    db_for_test.add(existing_sc)
    db_for_test.commit()

    sc = get_sc(
        BudgetLineItemData(
            SYS_CONTRACT_ID=1,
            CLIN_NAME="SC1",
        ),
        db_for_test,
    )
    assert sc == existing_sc

    sc = get_sc(
        BudgetLineItemData(
            SYS_CONTRACT_ID=1,
            CLIN_NAME="SC 1",
        ),
        db_for_test,
    )
    assert sc == existing_sc

    db_for_test.delete(existing_sc)
    db_for_test.commit()


def test_get_sc_get_existing_optional(db_for_test):
    """
    Test getting an existing ServicesComponent for the BLI.
    """
    existing_sc = ServicesComponent(
        number=1,
        contract_agreement_id=1,
        optional=True,
    )
    db_for_test.add(existing_sc)
    db_for_test.commit()

    sc = get_sc(
        BudgetLineItemData(
            SYS_CONTRACT_ID=1,
            CLIN_NAME="OSC1",
        ),
        db_for_test,
    )
    assert sc == existing_sc

    sc = get_sc(
        BudgetLineItemData(
            SYS_CONTRACT_ID=1,
            CLIN_NAME="OY 1",
        ),
        db_for_test,
    )
    assert sc == existing_sc

    sc = get_sc(
        BudgetLineItemData(
            SYS_CONTRACT_ID=1,
            CLIN_NAME="OT1",
        ),
        db_for_test,
    )
    assert sc == existing_sc

    sc = get_sc(
        BudgetLineItemData(
            SYS_CONTRACT_ID=1,
            CLIN_NAME="OS 1",
        ),
        db_for_test,
    )
    assert sc == existing_sc

    db_for_test.delete(existing_sc)
    db_for_test.commit()


def test_get_sc_create_none(db_for_test):
    sc = get_sc(
        BudgetLineItemData(
            SYS_CONTRACT_ID=1,
            CLIN_NAME=None,
        ),
        db_for_test,
    )
    assert sc is None


def test_get_sc_get_existing_sub_component(db_for_test):
    existing_sc = ServicesComponent(
        number=1,
        contract_agreement_id=1,
        optional=False,
        sub_component="SC 1A",
    )
    db_for_test.add(existing_sc)
    db_for_test.commit()

    sc = get_sc(
        BudgetLineItemData(
            SYS_CONTRACT_ID=1,
            CLIN_NAME="SC 1A",
        ),
        db_for_test,
    )
    assert sc == existing_sc

    db_for_test.delete(existing_sc)
    db_for_test.commit()


def test_get_sc_get_new_sub_component(db_for_test):
    sc = get_sc(
        BudgetLineItemData(
            SYS_CONTRACT_ID=1,
            CLIN_NAME="SC 12.1.1",
        ),
        db_for_test,
    )
    assert sc is not None
    assert sc.number == 12
    assert sc.sub_component == "SC 12.1.1"
    assert sc.optional is False


def test_get_clin_new(db_for_test):
    clin = get_clin(
        BudgetLineItemData(
            SYS_CONTRACT_ID=1,
            SYS_CLIN_ID=1,
            CLIN="1",
            CLIN_NAME="SC1",
            POP_START_DATE="2024-10-01",
            POP_END_DATE="2025-09-30",
        ),
        db_for_test,
    )
    assert clin is not None
    assert clin.id == 1
    assert clin.number == 1
    assert clin.name == "SC1"
    assert clin.pop_start_date == date(2024, 10, 1)
    assert clin.pop_end_date == date(2025, 9, 30)


def test_get_clin_existing(db_for_test):
    existing_clin = CLIN(
        id=1,
        number=1,
        contract_agreement_id=db_for_test.get(ContractAgreement, 1).id,
    )

    db_for_test.add(existing_clin)
    db_for_test.commit()

    clin = get_clin(
        BudgetLineItemData(
            SYS_CONTRACT_ID=1,
            SYS_CLIN_ID=1,
            CLIN="1",
            CLIN_NAME="SC1",
            POP_START_DATE="2024-10-01",
            POP_END_DATE="2025-09-30",
        ),
        db_for_test,
    )
    assert clin == existing_clin

    db_for_test.delete(existing_clin)
    db_for_test.commit()


def test_get_invoice_new(db_for_test):
    invoice = get_invoice(
        BudgetLineItemData(
            SYS_CONTRACT_ID=1,
            SYS_BUDGET_ID=1,
            INVOICE_LINE_NBR=1,
        ),
        db_for_test,
    )
    assert invoice is not None
    assert invoice.invoice_line_number == 1
    assert invoice.budget_line_item_id == 1


def test_get_invoice_existing(db_for_test):
    bli = BudgetLineItem(
        id=1,
        agreement_id=1,
    )

    existing_invoice = Invoice(
        invoice_line_number=1,
        budget_line_item_id=1,
    )

    db_for_test.add(bli)
    db_for_test.add(existing_invoice)
    db_for_test.commit()

    invoice = get_invoice(
        BudgetLineItemData(
            SYS_CONTRACT_ID=1,
            SYS_BUDGET_ID=1,
            INVOICE_LINE_NBR=1,
        ),
        db_for_test,
    )
    assert invoice == existing_invoice

    db_for_test.delete(existing_invoice)
    db_for_test.delete(bli)
    db_for_test.commit()


def test_get_invoice_none(db_for_test):
    invoice = get_invoice(
        BudgetLineItemData(
            SYS_CONTRACT_ID=1,
            SYS_BUDGET_ID=1,
        ),
        db_for_test,
    )
    assert invoice is None


def test_get_requisition_new(db_for_test):
    requisition = get_requisition(
        BudgetLineItemData(
            SYS_CONTRACT_ID=1,
            SYS_BUDGET_ID=1,
            ZERO_REQUISITION_NBR="REQZ-FY24-0001",
            ZERO_REQUISITION_DATE="2025-01-11",
            REQUISITION_NBR="REQZ-FY24-0002",
            REQUISITION_DATE="2025-01-12",
            REQUISITION_GROUP="1",
            REQUISITION_CHECK="Yes",
        ),
        db_for_test,
    )
    assert requisition is not None
    assert requisition.zero_number == "REQZ-FY24-0001"
    assert requisition.zero_date == date(2025, 1, 11)
    assert requisition.number == "REQZ-FY24-0002"
    assert requisition.date == date(2025, 1, 12)
    assert requisition.group == 1
    assert requisition.check == "Yes"


def test_get_requisition_existing(db_for_test):
    bli = BudgetLineItem(
        id=1,
        agreement_id=1,
    )
    existing_requisition = Requisition(
        budget_line_item_id=1,
        zero_number="REQZ-FY24-0001",
        zero_date=date(2025, 1, 11),
        number="REQZ-FY24-0002",
        date=date(2025, 1, 12),
        group=1,
        check="Yes",
    )
    db_for_test.add(bli)
    db_for_test.add(existing_requisition)
    db_for_test.commit()

    requisition = get_requisition(
        BudgetLineItemData(
            SYS_CONTRACT_ID=1,
            SYS_BUDGET_ID=1,
            ZERO_REQUISITION_NBR="REQZ-FY24-0001",
            REQUISITION_NBR="REQZ-FY24-0002",
        ),
        db_for_test,
    )
    assert requisition == existing_requisition

    db_for_test.delete(existing_requisition)
    db_for_test.delete(bli)
    db_for_test.commit()


def test_get_mod_new(db_for_test):
    mod = get_mod(
        BudgetLineItemData(
            SYS_CONTRACT_ID=1,
            SYS_BUDGET_ID=1,
            MOD_NBR="0000",
            SYS_TYPE_OF_MODE_ID=ModType.NEW.value,
        ),
        db_for_test,
    )
    assert mod is not None
    assert mod.number == "0000"
    assert mod.mod_type == ModType.NEW
    assert mod.agreement_id == 1
    assert mod.mod_date is None


def test_get_mod_existing(db_for_test):
    bli = BudgetLineItem(
        id=1,
        agreement_id=1,
    )
    existing_mod = AgreementMod(
        number="0000",
        mod_type=ModType.NEW,
        agreement_id=1,
    )
    db_for_test.add(bli)
    db_for_test.add(existing_mod)
    db_for_test.commit()

    mod = get_mod(
        BudgetLineItemData(
            SYS_CONTRACT_ID=1,
            SYS_BUDGET_ID=1,
            MOD_NBR="0000",
        ),
        db_for_test,
    )
    assert mod == existing_mod

    db_for_test.delete(existing_mod)
    db_for_test.delete(bli)
    db_for_test.commit()
