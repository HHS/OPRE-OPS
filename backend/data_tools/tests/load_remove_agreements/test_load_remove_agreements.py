import csv

import pytest
from click.testing import CliRunner
from data_tools.src.load_data import main
from data_tools.src.load_remove_agreements.utils import (
    AgreementData,
    create_agreement_data,
    create_models,
    validate_all,
    validate_data,
)
from data_tools.tests.conftest import loaded_db
from sqlalchemy import text

from models import *

file_path = "test_csv/agreements_to_remove.tsv"


def test_create_agreement_data():
    test_data = list(csv.DictReader(open(file_path), dialect="excel-tab"))

    # Check record count
    assert len(test_data) == 5
    record = test_data[0]

    # Create data object
    data = create_agreement_data(record)

    # Check data object
    assert data.AGREEMENT_NAME == "Test Agreement 1"
    assert data.AGREEMENT_TYPE == "contract"


def test_validate_data():
    # Test valid data
    data = AgreementData(AGREEMENT_NAME="Test Agreement", AGREEMENT_TYPE="contract")
    assert validate_data(data) is True

    # Test with empty name
    with pytest.raises(ValueError):
        AgreementData(AGREEMENT_NAME="", AGREEMENT_TYPE="contract")

    # Test with empty type
    with pytest.raises(ValueError):
        AgreementData(AGREEMENT_NAME="Test Agreement", AGREEMENT_TYPE="")


def test_validate_all():
    valid_data = [
        AgreementData(AGREEMENT_NAME="Test 1", AGREEMENT_TYPE="contract"),
        AgreementData(AGREEMENT_NAME="Test 2", AGREEMENT_TYPE="grant"),
    ]
    assert validate_all(valid_data) is True


def test_create_agreement_data_validation():
    with pytest.raises(ValueError):
        AgreementData(AGREEMENT_NAME="", AGREEMENT_TYPE="contract")

    with pytest.raises(ValueError):
        AgreementData(AGREEMENT_NAME="Test", AGREEMENT_TYPE="")


@pytest.fixture()
def db_with_agreements(loaded_db):
    # Delete all agreements before starting
    loaded_db.execute(text("DELETE FROM grant_agreement"))
    loaded_db.execute(text("DELETE FROM grant_agreement_version"))

    loaded_db.execute(text("DELETE FROM contract_agreement"))
    loaded_db.execute(text("DELETE FROM contract_agreement_version"))

    loaded_db.execute(text("DELETE FROM iaa_agreement"))
    loaded_db.execute(text("DELETE FROM iaa_agreement_version"))

    loaded_db.execute(text("DELETE FROM aa_agreement"))
    loaded_db.execute(text("DELETE FROM aa_agreement_version"))

    loaded_db.execute(text("DELETE FROM direct_agreement"))
    loaded_db.execute(text("DELETE FROM direct_agreement_version"))

    loaded_db.execute(text("DELETE FROM agreement"))
    loaded_db.execute(text("DELETE FROM agreement_version"))

    # Create test agreements of different types
    agreements = [
        ContractAgreement(
            name="Test Agreement 1",
            # agreement_type=AgreementType.CONTRACT,
        ),
        ContractAgreement(
            name="Test Agreement 2",
            # agreement_type=AgreementType.CONTRACT,
        ),
        GrantAgreement(
            name="Test Agreement 3",
            # agreement_type=AgreementType.GRANT,
        ),
        IaaAgreement(
            name="Test Agreement 4",
            # agreement_type=AgreementType.IAA,
            direction=IAADirectionType.OUTGOING,
        ),
        DirectAgreement(
            name="Test Agreement 5",
            # agreement_type=AgreementType.DIRECT_OBLIGATION,
        ),
        # This one should not be deleted - not in TSV
        ContractAgreement(
            name="Test Agreement Not In List",
            # agreement_type=AgreementType.CONTRACT,
        ),
    ]

    for agreement in agreements:
        loaded_db.add(agreement)
    loaded_db.commit()

    # Create test user
    test_user = loaded_db.get(User, 1)
    if not test_user:
        test_user = User(id=1, email="system.admin@localhost")
        loaded_db.add(test_user)
        loaded_db.commit()

    # Create a budget line item for one agreement to test the skip logic
    agreement_with_bli = agreements[0]
    bli = ContractBudgetLineItem(
        id=1,
        agreement_id=agreement_with_bli.id,
        # can_id=1,
        # budget_line_item_type=AgreementType.CONTRACT,
        line_description="Test BLI",
        amount=Decimal("10000.00"),
    )
    loaded_db.add(bli)
    loaded_db.commit()

    yield loaded_db

    # Clean up
    # loaded_db.execute(text("DELETE FROM ops_event"))
    # loaded_db.execute(text("DELETE FROM budget_line_item"))
    loaded_db.delete(bli)
    # loaded_db.execute(text("DELETE FROM agreement"))
    loaded_db.delete(agreement_with_bli)

    # Delete agreements by querying instead of using potentially stale objects
    for name in [
        "Test Agreement 1",
        "Test Agreement 2",
        "Test Agreement 3",
        "Test Agreement 4",
        "Test Agreement 5",
        "Test Agreement Not In List",
    ]:
        agreement = loaded_db.execute(select(Agreement).where(Agreement.name == name)).scalar_one_or_none()
        if agreement:
            loaded_db.delete(agreement)

    loaded_db.commit()
    # loaded_db.execute(text("DELETE FROM ops_event"))
    # loaded_db.execute(text("DELETE FROM ops_event_version"))
    loaded_db.commit()


