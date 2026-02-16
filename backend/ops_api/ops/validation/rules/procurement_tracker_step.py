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


def validate_task_completed_by_user_association(
    task_completed_by_id: int, context, procurement_tracker_step: ProcurementTrackerStep
) -> None:
    """Validates that the task_completed_by user is associated with the agreement linked to the procurement tracker step."""
    # Get the user from database
    completed_by_user = context.db_session.get(User, task_completed_by_id)
    if not completed_by_user:
        # Raise Auth Error instead of validation error so users can't use this endpoint to figure out the valid existing users
        raise AuthorizationError(
            f"User {task_completed_by_id} is not authorized to be marked as task_completed_by for procurement tracker step {procurement_tracker_step.id}.",
            "ProcurementTrackerStep",
        )

    # Get the agreement
    if not procurement_tracker_step.procurement_tracker or not procurement_tracker_step.procurement_tracker.agreement:
        raise ValidationError({"task_completed_by": "Procurement tracker step is not linked to a valid agreement."})

    agreement = procurement_tracker_step.procurement_tracker.agreement

    # Check if the completed_by user is associated with the agreement
    if not check_user_association(agreement, completed_by_user):
        raise AuthorizationError(
            f"User {task_completed_by_id} is not authorized to be marked as task_completed_by for procurement tracker step {procurement_tracker_step.id}.",
            "ProcurementTrackerStep",
        )


def is_procurement_tracker_step_updated_to_complete(context: ValidationContext) -> bool:
    """Checks if the procurement tracker step is being updated to completed status."""
    updated_fields = context.updated_fields
    return "status" in updated_fields and updated_fields["status"] == ProcurementTrackerStepStatus.COMPLETED


def is_date_completed_in_future(date_completed: date) -> bool:
    """Checks if the date_completed field is being updated to a future date."""
    # Check if date_completed is in the future
    if date_completed > date.today():
        return True
    else:
        return False


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


class CompletedByUpdateAuthorizationRule(ValidationRule):
    """
    Validates that task_completed_by is a user associated with the agreement.
    """

    @property
    def name(self) -> str:
        return "Completed By Authorization Check"

    def validate(self, procurement_tracker_step: ProcurementTrackerStep, context: ValidationContext) -> None:
        updated_fields = context.updated_fields
        if "task_completed_by" in updated_fields:
            # Only validate if task_completed_by is being updated
            task_completed_by_id = updated_fields.get("task_completed_by")
            if not task_completed_by_id:
                return

            validate_task_completed_by_user_association(task_completed_by_id, context, procurement_tracker_step)


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


class AcquisitionPlanningRequiredFieldsRule(ValidationRule):
    """
    Validate that when update an Acquisition Planning step all required fields are present.
    Given how this step does not care about what's already on the model and requires all fields to be present on update,
    it runs its own special required fields function.
    """

    @property
    def name(self) -> str:
        return "Required Fields Check"

    def validate(self, procurement_tracker_step: ProcurementTrackerStep, context: ValidationContext) -> None:

        updated_fields = context.updated_fields
        acquisition_planning = ["notes", "task_completed_by", "date_completed"]
        required_acquisition_planning_fields = ["task_completed_by", "date_completed"]
        acquisition_planning_field_found = [field for field in acquisition_planning if field in updated_fields]
        if acquisition_planning_field_found:
            missing_fields = [field for field in required_acquisition_planning_fields if field not in updated_fields]
            if missing_fields:
                raise ValidationError(
                    {
                        field: f"{field} is required when updating procurement tracker step with acquisition planning package provided."
                        for field in missing_fields
                    }
                )


