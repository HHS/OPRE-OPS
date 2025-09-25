import csv
import os
from datetime import date, datetime
from decimal import Decimal

import pytest
from click.testing import CliRunner
from data_tools.src.load_data import main
from data_tools.src.load_master_spreadsheet_budget_lines.utils import (
    BudgetLineItemData,
    calculate_proc_fee_percentage,
    create_budget_line_item_data,
    create_models,
    validate_data,
    verify_and_log_project_title,
)
from data_tools.tests.conftest import loaded_db
from sqlalchemy import select, text

from models import (
    CAN,
    AaAgreement,
    AABudgetLineItem,
    AgreementAgency,
    AgreementType,
    BudgetLineItem,
    BudgetLineItemStatus,
    ContractAgreement,
    ContractBudgetLineItem,
    Division,
    GrantAgreement,
    GrantBudgetLineItem,
    OpsDBHistory,
    OpsDBHistoryType,
    Portfolio,
    ProcurementShop,
    ProcurementShopFee,
    ResearchProject,
    ServiceRequirementType,
    User,
)

file_path = os.path.join(os.path.dirname(__file__), "../../test_csv/master_spreadsheet_budget_lines.tsv")


def test_verify_project_title_missing_project_id_logs_warning(db_with_data):
    bli_data = BudgetLineItemData(SYS_BUDGET_ID=1)
    result = verify_and_log_project_title(bli_data, db_with_data, None)
    assert result is None


def test_create_budget_line_data():
    test_data = list(csv.DictReader(open(file_path), dialect="excel-tab"))

    # Check record count
    assert len(test_data) == 10
    record = test_data[0]

    # Create data object
    data = create_budget_line_item_data(record)

    # Check data object
    assert data.EFFECTIVE_DATE == date(2025, 2, 22)
    assert data.REQUESTED_BY == "T. Nguyen"
    assert data.HOW_REQUESTED == "Email"
    assert data.CHANGE_REASONS == "Per Apocalypse"
    assert data.WHO_UPDATED == "L. Garcia"
    assert data.FISCAL_YEAR == "2025"
    assert data.CAN == "G99AB14 (IAA-Incoming-Extra)"
    assert data.SYS_BUDGET_ID == 15015
    assert data.PROJECT_TITLE == "Human Services Interoperability Support"
    assert data.CIG_NAME == "Contract #1: African American Child and Family Research Center"
    assert data.CIG_TYPE == "Contract"
    assert data.LINE_DESC == "Software Licensing"
    assert data.DATE_NEEDED == date(2025, 3, 11)
    assert data.AMOUNT == 2341552303.08
    assert data.PROC_FEE_AMOUNT == 1087.49
    assert data.STATUS == "OPRE - CURRENT"
    assert data.COMMENTS == "Requires revision"
    assert data.NEW_VS_CONTINUING == "N"
    assert data.APPLIED_RESEARCH_VS_EVALUATIVE == "AR"


def test_validate_data():
    test_data = list(csv.DictReader(open(file_path), dialect="excel-tab"))
    assert len(test_data) == 10
    count = sum(1 for data in test_data if validate_data(create_budget_line_item_data(data)))
    assert count == 10


def test_create_models_no_sys_budget_id():
    with pytest.raises(ValueError):
        BudgetLineItemData(
            SYS_BUDGET_ID=None,
        )


@pytest.fixture()
def db_with_data(loaded_db):
    # Create test division
    division = loaded_db.get(Division, 1)
    if not division:
        division = Division(
            id=1,
            name="Test Division",
            abbreviation="TD",
        )
    loaded_db.add(division)

    # Create test portfolio
    portfolio = loaded_db.get(Portfolio, 1)
    if not portfolio:
        portfolio = Portfolio(
            id=1,
            name="Test Portfolio",
            division_id=1,
        )
    loaded_db.add(portfolio)
    loaded_db.commit()

    # Create test Procurement Shop
    procurement_shop_proc1 = ProcurementShop(
        name="Procurement Shop 1",
        abbr="PROC1",
    )
    procurement_shop_proc2 = ProcurementShop(
        name="Procurement Shop 2",
        abbr="PROC2",
    )
    procurement_shop_proc3 = ProcurementShop(
        name="Procurement Shop 3",
        abbr="PROC3",
    )
    loaded_db.add(procurement_shop_proc1)
    loaded_db.add(procurement_shop_proc2)
    loaded_db.add(procurement_shop_proc3)
    loaded_db.commit()

    procurement_shop_proc1_fee = ProcurementShopFee(
        procurement_shop_id=procurement_shop_proc1.id,
        fee=Decimal("7.15"),
    )
    loaded_db.add(procurement_shop_proc1_fee)
    loaded_db.commit()

    # Create test agreements
    g_agreement = loaded_db.get(GrantAgreement, 1)
    if not g_agreement:
        grant_agreement = GrantAgreement(
            id=1,
            name="Grant #1: Early Care and Education Leadership Study (ExCELS)",
            agreement_type=AgreementType.GRANT,
        )
        loaded_db.add(grant_agreement)
    else:
        g_agreement.name = "Grant #1: Early Care and Education Leadership Study (ExCELS)"
        g_agreement.agreement_type = AgreementType.GRANT
        loaded_db.add(g_agreement)
    loaded_db.commit()

    c_agreement = loaded_db.get(ContractAgreement, 2)
    if not c_agreement:
        contract_agreement = ContractAgreement(
            id=2,
            name="Test Contract Agreement Name",
            agreement_type=AgreementType.CONTRACT,
        )
        loaded_db.add(contract_agreement)
    else:
        c_agreement.name = "Test Contract Agreement Name"
        c_agreement.agreement_type = AgreementType.CONTRACT
        loaded_db.add(c_agreement)
    loaded_db.commit()

    # Create test CAN
    can = loaded_db.get(CAN, 1)
    if not can:
        can = CAN(
            id=1,
            number="TestCanNumber",
            portfolio_id=1,
        )
        loaded_db.add(can)
    else:
        can.number = "TestCanNumber"
        can.portfolio_id = 1
        loaded_db.add(can)
    loaded_db.commit()

    yield loaded_db

    if g_agreement:
        loaded_db.delete(g_agreement)
    if c_agreement:
        loaded_db.delete(c_agreement)
    loaded_db.delete(procurement_shop_proc1)
    loaded_db.delete(procurement_shop_proc2)
    loaded_db.delete(procurement_shop_proc3)
    loaded_db.delete(procurement_shop_proc1_fee)
    loaded_db.commit()

    clean_up_db(loaded_db)