def test_create_model_delete(db_with_agreements):
    # Verify initial count of agreements
    initial_count = db_with_agreements.execute(select(Agreement)).scalars().all()
    assert len(initial_count) == 6

    # Verify the agreement exists before deletion
    agreement_name = "Test Agreement 2"
    agreement_type = "contract"

    data = AgreementData(AGREEMENT_NAME=agreement_name, AGREEMENT_TYPE=agreement_type)
    user = db_with_agreements.get(User, 1)

    # Delete the agreement
    create_models(data, user, db_with_agreements)

    # Verify the agreement no longer exists
    deleted_agreement = db_with_agreements.execute(
        select(Agreement).where(Agreement.name == agreement_name, Agreement.agreement_type == AgreementType.CONTRACT)
    ).scalar_one_or_none()
    assert deleted_agreement is None

    # Check if an OPS event was created
    ops_event = db_with_agreements.execute(
        select(OpsEvent).where(OpsEvent.event_type == OpsEventType.DELETE_AGREEMENT)
    ).scalar_one_or_none()

    assert ops_event is not None
    assert ops_event.event_type == OpsEventType.DELETE_AGREEMENT
    assert ops_event.created_by == 1
    assert "deleted_agreement" in ops_event.event_details
    assert ops_event.event_details["deleted_agreement"]["name"] == agreement_name


def test_skip_agreement_with_bli(db_with_agreements):
    # Try to delete an agreement with a BLI
    agreement_name = "Test Agreement 1"
    agreement_type = "contract"

    data = AgreementData(AGREEMENT_NAME=agreement_name, AGREEMENT_TYPE=agreement_type)
    user = db_with_agreements.get(User, 1)

    # This should skip deletion due to BLI attachment
    create_models(data, user, db_with_agreements)

    # Verify the agreement still exists
    agreement = db_with_agreements.execute(
        select(Agreement).where(Agreement.name == agreement_name, Agreement.agreement_type == AgreementType.CONTRACT)
    ).scalar_one_or_none()
    assert agreement is not None

    # Verify no OPS event was created for this deletion attempt
    ops_event = db_with_agreements.execute(
        select(OpsEvent).where(
            OpsEvent.event_type == OpsEventType.DELETE_AGREEMENT,
            OpsEvent.event_details["deleted_agreement"]["name"].astext == agreement_name,
        )
    ).scalar_one_or_none()
    assert ops_event is None


def test_delete_agreements_with_all_types(db_with_agreements):
    """Test deleting agreements of all different types."""
    # Verify initial count of agreements
    initial_count = len(db_with_agreements.execute(select(Agreement)).scalars().all())
    assert initial_count == 6

    # Create data for multiple agreement types
    agreement_data = [
        AgreementData(AGREEMENT_NAME="Test Agreement 2", AGREEMENT_TYPE="contract"),  # Should be deleted
        AgreementData(AGREEMENT_NAME="Test Agreement 3", AGREEMENT_TYPE="grants"),  # Should be deleted
        AgreementData(AGREEMENT_NAME="Test Agreement 4", AGREEMENT_TYPE="iaa"),  # Should be deleted
        AgreementData(AGREEMENT_NAME="Test Agreement 5", AGREEMENT_TYPE="do"),  # Should be deleted
    ]

    user = db_with_agreements.get(User, 1)

    # Delete each agreement
    for data in agreement_data:
        create_models(data, user, db_with_agreements)

    # Verify remaining count - should have 2 agreements left
    # (Test Agreement 1 - has BLI so can't delete, Test Agreement Not In List - not in delete list)
    remaining = db_with_agreements.execute(select(Agreement)).scalars().all()
    assert sum(1 for agreement in remaining if agreement.name == "Test Agreement 1") == 1
    assert sum(1 for agreement in remaining if agreement.name == "Test Agreement Not In List") == 1

    # Verify specific agreements were deleted
    for data in agreement_data:
        agreement_type = getattr(AgreementType, data.AGREEMENT_TYPE.upper(), None)
        agreement = db_with_agreements.execute(
            select(Agreement).where(Agreement.name == data.AGREEMENT_NAME, Agreement.agreement_type == agreement_type)
        ).scalar_one_or_none()
        assert agreement is None


