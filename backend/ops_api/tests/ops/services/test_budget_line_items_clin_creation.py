"""
Integration tests for CLIN lazy creation with concurrent request handling.

Tests the _ensure_clin_exists method's ability to handle race conditions
when multiple BLI updates request the same CLIN number simultaneously.

Test Philosophy: Integration tests (medium speed, real database)
- Tests service layer business logic with database access
- Uses real SQLAlchemy session and transaction handling
- Validates concurrent creation scenarios that can occur in production
- Focuses on race condition handling and atomicity guarantees
"""

import pytest
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from models import CLIN, BudgetLineItem
from ops_api.ops.services.budget_line_items import BudgetLineItemService
from ops_api.ops.services.ops_service import ValidationError


@pytest.fixture(scope="function", autouse=True)
def mock_current_user(mocker, loaded_db):
    """Mock JWT authentication for all tests in this module."""
    # Query a valid user from the test database
    from models import User

    test_user = loaded_db.query(User).first()
    if not test_user:
        # Create a proper object with id attribute (not a Mock which can have issues)
        test_user = type("MockUser", (), {"id": 500})()

    # Mock get_jwt() to provide JWT context
    mocker.patch(
        "flask_jwt_extended.utils.get_jwt",
        return_value={"sub": str(test_user.id)},
    )

    # Mock the Flask g._jwt_extended_jwt_user that get_current_user() reads
    # The format must match what flask_jwt_extended expects: a dict with "loaded_user" key
    mock_g = mocker.MagicMock()
    mock_g.get.return_value = {"loaded_user": test_user}
    mocker.patch("flask_jwt_extended.utils.g", mock_g)

    # Mock get_current_user() at all import locations to return test_user
    mocker.patch(
        "flask_jwt_extended.get_current_user",
        return_value=test_user,
    )
    mocker.patch(
        "ops_api.ops.services.budget_line_items.get_current_user",
        return_value=test_user,
    )
    mocker.patch(
        "ops_api.ops.services.budget_line_items.current_user",
        test_user,
    )
    mocker.patch(
        "ops_api.ops.utils.budget_line_items_helpers.get_current_user",
        return_value=test_user,
    )

    return test_user