def clean_up_db(db_with_data):
    yield db_with_data
    db_with_data.rollback()

    db_with_data.execute(text("DELETE FROM procurement_shop"))
    db_with_data.execute(text("DELETE FROM procurement_shop_version"))

    db_with_data.execute(text("DELETE FROM grant_budget_line_item"))
    db_with_data.execute(text("DELETE FROM grant_budget_line_item_version"))

    db_with_data.execute(text("DELETE FROM contract_budget_line_item"))
    db_with_data.execute(text("DELETE FROM contract_budget_line_item_version"))

    db_with_data.execute(text("DELETE FROM budget_line_item"))
    db_with_data.execute(text("DELETE FROM budget_line_item_version"))

    db_with_data.execute(text("DELETE FROM agreement_mod"))
    db_with_data.execute(text("DELETE FROM agreement_mod_version"))

    db_with_data.execute(text("DELETE FROM can_history"))
    db_with_data.execute(text("DELETE FROM can_history_version"))

    db_with_data.execute(text("DELETE FROM can"))
    db_with_data.execute(text("DELETE FROM can_version"))

    db_with_data.execute(text("DELETE FROM grant_agreement"))
    db_with_data.execute(text("DELETE FROM grant_agreement_version"))

    db_with_data.execute(text("DELETE FROM contract_agreement"))
    db_with_data.execute(text("DELETE FROM contract_agreement_version"))

    db_with_data.execute(text("DELETE FROM iaa_agreement"))
    db_with_data.execute(text("DELETE FROM iaa_agreement_version"))

    db_with_data.execute(text("DELETE FROM aa_agreement"))
    db_with_data.execute(text("DELETE FROM aa_agreement_version"))

    db_with_data.execute(text("DELETE FROM direct_agreement"))
    db_with_data.execute(text("DELETE FROM direct_agreement_version"))

    db_with_data.execute(text("DELETE FROM agreement"))
    db_with_data.execute(text("DELETE FROM agreement_version"))

    db_with_data.execute(text("DELETE FROM role"))
    db_with_data.execute(text("DELETE FROM role_version"))

    db_with_data.execute(text("DELETE FROM ops_event"))
    db_with_data.execute(text("DELETE FROM ops_event_version"))

    db_with_data.execute(text("DELETE FROM ops_user"))
    db_with_data.execute(text("DELETE FROM ops_user_version"))

    db_with_data.execute(text("DELETE FROM ops_db_history"))
    db_with_data.execute(text("DELETE FROM ops_db_history_version"))
    db_with_data.commit()