class NoFutureCompletionDateUpdateValidationRule(ValidationRule):
    """
    Validates that the date_completed is not in the future for procurement tracker steps steps.
    """

    @property
    def name(self) -> str:
        return "No Future Completion Date for Procurement Tracker Steps Update"

    def validate(self, procurement_tracker_step: ProcurementTrackerStep, context: ValidationContext) -> None:
        updated_fields = context.updated_fields

        # Only validate if date_completed is being updated
        if "date_completed" not in updated_fields:
            return

        date_completed = updated_fields.get("date_completed")

        if is_date_completed_in_future(date_completed):
            raise ValidationError(
                {"date_completed": "Completion date cannot be in the future for Procurement Tracker Steps."}
            )


class PreSolicitationCompletionRequiredFieldsRule(ValidationRule):
    """
    Validates that all required fields are present on the model when completing the Pre-Solicitation step.
    Only runs when status is being set to COMPLETED.
    """

    @property
    def name(self) -> str:
        return "Completion Required Fields Check"

    def validate(self, procurement_tracker_step: ProcurementTrackerStep, context: ValidationContext) -> None:
        mapping = {
            "task_completed_by": "pre_solicitation_task_completed_by",
            "date_completed": "pre_solicitation_date_completed",
        }
        # Only run if status is being set to COMPLETED
        if not is_procurement_tracker_step_updated_to_complete(context):
            return

        updated_fields = context.updated_fields
        presolicitation_required_fields = ["task_completed_by", "date_completed"]
        # Check update for missing fields
        missing_fields = [field for field in presolicitation_required_fields if field not in updated_fields]

        # If any fields are missing from update, check if they're populated on model
        final_missing_fields = [
            field for field in missing_fields if getattr(procurement_tracker_step, mapping[field], None) is None
        ]

        if final_missing_fields:
            raise ValidationError(
                {
                    field: f"{field} is required when updating procurement tracker step with pre-solicitation package provided."
                    for field in final_missing_fields
                }
            )


class NoPastTargetCompletionDateUpdateRule(ValidationRule):
    """
    Validates that the pre_solicitation_target_completion_date is not in the past when being updated for pre-solicitation steps.
    """

    @property
    def name(self) -> str:
        return "No Past Target Completion Date for Pre-Solicitation Steps Update"

    def validate(self, procurement_tracker_step: ProcurementTrackerStep, context: ValidationContext) -> None:
        updated_fields = context.updated_fields

        # Only validate if step type is PRE_SOLICITATION and pre_solicitation_target_completion_date is being updated
        if (
            procurement_tracker_step.step_type != ProcurementTrackerStepType.PRE_SOLICITATION
            or "target_completion_date" not in updated_fields
        ):
            return

        target_completion_date = updated_fields.get("target_completion_date")
        if target_completion_date and target_completion_date < date.today():
            raise ValidationError(
                {"target_completion_date": "Target completion date cannot be in the past for Pre-Solicitation steps."}
            )


class NoPastTargetCompletionDateOnModelRule(ValidationRule):
    """
    Validates that the pre_solicitation_target_completion_date is not in the past when being updated for pre-solicitation steps.
    This rule is meant to validate the field on the model, which could have been valid at the time of update but becomes invalid over time.
    """

    @property
    def name(self) -> str:
        return "No Past Target Completion Date for Pre-Solicitation Steps on Model"

    def validate(self, procurement_tracker_step: ProcurementTrackerStep, context: ValidationContext) -> None:
        # Only validate if step type is PRE_SOLICITATION
        if procurement_tracker_step.step_type != ProcurementTrackerStepType.PRE_SOLICITATION:
            return

        target_completion_date = procurement_tracker_step.pre_solicitation_target_completion_date

        if target_completion_date and target_completion_date < date.today():
            raise ValidationError(
                {
                    "pre_solicitation_target_completion_date": "Target completion date cannot be in the past for Pre-Solicitation steps."
                }
            )


