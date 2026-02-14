"""Procurement tracker orchestrator."""

from typing import Any, Dict, List

from sqlalchemy.orm import Session

from models import ProcurementTrackerStep, ProcurementTrackerStepStatus, ProcurementTrackerStepType, User
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
            AcquisitionPlanningRequiredFieldsRule,
            CompletedByUpdateAuthorizationRule,
            CompletionAuthorizationRule,
            NoUpdatingCompletedProcurementStepRule,
            ResourceExistsRule,
            UserAssociationRule,
        )

        return [
            ResourceExistsRule(),
            UserAssociationRule(),
            CompletedByUpdateAuthorizationRule(),
            NoUpdatingCompletedProcurementStepRule(),
            AcquisitionPlanningRequiredFieldsRule(),
            CompletionAuthorizationRule(),
        ]

    @staticmethod
    def _is_data_completed_step(data: dict) -> bool:
        """Helper method to determine if the update is marking the step as completed."""
        return data and data.get("status", None) == ProcurementTrackerStepStatus.COMPLETED

    def update_validators_for_step(self, procurement_tracker_step: ProcurementTrackerStep, data: dict = None) -> None:
        """
        Update the list of validators based on the procurement tracker step's current state.

        This allows us to have dynamic validation logic depending on the step type or status.

        Args:
            procurement_tracker_step: The procurement tracker step being validated
        """
        self.validators = self._get_validators(procurement_tracker_step, data)

    def _get_validators(
        self, procurement_tracker_step: ProcurementTrackerStep, data: dict = None
    ) -> List[ValidationRule]:
        """
        Get the list of validators to execute based on the procurement tracker step's current state.

        For example, if the step is already completed, we may want to skip certain validators.

        Args:
            procurement_tracker_step: The procurement tracker step being validated
        """
        from ops_api.ops.validation.rules.procurement_tracker_step import (
            AcquisitionPlanningRequiredFieldsRule,
            CompletedByUpdateAuthorizationRule,
            NoFutureCompletionDateUpdateValidationRule,
            NoPastDraftSolicitationDateOnModelRule,
            NoPastDraftSolicitationDateUpdateRule,
            NoPastTargetCompletionDateOnModelRule,
            NoPastTargetCompletionDateUpdateRule,
            NotesMaxLengthUpdateRule,
            NoUpdatingCompletedProcurementStepRule,
            PreSolicitationCompletionRequiredFieldsRule,
            ResourceExistsRule,
            UserAssociationRule,
        )

        if procurement_tracker_step.step_type == ProcurementTrackerStepType.ACQUISITION_PLANNING:
            return [
                ResourceExistsRule(),
                UserAssociationRule(),
                CompletedByUpdateAuthorizationRule(),
                NoUpdatingCompletedProcurementStepRule(),
                AcquisitionPlanningRequiredFieldsRule(),
                NoFutureCompletionDateUpdateValidationRule(),
                NotesMaxLengthUpdateRule(),
            ]
        elif procurement_tracker_step.step_type == ProcurementTrackerStepType.PRE_SOLICITATION:
            if ProcurementTrackerStepsValidator._is_data_completed_step(data):
                # For pre-solicitation steps being marked as completed, we require additional validation
                return [
                    ResourceExistsRule(),
                    UserAssociationRule(),
                    PreSolicitationCompletionRequiredFieldsRule(),
                    CompletedByUpdateAuthorizationRule(),
                    NoUpdatingCompletedProcurementStepRule(),
                    NoFutureCompletionDateUpdateValidationRule(),
                    NoPastTargetCompletionDateUpdateRule(),
                    NoPastTargetCompletionDateOnModelRule(),
                    NoPastDraftSolicitationDateUpdateRule(),
                    NoPastDraftSolicitationDateOnModelRule(),
                    NotesMaxLengthUpdateRule(),
                ]
            else:
                # Non-final updates to presolicitation steps require smaller rule set
                return [
                    ResourceExistsRule(),
                    UserAssociationRule(),
                    CompletedByUpdateAuthorizationRule(),
                    NoUpdatingCompletedProcurementStepRule(),
                    NoFutureCompletionDateUpdateValidationRule(),
                    NoPastTargetCompletionDateUpdateRule(),
                    NoPastDraftSolicitationDateUpdateRule(),
                    NotesMaxLengthUpdateRule(),
                ]

        else:
            return self._get_default_validators()

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
