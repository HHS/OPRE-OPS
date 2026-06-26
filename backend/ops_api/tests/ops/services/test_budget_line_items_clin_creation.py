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
        all_clins = loaded_db.execute(
            select(CLIN).where(CLIN.number == clin_number).where(CLIN.agreement_id == agreement.id)
        ).scalars().all()
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

        assert "agreement" in str(exc_info.value).lower()

    def test_concurrent_clin_creation_handles_race_condition(self, loaded_db, app_ctx, mocker):
        """
        GIVEN two concurrent requests trying to create the same CLIN
        WHEN both call _ensure_clin_exists with the same CLIN number
        THEN the first succeeds, the second catches IntegrityError and fetches the existing CLIN
        AND both requests receive the same CLIN ID
        """
        # Arrange: Get a BLI with an agreement
        bli = loaded_db.query(BudgetLineItem).filter(BudgetLineItem.agreement_id.isnot(None)).first()
        agreement = bli.agreement
        clin_number = 7

        # Ensure this CLIN number doesn't exist yet
        existing_clin = loaded_db.execute(
            select(CLIN).where(CLIN.number == clin_number).where(CLIN.agreement_id == agreement.id)
        ).scalar_one_or_none()
        assert existing_clin is None

        service = BudgetLineItemService(loaded_db)

        # Act: First request creates the CLIN
        clin_id_1 = service._ensure_clin_exists(bli, clin_number)
        loaded_db.commit()  # Commit so it's visible to the simulated concurrent request

        # Simulate concurrent request: Mock flush() to raise IntegrityError
        original_add = loaded_db.add

        def mock_add(instance):
            original_add(instance)
            # After adding, simulate that flush() will raise IntegrityError
            if isinstance(instance, CLIN) and instance.number == clin_number:
                # Create a mock IntegrityError with the constraint name
                mock_orig = mocker.Mock()
                mock_orig.__str__ = lambda self: 'duplicate key value violates unique constraint "clin_number_agreement_id_key"'
                error = IntegrityError("statement", "params", mock_orig)
                raise error

        mocker.patch.object(loaded_db, "add", side_effect=mock_add)

        # Act: Second concurrent request tries to create the same CLIN
        clin_id_2 = service._ensure_clin_exists(bli, clin_number)

        # Assert: Both requests got the same CLIN ID
        assert clin_id_1 == clin_id_2

        # Assert: Only one CLIN record exists
        all_clins = loaded_db.execute(
            select(CLIN).where(CLIN.number == clin_number).where(CLIN.agreement_id == agreement.id)
        ).scalars().all()
        assert len(all_clins) == 1

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
                mock_orig.__str__ = lambda self: 'duplicate key value violates unique constraint "clin_number_agreement_id_key"'
                error = IntegrityError("statement", "params", mock_orig)
                raise error
            original_add(instance)

        mocker.patch.object(loaded_db, "add", side_effect=mock_add)

        # Mock execute to return None when fetching the concurrent CLIN
        original_execute = loaded_db.execute

        def mock_execute(statement):
            # Check if this is the query for the concurrent CLIN after rollback
            if "SELECT clin" in str(statement).lower() and str(clin_number) in str(statement):
                result_mock = mocker.Mock()
                result_mock.scalar_one_or_none.return_value = None
                return result_mock
            return original_execute(statement)

        mocker.patch.object(loaded_db, "execute", side_effect=mock_execute)

        # Act & Assert: Should raise ValidationError when CLIN not found after rollback
        with pytest.raises(ValidationError) as exc_info:
            service._ensure_clin_exists(bli, clin_number)

        error_message = str(exc_info.value).lower()
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
                mock_orig.__str__ = lambda self: 'duplicate key value violates unique constraint "some_other_constraint"'
                error = IntegrityError("statement", "params", mock_orig)
                raise error
            original_add(instance)

        mocker.patch.object(loaded_db, "add", side_effect=mock_add)

        # Act & Assert: Should re-raise the IntegrityError since it's not the CLIN constraint
        with pytest.raises(IntegrityError) as exc_info:
            service._ensure_clin_exists(bli, clin_number)

        # Verify it's the different constraint error
        assert "some_other_constraint" in str(exc_info.value)