def test_create_model(db_with_data):
    data = BudgetLineItemData(
        SYS_BUDGET_ID="new",
        EFFECTIVE_DATE="2/22/25",
        REQUESTED_BY="Test Requested By User",
        HOW_REQUESTED="Test How Requested",
        CHANGE_REASONS="Test Change Reason",
        WHO_UPDATED="Test Who Updated User",
        FISCAL_YEAR="2025",
        CAN="TestCanNumber (TestCanNickname)",
        PROJECT_TITLE="Test Project Title",
        CIG_NAME="Grant #1: Early Care and Education Leadership Study (ExCELS)",
        CIG_TYPE="GRANT",
        LINE_DESC="Test Line Description",
        DATE_NEEDED="3/11/25",
        AMOUNT="15203.08",
        PROC_FEE_AMOUNT="1087.49",
        STATUS="OPRE - CURRENT",
        COMMENTS="Test Comments",
        NEW_VS_CONTINUING="N",
        APPLIED_RESEARCH_VS_EVALUATIVE="AR",
        PROC_SHOP="PROC1",
    )

    user = db_with_data.get(User, 1)

    if not user:
        user = User(id=1, email="system.admin@localhost")
        db_with_data.add(user)
        db_with_data.commit()

    create_models(data, user, db_with_data, True)

    bli_model = db_with_data.execute(
        select(GrantBudgetLineItem)
        .join(GrantAgreement)
        .where(GrantAgreement.name == "Grant #1: Early Care and Education Leadership Study (ExCELS)")
    ).scalar_one_or_none()

    # Check data on the created model
    assert bli_model.id != 0
    assert bli_model.agreement_id == 1
    assert bli_model.can_id == 1

    bli_agreement = db_with_data.get(GrantAgreement, 1)
    assert bli_model.agreement == bli_agreement
    assert bli_agreement.awarding_entity_id == db_with_data.scalar(
        select(ProcurementShop.id).where(ProcurementShop.abbr == "PROC1")
    )

    bli_can = db_with_data.get(CAN, 1)
    assert bli_model.can == bli_can

    assert bli_model.budget_line_item_type == AgreementType.GRANT
    assert bli_model.line_description == "Test Line Description"
    assert bli_model.comments == "Test Comments"
    assert bli_model.amount == Decimal("15203.08")
    assert bli_model.status == BudgetLineItemStatus.PLANNED
    assert bli_model.date_needed == date(2025, 3, 11)
    assert bli_model.proc_shop_fee_percentage == Decimal("0.07153")
    assert bli_model.procurement_shop_fee_id is None
    assert bli_model.created_by == 1

    # Default values
    assert bli_model.on_hold is False
    assert bli_model.certified is False
    assert bli_model.closed is False
    assert bli_model.closed_by is None
    assert bli_model.closed_date is None
    assert bli_model.is_under_current_resolution is False
    assert bli_model.extend_pop_to is None
    assert bli_model.start_date is None
    assert bli_model.end_date is None
    assert bli_model.requisition is None
    assert bli_model.object_class_code_id is None
    assert bli_model.object_class_code is None
    assert bli_model.doc_received is False
    assert bli_model.obligation_date is None

    # Check version records
    assert bli_model.versions[0].id == bli_model.id
    assert bli_model.versions[0].agreement_id == 1
    assert bli_model.versions[0].can_id == 1
    assert bli_model.versions[0].budget_line_item_type == AgreementType.GRANT
    assert bli_model.versions[0].line_description == "Test Line Description"
    assert bli_model.versions[0].comments == "Test Comments"
    assert bli_model.versions[0].amount == Decimal("15203.08")
    assert bli_model.versions[0].status == BudgetLineItemStatus.PLANNED
    assert bli_model.versions[0].date_needed == date(2025, 3, 11)
    assert bli_model.versions[0].proc_shop_fee_percentage == Decimal("0.07153")

    # Check history records
    history_records = (
        db_with_data.execute(
            select(OpsDBHistory)
            .where(OpsDBHistory.row_key == str(bli_model.id))
            .order_by(OpsDBHistory.created_on.desc())
        )
        .scalars()
        .all()
    )

    assert history_records[0].event_type == OpsDBHistoryType.NEW
    assert history_records[0].row_key == str(bli_model.id)

    # Cleanup
    db_with_data.delete(bli_model)
    db_with_data.commit()
    clean_up_db(db_with_data)


def test_create_models_upsert(db_with_data):
    existing_bli_id = 15999
    existing_bli = ContractBudgetLineItem(
        id=existing_bli_id,
        agreement_id=2,
        can_id=1,
        budget_line_item_type=AgreementType.CONTRACT,
        line_description="Original Test Line Description",
        comments="Original Test Comments",
        amount=Decimal("89542.75"),
        status=BudgetLineItemStatus.IN_EXECUTION,
        date_needed=date(2025, 2, 17),
        proc_shop_fee_percentage=Decimal("0.015"),
    )
    db_with_data.add(existing_bli)
    db_with_data.commit()

    # Mock data from spreadsheet
    bli_data = BudgetLineItemData(
        SYS_BUDGET_ID=existing_bli_id,
        EFFECTIVE_DATE="2/22/25",
        REQUESTED_BY="Test Requested By User",
        HOW_REQUESTED="Test How Requested",
        CHANGE_REASONS="Test Change Reason",
        WHO_UPDATED="Test Who Updated User",
        FISCAL_YEAR="2025",
        CAN="TestCanNumber (TestCanNickname)",
        PROJECT_TITLE="Test Project Title",
        CIG_NAME="Test Contract Agreement Name",
        CIG_TYPE="CONTRACT",
        LINE_DESC="Original Test Line Description",
        DATE_NEEDED="4/16/25",
        AMOUNT="22589000.75",
        PROC_FEE_AMOUNT="245000.00",
        STATUS="OPRE",
        COMMENTS="Pending final approval",
        NEW_VS_CONTINUING="N",
        APPLIED_RESEARCH_VS_EVALUATIVE="AR",
    )

    test_sys_user = db_with_data.get(User, 1)
    # Run with is_first_time = False
    create_models(bli_data, test_sys_user, db_with_data, False)

    # No change expected
    bli = db_with_data.get(ContractBudgetLineItem, existing_bli_id)
    assert bli is not None
    assert bli.id == existing_bli_id
    assert bli.agreement_id == 2
    assert bli.can_id == 1
    assert bli.budget_line_item_type == AgreementType.CONTRACT
    assert bli.line_description == "Original Test Line Description"
    assert bli.comments == "Original Test Comments"
    assert bli.amount == Decimal("89542.75")
    assert bli.status == BudgetLineItemStatus.IN_EXECUTION
    assert bli.date_needed == date(2025, 2, 17)
    assert bli.proc_shop_fee_percentage == Decimal("0.015")

    # Run with is_first_time = True
    create_models(bli_data, test_sys_user, db_with_data, True)

    # Expect change
    bli_model = db_with_data.get(ContractBudgetLineItem, existing_bli_id)
    assert bli_model is not None
    assert bli_model.id == existing_bli_id
    assert bli_model.agreement_id == 2
    assert bli_model.can_id == 1
    assert bli_model.budget_line_item_type == AgreementType.CONTRACT
    assert bli_model.line_description == "Original Test Line Description"
    assert bli_model.comments == "Pending final approval"
    assert bli_model.amount == Decimal("22589000.75")
    assert bli_model.status == BudgetLineItemStatus.PLANNED
    assert bli_model.date_needed == date(2025, 4, 16)
    assert bli_model.proc_shop_fee_percentage == Decimal("0.01085")
    assert bli_model.updated_by == 1

    # Check version records
    assert bli_model.versions[0].id == existing_bli_id
    assert bli_model.versions[0].agreement_id == 2
    assert bli_model.versions[0].can_id == 1
    assert bli_model.versions[0].budget_line_item_type == AgreementType.CONTRACT
    assert bli_model.versions[0].line_description == "Original Test Line Description"
    assert bli_model.versions[0].comments == "Original Test Comments"
    assert bli_model.versions[0].amount == Decimal("89542.75")
    assert bli_model.versions[0].status == BudgetLineItemStatus.IN_EXECUTION
    assert bli_model.versions[0].date_needed == date(2025, 2, 17)
    assert bli_model.versions[0].proc_shop_fee_percentage == Decimal("0.015")

    assert bli_model.versions[1].id == existing_bli_id
    assert bli_model.versions[1].agreement_id == 2
    assert bli_model.versions[1].can_id == 1
    assert bli_model.versions[1].budget_line_item_type == AgreementType.CONTRACT
    assert bli_model.versions[1].line_description == "Original Test Line Description"
    assert bli_model.versions[1].comments == "Pending final approval"
    assert bli_model.versions[1].amount == Decimal("22589000.75")
    assert bli_model.versions[1].status == BudgetLineItemStatus.PLANNED
    assert bli_model.versions[1].date_needed == date(2025, 4, 16)
    assert bli_model.versions[1].proc_shop_fee_percentage == Decimal("0.01085")

    # Check history records
    history_records = (
        db_with_data.execute(select(OpsDBHistory).where(OpsDBHistory.row_key == str(existing_bli_id))).scalars().all()
    )

    assert history_records[0].class_name == "ContractBudgetLineItem"
    assert history_records[0].event_type == OpsDBHistoryType.NEW

    # Cleanup
    db_with_data.delete(bli_model)
    db_with_data.commit()
    clean_up_db(db_with_data)


