from datetime import date

from models import (
    ProcurementTrackerStep,
    ProcurementTrackerStepStatus,
    ProcurementTrackerStepType,
    User,
)
from ops_api.ops.services.ops_service import AuthorizationError, ResourceNotFoundError, ValidationError
from ops_api.ops.utils.agreements_helpers import check_user_association
from ops_api.ops.validation.base import ValidationRule
from ops_api.ops.validation.context import ValidationContext


class ResourceExistsRule(ValidationRule):
    """Validates that the procurement tracker step exists."""

    @property
    def name(self) -> str:
        return "Resource Exists"

    def validate(self, procurement_tracker_step: ProcurementTrackerStep, context: ValidationContext) -> None:
        if not procurement_tracker_step:
            raise ResourceNotFoundError("ProcurementTrackerStep", context.updated_fields.get("id"))


class UserAssociationRule(ValidationRule):
    """
    Validates that the user is associated with the procurement tracker step.
    """

    @property
    def name(self) -> str:
        return "User Association Check"

    def validate(self, procurement_tracker_step: ProcurementTrackerStep, context: ValidationContext) -> None:
        if (
            not procurement_tracker_step.procurement_tracker
            or not procurement_tracker_step.procurement_tracker.agreement
        ):
            raise ValidationError(
                {
                    "agreement": f"Procurement tracker step {procurement_tracker_step.id} is not linked to a valid agreement."
                }
            )
        agreement = procurement_tracker_step.procurement_tracker.agreement
        # Check if user is associated with the procurement tracker step using existing helper
        if not check_user_association(agreement, context.user):
            raise AuthorizationError(
                f"User {context.user.id} is not authorized to update procurement tracker step {procurement_tracker_step.id}.",
                "ProcurementTrackerStep",
            )


class CompletedByAuthorizationRule(ValidationRule):
    """
    Validates that task_completed_by is a user associated with the agreement.
    """

    @property
    def name(self) -> str:
        return "Completed By Authorization Check"

    def validate(self, procurement_tracker_step: ProcurementTrackerStep, context: ValidationContext) -> None:
        updated_fields = context.updated_fields
        if "task_completed_by" not in updated_fields:
            return

        task_completed_by_id = updated_fields.get("task_completed_by")
        if not task_completed_by_id:
            return

        # Get the user from database
        completed_by_user = context.db_session.get(User, task_completed_by_id)
        if not completed_by_user:
            # Raise Auth Error instead of validation error so users can't use this endpoint to figure out the valid existing users
            raise AuthorizationError(
                f"User {task_completed_by_id} is not authorized to be marked as task_completed_by for procurement tracker step {procurement_tracker_step.id}.",
                "ProcurementTrackerStep",
            )

        # Get the agreement
        if (
            not procurement_tracker_step.procurement_tracker
            or not procurement_tracker_step.procurement_tracker.agreement
        ):
            raise ValidationError({"task_completed_by": "Procurement tracker step is not linked to a valid agreement."})

        agreement = procurement_tracker_step.procurement_tracker.agreement

        # Check if the completed_by user is associated with the agreement
        if not check_user_association(agreement, completed_by_user):
            raise AuthorizationError(
                f"User {task_completed_by_id} is not authorized to be marked as task_completed_by for procurement tracker step {procurement_tracker_step.id}.",
                "ProcurementTrackerStep",
            )


class NoUpdatingCompletedProcurementStepRule(ValidationRule):
    """
    Validates that completed procurement tracker steps cannot be updated.
    """

    @property
    def name(self) -> str:
        return "No Updating Completed Procurement Step"

    def validate(self, procurement_tracker_step: ProcurementTrackerStep, context: ValidationContext) -> None:
        if procurement_tracker_step.status == ProcurementTrackerStepStatus.COMPLETED:
            raise ValidationError({"status": "Cannot update a procurement tracker step that is already completed."})


class RequiredFieldsRule(ValidationRule):
    """
    Validates that required fields are present when updating a procurement tracker step.
    """

    @property
    def name(self) -> str:
        return "Required Fields Check"

    def validate(self, procurement_tracker_step: ProcurementTrackerStep, context: ValidationContext) -> None:
        updated_fields = context.updated_fields
        if procurement_tracker_step.step_type == ProcurementTrackerStepType.ACQUISITION_PLANNING:
            acquisition_planning = ["notes", "task_completed_by", "date_completed"]
            required_acquisition_planning_fields = ["task_completed_by", "date_completed"]
            acquisition_planning_field_found = [field for field in acquisition_planning if field in updated_fields]
            if acquisition_planning_field_found:
                missing_fields = [
                    field for field in required_acquisition_planning_fields if field not in updated_fields
                ]
                if missing_fields:
                    raise ValidationError(
                        {
                            field: f"{field} is required when updating procurement tracker step with acquisition planning package provided."
                            for field in missing_fields
                        }
                    )
        else:
            return  # Not required fields yet for other step types


class NoFutureCompletionDateForAcquisitionPlanningRule(ValidationRule):
    """
    Validates that the date_completed is not in the future for Acquisition Planning steps.
    """

    @property
    def name(self) -> str:
        return "No Future Completion Date for Acquisition Planning"

    def validate(self, procurement_tracker_step: ProcurementTrackerStep, context: ValidationContext) -> None:
        updated_fields = context.updated_fields

        # Only validate if date_completed is being updated
        if "date_completed" not in updated_fields:
            return

        # Only validate for Acquisition Planning steps
        if procurement_tracker_step.step_type != ProcurementTrackerStepType.ACQUISITION_PLANNING:
            return

        date_completed = updated_fields.get("date_completed")
        if not date_completed:
            # Only matters if date_completed is provided
            return

        # Check if date_completed is in the future
        if date_completed > date.today():
            raise ValidationError(
                {"date_completed": "Completion date cannot be in the future for Acquisition Planning steps."}
            )
