"""Tests for AwardedAgreementValidator."""

import pytest

from models import AgreementType, ContractAgreement
from ops_api.ops.services.ops_service import ValidationError
from ops_api.ops.validation.awarded_agreement_validator import AwardedAgreementValidator
from ops_api.ops.validation.rules.awarded import ImmutableAwardedFieldsRule


class TestAwardedAgreementValidator:
    """Test suite for AwardedAgreementValidator."""

    def test_validator_includes_base_and_awarded_validators(self, app_ctx):
        """Test that AwardedAgreementValidator includes both base and awarded-specific validators."""
        validator = AwardedAgreementValidator()

        # Should have base validators (5) + awarded validators (1) = 6
        assert len(validator.validators) == 6

        # Check that ImmutableAwardedFieldsRule is included
        awarded_rule_present = any(isinstance(v, ImmutableAwardedFieldsRule) for v in validator.validators)
        assert awarded_rule_present

    def test_validate_raises_error_for_immutable_field_on_awarded_agreement(
        self, test_user, loaded_db, monkeypatch, app_ctx
    ):
        """Test that validator prevents immutable field changes on awarded agreements."""
        agreement = ContractAgreement(
            name="Test Agreement - Awarded Immutable Field",
            agreement_type=AgreementType.CONTRACT,
            project_officer_id=test_user.id,
        )
        loaded_db.add(agreement)
        loaded_db.commit()

        # Mock is_awarded to return True
        monkeypatch.setattr(type(agreement), "is_awarded", property(lambda self: True))

        validator = AwardedAgreementValidator()
        updated_fields = {"name": "New Name"}

        with pytest.raises(ValidationError) as exc_info:
            validator.validate(agreement, test_user, updated_fields, loaded_db)

        assert "name" in exc_info.value.validation_errors
        assert "immutable" in exc_info.value.validation_errors["name"].lower()

        # Cleanup
        loaded_db.delete(agreement)
        loaded_db.commit()

    def test_validate_allows_non_immutable_field_changes_on_awarded_agreement(
        self, test_user, loaded_db, monkeypatch, app_ctx
    ):
        """Test that validator allows non-immutable field changes on awarded agreements."""
        agreement = ContractAgreement(
            name="Test Agreement - Awarded Non Immutable",
            agreement_type=AgreementType.CONTRACT,
            project_officer_id=test_user.id,
        )
        loaded_db.add(agreement)
        loaded_db.commit()

        # Mock is_awarded to return True
        monkeypatch.setattr(type(agreement), "is_awarded", property(lambda self: True))

        validator = AwardedAgreementValidator()
        updated_fields = {"description": "New description"}  # Not an immutable field

        # Should not raise
        validator.validate(agreement, test_user, updated_fields, loaded_db)

        # Cleanup
        loaded_db.delete(agreement)
        loaded_db.commit()

    def test_validate_still_checks_base_validation_rules(self, loaded_db, monkeypatch, app_ctx):
        """Test that AwardedAgreementValidator still checks base validation rules."""
        from models import User

        # Create unauthorized user
        unauthorized_user = User(email="unauth@test.com", oidc_id="00000000-0000-0000-0000-000000000004")
        loaded_db.add(unauthorized_user)

        agreement = ContractAgreement(name="Test Agreement - Base Rules Check", agreement_type=AgreementType.CONTRACT)
        loaded_db.add(agreement)
        loaded_db.commit()

        # Mock is_awarded to return True
        monkeypatch.setattr(type(agreement), "is_awarded", property(lambda self: True))

        validator = AwardedAgreementValidator()
        updated_fields = {"description": "New description"}

        # Should still fail authorization check (base rule)
        with pytest.raises(Exception):  # Will be AuthorizationError
            validator.validate(agreement, unauthorized_user, updated_fields, loaded_db)

        # Cleanup
        loaded_db.delete(agreement)
        loaded_db.delete(unauthorized_user)
        loaded_db.commit()

    def test_validator_can_be_initialized_with_custom_validators(self, app_ctx):
        """Test that AwardedAgreementValidator can accept custom validators."""
        from ops_api.ops.validation.rules.agreement import AgreementTypeImmutableRule

        custom_validators = [AgreementTypeImmutableRule()]
        validator = AwardedAgreementValidator(validators=custom_validators)

        assert len(validator.validators) == 1
        assert isinstance(validator.validators[0], AgreementTypeImmutableRule)