class TestBudgetLineItemCLINAssignment:
    """Integration tests for BLI CLIN assignment with lazy creation."""

    def test_update_bli_with_clin_number_creates_clin(self, loaded_db, app_ctx):
        """
        GIVEN a BLI with no CLIN assigned
        WHEN the BLI is updated with clin_id=2 (CLIN number)
        THEN a CLIN record is created and assigned to the BLI
        """
        # Arrange: Get a DRAFT BLI with no CLIN
        bli = (
            loaded_db.query(BudgetLineItem)
            .filter(BudgetLineItem.clin_id.is_(None))
            .filter(BudgetLineItem.status == "DRAFT")
            .first()
        )
        agreement = bli.agreement
        clin_number = 2

        # Ensure this CLIN doesn't exist yet
        existing_clin = loaded_db.execute(
            select(CLIN).where(CLIN.number == clin_number).where(CLIN.agreement_id == agreement.id)
        ).scalar_one_or_none()
        assert existing_clin is None

        # Act: Update the BLI with a CLIN number
        service = BudgetLineItemService(loaded_db)
        updated_bli, status_code, _ = service.update_with_change_request_ids(
            id=bli.id, updated_fields={"clin_id": clin_number}, request=None, schema=None, commit=True
        )

        # Assert: CLIN was created
        created_clin = loaded_db.execute(
            select(CLIN).where(CLIN.number == clin_number).where(CLIN.agreement_id == agreement.id)
        ).scalar_one_or_none()
        assert created_clin is not None
        assert created_clin.number == clin_number

        # Assert: BLI is assigned to the created CLIN
        assert updated_bli.clin_id == created_clin.id

    def test_update_multiple_blis_with_same_clin_number(self, loaded_db, app_ctx):
        """
        GIVEN two BLIs from the same agreement
        WHEN both are updated with the same CLIN number
        THEN only one CLIN record is created and both BLIs reference it
        """
        # Arrange: Get two DRAFT BLIs from the same agreement
        bli_1 = (
            loaded_db.query(BudgetLineItem)
            .filter(BudgetLineItem.clin_id.is_(None))
            .filter(BudgetLineItem.status == "DRAFT")
            .first()
        )
        bli_2 = (
            loaded_db.query(BudgetLineItem)
            .filter(BudgetLineItem.clin_id.is_(None))
            .filter(BudgetLineItem.status == "DRAFT")
            .filter(BudgetLineItem.agreement_id == bli_1.agreement_id)
            .filter(BudgetLineItem.id != bli_1.id)
            .first()
        )
        agreement = bli_1.agreement
        clin_number = 3

        # Ensure this CLIN doesn't exist yet
        existing_clin = loaded_db.execute(
            select(CLIN).where(CLIN.number == clin_number).where(CLIN.agreement_id == agreement.id)
        ).scalar_one_or_none()
        assert existing_clin is None

        # Act: Update both BLIs with the same CLIN number
        service = BudgetLineItemService(loaded_db)

        updated_bli_1, _, _ = service.update_with_change_request_ids(
            id=bli_1.id, updated_fields={"clin_id": clin_number}, request=None, schema=None, commit=True
        )

        updated_bli_2, _, _ = service.update_with_change_request_ids(
            id=bli_2.id, updated_fields={"clin_id": clin_number}, request=None, schema=None, commit=True
        )

        # Assert: Only one CLIN was created
        all_clins = loaded_db.execute(
            select(CLIN).where(CLIN.number == clin_number).where(CLIN.agreement_id == agreement.id)
        ).scalars().all()
        assert len(all_clins) == 1

        # Assert: Both BLIs reference the same CLIN
        assert updated_bli_1.clin_id == updated_bli_2.clin_id
        assert updated_bli_1.clin_id == all_clins[0].id

    def test_update_bli_with_existing_clin_id_uses_existing_clin(self, loaded_db, app_ctx):
        """
        GIVEN a BLI and a CLIN that already exists (ID >= 5000)
        WHEN the BLI is updated with the existing CLIN ID
        THEN the BLI is assigned to the existing CLIN (no new CLIN created)
        """
        # Arrange: Get a BLI with a CLIN already assigned
        bli_with_clin = loaded_db.query(BudgetLineItem).filter(BudgetLineItem.clin_id.isnot(None)).first()
        existing_clin = bli_with_clin.clin

        # Get a different BLI without a CLIN from the same agreement
        bli_without_clin = (
            loaded_db.query(BudgetLineItem)
            .filter(BudgetLineItem.clin_id.is_(None))
            .filter(BudgetLineItem.status == "DRAFT")
            .filter(BudgetLineItem.agreement_id == bli_with_clin.agreement_id)
            .first()
        )

        # Act: Update the BLI with the existing CLIN ID (not a number, but an actual ID >= 5000)
        service = BudgetLineItemService(loaded_db)
        updated_bli, _, _ = service.update_with_change_request_ids(
            id=bli_without_clin.id,
            updated_fields={"clin_id": existing_clin.id},
            request=None,
            schema=None,
            commit=True,
        )

        # Assert: BLI is assigned to the existing CLIN
        assert updated_bli.clin_id == existing_clin.id

        # Assert: No duplicate CLIN was created
        agreement = bli_with_clin.agreement
        all_clins = loaded_db.execute(
            select(CLIN).where(CLIN.number == existing_clin.number).where(CLIN.agreement_id == agreement.id)
        ).scalars().all()
        assert len(all_clins) == 1
