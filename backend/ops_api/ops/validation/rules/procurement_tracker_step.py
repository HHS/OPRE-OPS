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


class EvaluationCompletionRequiredFieldsRule(ValidationRule):
    """
    Validates that required fields are present when completing the Evaluation step.
    Only runs when status is being set to COMPLETED.
    """

    @property
    def name(self) -> str:
        return "Evaluation Completion Required Fields Check"

    def validate(self, procurement_tracker_step: ProcurementTrackerStep, context: ValidationContext) -> None:
        mapping = {
            "task_completed_by": "evaluation_task_completed_by",
            "date_completed": "evaluation_date_completed",
        }

        if not is_procurement_tracker_step_updated_to_complete(context):
            return

        updated_fields = context.updated_fields
        evaluation_required_fields = ["task_completed_by", "date_completed"]
        missing_fields = [field for field in evaluation_required_fields if field not in updated_fields]

        final_missing_fields = [
            field for field in missing_fields if getattr(procurement_tracker_step, mapping[field], None) is None
        ]

        if final_missing_fields:
            raise ValidationError(
                {field: f"{field} is required when completing evaluation step." for field in final_missing_fields}
            )


class PreAwardCompletionRequiredFieldsRule(ValidationRule):
    """
    Validates that required fields are present when completing the PRE_AWARD step.
    Only runs when status is being set to COMPLETED.
    """

    @property
    def name(self) -> str:
        return "PRE_AWARD Completion Required Fields Check"

    def validate(self, procurement_tracker_step: ProcurementTrackerStep, context: ValidationContext) -> None:
        mapping = {
            "task_completed_by": "pre_award_task_completed_by",
            "date_completed": "pre_award_date_completed",
        }

        if not is_procurement_tracker_step_updated_to_complete(context):
            return

        updated_fields = context.updated_fields
        pre_award_required_fields = ["task_completed_by", "date_completed"]

        # Check for missing fields
        missing_fields = [field for field in pre_award_required_fields if field not in updated_fields]

        # Check if missing fields are populated on model
        final_missing_fields = [
            field for field in missing_fields if getattr(procurement_tracker_step, mapping[field], None) is None
        ]

        # Check if any provided fields are explicitly set to None
        null_fields = [
            field for field in pre_award_required_fields if field in updated_fields and updated_fields[field] is None
        ]

        # Combine missing and null fields
        invalid_fields = list(set(final_missing_fields + null_fields))

        if invalid_fields:
            raise ValidationError(
                {field: f"{field} is required when completing PRE_AWARD step." for field in invalid_fields}
            )


