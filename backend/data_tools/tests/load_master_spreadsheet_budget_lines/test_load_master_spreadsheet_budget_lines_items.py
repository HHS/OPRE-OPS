import csv
import os
from datetime import date
from decimal import Decimal

import pytest
from click.testing import CliRunner
from data_tools.src.load_data import main
from data_tools.src.load_master_spreadsheet_budget_lines.utils import (
    BudgetLineItemData,
    calculate_proc_fee_percentage,
    create_budget_line_item_data,
    create_models,
    get_bli_status,
    validate_data,
    verify_and_log_project_title,
)
from data_tools.tests.conftest import loaded_db
from sqlalchemy import select, text

from models import (
    CAN,
    Agreement,
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
    User,
)

file_path = os.path.join(os.path.dirname(__file__), "../../test_csv/master_spreadsheet_budget_lines.tsv")


@pytest.mark.parametrize(
    "pro_fee_amount, amount, expected_result",
    [
        (Decimal("1087.49"), Decimal("15203.08"), Decimal("0.07153")),
        (Decimal("100.00"), Decimal("0.00"), None),
        (Decimal("0.00"), Decimal("5000.00"), None),
        (None, Decimal("1000.00"), None),
        (Decimal("100.00"), None, None),
        (None, None, None),
        (Decimal("1"), Decimal("3"), Decimal("0.33333")),
    ],
)
def test_calculate_proc_fee_percentage(pro_fee_amount, amount, expected_result):
    result = calculate_proc_fee_percentage(pro_fee_amount, amount)
    assert result == expected_result


@pytest.mark.parametrize(
    "status_input, expected_status",
    [
        ("OPRE - CURRENT", BudgetLineItemStatus.PLANNED),
        ("PSC - EXECUTION", BudgetLineItemStatus.IN_EXECUTION),
        ("OBL", BudgetLineItemStatus.OBLIGATED),
        ("COM", BudgetLineItemStatus.IN_EXECUTION),
        ("unknown", None),
        ("", None),
        (None, None),
    ],
)
def test_get_bli_status(status_input, expected_status):
    assert get_bli_status(status_input) == expected_status


def test_verify_project_title_missing_project_id_logs_warning(db_with_data):
    bli_data = BudgetLineItemData(SYS_BUDGET_ID=1)
    result = verify_and_log_project_title(bli_data, db_with_data, None)
    assert result is None


def test_create_budget_line_data():
    test_data = list(csv.DictReader(open(file_path), dialect="excel-tab"))

    # Check record count
    assert len(test_data) == 7
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
    assert len(test_data) == 7
    count = sum(1 for data in test_data if validate_data(create_budget_line_item_data(data)))
    assert count == 7


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

    # Create test agreements
    g_agreement = loaded_db.get(GrantAgreement, 1)
    if not g_agreement:
        grant_agreement = GrantAgreement(
            id=1,
            name="Test Grant Agreement Name",
            agreement_type=AgreementType.GRANT,
        )
        loaded_db.add(grant_agreement)
    else:
        g_agreement.name = "Test Grant Agreement Name"
        g_agreement.agreement_type = AgreementType.GRANT
        loaded_db.add(g_agreement)
    loaded_db.commit()

    c_agreement = loaded_db.get(Agreement, 2)
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
    loaded_db.commit()


def clean_up_db(db_with_data):
    yield db_with_data
    db_with_data.rollback()

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

    db_with_data.execute(text("DELETE FROM grant_agreement_version"))
    db_with_data.execute(text("DELETE FROM grant_agreement"))

    db_with_data.execute(text("DELETE FROM contract_agreement"))
    db_with_data.execute(text("DELETE FROM contract_agreement_version"))

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
        SYS_BUDGET_ID=15240,
        EFFECTIVE_DATE="2/22/25",
        REQUESTED_BY="Test Requested By User",
        HOW_REQUESTED="Test How Requested",
        CHANGE_REASONS="Test Change Reason",
        WHO_UPDATED="Test Who Updated User",
        FISCAL_YEAR="2025",
        CAN="TestCanNumber (TestCanNickname)",
        PROJECT_TITLE="Test Project Title",
        CIG_NAME="Test Grant Agreement Name",
        CIG_TYPE="GRANT",
        LINE_DESC="Test Line Description",
        DATE_NEEDED="3/11/25",
        AMOUNT="15203.08",
        PROC_FEE_AMOUNT="1087.49",
        STATUS="OPRE - CURRENT",
        COMMENTS="Test Comments",
        NEW_VS_CONTINUING="N",
        APPLIED_RESEARCH_VS_EVALUATIVE="AR",
    )

    test_sys_user = User(id=1, email="system.admin@localhost")
    db_with_data.add(test_sys_user)
    db_with_data.commit()

    user = db_with_data.get(User, 1)

    create_models(data, user, db_with_data, True)

    bli_model = db_with_data.execute(
        select(GrantBudgetLineItem)
        .join(GrantAgreement)
        .where(GrantAgreement.id == 1)
        .where(GrantAgreement.name == "Test Grant Agreement Name")
    ).scalar_one_or_none()

    # Check data on the created model
    assert bli_model.id != 15240
    assert bli_model.agreement_id == 1
    assert bli_model.can_id == 1

    bli_agreement = db_with_data.get(GrantAgreement, 1)
    assert bli_model.agreement == bli_agreement

    bli_can = db_with_data.get(CAN, 1)
    assert bli_model.can == bli_can

    assert bli_model.budget_line_item_type == AgreementType.GRANT
    assert bli_model.line_description == "Test Line Description"
    assert bli_model.comments == "Test Comments"
    assert bli_model.amount == Decimal("15203.08")
    assert bli_model.status == BudgetLineItemStatus.PLANNED
    assert bli_model.date_needed == date(2025, 3, 11)
    assert bli_model.proc_shop_fee_percentage == Decimal("0.07153")
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
    clean_up_db(db_with_data)


def test_create_model_upsert(db_with_data):
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

    assert len(all_blis) == 7

    # Cleanup
    clean_up_db(db_with_data)
