"""Tests for BudgetLineStatusRule."""
import pytest

from models import AgreementType, BudgetLineItemStatus, ContractAgreement, ContractBudgetLineItem
from ops_api.ops.services.ops_service import ValidationError
from ops_api.ops.validation.context import ValidationContext
from ops_api.ops.validation.rules.agreement import BudgetLineStatusRule


@pytest.mark.usefixtures("app_ctx")
class TestBudgetLineStatusRule:
    """Test suite for BudgetLineStatusRule."""

    def test_name_property(self):
        """Test that the rule has the correct name."""
        rule = BudgetLineStatusRule()
        assert rule.name == "Budget Line Status Check"

    def test_validate_passes_when_no_budget_lines(self, test_user, loaded_db):
        """Test that validation passes when agreement has no budget lines."""
        agreement = ContractAgreement(
            name="Test Agreement - No BLI",
            agreement_type=AgreementType.CONTRACT
        )
        loaded_db.add(agreement)
        loaded_db.commit()

        context = ValidationContext(
            user=test_user,
            updated_fields={"name": "Updated Name"},
            db_session=loaded_db
        )

        rule = BudgetLineStatusRule()
        # Should not raise
        rule.validate(agreement, context)

        # Cleanup
        loaded_db.delete(agreement)
        loaded_db.commit()

    def test_validate_passes_when_budget_lines_in_draft(self, test_user, loaded_db):
        """Test that validation passes when budget lines are in DRAFT status."""
        agreement = ContractAgreement(
            name="Test Agreement - Draft BLI",
            agreement_type=AgreementType.CONTRACT
        )
        loaded_db.add(agreement)
        loaded_db.commit()

        bli = ContractBudgetLineItem(
            agreement_id=agreement.id,
            status=BudgetLineItemStatus.DRAFT,
            line_description="Test BLI"
        )
        loaded_db.add(bli)
        loaded_db.commit()

        context = ValidationContext(
            user=test_user,
            updated_fields={"name": "Updated Name"},
            db_session=loaded_db
        )

        rule = BudgetLineStatusRule()
        # Should not raise
        rule.validate(agreement, context)

        # Cleanup
        loaded_db.delete(bli)
        loaded_db.delete(agreement)
        loaded_db.commit()

    def test_validate_raises_error_when_budget_line_in_execution(self, test_user, loaded_db):
        """Test that validation fails when budget line is IN_EXECUTION."""
        agreement = ContractAgreement(
            name="Test Agreement - In Execution",
            agreement_type=AgreementType.CONTRACT
        )
        loaded_db.add(agreement)
        loaded_db.commit()

        bli = ContractBudgetLineItem(
            agreement_id=agreement.id,
            status=BudgetLineItemStatus.IN_EXECUTION,
            line_description="Test BLI"
        )
        loaded_db.add(bli)
        loaded_db.commit()

        context = ValidationContext(
            user=test_user,
            updated_fields={"name": "Updated Name"},
            db_session=loaded_db
        )

        rule = BudgetLineStatusRule()

        with pytest.raises(ValidationError) as exc_info:
            rule.validate(agreement, context)

        assert "budget_line_items" in exc_info.value.validation_errors
        assert "Execution or higher" in exc_info.value.validation_errors["budget_line_items"]

        # Cleanup
        loaded_db.delete(bli)
        loaded_db.delete(agreement)
        loaded_db.commit()

    def test_validate_raises_error_when_budget_line_obligated(self, test_user, loaded_db):
        """Test that validation fails when budget line is OBLIGATED."""
        agreement = ContractAgreement(
            name="Test Agreement - Obligated",
            agreement_type=AgreementType.CONTRACT
        )
        loaded_db.add(agreement)
        loaded_db.commit()

        bli = ContractBudgetLineItem(
            agreement_id=agreement.id,
            status=BudgetLineItemStatus.OBLIGATED,
            line_description="Test BLI"
        )
        loaded_db.add(bli)
        loaded_db.commit()

        context = ValidationContext(
            user=test_user,
            updated_fields={"name": "Updated Name"},
            db_session=loaded_db
        )

        rule = BudgetLineStatusRule()

        with pytest.raises(ValidationError) as exc_info:
            rule.validate(agreement, context)

        assert "budget_line_items" in exc_info.value.validation_errors

        # Cleanup
        loaded_db.delete(bli)
        loaded_db.delete(agreement)
        loaded_db.commit()
