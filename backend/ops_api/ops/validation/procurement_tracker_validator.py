"""Procurement tracker orchestrator."""

from typing import Any, Dict, List

from sqlalchemy.orm import Session

from models import ProcurementTrackerStep, User
from ops_api.ops.validation.base import ValidationRule
from ops_api.ops.validation.context import ValidationContext


class ProcurementTrackerStepsValidator:
    """
    Orchestrates validation of procurement tracker update requests.

    Uses the Strategy pattern to execute a configurable list of validation rules.
    """

    def __init__(self, validators: List[ValidationRule] = None):
        """
        Initialize the validator.

        Args:
            validators: Optional list of validation rules to execute.
                       If None, uses default validators.
        """
        self.validators = validators or self._get_default_validators()

    def _get_default_validators(self) -> List[ValidationRule]:
        """
        Get the default set of validation rules for procurement tracker steps updates.

        Returns:
            List of validation rules in execution order
        """
        from ops_api.ops.validation.rules.procurement_tracker_step import (
            CompletedByAuthorizationRule,
            NoUpdatingCompletedProcurementStepRule,
            RequiredFieldsRule,
            ResourceExistsRule,
            UserAssociationRule,
        )

        return [
            ResourceExistsRule(),
            UserAssociationRule(),
            CompletedByAuthorizationRule(),
            NoUpdatingCompletedProcurementStepRule(),
            RequiredFieldsRule(),
        ]

    def validate_step(
        self,
        procurement_tracker_step: ProcurementTrackerStep,
        user: User,
        updated_fields: Dict[str, Any],
        db_session: Session,
    ) -> None:
        """
        Execute all validation rules in sequence.

        Args:
            procurement_tracker: The procurement tracker being validated
            user: The user making the request
            updated_fields: Dictionary of fields being updated
            db_session: Database session for queries

        Raises:
            ValidationError: If any validation fails
            ResourceNotFoundError: If resource not found
            AuthorizationError: If authorization fails
        """
        # Create validation context
        context = ValidationContext(user=user, updated_fields=updated_fields, db_session=db_session)

        # Execute all validators
        for validator in self.validators:
            validator.validate(procurement_tracker_step, context)

    def add_validator(self, validator: ValidationRule) -> None:
        """Add a validation rule to the validator."""
        self.validators.append(validator)

    def remove_validator(self, validator_class: type) -> None:
        """Remove a validation rule by class type."""
        self.validators = [v for v in self.validators if not isinstance(v, validator_class)]
