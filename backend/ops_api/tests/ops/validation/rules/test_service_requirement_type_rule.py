"""Tests for ServiceRequirementTypeRule."""

import pytest

from models import AgreementType, ContractAgreement, ServiceRequirementType
from models.agreements import GrantAgreement
from ops_api.ops.services.ops_service import ValidationError
from ops_api.ops.validation.context import ValidationContext
from ops_api.ops.validation.rules.agreement import ServiceRequirementTypeRule


class TestServiceRequirementTypeRule:
    """Test suite for ServiceRequirementTypeRule."""

    def test_name_property(self, app_ctx):
        rule = ServiceRequirementTypeRule()
        assert rule.name == "Service Requirement Type Required"

    def test_contract_with_service_requirement_type_set_passes(self, test_user, loaded_db, app_ctx):
        agreement = ContractAgreement(
            name="Test Contract - SRT Set",
            agreement_type=AgreementType.CONTRACT,
            service_requirement_type=ServiceRequirementType.SEVERABLE,
        )
        loaded_db.add(agreement)
        loaded_db.commit()

        context = ValidationContext(
            user=test_user,
            updated_fields={"service_requirement_type": ServiceRequirementType.SEVERABLE},
            db_session=loaded_db,
            metadata={"full_update": True},
        )

        rule = ServiceRequirementTypeRule()
        rule.validate(agreement, context)

        loaded_db.delete(agreement)
        loaded_db.commit()

    def test_contract_with_null_service_requirement_type_full_update_fails(self, test_user, loaded_db, app_ctx):
        agreement = ContractAgreement(
            name="Test Contract - SRT Null Full",
            agreement_type=AgreementType.CONTRACT,
            service_requirement_type=None,
        )
        loaded_db.add(agreement)
        loaded_db.commit()

        context = ValidationContext(
            user=test_user,
            updated_fields={"name": "Updated Name"},
            db_session=loaded_db,
            metadata={"full_update": True},
        )

        rule = ServiceRequirementTypeRule()

        with pytest.raises(ValidationError) as exc_info:
            rule.validate(agreement, context)

        assert "service_requirement_type" in exc_info.value.validation_errors

        loaded_db.delete(agreement)
        loaded_db.commit()

    def test_contract_patch_without_touching_field_passes(self, test_user, loaded_db, app_ctx):
        agreement = ContractAgreement(
            name="Test Contract - SRT Patch",
            agreement_type=AgreementType.CONTRACT,
            service_requirement_type=None,
        )
        loaded_db.add(agreement)
        loaded_db.commit()

        context = ValidationContext(
            user=test_user,
            updated_fields={"name": "Updated Name"},
            db_session=loaded_db,
            metadata={"full_update": False},
        )

        rule = ServiceRequirementTypeRule()
        rule.validate(agreement, context)

        loaded_db.delete(agreement)
        loaded_db.commit()

    def test_contract_explicitly_setting_null_fails(self, test_user, loaded_db, app_ctx):
        agreement = ContractAgreement(
            name="Test Contract - SRT Explicit Null",
            agreement_type=AgreementType.CONTRACT,
            service_requirement_type=ServiceRequirementType.SEVERABLE,
        )
        loaded_db.add(agreement)
        loaded_db.commit()

        context = ValidationContext(
            user=test_user,
            updated_fields={"service_requirement_type": None},
            db_session=loaded_db,
        )

        rule = ServiceRequirementTypeRule()

        with pytest.raises(ValidationError) as exc_info:
            rule.validate(agreement, context)

        assert "service_requirement_type" in exc_info.value.validation_errors

        loaded_db.delete(agreement)
        loaded_db.commit()

    def test_aa_agreement_with_null_service_requirement_type_full_update_fails(self, test_user, loaded_db, app_ctx):
        from unittest.mock import MagicMock

        agreement = MagicMock()
        agreement.agreement_type = AgreementType.AA
        agreement.service_requirement_type = None

        context = ValidationContext(
            user=test_user,
            updated_fields={"name": "Updated Name"},
            db_session=loaded_db,
            metadata={"full_update": True},
        )

        rule = ServiceRequirementTypeRule()

        with pytest.raises(ValidationError) as exc_info:
            rule.validate(agreement, context)

        assert "service_requirement_type" in exc_info.value.validation_errors

    def test_grant_agreement_with_null_service_requirement_type_passes(self, test_user, loaded_db, app_ctx):
        agreement = GrantAgreement(
            name="Test Grant - SRT Null OK",
            agreement_type=AgreementType.GRANT,
            service_requirement_type=None,
        )
        loaded_db.add(agreement)
        loaded_db.commit()

        context = ValidationContext(
            user=test_user,
            updated_fields={"name": "Updated Name"},
            db_session=loaded_db,
            metadata={"full_update": True},
        )

        rule = ServiceRequirementTypeRule()
        rule.validate(agreement, context)

        loaded_db.delete(agreement)
        loaded_db.commit()

    def test_iaa_agreement_with_null_service_requirement_type_passes(self, test_user, loaded_db, app_ctx):
        from unittest.mock import MagicMock

        agreement = MagicMock()
        agreement.agreement_type = AgreementType.IAA
        agreement.service_requirement_type = None

        context = ValidationContext(
            user=test_user,
            updated_fields={"name": "Updated Name"},
            db_session=loaded_db,
            metadata={"full_update": True},
        )

        rule = ServiceRequirementTypeRule()
        rule.validate(agreement, context)

    def test_direct_agreement_with_null_service_requirement_type_passes(self, test_user, loaded_db, app_ctx):
        from models import DirectAgreement

        agreement = DirectAgreement(
            name="Test Direct - SRT Null OK",
            agreement_type=AgreementType.DIRECT_OBLIGATION,
            service_requirement_type=None,
        )
        loaded_db.add(agreement)
        loaded_db.commit()

        context = ValidationContext(
            user=test_user,
            updated_fields={"name": "Updated Name"},
            db_session=loaded_db,
            metadata={"full_update": True},
        )

        rule = ServiceRequirementTypeRule()
        rule.validate(agreement, context)

        loaded_db.delete(agreement)
        loaded_db.commit()
