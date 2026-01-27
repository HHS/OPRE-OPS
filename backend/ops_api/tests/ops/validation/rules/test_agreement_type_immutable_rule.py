"""Tests for AgreementTypeImmutableRule."""

import pytest

from models import AgreementType, ContractAgreement
from ops_api.ops.services.ops_service import ValidationError
from ops_api.ops.validation.context import ValidationContext
from ops_api.ops.validation.rules.agreement import AgreementTypeImmutableRule


class TestAgreementTypeImmutableRule:
    """Test suite for AgreementTypeImmutableRule."""

    def test_name_property(self, app_ctx):
        """Test that the rule has the correct name."""
        rule = AgreementTypeImmutableRule()
        assert rule.name == "Agreement Type Immutable"

    def test_validate_passes_when_agreement_type_not_in_update(self, test_user, loaded_db, app_ctx):
        """Test that validation passes when agreement_type is not being updated."""
        agreement = ContractAgreement(name="Test Agreement - Type Not Updated", agreement_type=AgreementType.CONTRACT)
        loaded_db.add(agreement)
        loaded_db.commit()

        context = ValidationContext(user=test_user, updated_fields={"name": "Updated Name"}, db_session=loaded_db)

        rule = AgreementTypeImmutableRule()
        # Should not raise
        rule.validate(agreement, context)

        # Cleanup
        loaded_db.delete(agreement)
        loaded_db.commit()

    def test_validate_passes_when_agreement_type_unchanged(self, test_user, loaded_db, app_ctx):
        """Test that validation passes when agreement_type is same as current."""
        agreement = ContractAgreement(name="Test Agreement - Type Unchanged", agreement_type=AgreementType.CONTRACT)
        loaded_db.add(agreement)
        loaded_db.commit()

        context = ValidationContext(
            user=test_user, updated_fields={"agreement_type": AgreementType.CONTRACT}, db_session=loaded_db
        )

        rule = AgreementTypeImmutableRule()
        # Should not raise
        rule.validate(agreement, context)

        # Cleanup
        loaded_db.delete(agreement)
        loaded_db.commit()

    def test_validate_raises_error_when_agreement_type_changes(self, test_user, loaded_db, app_ctx):
        """Test that validation fails when agreement_type is changed."""
        agreement = ContractAgreement(name="Test Agreement - Type Changed", agreement_type=AgreementType.CONTRACT)
        loaded_db.add(agreement)
        loaded_db.commit()

        context = ValidationContext(
            user=test_user, updated_fields={"agreement_type": AgreementType.GRANT}, db_session=loaded_db
        )

        rule = AgreementTypeImmutableRule()

        with pytest.raises(ValidationError) as exc_info:
            rule.validate(agreement, context)

        assert "agreement_type" in exc_info.value.validation_errors
        assert "Cannot change" in exc_info.value.validation_errors["agreement_type"]

        # Cleanup
        loaded_db.delete(agreement)
        loaded_db.commit()