def test_create_models_not_first_run_with_contract_in_execution_bli(db_with_data):
    data = BudgetLineItemData(
        SYS_BUDGET_ID="new",  # This should be ignored since it's not the first run
        EFFECTIVE_DATE="5/22/25",
        REQUESTED_BY="Test Requested",
        HOW_REQUESTED="Test How Requested",
        CHANGE_REASONS="Test Change Reason",
        WHO_UPDATED="Test Who Updated User",
        FISCAL_YEAR="2025",
        CAN="TestCanNumber (TestCanNickname)",
        PROJECT_TITLE="Test Project Title",
        CIG_NAME="Test Contract Agreement Name",
        CIG_TYPE="CONTRACT",
        LINE_DESC="Test Line Description",
        DATE_NEEDED="6/22/25",
        AMOUNT="1234567.89",
        PROC_FEE_AMOUNT="123.45",
        STATUS="PSC",  # This should be converted to IN_EXECUTION
        COMMENTS="Test Comments",
        NEW_VS_CONTINUING="N",
        APPLIED_RESEARCH_VS_EVALUATIVE="AR",
    )

    user = db_with_data.get(User, 1)

    create_models(data, user, db_with_data, False)

    # Expect new BLI in execution to be created
    bli_model = db_with_data.execute(
        select(ContractBudgetLineItem)
        .join(ContractAgreement)
        .where(ContractBudgetLineItem.status == BudgetLineItemStatus.IN_EXECUTION)
    ).scalar_one_or_none()

    assert bli_model is not None
    assert bli_model.agreement_id == 2
    assert bli_model.can_id == 1
    assert bli_model.budget_line_item_type == AgreementType.CONTRACT
    assert bli_model.amount == Decimal("1234567.89")
    assert bli_model.status == BudgetLineItemStatus.IN_EXECUTION

    bli_id = bli_model.id

    # Update test data
    updated_data = BudgetLineItemData(
        SYS_BUDGET_ID=bli_id,
        EFFECTIVE_DATE="5/22/25",
        REQUESTED_BY="Test Requested",
        HOW_REQUESTED="Test How Requested",
        CHANGE_REASONS="Test Change Reason",
        WHO_UPDATED="Test Who Updated User",
        FISCAL_YEAR="2025",
        CAN="TestCanNumber (TestCanNickname)",
        PROJECT_TITLE="Test Project Title",
        CIG_NAME="Test Contract Agreement Name",
        CIG_TYPE="CONTRACT",
        LINE_DESC="Updated Test Line Description",
        DATE_NEEDED="6/22/25",
        AMOUNT="9876543.21",  # This should be updated
        PROC_FEE_AMOUNT="123.45",
        STATUS="COM",  # This should be converted to IN_EXECUTION
        COMMENTS="Updated Test Comments",
        NEW_VS_CONTINUING="N",
        APPLIED_RESEARCH_VS_EVALUATIVE="AR",
    )

    # Run with is_first_time = False
    create_models(updated_data, user, db_with_data, False)

    # Expect updated BLI in execution to be updated
    bli_model = db_with_data.execute(
        select(ContractBudgetLineItem)
        .join(ContractAgreement)
        .where(ContractBudgetLineItem.status == BudgetLineItemStatus.IN_EXECUTION)
    ).scalar_one_or_none()

    assert bli_model is not None
    assert bli_model.id == bli_id
    assert bli_model.agreement_id == 2
    assert bli_model.can_id == 1
    assert bli_model.budget_line_item_type == AgreementType.CONTRACT
    assert bli_model.amount == Decimal("9876543.21")
    assert bli_model.status == BudgetLineItemStatus.IN_EXECUTION

    # Cleanup
    db_with_data.delete(bli_model)
    db_with_data.commit()
    clean_up_db(db_with_data)