class NoPastTargetCompletionDateUpdateRule(ValidationRule):
    """
    Validates that the target_completion_date is not in the past when being updated for pre-solicitation, evaluation, and pre-award steps.
    """

    @property
    def name(self) -> str:
        return "No Past Target Completion Date for Pre-Solicitation, Evaluation, and Pre-Award Steps Update"

    def validate(self, procurement_tracker_step: ProcurementTrackerStep, context: ValidationContext) -> None:
        updated_fields = context.updated_fields

        # Only validate if step type is PRE_SOLICITATION, EVALUATION, or PRE_AWARD and target_completion_date is being updated
        if (
            procurement_tracker_step.step_type
            not in [
                ProcurementTrackerStepType.PRE_SOLICITATION,
                ProcurementTrackerStepType.EVALUATION,
                ProcurementTrackerStepType.PRE_AWARD,
            ]
            or "target_completion_date" not in updated_fields
        ):
            return

        target_completion_date = updated_fields.get("target_completion_date")
        if target_completion_date and target_completion_date < date.today():
            step_name_map = {
                ProcurementTrackerStepType.PRE_SOLICITATION: "Pre-Solicitation",
                ProcurementTrackerStepType.EVALUATION: "Evaluation",
                ProcurementTrackerStepType.PRE_AWARD: "Pre-Award",
            }
            step_name = step_name_map.get(procurement_tracker_step.step_type, "")
            raise ValidationError(
                {"target_completion_date": f"Target completion date cannot be in the past for {step_name} steps."}
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
        elif procurement_tracker_step.step_type == ProcurementTrackerStepType.SOLICITATION:
            task_completed_by_id = procurement_tracker_step.solicitation_task_completed_by
        elif procurement_tracker_step.step_type == ProcurementTrackerStepType.EVALUATION:
            task_completed_by_id = procurement_tracker_step.evaluation_task_completed_by
        elif procurement_tracker_step.step_type == ProcurementTrackerStepType.PRE_AWARD:
            task_completed_by_id = procurement_tracker_step.pre_award_task_completed_by
        # If task_completed_by is not set, the CompletionRequiredFieldsRule will catch it
        if not task_completed_by_id:
            return

        # Validate the user association
        validate_task_completed_by_user_association(task_completed_by_id, context, procurement_tracker_step)


class SolicitationPeriodDateOrderRule(ValidationRule):
    """
    Validates that solicitation_period_start_date is earlier than solicitation_period_end_date
    for Solicitation steps.
    """

    @property
    def name(self) -> str:
        return "Solicitation Period Date Order Validation"

    def validate(self, procurement_tracker_step: ProcurementTrackerStep, context: ValidationContext) -> None:
        # Only validate if step type is SOLICITATION
        if procurement_tracker_step.step_type != ProcurementTrackerStepType.SOLICITATION:
            return

        updated_fields = context.updated_fields

        # Get start and end dates from update or model
        start_date = updated_fields.get(
            "solicitation_period_start_date", procurement_tracker_step.solicitation_period_start_date
        )
        end_date = updated_fields.get(
            "solicitation_period_end_date", procurement_tracker_step.solicitation_period_end_date
        )

        # Only validate if both dates are present
        if start_date and end_date:
            if start_date >= end_date:
                raise ValidationError(
                    {"solicitation_period_start_date": "Solicitation period start date must be earlier than end date."}
                )


class PreAwardApprovalRequestAuthorizationRule(ValidationRule):
    """
    Validates that the user requesting pre-award approval is authorized.
    Only checks when approval_requested fields are being updated for PRE_AWARD steps.
    """

    @property
    def name(self) -> str:
        return "PRE_AWARD Approval Request Authorization"

    def validate(self, procurement_tracker_step: ProcurementTrackerStep, context: ValidationContext) -> None:
        # Only validate if step type is PRE_AWARD
        if procurement_tracker_step.step_type != ProcurementTrackerStepType.PRE_AWARD:
            return

        updated_fields = context.updated_fields

        # Only validate if approval_requested fields are being updated
        # Use unprefixed field names as they appear in the API request before mapping
        # Note: approval_requested_by is server-controlled and not in this list
        approval_fields = [
            "approval_requested",
            "approval_requested_date",
            "requestor_notes",
        ]
        if not any(field in updated_fields for field in approval_fields):
            return

        # Check if procurement tracker step has a valid agreement
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

        # Verify user is authorized for the agreement
        if not check_user_association(agreement, context.user):
            raise AuthorizationError(
                f"User {context.user.id} is not authorized to request pre-award approval for procurement tracker step {procurement_tracker_step.id}.",
                "ProcurementTrackerStep",
            )


class NoBLIsInReviewForApprovalRequestRule(ValidationRule):
    """
    Validates that no budget line items are in review when requesting pre-award approval.
    Only checks when approval_requested is being set to true for PRE_AWARD steps.
    """

    @property
    def name(self) -> str:
        return "No BLIs In Review For Approval Request"

    def validate(self, procurement_tracker_step: ProcurementTrackerStep, context: ValidationContext) -> None:
        # Only validate if step type is PRE_AWARD
        if procurement_tracker_step.step_type != ProcurementTrackerStepType.PRE_AWARD:
            return

        updated_fields = context.updated_fields

        # Only validate if approval_requested is being set to true
        if updated_fields.get("approval_requested") is not True:
            return

        # Check if procurement tracker step has a valid agreement
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

        # Check if any budget line items are in review
        if agreement.budget_line_items:
            blis_in_review = [bli for bli in agreement.budget_line_items if bli.in_review]
            if blis_in_review:
                bli_ids = ", ".join(str(bli.id) for bli in blis_in_review)
                raise ValidationError(
                    {
                        "approval_requested": f"Cannot request pre-award approval while budget line items are in review. Budget line items in review: {bli_ids}"
                    }
                )


class Step4CompletionRequiredForApprovalRequestRule(ValidationRule):
    """
    Validates that Step 4 (Evaluation) is completed before allowing pre-award approval requests.
    Only checks when approval_requested is being set to true for PRE_AWARD steps.
    """

    @property
    def name(self) -> str:
        return "Step 4 Completion Required For Pre-Award Approval Request"

    def validate(self, procurement_tracker_step: ProcurementTrackerStep, context: ValidationContext) -> None:
        # Only validate if step type is PRE_AWARD
        if procurement_tracker_step.step_type != ProcurementTrackerStepType.PRE_AWARD:
            return

        updated_fields = context.updated_fields

        # Only validate if approval_requested is being set to true
        if updated_fields.get("approval_requested") is not True:
            return

        # Check if procurement tracker step has a valid tracker
        if not procurement_tracker_step.procurement_tracker:
            raise ValidationError(
                {
                    "procurement_tracker": f"Procurement tracker step {procurement_tracker_step.id} is not linked to a valid procurement tracker."
                }
            )

        procurement_tracker = procurement_tracker_step.procurement_tracker

        # Find Step 4 (Evaluation) in the tracker
        step_4 = next((step for step in procurement_tracker.steps if step.step_number == 4), None)

        # Step 4 must exist
        if not step_4:
            raise ValidationError(
                {
                    "approval_requested": "Cannot request pre-award approval: Step 4 (Evaluation) is missing from the procurement tracker."
                }
            )

        # Step 4 must be completed
        if step_4.status != ProcurementTrackerStepStatus.COMPLETED:
            raise ValidationError(
                {
                    "approval_requested": f"Cannot request pre-award approval: Step 4 (Evaluation) must be completed first. Current status: {step_4.status}"
                }
            )


class PreAwardApprovalResponseAuthorizationRule(ValidationRule):
    """
    Validates that the user responding to pre-award approval is authorized.
    Only checks when approval_status is being updated for PRE_AWARD steps.

    Authorized users are:
    - Division Directors and Deputy Directors (for divisions linked to the agreement)
    - BUDGET_TEAM role members
    - SYSTEM_OWNER role members
    """

    @property
    def name(self) -> str:
        return "PRE_AWARD Approval Response Authorization"

    def validate(self, procurement_tracker_step: ProcurementTrackerStep, context: ValidationContext) -> None:
        from ops_api.ops.utils.agreements_helpers import get_division_directors_for_agreement

        # Only validate if step type is PRE_AWARD
        if procurement_tracker_step.step_type != ProcurementTrackerStepType.PRE_AWARD:
            return

        updated_fields = context.updated_fields

        # Only validate if approval_status is being updated
        if "approval_status" not in updated_fields:
            return

        # Get the agreement
        if (
            not procurement_tracker_step.procurement_tracker
            or not procurement_tracker_step.procurement_tracker.agreement
        ):
            raise ValidationError({"agreement": "Procurement tracker step is not linked to a valid agreement."})

        agreement = procurement_tracker_step.procurement_tracker.agreement
        user_id = context.user.id

        # Check if user is a division director or deputy
        directors, deputies = get_division_directors_for_agreement(agreement)
        if user_id in directors or user_id in deputies:
            return

        # Check if user has BUDGET_TEAM or SYSTEM_OWNER role
        user = context.db_session.get(User, user_id)
        if user:
            user_role_names = {role.name for role in user.roles}
            if "BUDGET_TEAM" in user_role_names or "SYSTEM_OWNER" in user_role_names:
                return

        raise AuthorizationError(
            f"User {user_id} is not authorized to respond to pre-award approval requests for procurement tracker step {procurement_tracker_step.id}.",
            "ProcurementTrackerStep",
        )


class PreAwardApprovalResponseValidationRule(ValidationRule):
    """
    Validates that approval responses are valid:
    - Can only respond if approval has been requested
    - Cannot respond if already responded
    - Reviewer notes required when declining
    """

    @property
    def name(self) -> str:
        return "PRE_AWARD Approval Response Validation"

    def validate(self, procurement_tracker_step: ProcurementTrackerStep, context: ValidationContext) -> None:
        # Only validate if step type is PRE_AWARD
        if procurement_tracker_step.step_type != ProcurementTrackerStepType.PRE_AWARD:
            return

        updated_fields = context.updated_fields

        # Only validate if approval_status is being updated
        if "approval_status" not in updated_fields:
            return

        # Check if approval was requested
        if not procurement_tracker_step.pre_award_approval_requested:
            raise ValidationError(
                {"approval_status": "Cannot respond to approval request that has not been submitted."}
            )

        # Check if already responded
        if procurement_tracker_step.pre_award_approval_status:
            raise ValidationError(
                {
                    "approval_status": f"This approval request has already been {procurement_tracker_step.pre_award_approval_status.lower()}."
                }
            )

        # Require reviewer notes when declining
        if updated_fields["approval_status"] == "DECLINED":
            if not updated_fields.get("reviewer_notes") or not updated_fields["reviewer_notes"].strip():
                raise ValidationError(
                    {"reviewer_notes": "Reviewer notes are required when declining an approval request."}
                )


class NoBLIsInReviewForApprovalRequestRule(ValidationRule):
    """
    Validates that no budget line items are in review when requesting pre-award approval.
    Only checks when approval_requested is being set to true for PRE_AWARD steps.
    """

    @property
    def name(self) -> str:
        return "No BLIs In Review For Approval Request"

    def validate(self, procurement_tracker_step: ProcurementTrackerStep, context: ValidationContext) -> None:
        # Only validate if step type is PRE_AWARD
        if procurement_tracker_step.step_type != ProcurementTrackerStepType.PRE_AWARD:
            return

        updated_fields = context.updated_fields

        # Only validate if approval_requested is being set to true
        if updated_fields.get("approval_requested") is not True:
            return

        # Check if procurement tracker step has a valid agreement
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

        # Check if any budget line items are in review
        if agreement.budget_line_items:
            blis_in_review = [bli for bli in agreement.budget_line_items if bli.in_review]
            if blis_in_review:
                bli_ids = ", ".join(str(bli.id) for bli in blis_in_review)
>>>>>>> 492b1e083 (style: apply black formatting to validation rule)
                raise ValidationError(
                    {"reviewer_notes": "Reviewer notes are required when declining an approval request."}
                )
