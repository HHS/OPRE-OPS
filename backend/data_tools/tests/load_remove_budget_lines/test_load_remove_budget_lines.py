import csv
from datetime import date
from decimal import Decimal

import pytest
from click.testing import CliRunner
from sqlalchemy import select, text

from data_tools.src.load_data import main
from data_tools.src.load_remove_budget_lines.utils import (
    BudgetLineItemData,
    create_budget_line_item_data,
    create_models,
    validate_data,
)
from data_tools.tests.conftest import loaded_db
from models import (
    CAN,
    AgreementType,
    BudgetLineItem,
    BudgetLineItemStatus,
    ContractAgreement,
    ContractBudgetLineItem,
    DirectObligationBudgetLineItem,
    Division,
    GrantAgreement,
    GrantBudgetLineItem,
    IAABudgetLineItem,
    OpsEvent,
    OpsEventType,
    Portfolio,
    User,
)

file_path = "test_csv/budget_line_items_to_delete.tsv"


def test_create_budget_line_data():
    test_data = list(csv.DictReader(open(file_path), dialect="excel-tab"))

    # Check record count
    assert len(test_data) == 6
    record = test_data[0]

    # Create data object
    data = create_budget_line_item_data(record)

    # Check data object
    assert data.EFFECTIVE_DATE == "2/22/2025"
    assert data.REQUESTED_BY == "T. Nguyen"
    assert data.HOW_REQUESTED == "Email"
    assert data.CHANGE_REASONS == "Per Apocalypse"
    assert data.WHO_UPDATED == "L. Garcia"
    assert data.FISCAL_YEAR == "2025"
    assert data.CAN == "G99AB14 (IAA-Incoming-Extra)"
    assert data.SYS_BUDGET_ID == 15000
    assert data.PROJECT_TITLE == "Human Services Interoperability Support"
    assert data.CIG_NAME == "Contract #1: African American Child and Family Research Center"
    assert data.CIG_TYPE == "Contract"
    assert data.LINE_DESC == "Software Licensing"
    assert data.DATE_NEEDED == "3/11/2025"
    assert data.AMOUNT == "15203.08"
    assert data.PROC_FEE_AMOUNT == "1087.49"
    assert data.STATUS == "OPRE - CURRENT"
    assert data.COMMENTS == "Requires revision"
    assert data.NEW_VS_CONTINUING == "N"
    assert data.APPLIED_RESEARCH_VS_EVALUATIVE == "AR"


def test_validate_data():
    test_data = list(csv.DictReader(open(file_path), dialect="excel-tab"))
    assert len(test_data) == 6
    count = sum(1 for data in test_data if validate_data(create_budget_line_item_data(data)))
    assert count == 6


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

    # Create test CAN
    can = loaded_db.get(CAN, 1)
    if not can:
        can = CAN(
            id=1,
            number="G99AB14",
            portfolio_id=1,
        )
    loaded_db.add(can)
    loaded_db.commit()

    # Create test agreements
    contract_agreement = ContractAgreement(
        name="Contract #1: African American Child and Family Research Center",
        agreement_type=AgreementType.CONTRACT,
    )
    loaded_db.add(contract_agreement)
    loaded_db.commit()

    grant_agreement = GrantAgreement(
        name="Grant #1: Early Care and Education Leadership Study (ExCELS)",
        agreement_type=AgreementType.GRANT,
    )
    loaded_db.add(grant_agreement)
    loaded_db.commit()

    # Create test budget line items to delete
    budget_line_items = [
        ContractBudgetLineItem(
            id=15000,
            agreement_id=contract_agreement.id,
            can_id=1,
            budget_line_item_type=AgreementType.CONTRACT,
            line_description="Software Licensing",
            comments="Requires revision",
            amount=Decimal("15203.08"),
            status=BudgetLineItemStatus.PLANNED,
            date_needed=date(2025, 3, 11),
            proc_shop_fee_percentage=Decimal("0.07153"),
        ),
        GrantBudgetLineItem(
            id=15001,
            agreement_id=grant_agreement.id,
            can_id=1,
            budget_line_item_type=AgreementType.GRANT,
            line_description="Consulting Services",
            comments="All documents submitted",
            amount=Decimal("73364.08"),
            status=BudgetLineItemStatus.PLANNED,
            date_needed=date(2025, 2, 17),
            proc_shop_fee_percentage=Decimal("0.0091"),
        ),
        IAABudgetLineItem(
            id=15002,
            agreement_id=grant_agreement.id,
            can_id=1,
            budget_line_item_type=AgreementType.IAA,
            line_description="Consulting Services",
            comments="per OPS - DOI Spreadsheet",
            amount=Decimal("10216.43"),
            status=BudgetLineItemStatus.PLANNED,
            date_needed=date(2025, 1, 28),
            proc_shop_fee_percentage=Decimal("0.4615"),
        ),
        DirectObligationBudgetLineItem(
            id=15003,
            agreement_id=contract_agreement.id,
            can_id=1,
            budget_line_item_type=AgreementType.DIRECT_OBLIGATION,
            line_description="Personnel",
            comments="Per Hilary B. Email 1/1/25",
            amount=Decimal("35558.43"),
            status=BudgetLineItemStatus.PLANNED,
            date_needed=date(2025, 4, 11),
            proc_shop_fee_percentage=Decimal("0.082"),
        ),
        DirectObligationBudgetLineItem(
            id=15004,
            agreement_id=contract_agreement.id,
            can_id=1,
            budget_line_item_type=AgreementType.DIRECT_OBLIGATION,
            line_description="Personnel",
            comments="per new contract spreadsheet 4/16/25",
            amount=Decimal("35558.43"),
            status=BudgetLineItemStatus.PLANNED,
            date_needed=date(2025, 4, 11),
            proc_shop_fee_percentage=Decimal("0.082"),
        ),
        ContractBudgetLineItem(
            id=15005,
            agreement_id=contract_agreement.id,
            can_id=1,
            budget_line_item_type=AgreementType.CONTRACT,
            line_description="Software Development",
            comments="New contract per leadership approval 4/8/25",
            amount=Decimal("42750.00"),
            status=BudgetLineItemStatus.PLANNED,
            date_needed=date(2025, 5, 15),
            proc_shop_fee_percentage=Decimal("0.0737"),
        ),
    ]

    for bli in budget_line_items:
        # Check if the BLI already exists
        existing_bli = loaded_db.get(BudgetLineItem, bli.id)
        if not existing_bli:
            loaded_db.add(bli)
    loaded_db.commit()

    # Create test user
    test_user = loaded_db.get(User, 1)
    if not test_user:
        test_user = User(id=1, email="system.admin@localhost")
        loaded_db.add(test_user)
        loaded_db.commit()

    yield loaded_db

    loaded_db.execute(text("DELETE FROM ops_event"))
    loaded_db.execute(text("DELETE FROM ops_db_history"))

    loaded_db.commit()
    loaded_db.delete(contract_agreement)
    loaded_db.delete(grant_agreement)
    loaded_db.commit()
    # Clean up test data
    loaded_db.delete(can)
    loaded_db.commit()
    # Clean up test data
    loaded_db.delete(portfolio)
    loaded_db.commit()
    loaded_db.delete(division)
    loaded_db.commit()


