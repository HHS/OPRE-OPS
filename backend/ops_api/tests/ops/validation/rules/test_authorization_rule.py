"""Tests for AuthorizationRule."""

import pytest

from models import AgreementType, ContractAgreement, Role, User
from ops_api.ops.services.ops_service import AuthorizationError
from ops_api.ops.validation.context import ValidationContext
from ops_api.ops.validation.rules.agreement import AuthorizationRule


class TestAuthorizationRule:
    """Test suite for AuthorizationRule."""

    def test_name_property(self, app_ctx):
        """Test that the rule has the correct name."""
        rule = AuthorizationRule()
        assert rule.name == "Authorization Check"

    def test_validate_passes_when_user_is_project_officer(self, test_user, loaded_db, app_ctx):
        """Test that validation passes when user is the project officer."""
        agreement = ContractAgreement(
            name="Test Agreement - PO Auth", agreement_type=AgreementType.CONTRACT, project_officer_id=test_user.id
        )
        loaded_db.add(agreement)
        loaded_db.commit()

        context = ValidationContext(user=test_user, updated_fields={"name": "Updated Name"}, db_session=loaded_db)

        rule = AuthorizationRule()
        # Should not raise
        rule.validate(agreement, context)

        # Cleanup
        loaded_db.delete(agreement)
        loaded_db.commit()

    def test_validate_passes_when_user_is_alternate_project_officer(self, test_user, loaded_db, app_ctx):
        """Test that validation passes when user is the alternate project officer."""
        agreement = ContractAgreement(
            name="Test Agreement - APO Auth",
            agreement_type=AgreementType.CONTRACT,
            alternate_project_officer_id=test_user.id,
        )
        loaded_db.add(agreement)
        loaded_db.commit()

        context = ValidationContext(user=test_user, updated_fields={"name": "Updated Name"}, db_session=loaded_db)

        rule = AuthorizationRule()
        # Should not raise
        rule.validate(agreement, context)

        # Cleanup
        loaded_db.delete(agreement)
        loaded_db.commit()

    def test_validate_passes_when_user_is_team_member(self, test_user, loaded_db, app_ctx):
        """Test that validation passes when user is a team member."""
        agreement = ContractAgreement(
            name="Test Agreement - Team Member Auth", agreement_type=AgreementType.CONTRACT, team_members=[test_user]
        )
        loaded_db.add(agreement)
        loaded_db.commit()

        context = ValidationContext(user=test_user, updated_fields={"name": "Updated Name"}, db_session=loaded_db)

        rule = AuthorizationRule()
        # Should not raise
        rule.validate(agreement, context)

        # Cleanup
        loaded_db.delete(agreement)
        loaded_db.commit()

    def test_validate_raises_error_when_user_not_authorized(self, loaded_db, app_ctx):
        """Test that validation fails when user is not authorized."""
        # Create unauthorized user
        unauthorized_user = User(email="unauthorized@test.com", oidc_id="00000000-0000-0000-0000-000000000001")
        loaded_db.add(unauthorized_user)

        # Create agreement without the unauthorized user
        agreement = ContractAgreement(name="Test Agreement - Unauthorized", agreement_type=AgreementType.CONTRACT)
        loaded_db.add(agreement)
        loaded_db.commit()

        context = ValidationContext(
            user=unauthorized_user, updated_fields={"name": "Updated Name"}, db_session=loaded_db
        )

        rule = AuthorizationRule()

        with pytest.raises(AuthorizationError) as exc_info:
            rule.validate(agreement, context)

        assert "not authorized" in str(exc_info.value).lower()
        assert str(unauthorized_user.id) in str(exc_info.value)

        # Cleanup
        loaded_db.delete(agreement)
        loaded_db.delete(unauthorized_user)
        loaded_db.commit()

    def test_validate_passes_when_user_has_admin_role(self, loaded_db, app_ctx):
        """Test that validation passes when user has SYSTEM_OWNER role."""
        # Create admin user with SYSTEM_OWNER role
        admin_role = Role(name="SYSTEM_OWNER")
        admin_user = User(email="admin@test.com", oidc_id="00000000-0000-0000-0000-000000000002", roles=[admin_role])
        loaded_db.add(admin_user)

        # Create agreement
        agreement = ContractAgreement(name="Test Agreement - Admin Auth", agreement_type=AgreementType.CONTRACT)
        loaded_db.add(agreement)
        loaded_db.commit()

        context = ValidationContext(user=admin_user, updated_fields={"name": "Updated Name"}, db_session=loaded_db)

        rule = AuthorizationRule()
        # Should not raise
        rule.validate(agreement, context)

        # Cleanup
        loaded_db.delete(agreement)
        loaded_db.delete(admin_user)
        loaded_db.delete(admin_role)
        loaded_db.commit()
