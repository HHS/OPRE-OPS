"""Tests for ImmutableAwardedFieldsRule."""

import pytest

from models import AgreementReason, AgreementType, ContractAgreement, GrantAgreement
from ops_api.ops.services.ops_service import ValidationError
from ops_api.ops.validation.context import ValidationContext
from ops_api.ops.validation.rules.awarded import ImmutableAwardedFieldsRule


class TestImmutableAwardedFieldsRule:
    """Test suite for ImmutableAwardedFieldsRule."""

    def test_name_property(self, app_ctx):
        """Test that the rule has the correct name."""
        rule = ImmutableAwardedFieldsRule()
        assert rule.name == "Immutable Awarded Fields"

    def test_validate_passes_when_agreement_not_awarded(self, test_user, loaded_db, app_ctx):
        """Test that validation passes when agreement is not awarded."""
        agreement = ContractAgreement(name="Test Agreement - Not Awarded", agreement_type=AgreementType.CONTRACT)
        # Ensure is_awarded returns False (no budget lines in obligated status)
        loaded_db.add(agreement)
        loaded_db.commit()

        context = ValidationContext(
            user=test_user, updated_fields={"name": "New Name", "contract_type": "NEW_TYPE"}, db_session=loaded_db
        )

        rule = ImmutableAwardedFieldsRule()
        # Should not raise even though trying to change immutable fields
        rule.validate(agreement, context)

        # Cleanup
        loaded_db.delete(agreement)
        loaded_db.commit()

    def test_validate_passes_when_no_immutable_fields_for_type(self, test_user, loaded_db, monkeypatch, app_ctx):
        """Test that validation passes for agreement types with no immutable fields."""
        agreement = GrantAgreement(name="Test Grant", agreement_type=AgreementType.GRANT)
        loaded_db.add(agreement)
        loaded_db.commit()

        # Mock is_awarded to return True
        monkeypatch.setattr(type(agreement), "is_awarded", property(lambda self: True))

        context = ValidationContext(user=test_user, updated_fields={"name": "New Name"}, db_session=loaded_db)

        rule = ImmutableAwardedFieldsRule()
        # Should not raise (GrantAgreement has no immutable fields)
        rule.validate(agreement, context)

        # Cleanup
        loaded_db.delete(agreement)
        loaded_db.commit()

    def test_validate_passes_when_immutable_field_value_unchanged(self, test_user, loaded_db, monkeypatch, app_ctx):
        """Test that validation passes when immutable field value stays the same."""
        agreement = ContractAgreement(name="Test Agreement - Field Unchanged", agreement_type=AgreementType.CONTRACT)
        loaded_db.add(agreement)
        loaded_db.commit()

        # Mock is_awarded to return True
        monkeypatch.setattr(type(agreement), "is_awarded", property(lambda self: True))

        context = ValidationContext(
            user=test_user,
            updated_fields={"name": "Test Agreement - Field Unchanged"},  # Same value
            db_session=loaded_db,
        )

        rule = ImmutableAwardedFieldsRule()
        # Should not raise (value not changing)
        rule.validate(agreement, context)

        # Cleanup
        loaded_db.delete(agreement)
        loaded_db.commit()

    def test_validate_passes_when_updating_non_immutable_field(self, test_user, loaded_db, monkeypatch, app_ctx):
        """Test that validation passes when updating non-immutable fields."""
        agreement = ContractAgreement(
            name="Test Agreement - Non Immutable Field", agreement_type=AgreementType.CONTRACT
        )
        loaded_db.add(agreement)
        loaded_db.commit()

        # Mock is_awarded to return True
        monkeypatch.setattr(type(agreement), "is_awarded", property(lambda self: True))

        context = ValidationContext(
            user=test_user,
            updated_fields={"description": "New description"},  # Not an immutable field
            db_session=loaded_db,
        )

        rule = ImmutableAwardedFieldsRule()
        # Should not raise
        rule.validate(agreement, context)

        # Cleanup
        loaded_db.delete(agreement)
        loaded_db.commit()

    def test_validate_raises_error_when_immutable_field_changed(self, test_user, loaded_db, monkeypatch, app_ctx):
        """Test that validation fails when an immutable field is changed on awarded agreement."""
        agreement = ContractAgreement(
            name="Test Agreement - Immutable Field Changed", agreement_type=AgreementType.CONTRACT
        )
        loaded_db.add(agreement)
        loaded_db.commit()

        # Mock is_awarded to return True
        monkeypatch.setattr(type(agreement), "is_awarded", property(lambda self: True))

        context = ValidationContext(
            user=test_user,
            updated_fields={"name": "New Name"},  # 'name' is immutable for ContractAgreement
            db_session=loaded_db,
        )

        rule = ImmutableAwardedFieldsRule()

        with pytest.raises(ValidationError) as exc_info:
            rule.validate(agreement, context)

        assert "name" in exc_info.value.validation_errors
        assert "immutable field" in exc_info.value.validation_errors["name"].lower()
        assert "awarded agreement" in exc_info.value.validation_errors["name"].lower()

        # Cleanup
        loaded_db.delete(agreement)
        loaded_db.commit()

    def test_validate_raises_error_for_multiple_immutable_fields_changed(self, test_user, loaded_db, monkeypatch, app_ctx):
        """Test that validation fails when multiple immutable fields are changed."""
        agreement = ContractAgreement(
            name="Test Agreement - Multiple Fields Changed",
            agreement_type=AgreementType.CONTRACT,
            agreement_reason=AgreementReason.RECOMPETE,
        )
        loaded_db.add(agreement)
        loaded_db.commit()

        # Mock is_awarded to return True
        monkeypatch.setattr(type(agreement), "is_awarded", property(lambda self: True))

        context = ValidationContext(
            user=test_user,
            updated_fields={"name": "New Name", "agreement_reason": AgreementReason.LOGICAL_FOLLOW_ON},
            db_session=loaded_db,
        )

        rule = ImmutableAwardedFieldsRule()

        with pytest.raises(ValidationError) as exc_info:
            rule.validate(agreement, context)

        # Should have errors for both fields
        assert "name" in exc_info.value.validation_errors
        assert "agreement_reason" in exc_info.value.validation_errors

        # Cleanup
        loaded_db.delete(agreement)
        loaded_db.commit()

    def test_validate_passes_when_user_is_superuser(self, loaded_db, monkeypatch, app_ctx):
        """Test that validation passes for super users."""
        from models import Role, User

        # Create or get SUPER_USER role
        super_user_role = loaded_db.query(Role).filter(Role.name == "SUPER_USER").first()
        if not super_user_role:
            super_user_role = Role(name="SUPER_USER")
            loaded_db.add(super_user_role)
            loaded_db.commit()

        # Create super user with SUPER_USER role
        super_user = User(
            email="super@test.com", oidc_id="00000000-0000-0000-0000-000000000099", roles=[super_user_role]
        )
        loaded_db.add(super_user)
        loaded_db.commit()

        agreement = ContractAgreement(name="Test Agreement - Super User", agreement_type=AgreementType.CONTRACT)
        loaded_db.add(agreement)
        loaded_db.commit()

        # Mock is_awarded to return True
        monkeypatch.setattr(type(agreement), "is_awarded", property(lambda self: True))

        context = ValidationContext(
            user=super_user, updated_fields={"name": "New Name"}, db_session=loaded_db  # Immutable field
        )

        rule = ImmutableAwardedFieldsRule()
        # Should not raise - super users can bypass immutable field validation
        rule.validate(agreement, context)

        # Cleanup
        loaded_db.delete(agreement)
        loaded_db.delete(super_user)
        loaded_db.commit()