def test_main(db_with_data):
    result = CliRunner().invoke(
        main,
        [
            "--env",
            "pytest_data_tools",
            "--type",
            "master_spreadsheet_budget_lines",
            "--input-csv",
            file_path,
            "--first-run",
        ],
    )

    assert result.exit_code == 0

    all_blis = db_with_data.execute(select(BudgetLineItem)).scalars().all()

    assert len(all_blis) == 6

    # Check Grant Budget Line Item
    grant_bli = db_with_data.scalar(
        select(GrantBudgetLineItem).where(
            GrantAgreement.name == "Grant #1: Early Care and Education Leadership Study (ExCELS)"
        )
    )
    assert grant_bli.agreement.awarding_entity_id == db_with_data.scalar(
        select(ProcurementShop.id).where(ProcurementShop.abbr == "PROC1")
    )

    # Cleanup
    db_with_data.delete(grant_bli)
    db_with_data.commit()
    clean_up_db(db_with_data)


def test_create_model_lock_in_proc_shop(db_with_data):
    """
    Test creating a model with a locked-in procurement shop fee (the PROC_SHOP is locked in and the BLI is OBLIGATED).
    """
    data = BudgetLineItemData(
        SYS_BUDGET_ID="new",
        EFFECTIVE_DATE="2/22/25",
        REQUESTED_BY="Test Requested By User",
        HOW_REQUESTED="Test How Requested",
        CHANGE_REASONS="Test Change Reason",
        WHO_UPDATED="Test Who Updated User",
        FISCAL_YEAR="2025",
        CAN="TestCanNumber (TestCanNickname)",
        PROJECT_TITLE="Test Project Title",
        CIG_NAME="Grant #1: Early Care and Education Leadership Study (ExCELS)",
        CIG_TYPE="GRANT",
        LINE_DESC="Test Line Description",
        DATE_NEEDED="3/11/25",
        AMOUNT="15203.08",
        PROC_FEE_AMOUNT="1087.49",
        STATUS="OBL",
        COMMENTS="Test Comments",
        NEW_VS_CONTINUING="N",
        APPLIED_RESEARCH_VS_EVALUATIVE="AR",
        PROC_SHOP="PROC1",
    )

    user = db_with_data.get(User, 1)

    if not user:
        user = User(id=1, email="system.admin@localhost")
        db_with_data.add(user)
        db_with_data.commit()

    create_models(data, user, db_with_data, True)

    bli_model = db_with_data.execute(
        select(GrantBudgetLineItem)
        .join(GrantAgreement)
        .where(GrantAgreement.name == "Grant #1: Early Care and Education Leadership Study (ExCELS)")
    ).scalar_one_or_none()

    # Check data on the created model
    assert bli_model.id != 0
    assert bli_model.agreement_id == 1
    assert bli_model.can_id == 1

    bli_agreement = db_with_data.get(GrantAgreement, 1)
    assert bli_model.agreement == bli_agreement
    assert bli_agreement.awarding_entity_id == db_with_data.scalar(
        select(ProcurementShop.id).where(ProcurementShop.abbr == "PROC1")
    )

    bli_can = db_with_data.get(CAN, 1)
    assert bli_model.can == bli_can

    assert bli_model.budget_line_item_type == AgreementType.GRANT
    assert bli_model.line_description == "Test Line Description"
    assert bli_model.comments == "Test Comments"
    assert bli_model.amount == Decimal("15203.08")
    assert bli_model.status == BudgetLineItemStatus.OBLIGATED
    assert bli_model.date_needed == date(2025, 3, 11)
    assert bli_model.proc_shop_fee_percentage == Decimal("0.07153")
    assert bli_model.created_by == 1

    # get the procurement shop fee id from data.PROC_FEE_AMOUNT, data.AMOUNT, and data.PROC_SHOP
    fee_percentage = calculate_proc_fee_percentage(data.PROC_FEE_AMOUNT, data.AMOUNT) * 100
    expected_procurement_shop_fee_id = db_with_data.scalar(
        select(ProcurementShopFee.id).where(
            ProcurementShopFee.procurement_shop_id == bli_agreement.awarding_entity_id,
            ProcurementShopFee.fee.between(fee_percentage - 0.01, fee_percentage + 0.01),
        )
    )
    assert expected_procurement_shop_fee_id is not None
    assert bli_model.procurement_shop_fee_id == expected_procurement_shop_fee_id

    # Default values
    assert bli_model.on_hold is False
    assert bli_model.certified is False
    assert bli_model.closed is False
    assert bli_model.closed_by is None
    assert bli_model.closed_date is None
    assert bli_model.is_under_current_resolution is False
    assert bli_model.extend_pop_to is None
    assert bli_model.start_date is None
    assert bli_model.end_date is None
    assert bli_model.requisition is None
    assert bli_model.object_class_code_id is None
    assert bli_model.object_class_code is None
    assert bli_model.doc_received is False
    assert bli_model.obligation_date is None

    # Check version records
    assert bli_model.versions[0].id == bli_model.id
    assert bli_model.versions[0].agreement_id == 1
    assert bli_model.versions[0].can_id == 1
    assert bli_model.versions[0].budget_line_item_type == AgreementType.GRANT
    assert bli_model.versions[0].line_description == "Test Line Description"
    assert bli_model.versions[0].comments == "Test Comments"
    assert bli_model.versions[0].amount == Decimal("15203.08")
    assert bli_model.versions[0].status == BudgetLineItemStatus.OBLIGATED
    assert bli_model.versions[0].date_needed == date(2025, 3, 11)
    assert bli_model.versions[0].proc_shop_fee_percentage == Decimal("0.07153")
    assert bli_model.versions[0].procurement_shop_fee_id == expected_procurement_shop_fee_id

    # Check history records
    history_records = (
        db_with_data.execute(
            select(OpsDBHistory)
            .where(OpsDBHistory.row_key == str(bli_model.id))
            .order_by(OpsDBHistory.created_on.desc())
        )
        .scalars()
        .all()
    )

    assert history_records[0].event_type == OpsDBHistoryType.NEW
    assert history_records[0].row_key == str(bli_model.id)

    # Cleanup
    db_with_data.delete(bli_model)
    db_with_data.commit()
    clean_up_db(db_with_data)


