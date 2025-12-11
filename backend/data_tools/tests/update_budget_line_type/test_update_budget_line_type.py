import csv
from datetime import date
from decimal import Decimal

import pytest
from click.testing import CliRunner
from sqlalchemy import select, text

from data_tools.src.load_data import main
from data_tools.src.update_budget_line_type.utils import (
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
    DirectAgreement,
    DirectObligationBudgetLineItem,
    Division,
    GrantAgreement,
    GrantBudgetLineItem,
    IaaAgreement,
    IAABudgetLineItem,
    IAADirectionType,
    OpsEvent,
    OpsEventType,
    Portfolio,
    User,
)

file_path = "test_csv/budget_line_items_to_update.tsv"


def test_create_budget_line_data():
    test_data = list(csv.DictReader(open(file_path), dialect="excel-tab"))

    # Check record count
    assert len(test_data) == 6
    record = test_data[0]

    # Create data object
    data = create_budget_line_item_data(record)

    # Check data object
    assert data.SYS_BUDGET_ID == 15000
    assert data.CIG_TYPE == AgreementType.GRANT


def test_validate_data():
    test_data = list(csv.DictReader(open(file_path), dialect="excel-tab"))
    assert len(test_data) == 6
    count = sum(1 for data in test_data if validate_data(create_budget_line_item_data(data)))
    assert count == 6


def test_create_models_no_sys_budget_id():
    with pytest.raises(ValueError):
        BudgetLineItemData(
            SYS_BUDGET_ID=None,
            CIG_TYPE="contract",
        )


def test_create_models_no_cig_type():
    with pytest.raises(ValueError):
        BudgetLineItemData(
            SYS_BUDGET_ID=15000,
            CIG_TYPE=None,
        )