class TestCLINLazyCreation:
    """Test suite for CLIN lazy creation with concurrent request handling."""

    def test_ensure_clin_exists_creates_new_clin(self, loaded_db, app_ctx):
        """
        GIVEN a BLI with an agreement that has no CLINs
        WHEN _ensure_clin_exists is called with a CLIN number
        THEN a new CLIN record is created with correct attributes
        """
        # Arrange: Get a BLI from the test database
        bli = loaded_db.query(BudgetLineItem).filter(BudgetLineItem.agreement_id.isnot(None)).first()
        agreement = bli.agreement
        clin_number = 5

        # Ensure this CLIN number doesn't exist yet
        existing_clin = loaded_db.execute(
            select(CLIN).where(CLIN.number == clin_number).where(CLIN.agreement_id == agreement.id)
        ).scalar_one_or_none()
        assert existing_clin is None, "Test setup: CLIN should not exist yet"

        # Act: Call the method
        service = BudgetLineItemService(loaded_db)
        clin_id = service._ensure_clin_exists(bli, clin_number)

        # Assert: CLIN was created with correct attributes
        created_clin = loaded_db.get(CLIN, clin_id)
        assert created_clin is not None
        assert created_clin.number == clin_number
        assert created_clin.name == f"CLIN {clin_number}"
        assert created_clin.agreement_id == agreement.id
        assert created_clin.pop_start_date == agreement.sc_start_date
        assert created_clin.pop_end_date == agreement.sc_end_date

    def test_ensure_clin_exists_returns_existing_clin(self, loaded_db, app_ctx):
        """
        GIVEN a BLI with an agreement that already has a CLIN with number 1
        WHEN _ensure_clin_exists is called with CLIN number 1
        THEN the existing CLIN ID is returned without creating a duplicate
        """
        # Arrange: Get a BLI that already has a CLIN assigned
        bli = loaded_db.query(BudgetLineItem).filter(BudgetLineItem.clin_id.isnot(None)).first()
        agreement = bli.agreement
        existing_clin = bli.clin
        clin_number = existing_clin.number

        # Act: Call the method with the existing CLIN number
        service = BudgetLineItemService(loaded_db)
        clin_id = service._ensure_clin_exists(bli, clin_number)

        # Assert: Returned the existing CLIN ID
        assert clin_id == existing_clin.id

        # Assert: No duplicate CLIN was created
        all_clins = (
            loaded_db.execute(select(CLIN).where(CLIN.number == clin_number).where(CLIN.agreement_id == agreement.id))
            .scalars()
            .all()
        )
        assert len(all_clins) == 1

    def test_ensure_clin_exists_without_agreement_raises_validation_error(self, loaded_db, app_ctx):
        """
        GIVEN a BLI with no associated agreement
        WHEN _ensure_clin_exists is called
        THEN a ValidationError is raised
        """
        # Arrange: Create a BLI without an agreement
        bli = BudgetLineItem(agreement_id=None)

        # Act & Assert: Should raise ValidationError
        service = BudgetLineItemService(loaded_db)
        with pytest.raises(ValidationError) as exc_info:
            service._ensure_clin_exists(bli, 1)

        # ValidationError stores errors in validation_errors attribute
        error_dict = exc_info.value.validation_errors
        assert "clin_id" in error_dict or "agreement" in str(error_dict).lower()

    def test_integrity_error_handling_fetches_existing_clin(self, loaded_db, app_ctx, mocker):
        """
        GIVEN a CLIN creation that triggers IntegrityError (simulating concurrent creation)
        WHEN _ensure_clin_exists catches the error
        THEN it fetches and returns the CLIN created by the concurrent request

        Note: This test directly triggers the IntegrityError path by mocking flush() to raise
        the error, then verifies the exception handler correctly fetches the existing CLIN.
        """
        # Arrange: Get a BLI with an agreement
        bli = loaded_db.query(BudgetLineItem).filter(BudgetLineItem.agreement_id.isnot(None)).first()
        agreement = bli.agreement
        clin_number = 7

        # Create the CLIN that the "concurrent" request would have created
        # but DON'T commit it yet - we need to simulate it appearing after IntegrityError
        concurrent_clin = CLIN(
            number=clin_number,
            name=f"CLIN {clin_number}",
            agreement_id=agreement.id,
            pop_start_date=agreement.sc_start_date,
            pop_end_date=agreement.sc_end_date,
            created_by=500,
        )
        concurrent_clin.id = 5999  # Assign ID to simulate committed record

        service = BudgetLineItemService(loaded_db)

        # Track how many times execute() is called to distinguish initial check vs retry
        execute_call_count = {"count": 0}

        original_execute = loaded_db.execute

        def mock_execute(statement, *args, **kwargs):
            execute_call_count["count"] += 1
            # First call: initial existence check should return None (CLIN doesn't exist yet)
            if execute_call_count["count"] == 1:
                mock_result = mocker.Mock()
                mock_result.scalar_one_or_none.return_value = None
                return mock_result
            # Second call: after IntegrityError, return the "concurrent" CLIN
            elif execute_call_count["count"] == 2:
                mock_result = mocker.Mock()
                mock_result.scalar_one_or_none.return_value = concurrent_clin
                return mock_result
            else:
                return original_execute(statement, *args, **kwargs)

        mocker.patch.object(loaded_db, "execute", side_effect=mock_execute)

        # Mock flush() to raise IntegrityError when trying to create CLIN
        original_flush = loaded_db.flush

        def mock_flush():
            # Check if we're trying to create a CLIN
            for obj in loaded_db.new:
                if isinstance(obj, CLIN) and obj.number == clin_number:
                    # Raise IntegrityError as if concurrent creation happened
                    mock_orig = mocker.Mock()
                    mock_orig.__str__ = (
                        lambda self: 'duplicate key value violates unique constraint "clin_number_agreement_id_key"'
                    )
                    error = IntegrityError("statement", "params", mock_orig)
                    raise error
            original_flush()

        mocker.patch.object(loaded_db, "flush", side_effect=mock_flush)

        # Act: Call _ensure_clin_exists - it will try to create, get IntegrityError, then fetch existing
        result_clin_id = service._ensure_clin_exists(bli, clin_number)

        # Assert: Returns the ID of the CLIN that was "concurrently" created
        assert result_clin_id == concurrent_clin.id

    def test_concurrent_clin_creation_not_found_after_rollback_raises_error(self, loaded_db, app_ctx, mocker):
        """
        GIVEN a concurrent CLIN creation that triggers IntegrityError
        WHEN the CLIN cannot be found after rollback (edge case: concurrent transaction rolled back)
        THEN a ValidationError is raised with a helpful message
        """
        # Arrange: Get a BLI with an agreement
        bli = loaded_db.query(BudgetLineItem).filter(BudgetLineItem.agreement_id.isnot(None)).first()
        clin_number = 8

        service = BudgetLineItemService(loaded_db)

        # Mock: Make flush() raise IntegrityError for duplicate CLIN
        # AND make the subsequent query return None (simulating concurrent rollback)
        original_add = loaded_db.add
        call_count = {"add": 0}

        def mock_add(instance):
            if isinstance(instance, CLIN) and instance.number == clin_number:
                call_count["add"] += 1
                mock_orig = mocker.Mock()
                mock_orig.__str__ = (
                    lambda self: 'duplicate key value violates unique constraint "clin_number_agreement_id_key"'
                )
                error = IntegrityError("statement", "params", mock_orig)
                raise error
            original_add(instance)

        mocker.patch.object(loaded_db, "add", side_effect=mock_add)

        # Mock execute to return None when fetching the concurrent CLIN
        original_execute = loaded_db.execute

        def mock_execute(statement):
            # Check if this is the query for the concurrent CLIN after rollback
            if "select clin" in str(statement).lower() and str(clin_number) in str(statement):
                result_mock = mocker.Mock()
                result_mock.scalar_one_or_none.return_value = None
                return result_mock
            return original_execute(statement)

        mocker.patch.object(loaded_db, "execute", side_effect=mock_execute)

        # Act & Assert: Should raise ValidationError when CLIN not found after rollback
        with pytest.raises(ValidationError) as exc_info:
            service._ensure_clin_exists(bli, clin_number)

        error_message = str(exc_info.value.validation_errors).lower()
        assert "clin" in error_message
        assert "failed" in error_message or "retrieve" in error_message

    def test_different_integrity_error_is_reraised(self, loaded_db, app_ctx, mocker):
        """
        GIVEN a CLIN creation that triggers IntegrityError for a DIFFERENT constraint
        WHEN _ensure_clin_exists catches the error
        THEN the IntegrityError is re-raised (not swallowed)
        """
        # Arrange: Get a BLI with an agreement
        bli = loaded_db.query(BudgetLineItem).filter(BudgetLineItem.agreement_id.isnot(None)).first()
        clin_number = 9

        service = BudgetLineItemService(loaded_db)

        # Mock: Make add() raise IntegrityError for a DIFFERENT constraint
        original_add = loaded_db.add

        def mock_add(instance):
            if isinstance(instance, CLIN) and instance.number == clin_number:
                # Simulate a different constraint violation (not the CLIN unique constraint)
                mock_orig = mocker.Mock()
                mock_orig.__str__ = (
                    lambda self: 'duplicate key value violates unique constraint "some_other_constraint"'
                )
                error = IntegrityError("statement", "params", mock_orig)
                raise error
            original_add(instance)

        mocker.patch.object(loaded_db, "add", side_effect=mock_add)

        # Act & Assert: Should re-raise the IntegrityError since it's not the CLIN constraint
        with pytest.raises(IntegrityError) as exc_info:
            service._ensure_clin_exists(bli, clin_number)

        # Verify it's the different constraint error
        assert "some_other_constraint" in str(exc_info.value)


# TODO: Add integration tests for BLI CLIN assignment via update_with_change_request_ids()
# These tests require proper mocking of Flask request context and Marshmallow schemas.
# Test scenarios to cover:
# 1. Update BLI with CLIN number (1-10) creates CLIN and assigns it
# 2. Update multiple BLIs with same CLIN number reuses single CLIN record
# 3. Update BLI with existing CLIN ID (>= 5000) uses existing CLIN without creating duplicate