def test_create_model_lock_in_proc_shop_fee_not_found(db_with_data):
    """
    Test creating a model with a locked-in procurement shop fee that does not exist.
    """
    data = BudgetLineItemData(
        SYS_BUDGET_ID="new",
        EFFECTIVE_DATE="2/22/25",
        REQUESTED_BY="Test Requested By User",
        HOW_REQUESTED="Test How Requested",
        CHANGE_REASONS="Test Change Reason",
        WHO_UPDATED="Test Who Updated User",
        FISCAL_YEAR="2025",
        CAN="TestCanNumber (TestCanNickname)",
        PROJECT_TITLE="Test Project Title",
        CIG_NAME="Grant #1: Early Care and Education Leadership Study (ExCELS)",
        CIG_TYPE="GRANT",
        LINE_DESC="Test Line Description",
        DATE_NEEDED="3/11/25",
        AMOUNT="15203.08",
        PROC_FEE_AMOUNT="0",
        STATUS="OBL",
        COMMENTS="Test Comments",
        NEW_VS_CONTINUING="N",
        APPLIED_RESEARCH_VS_EVALUATIVE="AR",
        PROC_SHOP="PROC1",
    )

    user = db_with_data.get(User, 1)

    if not user:
        user = User(id=1, email="system.admin@localhost")
        db_with_data.add(user)
        db_with_data.commit()

    create_models(data, user, db_with_data, True)

    bli_model = db_with_data.execute(
        select(GrantBudgetLineItem)
        .join(GrantAgreement)
        .where(GrantAgreement.name == "Grant #1: Early Care and Education Leadership Study (ExCELS)")
    ).scalar_one_or_none()

    # Check data on the created model
    assert bli_model.id != 0
    assert bli_model.agreement_id == 1
    assert bli_model.can_id == 1

    bli_agreement = db_with_data.get(GrantAgreement, 1)
    assert bli_model.agreement == bli_agreement
    assert bli_agreement.awarding_entity_id == db_with_data.scalar(
        select(ProcurementShop.id).where(ProcurementShop.abbr == "PROC1")
    )

    bli_can = db_with_data.get(CAN, 1)
    assert bli_model.can == bli_can

    assert bli_model.budget_line_item_type == AgreementType.GRANT
    assert bli_model.line_description == "Test Line Description"
    assert bli_model.comments == "Test Comments"
    assert bli_model.amount == Decimal("15203.08")
    assert bli_model.status == BudgetLineItemStatus.OBLIGATED
    assert bli_model.date_needed == date(2025, 3, 11)
    assert bli_model.proc_shop_fee_percentage is None  # No fee found, should be None
    assert bli_model.procurement_shop_fee_id is None  # No fee found, should be None
    assert bli_model.created_by == 1

    # Default values
    assert bli_model.on_hold is False
    assert bli_model.certified is False
    assert bli_model.closed is False
    assert bli_model.closed_by is None
    assert bli_model.closed_date is None
    assert bli_model.is_under_current_resolution is False
    assert bli_model.extend_pop_to is None
    assert bli_model.start_date is None
    assert bli_model.end_date is None
    assert bli_model.requisition is None
    assert bli_model.object_class_code_id is None
    assert bli_model.object_class_code is None
    assert bli_model.doc_received is False
    assert bli_model.obligation_date is None

    # Check version records
    assert bli_model.versions[0].id == bli_model.id
    assert bli_model.versions[0].agreement_id == 1
    assert bli_model.versions[0].can_id == 1
    assert bli_model.versions[0].budget_line_item_type == AgreementType.GRANT
    assert bli_model.versions[0].line_description == "Test Line Description"
    assert bli_model.versions[0].comments == "Test Comments"
    assert bli_model.versions[0].amount == Decimal("15203.08")
    assert bli_model.versions[0].status == BudgetLineItemStatus.OBLIGATED
    assert bli_model.versions[0].date_needed == date(2025, 3, 11)
    assert bli_model.versions[0].proc_shop_fee_percentage is None  # No fee found, should be None
    assert bli_model.versions[0].procurement_shop_fee_id is None  # No fee found, should be None

    # Check history records
    history_records = (
        db_with_data.execute(
            select(OpsDBHistory)
            .where(OpsDBHistory.row_key == str(bli_model.id))
            .order_by(OpsDBHistory.created_on.desc())
        )
        .scalars()
        .all()
    )

    assert history_records[0].event_type == OpsDBHistoryType.NEW
    assert history_records[0].row_key == str(bli_model.id)

    # Cleanup
    db_with_data.delete(bli_model)
    db_with_data.commit()
    clean_up_db(db_with_data)