def test_invalid_agreement_type(db_with_agreements):
    """Test handling invalid agreement types."""
    data = AgreementData(AGREEMENT_NAME="Test Invalid", AGREEMENT_TYPE="invalid_type")
    user = db_with_agreements.get(User, 1)

    # Should not raise exception but log a warning
    create_models(data, user, db_with_agreements)

    # Verify nothing was deleted
    initial_count = len(db_with_agreements.execute(select(Agreement)).scalars().all())
    assert initial_count == 6


def test_nonexistent_agreement(db_with_agreements):
    """Test trying to delete an agreement that doesn't exist."""
    data = AgreementData(AGREEMENT_NAME="Nonexistent Agreement", AGREEMENT_TYPE="contract")
    user = db_with_agreements.get(User, 1)

    # Should not raise exception but log a warning
    create_models(data, user, db_with_agreements)

    # Verify nothing was deleted
    initial_count = len(db_with_agreements.execute(select(Agreement)).scalars().all())
    assert initial_count == 6


def test_create_all_models(db_with_agreements):
    """Test the create_all_models function with multiple agreements."""
    # Verify initial count of agreements
    initial_count = len(db_with_agreements.execute(select(Agreement)).scalars().all())
    assert initial_count == 6

    # Create data for multiple agreements
    agreement_data = [
        AgreementData(AGREEMENT_NAME="Test Agreement 2", AGREEMENT_TYPE="contract"),
        AgreementData(AGREEMENT_NAME="Test Agreement 3", AGREEMENT_TYPE="grants"),
    ]

    user = db_with_agreements.get(User, 1)

    # Delete the agreements
    from data_tools.src.load_remove_agreements.utils import create_all_models

    create_all_models(agreement_data, user, db_with_agreements)

    # Verify the agreements no longer exist
    remaining = db_with_agreements.execute(select(Agreement)).scalars().all()
    assert len(remaining) == 4  # Started with 6, deleted 2


def test_main_cli(db_with_agreements):
    """Test the main CLI command for removing agreements."""
    # Initial count of agreements
    initial_count = len(db_with_agreements.execute(select(Agreement)).scalars().all())
    assert initial_count == 6

    # Run the CLI command
    result = CliRunner().invoke(
        main, ["--env", "pytest_data_tools", "--type", "remove_agreements", "--input-csv", file_path]
    )

    assert result.exit_code == 0

    # Refresh the session to avoid deferred loading issues
    db_with_agreements.expire_all()

    # Verify remaining count - should have 2 agreements left
    # (Test Agreement 1 - has BLI so can't delete, Test Agreement Not In List - not in delete list)
    remaining = db_with_agreements.execute(select(Agreement)).scalars().all()
    assert sum(1 for agreement in remaining if agreement.name == "Test Agreement 1") == 1

    # Check that OPS events were created (one per deleted agreement)
    ops_events = (
        db_with_agreements.execute(select(OpsEvent).where(OpsEvent.event_type == OpsEventType.DELETE_AGREEMENT))
        .scalars()
        .all()
    )

    # Verify event details
    for event in ops_events:
        assert event.event_type == OpsEventType.DELETE_AGREEMENT
        assert "deleted_agreement" in event.event_details

    # test a few ops_events have the correct details
    assert "Test Agreement 2" in [event.event_details["deleted_agreement"]["name"] for event in ops_events]
    assert "Test Agreement 3" in [event.event_details["deleted_agreement"]["name"] for event in ops_events]
    assert "Test Agreement 4" in [event.event_details["deleted_agreement"]["name"] for event in ops_events]
