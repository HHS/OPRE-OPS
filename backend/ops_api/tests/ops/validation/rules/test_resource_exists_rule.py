"""Tests for ResourceExistsRule."""

import pytest

from models import AgreementType, ContractAgreement
from ops_api.ops.services.ops_service import ResourceNotFoundError
from ops_api.ops.validation.context import ValidationContext
from ops_api.ops.validation.rules.agreement import ResourceExistsRule


class TestResourceExistsRule:
    """Test suite for ResourceExistsRule."""

    def test_name_property(self, app_ctx):
        """Test that the rule has the correct name."""
        rule = ResourceExistsRule()
        assert rule.name == "Resource Exists"

    def test_validate_passes_when_agreement_exists(self, test_user, loaded_db, app_ctx):
        """Test that validation passes when agreement exists."""
        agreement = ContractAgreement(name="Test Agreement - Exists", agreement_type=AgreementType.CONTRACT)
        loaded_db.add(agreement)
        loaded_db.commit()

        context = ValidationContext(user=test_user, updated_fields={"name": "Updated Name"}, db_session=loaded_db)

        rule = ResourceExistsRule()
        # Should not raise
        rule.validate(agreement, context)

        # Cleanup
        loaded_db.delete(agreement)
        loaded_db.commit()

    def test_validate_raises_error_when_agreement_is_none(self, test_user, loaded_db, app_ctx):
        """Test that validation fails when agreement is None."""
        context = ValidationContext(
            user=test_user, updated_fields={"id": 999, "name": "Updated Name"}, db_session=loaded_db
        )

        rule = ResourceExistsRule()

        with pytest.raises(ResourceNotFoundError) as exc_info:
            rule.validate(None, context)

        assert "Agreement" in str(exc_info.value)
        assert "999" in str(exc_info.value)

    def test_validate_uses_id_from_context(self, test_user, loaded_db, app_ctx):
        """Test that the error message includes ID from context."""
        agreement_id = 12345
        context = ValidationContext(user=test_user, updated_fields={"id": agreement_id}, db_session=loaded_db)

        rule = ResourceExistsRule()

        with pytest.raises(ResourceNotFoundError) as exc_info:
            rule.validate(None, context)

        assert str(agreement_id) in str(exc_info.value)