@pytest.fixture()
def db_for_aas(loaded_db):
    """Set up database for AAS tests"""
    # Create project
    project = ResearchProject(title="Test Project")
    loaded_db.add(project)

    # Create requesting agency
    req_agency = AgreementAgency(
        name="HHS",
        abbreviation="HHS",
        requesting=True,
        servicing=False,
        created_on=datetime.now(),
        updated_on=datetime.now(),
    )
    loaded_db.add(req_agency)

    # Create servicing agency
    serv_agency = AgreementAgency(
        name="NSF",
        abbreviation="NSF",
        requesting=False,
        servicing=True,
        created_on=datetime.now(),
        updated_on=datetime.now(),
    )
    loaded_db.add(serv_agency)

    loaded_db.commit()

    yield loaded_db
    loaded_db.rollback()

    # Clean up test data
    loaded_db.execute(text("DELETE FROM grant_agreement"))
    loaded_db.execute(text("DELETE FROM grant_agreement_version"))
    loaded_db.execute(text("DELETE FROM contract_agreement"))
    loaded_db.execute(text("DELETE FROM contract_agreement_version"))
    loaded_db.execute(text("DELETE FROM aa_agreement"))
    loaded_db.execute(text("DELETE FROM aa_agreement_version"))
    loaded_db.execute(text("DELETE FROM agreement"))
    loaded_db.execute(text("DELETE FROM agreement_version"))
    loaded_db.execute(text("DELETE FROM agreement_agency"))
    loaded_db.execute(text("DELETE FROM agreement_agency_version"))
    loaded_db.execute(text("DELETE FROM research_project"))
    loaded_db.execute(text("DELETE FROM research_project_version"))
    loaded_db.execute(text("DELETE FROM project"))
    loaded_db.execute(text("DELETE FROM project_version"))
    loaded_db.execute(text("DELETE FROM ops_event"))
    loaded_db.execute(text("DELETE FROM ops_event_version"))
    loaded_db.execute(text("DELETE FROM ops_user"))
    loaded_db.execute(text("DELETE FROM ops_user_version"))
    loaded_db.execute(text("DELETE FROM ops_db_history"))
    loaded_db.execute(text("DELETE FROM ops_db_history_version"))
    loaded_db.commit()


def test_create_model_for_aa_agreement(db_for_aas):
    """
    Test creating a model for an AA Agreement.
    """
    aa_agreement = AaAgreement(
        name="Test AA Agreement Name",
        requesting_agency=db_for_aas.scalar(select(AgreementAgency).where(AgreementAgency.name == "HHS")),
        servicing_agency=db_for_aas.scalar(select(AgreementAgency).where(AgreementAgency.name == "NSF")),
        service_requirement_type=ServiceRequirementType.SEVERABLE,
    )

    db_for_aas.add(aa_agreement)
    db_for_aas.commit()

    data = BudgetLineItemData(
        SYS_BUDGET_ID="new",
        EFFECTIVE_DATE="2/22/25",
        REQUESTED_BY="Test Requested By User",
        HOW_REQUESTED="Test How Requested",
        CHANGE_REASONS="Test Change Reason",
        WHO_UPDATED="Test Who Updated User",
        FISCAL_YEAR="2025",
        CAN="TestCanNumber (TestCanNickname)",
        PROJECT_TITLE="Test Project Title",
        CIG_NAME="Test AA Agreement Name",
        CIG_TYPE="AA",
        LINE_DESC="Test Line Description",
        DATE_NEEDED="3/11/25",
        AMOUNT="15203.08",
        PROC_FEE_AMOUNT="1087.49",
        STATUS="OPRE - CURRENT",
        COMMENTS="Test Comments",
        NEW_VS_CONTINUING="N",
        APPLIED_RESEARCH_VS_EVALUATIVE="AR",
    )

    user = db_for_aas.get(User, 1)

    if not user:
        user = User(id=1, email="system.admin@localhost")
        db_for_aas.add(user)
        db_for_aas.commit()

    create_models(data, user, db_for_aas, True)

    bli_model = db_for_aas.execute(
        select(AABudgetLineItem).join(AaAgreement).where(AaAgreement.name == "Test AA Agreement Name")
    ).scalar_one_or_none()

    # Check data on the created model
    assert bli_model.id != 0
    assert bli_model.agreement.name == "Test AA Agreement Name"
    assert bli_model.amount == Decimal("15203.08")
    assert bli_model.status == BudgetLineItemStatus.PLANNED

    # Check version records
    assert bli_model.versions[0].id == bli_model.id
    assert bli_model.versions[0].agreement_id == bli_model.agreement_id
    assert bli_model.versions[0].amount == Decimal("15203.08")
    assert bli_model.versions[0].status == BudgetLineItemStatus.PLANNED

    # Check history records
    history_records = (
        db_for_aas.execute(
            select(OpsDBHistory)
            .where(OpsDBHistory.row_key == str(bli_model.id))
            .order_by(OpsDBHistory.created_on.desc())
        )
        .scalars()
        .all()
    )
    assert history_records[0].event_type == OpsDBHistoryType.NEW
    assert history_records[0].row_key == str(bli_model.id)

    # Cleanup
    db_for_aas.delete(bli_model)
    db_for_aas.delete(aa_agreement)
    db_for_aas.commit()
    clean_up_db(db_for_aas)