class NoPastDraftSolicitationDateUpdateRule(ValidationRule):
    """
    Validates that the pre_solicitation_draft_solicitation_date is not in the past when being updated for pre-solicitation steps.
    """

    @property
    def name(self) -> str:
        return "No Past Draft Solicitation Date for Pre-Solicitation Steps Update"

    def validate(self, procurement_tracker_step: ProcurementTrackerStep, context: ValidationContext) -> None:
        updated_fields = context.updated_fields

        # Only validate if step type is PRE_SOLICITATION and pre_solicitation_draft_solicitation_date is being updated
        if (
            procurement_tracker_step.step_type != ProcurementTrackerStepType.PRE_SOLICITATION
            or "draft_solicitation_date" not in updated_fields
        ):
            return

        draft_solicitation_date = updated_fields.get("draft_solicitation_date")
        if draft_solicitation_date and draft_solicitation_date < date.today():
            raise ValidationError(
                {"draft_solicitation_date": "Draft solicitation date cannot be in the past for Pre-Solicitation steps."}
            )


class NoPastDraftSolicitationDateOnModelRule(ValidationRule):
    """
    Validates that the pre_solicitation_draft_solicitation_date is not in the past when being updated for pre-solicitation steps.
    This rule is meant to validate the field on the model, which could have been valid at the time of update but becomes invalid over time.
    """

    @property
    def name(self) -> str:
        return "No Past Draft Solicitation Date for Pre-Solicitation Steps on Model"

    def validate(self, procurement_tracker_step: ProcurementTrackerStep, context: ValidationContext) -> None:
        # Only validate if step type is PRE_SOLICITATION
        if procurement_tracker_step.step_type != ProcurementTrackerStepType.PRE_SOLICITATION:
            return

        draft_solicitation_date = procurement_tracker_step.pre_solicitation_draft_solicitation_date

        if draft_solicitation_date and draft_solicitation_date and draft_solicitation_date < date.today():
            raise ValidationError(
                {
                    "pre_solicitation_draft_solicitation_date": "Draft solicitation date cannot be in the past for Pre-Solicitation steps."
                }
            )


class CompletionAuthorizationRule(ValidationRule):
    """
    Validates that task_completed_by is properly associated with the agreement when completing.
    Only runs when status is being set to COMPLETED.
    """

    @property
    def name(self) -> str:
        return "Completion Authorization Check"

    def validate(self, procurement_tracker_step: ProcurementTrackerStep, context: ValidationContext) -> None:
        # Only run if status is being set to COMPLETED
        if not is_procurement_tracker_step_updated_to_complete(context):
            return

        # Get the task_completed_by value from the model based on step type
        task_completed_by_id = None
        if procurement_tracker_step.step_type == ProcurementTrackerStepType.ACQUISITION_PLANNING:
            task_completed_by_id = procurement_tracker_step.acquisition_planning_task_completed_by
        elif procurement_tracker_step.step_type == ProcurementTrackerStepType.PRE_SOLICITATION:
            task_completed_by_id = procurement_tracker_step.pre_solicitation_task_completed_by

        # If task_completed_by is not set, the CompletionAcquisitionPlanningRequiredFieldsRule will catch it
        if not task_completed_by_id:
            return

        # Validate the user association
        validate_task_completed_by_user_association(task_completed_by_id, context, procurement_tracker_step)


class NotesMaxLengthUpdateRule(ValidationRule):
    """
    Validates that the notes field does not exceed 750 characters when being updated.
    """

    MAX_NOTES_LENGTH = 750

    @property
    def name(self) -> str:
        return "Notes Max Length Check"

    def validate(self, procurement_tracker_step: ProcurementTrackerStep, context: ValidationContext) -> None:
        updated_fields = context.updated_fields

        # Only validate if notes is being updated
        if "notes" not in updated_fields:
            return

        notes = updated_fields.get("notes")

        # Skip validation if notes is None or empty
        if not notes:
            return

        # Check if notes exceeds maximum length
        if len(notes) > self.MAX_NOTES_LENGTH:
            raise ValidationError(
                {"notes": f"Notes cannot exceed {self.MAX_NOTES_LENGTH} characters. Current length: {len(notes)}."}
            )
