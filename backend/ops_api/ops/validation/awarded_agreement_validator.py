"""Validator for awarded agreements with additional business rules."""
from typing import List

from ops_api.ops.validation.agreement_validator import AgreementValidator
from ops_api.ops.validation.base import ValidationRule


class AwardedAgreementValidator(AgreementValidator):
    """
    Validator for awarded agreements with additional business rules.

    Extends AgreementValidator with rules specific to awarded agreements,
    such as immutable field validation.
    """

    def _get_default_validators(self) -> List[ValidationRule]:
        """
        Get validation rules for awarded agreements.

        Includes all base agreement rules plus awarded-specific rules.
        """
        from ops_api.ops.validation.rules.awarded import ImmutableAwardedFieldsRule

        # Get base validators
        base_validators = super()._get_default_validators()

        # Add awarded-specific validators
        awarded_validators = [
            ImmutableAwardedFieldsRule(),
        ]

        return base_validators + awarded_validators