def test_create_models_invalid_cig_type():
    with pytest.raises(ValueError):
        BudgetLineItemData(
            SYS_BUDGET_ID=15000,
            CIG_TYPE="invalid_type",
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
        name="Contract #1: Research Center",
        agreement_type=AgreementType.CONTRACT,
    )
    loaded_db.add(contract_agreement)
    loaded_db.commit()

    grant_agreement = GrantAgreement(
        name="Grant #1: Education Study",
        agreement_type=AgreementType.GRANT,
    )
    loaded_db.add(grant_agreement)
    loaded_db.commit()

    iaa_agreement = IaaAgreement(
        name="IAA #1: Interagency Agreement",
        agreement_type=AgreementType.IAA,
        direction=IAADirectionType.OUTGOING,
    )
    loaded_db.add(iaa_agreement)
    loaded_db.commit()

    do_agreement = DirectAgreement(
        name="Direct Obligation #1: Direct Purchase",
        agreement_type=AgreementType.DIRECT_OBLIGATION,
    )

    loaded_db.add(do_agreement)
    loaded_db.commit()

    # Create test budget line items to update
    budget_line_items = [
        # Contract BLI that will be updated to Grant
        ContractBudgetLineItem(
            id=15000,
            agreement_id=grant_agreement.id,
            can_id=1,
            budget_line_item_type=AgreementType.CONTRACT,
            line_description="Software Licensing",
            comments="Convert to grant",
            amount=Decimal("15203.08"),
            status=BudgetLineItemStatus.PLANNED,
            date_needed=date(2025, 3, 11),
            proc_shop_fee_percentage=Decimal("0.07153"),
        ),
        # Grant BLI that will be updated to IAA
        GrantBudgetLineItem(
            id=15001,
            agreement_id=iaa_agreement.id,
            can_id=1,
            budget_line_item_type=AgreementType.GRANT,
            line_description="Consulting Services",
            comments="Convert to IAA",
            amount=Decimal("73364.08"),
            status=BudgetLineItemStatus.PLANNED,
            date_needed=date(2025, 2, 17),
            proc_shop_fee_percentage=Decimal("0.0091"),
        ),
        # IAA BLI that will be updated to Direct Obligation
        IAABudgetLineItem(
            id=15002,
            agreement_id=do_agreement.id,
            can_id=1,
            budget_line_item_type=AgreementType.IAA,
            line_description="Consulting Services",
            comments="Convert to direct obligation",
            amount=Decimal("10216.43"),
            status=BudgetLineItemStatus.PLANNED,
            date_needed=date(2025, 1, 28),
            proc_shop_fee_percentage=Decimal("0.4615"),
        ),
        # Direct Obligation BLI that will be updated to Contract
        DirectObligationBudgetLineItem(
            id=15003,
            agreement_id=contract_agreement.id,
            can_id=1,
            budget_line_item_type=AgreementType.DIRECT_OBLIGATION,
            line_description="Personnel",
            comments="Convert to contract",
            amount=Decimal("35558.43"),
            status=BudgetLineItemStatus.PLANNED,
            date_needed=date(2025, 4, 11),
            proc_shop_fee_percentage=Decimal("0.082"),
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

    # Clean up ops events
    loaded_db.execute(text("DELETE FROM ops_event"))
    loaded_db.commit()

    # Clean up budget line items
    loaded_db.execute(text("DELETE FROM contract_budget_line_item"))
    loaded_db.execute(text("DELETE FROM grant_budget_line_item"))
    loaded_db.execute(text("DELETE FROM iaa_budget_line_item"))
    loaded_db.execute(text("DELETE FROM direct_obligation_budget_line_item"))
    loaded_db.execute(text("DELETE FROM budget_line_item"))
    loaded_db.commit()

    # Clean up agreements
    loaded_db.delete(contract_agreement)
    loaded_db.delete(grant_agreement)
    loaded_db.delete(iaa_agreement)
    loaded_db.delete(do_agreement)
    loaded_db.commit()

    # Clean up other test data
    loaded_db.delete(can)
    loaded_db.commit()
    loaded_db.delete(portfolio)
    loaded_db.commit()
    loaded_db.delete(division)
    loaded_db.commit()


def test_convert_contract_to_grant(db_with_data):
    # Get the contract BLI
    bli_id = 15000
    bli = db_with_data.get(BudgetLineItem, bli_id)
    assert bli is not None
    assert isinstance(bli, ContractBudgetLineItem)

    # Prepare data to convert to Grant
    data = BudgetLineItemData(SYS_BUDGET_ID=bli_id, CIG_TYPE="grant")
    user = db_with_data.get(User, 1)

    # Convert the BLI type
    create_models(data, user, db_with_data)

    # Verify the type was changed
    updated_bli = db_with_data.get(BudgetLineItem, bli_id)
    assert updated_bli is not None
    assert isinstance(updated_bli, GrantBudgetLineItem)
    assert updated_bli.budget_line_item_type == AgreementType.GRANT

    # Check if an OPS event was created
    ops_event = db_with_data.execute(
        select(OpsEvent).where(OpsEvent.event_type == OpsEventType.UPDATE_BLI)
    ).scalar_one_or_none()

    assert ops_event is not None
    assert ops_event.event_type == OpsEventType.UPDATE_BLI
    assert ops_event.created_by == 1
    assert ops_event.event_details["budget_line_item_id"] == bli_id
    assert ops_event.event_details["original_type"] == "CONTRACT"
    assert ops_event.event_details["new_type"] == "GRANT"


def test_convert_grant_to_iaa(db_with_data):
    # Get the grant BLI
    bli_id = 15001
    bli = db_with_data.get(BudgetLineItem, bli_id)
    assert bli is not None
    assert isinstance(bli, GrantBudgetLineItem)

    # Prepare data to convert to IAA
    data = BudgetLineItemData(SYS_BUDGET_ID=bli_id, CIG_TYPE="iaa")
    user = db_with_data.get(User, 1)

    # Convert the BLI type
    create_models(data, user, db_with_data)

    # Verify the type was changed
    updated_bli = db_with_data.get(BudgetLineItem, bli_id)
    assert updated_bli is not None
    assert isinstance(updated_bli, IAABudgetLineItem)
    assert updated_bli.budget_line_item_type == AgreementType.IAA


def test_convert_iaa_to_direct_obligation(db_with_data):
    # Get the IAA BLI
    bli_id = 15002
    bli = db_with_data.get(BudgetLineItem, bli_id)
    assert bli is not None
    assert isinstance(bli, IAABudgetLineItem)

    # Prepare data to convert to Direct Obligation
    data = BudgetLineItemData(SYS_BUDGET_ID=bli_id, CIG_TYPE="direct obligation")
    user = db_with_data.get(User, 1)

    # Convert the BLI type
    create_models(data, user, db_with_data)

    # Verify the type was changed
    updated_bli = db_with_data.get(BudgetLineItem, bli_id)
    assert updated_bli is not None
    assert isinstance(updated_bli, DirectObligationBudgetLineItem)
    assert updated_bli.budget_line_item_type == AgreementType.DIRECT_OBLIGATION


def test_convert_direct_obligation_to_contract(db_with_data):
    # Get the Direct Obligation BLI
    bli_id = 15003
    bli = db_with_data.get(BudgetLineItem, bli_id)
    assert bli is not None
    assert isinstance(bli, DirectObligationBudgetLineItem)

    # Prepare data to convert to Contract
    data = BudgetLineItemData(SYS_BUDGET_ID=bli_id, CIG_TYPE="contract")
    user = db_with_data.get(User, 1)

    # Convert the BLI type
    create_models(data, user, db_with_data)

    # Verify the type was changed
    updated_bli = db_with_data.get(BudgetLineItem, bli_id)
    assert updated_bli is not None
    assert isinstance(updated_bli, ContractBudgetLineItem)
    assert updated_bli.budget_line_item_type == AgreementType.CONTRACT


def test_create_model_nonexistent_bli(db_with_data):
    # Try to update a BLI that doesn't exist
    non_existent_id = 99999
    data = BudgetLineItemData(SYS_BUDGET_ID=non_existent_id, CIG_TYPE="contract")
    user = db_with_data.get(User, 1)

    create_models(data, user, db_with_data)

    # Test that no event records were created
    ops_events = (
        db_with_data.execute(select(OpsEvent).where(OpsEvent.event_type == OpsEventType.UPDATE_BLI)).scalars().all()
    )
    assert len(ops_events) == 0


def test_no_change_if_already_correct_type(db_with_data):
    # Get a contract BLI
    bli_id = 15000
    bli = db_with_data.get(BudgetLineItem, bli_id)
    assert bli is not None
    assert isinstance(bli, ContractBudgetLineItem)

    # Try to "update" to the same type
    data = BudgetLineItemData(SYS_BUDGET_ID=bli_id, CIG_TYPE="contract")
    user = db_with_data.get(User, 1)

    # Get the original count of ops events
    original_event_count = db_with_data.execute(
        select(OpsEvent).where(OpsEvent.event_type == OpsEventType.UPDATE_BLI)
    ).all()

    # Update the BLI type (which should not change)
    create_models(data, user, db_with_data)

    # Verify the type was not changed
    updated_bli = db_with_data.get(BudgetLineItem, bli_id)
    assert updated_bli is not None
    assert isinstance(updated_bli, ContractBudgetLineItem)

    # Verify no new ops event was created
    new_event_count = db_with_data.execute(select(OpsEvent).where(OpsEvent.event_type == OpsEventType.UPDATE_BLI)).all()
    assert len(new_event_count) == len(original_event_count)


def test_main_cli(db_with_data):
    # Initial types
    initial_types = {}
    for bli_id in range(15000, 15004):
        bli = db_with_data.get(BudgetLineItem, bli_id)
        initial_types[bli_id] = bli.__class__

    # Run the CLI command
    result = CliRunner().invoke(
        main, ["--env", "pytest_data_tools", "--type", "update_budget_line_type", "--input-csv", file_path]
    )

    assert result.exit_code == 0

    # Refresh the session to avoid deferred loading issues
    db_with_data.expire_all()

    # Verify types have changed
    # BLI 15000: ContractBudgetLineItem -> GrantBudgetLineItem
    assert isinstance(db_with_data.get(BudgetLineItem, 15000), GrantBudgetLineItem)
    # BLI 15001: GrantBudgetLineItem -> IAABudgetLineItem
    assert isinstance(db_with_data.get(BudgetLineItem, 15001), IAABudgetLineItem)
    # BLI 15002: IAABudgetLineItem -> DirectObligationBudgetLineItem
    assert isinstance(db_with_data.get(BudgetLineItem, 15002), DirectObligationBudgetLineItem)
    # BLI 15003: DirectObligationBudgetLineItem -> ContractBudgetLineItem
    assert isinstance(db_with_data.get(BudgetLineItem, 15003), ContractBudgetLineItem)

    # Check that OPS events were created (one per updated BLI)
    ops_events = (
        db_with_data.execute(select(OpsEvent).where(OpsEvent.event_type == OpsEventType.UPDATE_BLI)).scalars().all()
    )

    assert len(ops_events) == 4

    # Verify event details
    for event in ops_events:
        assert event.event_type == OpsEventType.UPDATE_BLI
        assert "budget_line_item_id" in event.event_details
        assert "original_type" in event.event_details
        assert "new_type" in event.event_details