def test_create_model_for_aa_agreement_upsert(db_for_aas):
    """
    Test creating a model for an AA Agreement and then updating it.
    """
    aa_agreement = AaAgreement(
        name="Test AA Agreement Name",
        requesting_agency=db_for_aas.scalar(select(AgreementAgency).where(AgreementAgency.name == "HHS")),
        servicing_agency=db_for_aas.scalar(select(AgreementAgency).where(AgreementAgency.name == "NSF")),
        service_requirement_type=ServiceRequirementType.SEVERABLE,
    )

    db_for_aas.add(aa_agreement)
    db_for_aas.commit()

    data = BudgetLineItemData(
        SYS_BUDGET_ID="new",
        EFFECTIVE_DATE="2/22/25",
        REQUESTED_BY="Test Requested By User",
        HOW_REQUESTED="Test How Requested",
        CHANGE_REASONS="Test Change Reason",
        WHO_UPDATED="Test Who Updated User",
        FISCAL_YEAR="2025",
        CAN="TestCanNumber (TestCanNickname)",
        PROJECT_TITLE="Test Project Title",
        CIG_NAME="Test AA Agreement Name",
        CIG_TYPE="AA",
        LINE_DESC="Test Line Description",
        DATE_NEEDED="3/11/25",
        AMOUNT="15203.08",
        PROC_FEE_AMOUNT="1087.49",
        STATUS="OPRE - CURRENT",
        COMMENTS="Test Comments",
        NEW_VS_CONTINUING="N",
        APPLIED_RESEARCH_VS_EVALUATIVE="AR",
    )

    user = db_for_aas.get(User, 1)

    if not user:
        user = User(id=1, email="system.admin@localhost")
        db_for_aas.add(user)
        db_for_aas.commit()

    create_models(data, user, db_for_aas, True)

    bli_model = db_for_aas.execute(
        select(AABudgetLineItem).join(AaAgreement).where(AaAgreement.name == "Test AA Agreement Name")
    ).scalar_one_or_none()
    bli_id = bli_model.id

    # Check data on the created model
    assert bli_model.id != 0
    assert bli_model.agreement.name == "Test AA Agreement Name"
    assert bli_model.amount == Decimal("15203.08")
    assert bli_model.status == BudgetLineItemStatus.PLANNED

    # Check version records
    assert bli_model.versions[0].id == bli_model.id
    assert bli_model.versions[0].agreement_id == bli_model.agreement_id
    assert bli_model.versions[0].amount == Decimal("15203.08")
    assert bli_model.versions[0].status == BudgetLineItemStatus.PLANNED

    # Update data
    updated_data = BudgetLineItemData(
        SYS_BUDGET_ID=bli_id,
        EFFECTIVE_DATE="2/22/25",
        REQUESTED_BY="Test Requested By User",
        HOW_REQUESTED="Test How Requested",
        CHANGE_REASONS="Test Change Reason",
        WHO_UPDATED="Test Who Updated User",
        FISCAL_YEAR="2025",
        CAN="TestCanNumber (TestCanNickname)",
        PROJECT_TITLE="Test Project Title",
        CIG_NAME="Test AA Agreement Name",
        CIG_TYPE="AA",
        LINE_DESC="Updated Test Line Description",
        DATE_NEEDED="3/11/25",
        AMOUNT="25000.00",  # Updated amount
        PROC_FEE_AMOUNT="1087.49",
        STATUS="OPRE - CURRENT",
        COMMENTS="Updated Test Comments",
        NEW_VS_CONTINUING="N",
        APPLIED_RESEARCH_VS_EVALUATIVE="AR",
    )

    create_models(updated_data, user, db_for_aas, False)

    updated_bli_model = db_for_aas.get(AABudgetLineItem, bli_id)
    assert updated_bli_model is not None
    assert updated_bli_model.id == bli_id
    assert updated_bli_model.amount == Decimal("25000.00")
    assert updated_bli_model.comments == "Updated Test Comments"
    assert updated_bli_model.line_description == "Updated Test Line Description"
    assert updated_bli_model.updated_by == 1

    # Check version records after update
    assert len(list(updated_bli_model.versions)) == 2
    assert updated_bli_model.versions[0].id == bli_id
    assert updated_bli_model.versions[0].agreement_id == updated_bli_model.agreement_id
    assert updated_bli_model.versions[0].amount == Decimal("15203.08")
    assert updated_bli_model.versions[0].status == BudgetLineItemStatus.PLANNED
    assert updated_bli_model.versions[1].id == bli_id
    assert updated_bli_model.versions[1].agreement_id == updated_bli_model.agreement_id
    assert updated_bli_model.versions[1].amount == Decimal("25000.00")
    assert updated_bli_model.versions[1].status == BudgetLineItemStatus.PLANNED

    # Cleanup
    db_for_aas.delete(updated_bli_model)
    db_for_aas.delete(aa_agreement)
    db_for_aas.commit()
    clean_up_db(db_for_aas)
