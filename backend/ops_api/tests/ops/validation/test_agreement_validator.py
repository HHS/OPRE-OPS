"""Tests for AgreementValidator."""
import pytest

from models import AgreementType, BudgetLineItemStatus, ContractAgreement, ContractBudgetLineItem
from ops_api.ops.services.ops_service import (
    AuthorizationError,
    ResourceNotFoundError,
    ValidationError,
)
from ops_api.ops.validation.agreement_validator import AgreementValidator
from ops_api.ops.validation.rules.agreement import AgreementTypeImmutableRule


@pytest.mark.usefixtures("app_ctx")
class TestAgreementValidator:
    """Test suite for AgreementValidator."""

    def test_validator_has_default_validators(self):
        """Test that validator initializes with default validators."""
        validator = AgreementValidator()

        assert len(validator.validators) == 6
        assert all(hasattr(v, 'validate') for v in validator.validators)
        assert all(hasattr(v, 'name') for v in validator.validators)

    def test_validator_accepts_custom_validators(self):
        """Test that validator can be initialized with custom validators."""
        custom_validators = [AgreementTypeImmutableRule()]
        validator = AgreementValidator(validators=custom_validators)

        assert len(validator.validators) == 1
        assert isinstance(validator.validators[0], AgreementTypeImmutableRule)

    def test_validate_executes_all_validators_in_order(self, test_user, loaded_db):
        """Test that validate method executes all validators."""
        agreement = ContractAgreement(
            name="Test Agreement - All Validators",
            agreement_type=AgreementType.CONTRACT,
            project_officer_id=test_user.id
        )
        loaded_db.add(agreement)
        loaded_db.commit()

        validator = AgreementValidator()
        updated_fields = {"description": "New description"}

        # Should execute all validators without error
        validator.validate(agreement, test_user, updated_fields, loaded_db)

        # Cleanup
        loaded_db.delete(agreement)
        loaded_db.commit()

    def test_validate_raises_resource_not_found_error(self, test_user, loaded_db):
        """Test that validator raises ResourceNotFoundError when agreement is None."""
        validator = AgreementValidator()
        updated_fields = {"id": 999, "name": "Test"}

        with pytest.raises(ResourceNotFoundError):
            validator.validate(None, test_user, updated_fields, loaded_db)

    def test_validate_raises_authorization_error(self, loaded_db):
        """Test that validator raises AuthorizationError for unauthorized user."""
        # Create unauthorized user
        from models import User
        unauthorized_user = User(email="unauth@test.com", oidc_id="00000000-0000-0000-0000-000000000003")
        loaded_db.add(unauthorized_user)

        agreement = ContractAgreement(
            name="Test Agreement - Unauthorized User",
            agreement_type=AgreementType.CONTRACT
        )
        loaded_db.add(agreement)
        loaded_db.commit()

        validator = AgreementValidator()
        updated_fields = {"name": "Updated Name"}

        with pytest.raises(AuthorizationError):
            validator.validate(agreement, unauthorized_user, updated_fields, loaded_db)

        # Cleanup
        loaded_db.delete(agreement)
        loaded_db.delete(unauthorized_user)
        loaded_db.commit()

    def test_validate_raises_validation_error_for_budget_line_status(self, test_user, loaded_db):
        """Test that validator raises ValidationError for budget line status."""
        agreement = ContractAgreement(
            name="Test Agreement - BLI Status Error",
            agreement_type=AgreementType.CONTRACT,
            project_officer_id=test_user.id
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

        validator = AgreementValidator()
        updated_fields = {"name": "Updated Name"}

        with pytest.raises(ValidationError) as exc_info:
            validator.validate(agreement, test_user, updated_fields, loaded_db)

        assert "budget_line_items" in exc_info.value.validation_errors

        # Cleanup
        loaded_db.delete(bli)
        loaded_db.delete(agreement)
        loaded_db.commit()

    def test_validate_raises_validation_error_for_agreement_type_change(self, test_user, loaded_db):
        """Test that validator raises ValidationError when agreement type changes."""
        agreement = ContractAgreement(
            name="Test Agreement - Type Change Error",
            agreement_type=AgreementType.CONTRACT,
            project_officer_id=test_user.id
        )
        loaded_db.add(agreement)
        loaded_db.commit()

        validator = AgreementValidator()
        updated_fields = {"agreement_type": AgreementType.GRANT}

        with pytest.raises(ValidationError) as exc_info:
            validator.validate(agreement, test_user, updated_fields, loaded_db)

        assert "agreement_type" in exc_info.value.validation_errors

        # Cleanup
        loaded_db.delete(agreement)
        loaded_db.commit()

    def test_add_validator_adds_rule(self):
        """Test that add_validator adds a new rule to the validator."""
        validator = AgreementValidator(validators=[])
        initial_count = len(validator.validators)

        rule = AgreementTypeImmutableRule()
        validator.add_validator(rule)

        assert len(validator.validators) == initial_count + 1
        assert validator.validators[-1] == rule

    def test_remove_validator_removes_rule(self):
        """Test that remove_validator removes a rule by class type."""
        rule = AgreementTypeImmutableRule()
        validator = AgreementValidator(validators=[rule])
        assert len(validator.validators) == 1

        validator.remove_validator(AgreementTypeImmutableRule)

        assert len(validator.validators) == 0

    def test_validation_context_created_correctly(self, test_user, loaded_db):
        """Test that validation context is created with correct values."""
        agreement = ContractAgreement(
            name="Test Agreement - Context Creation",
            agreement_type=AgreementType.CONTRACT,
            project_officer_id=test_user.id
        )
        loaded_db.add(agreement)
        loaded_db.commit()

        validator = AgreementValidator()
        updated_fields = {"name": "Updated Name"}

        # Should create context and pass to validators
        validator.validate(agreement, test_user, updated_fields, loaded_db)

        # Cleanup
        loaded_db.delete(agreement)
        loaded_db.commit()
