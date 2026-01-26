"""Tests for AgreementValidator."""

import pytest

from models import AgreementType, ContractAgreement
from ops_api.ops.services.ops_service import (
    AuthorizationError,
    ResourceNotFoundError,
    ValidationError,
)
from ops_api.ops.validation.agreement_validator import AgreementValidator
from ops_api.ops.validation.awarded_agreement_validator import AwardedAgreementValidator
from ops_api.ops.validation.rules.agreement import AgreementTypeImmutableRule


class TestAgreementValidator:
    """Test suite for AgreementValidator."""

    def test_validator_has_default_validators(self, app_ctx):
        """Test that validator initializes with default validators."""
        validator = AgreementValidator()

        assert len(validator.validators) == 5
        assert all(hasattr(v, "validate") for v in validator.validators)
        assert all(hasattr(v, "name") for v in validator.validators)

    def test_validator_accepts_custom_validators(self, app_ctx):
        """Test that validator can be initialized with custom validators."""
        custom_validators = [AgreementTypeImmutableRule()]
        validator = AgreementValidator(validators=custom_validators)

        assert len(validator.validators) == 1
        assert isinstance(validator.validators[0], AgreementTypeImmutableRule)

    def test_validate_executes_all_validators_in_order(self, test_user, loaded_db, app_ctx):
        """Test that validate method executes all validators."""
        agreement = ContractAgreement(
            name="Test Agreement - All Validators",
            agreement_type=AgreementType.CONTRACT,
            project_officer_id=test_user.id,
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

    def test_validate_raises_resource_not_found_error(self, test_user, loaded_db, app_ctx):
        """Test that validator raises ResourceNotFoundError when agreement is None."""
        validator = AgreementValidator()
        updated_fields = {"id": 999, "name": "Test"}

        with pytest.raises(ResourceNotFoundError):
            validator.validate(None, test_user, updated_fields, loaded_db)

    def test_validate_raises_authorization_error(self, loaded_db, app_ctx):
        """Test that validator raises AuthorizationError for unauthorized user."""
        # Create unauthorized user
        from models import User

        unauthorized_user = User(email="unauth@test.com", oidc_id="00000000-0000-0000-0000-000000000003")
        loaded_db.add(unauthorized_user)

        agreement = ContractAgreement(name="Test Agreement - Unauthorized User", agreement_type=AgreementType.CONTRACT)
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

    def test_validate_raises_validation_error_for_agreement_type_change(self, test_user, loaded_db, app_ctx):
        """Test that validator raises ValidationError when agreement type changes."""
        agreement = ContractAgreement(
            name="Test Agreement - Type Change Error",
            agreement_type=AgreementType.CONTRACT,
            project_officer_id=test_user.id,
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

    def test_add_validator_adds_rule(self, app_ctx):
        """Test that add_validator adds a new rule to the validator."""
        validator = AgreementValidator(validators=[])
        initial_count = len(validator.validators)

        rule = AgreementTypeImmutableRule()
        validator.add_validator(rule)

        assert len(validator.validators) == initial_count + 1
        assert validator.validators[-1] == rule

    def test_remove_validator_removes_rule(self, app_ctx):
        """Test that remove_validator removes a rule by class type."""
        rule = AgreementTypeImmutableRule()
        validator = AgreementValidator(validators=[rule])
        assert len(validator.validators) == 1

        validator.remove_validator(AgreementTypeImmutableRule)

        assert len(validator.validators) == 0

    def test_validation_context_created_correctly(self, test_user, loaded_db, app_ctx):
        """Test that validation context is created with correct values."""
        agreement = ContractAgreement(
            name="Test Agreement - Context Creation",
            agreement_type=AgreementType.CONTRACT,
            project_officer_id=test_user.id,
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

    def test_validate_raises_error_for_immutable_field_on_awarded_agreement(self, test_user, loaded_db, monkeypatch, app_ctx):
        """Test that validator raises ValidationError when updating immutable field on awarded agreement."""
        from models import ContractType
        from models.procurement_action import AwardType, ProcurementAction, ProcurementActionStatus

        agreement = ContractAgreement(
            name="Test Agreement - Awarded",
            agreement_type=AgreementType.CONTRACT,
            project_officer_id=test_user.id,
            contract_type=ContractType.FIRM_FIXED_PRICE,
        )
        loaded_db.add(agreement)
        loaded_db.commit()

        # Create procurement action to make agreement awarded
        proc_action = ProcurementAction(
            agreement_id=agreement.id, status=ProcurementActionStatus.AWARDED, award_type=AwardType.NEW_AWARD
        )
        loaded_db.add(proc_action)
        loaded_db.commit()

        validator = AwardedAgreementValidator()
        # Try to update an immutable field (name is immutable for awarded ContractAgreement)
        updated_fields = {"name": "New Name"}

        with pytest.raises(ValidationError) as exc_info:
            validator.validate(agreement, test_user, updated_fields, loaded_db)

        assert "name" in exc_info.value.validation_errors

        # Cleanup
        loaded_db.delete(proc_action)
        loaded_db.delete(agreement)
        loaded_db.commit()

    def test_validate_allows_mutable_field_updates_on_awarded_agreement(self, test_user, loaded_db, app_ctx):
        """Test that validator allows updating mutable fields on awarded agreement."""
        from models.procurement_action import AwardType, ProcurementAction, ProcurementActionStatus

        agreement = ContractAgreement(
            name="Test Agreement - Awarded Mutable Update",
            agreement_type=AgreementType.CONTRACT,
            project_officer_id=test_user.id,
        )
        loaded_db.add(agreement)
        loaded_db.commit()

        # Create procurement action to make agreement awarded
        proc_action = ProcurementAction(
            agreement_id=agreement.id, status=ProcurementActionStatus.AWARDED, award_type=AwardType.NEW_AWARD
        )
        loaded_db.add(proc_action)
        loaded_db.commit()

        validator = AgreementValidator()
        # Update a mutable field (description is not in immutable_awarded_fields)
        updated_fields = {"description": "New description"}

        # Should not raise
        validator.validate(agreement, test_user, updated_fields, loaded_db)

        # Cleanup
        loaded_db.delete(proc_action)
        loaded_db.delete(agreement)
        loaded_db.commit()

    def test_validate_allows_super_user_to_modify_immutable_fields_on_awarded_agreement(self, loaded_db, app_ctx):
        """Test that super users can modify immutable fields on awarded agreement."""
        from models import Role, User
        from models.procurement_action import AwardType, ProcurementAction, ProcurementActionStatus

        # Create or get SUPER_USER role
        super_user_role = loaded_db.query(Role).filter(Role.name == "SUPER_USER").first()
        if not super_user_role:
            super_user_role = Role(name="SUPER_USER")
            loaded_db.add(super_user_role)
            loaded_db.commit()

        # Create super user with SUPER_USER role
        super_user = User(
            email="super@test.com", oidc_id="00000000-0000-0000-0000-000000000098", roles=[super_user_role]
        )
        loaded_db.add(super_user)
        loaded_db.commit()

        agreement = ContractAgreement(
            name="Test Agreement - Super User Awarded",
            agreement_type=AgreementType.CONTRACT,
            project_officer_id=super_user.id,
        )
        loaded_db.add(agreement)
        loaded_db.commit()

        # Create procurement action to make agreement awarded
        proc_action = ProcurementAction(
            agreement_id=agreement.id, status=ProcurementActionStatus.AWARDED, award_type=AwardType.NEW_AWARD
        )
        loaded_db.add(proc_action)
        loaded_db.commit()

        validator = AgreementValidator()
        # Try to update an immutable field (name is immutable for awarded ContractAgreement)
        updated_fields = {"name": "New Name Modified by Super User"}

        # Should not raise - super users can bypass immutable field validation
        validator.validate(agreement, super_user, updated_fields, loaded_db)

        # Cleanup
        loaded_db.delete(proc_action)
        loaded_db.delete(agreement)
        loaded_db.delete(super_user)
        loaded_db.commit()