def test_create_model_delete(db_with_data):
    # First query to verify the data was properly loaded
    all_blis = db_with_data.execute(select(BudgetLineItem)).scalars().all()
    print(f"Total BLIs in database: {len(all_blis)}")  # Debug output

    # Verify the BLI exists before deletion - use explicit query instead of get
    bli_id = 15000
    bli = db_with_data.execute(select(BudgetLineItem).where(BudgetLineItem.id == bli_id)).scalar_one_or_none()

    assert bli is not None, f"BLI with ID {bli_id} not found in database. Available IDs: {[b.id for b in all_blis]}"

    # Verify the BLI exists before deletion
    bli_id = 15000
    bli = db_with_data.get(BudgetLineItem, bli_id)
    assert bli is not None

    data = BudgetLineItemData(SYS_BUDGET_ID=bli_id)
    user = db_with_data.get(User, 1)

    # Delete the BLI
    create_models(data, user, db_with_data)

    # Verify the BLI no longer exists
    deleted_bli = db_with_data.get(BudgetLineItem, bli_id)
    assert deleted_bli is None

    # Check if an OPS event was created
    ops_event = db_with_data.execute(
        select(OpsEvent).where(OpsEvent.event_type == OpsEventType.DELETE_BLI)
    ).scalar_one_or_none()

    assert ops_event is not None
    assert ops_event.event_type == OpsEventType.DELETE_BLI
    assert ops_event.created_by == 1
    assert "deleted_bli" in ops_event.event_details
    assert ops_event.event_details["deleted_bli"]["id"] == bli_id


def test_create_model_delete_nonexistent_bli(db_with_data):
    # Try to delete a BLI that doesn't exist
    non_existent_id = 99999
    data = BudgetLineItemData(SYS_BUDGET_ID=non_existent_id)
    user = db_with_data.get(User, 1)

    # Should raise an error
    with pytest.raises(ValueError, match=f"BudgetLineItem with SYS_BUDGET_ID {non_existent_id} not found."):
        create_models(data, user, db_with_data)


def test_delete_all_budget_types(db_with_data):
    # Verify initial count of BLIs
    initial_count = db_with_data.execute(select(BudgetLineItem)).scalars().all()
    assert len(initial_count) == 6

    # Create data for each BLI type
    bli_ids = [15000, 15001, 15002, 15003]
    data_list = [BudgetLineItemData(SYS_BUDGET_ID=id) for id in bli_ids]

    user = db_with_data.get(User, 1)

    # Delete each BLI type
    for data in data_list:
        create_models(data, user, db_with_data)

    # Verify remaining count
    remaining = db_with_data.execute(select(BudgetLineItem)).scalars().all()
    assert len(remaining) == 2  # Started with 6, deleted 4

    # Verify specific IDs were deleted
    for bli_id in bli_ids:
        bli = db_with_data.get(BudgetLineItem, bli_id)
        assert bli is None


def test_main_cli(db_with_data):
    # Initial count of BLIs
    initial_count = len(db_with_data.execute(select(BudgetLineItem)).scalars().all())
    assert initial_count == 6

    # Run the CLI command
    result = CliRunner().invoke(
        main, ["--env", "pytest_data_tools", "--type", "remove_budget_lines", "--input-csv", file_path]
    )

    assert result.exit_code == 0

    # Refresh the session to avoid deferred loading issues
    db_with_data.expire_all()

    # Final count of BLIs should be 1 since 6 are in the delete file
    final_count = len(db_with_data.execute(select(BudgetLineItem)).scalars().all())
    assert final_count == initial_count - 6

    # Check that OPS events were created (one per deleted BLI)
    ops_events = (
        db_with_data.execute(select(OpsEvent).where(OpsEvent.event_type == OpsEventType.DELETE_BLI)).scalars().all()
    )

    assert len(ops_events) == 6

    # Verify event details
    for event in ops_events:
        assert event.event_type == OpsEventType.DELETE_BLI
        assert "deleted_bli" in event.event_details
