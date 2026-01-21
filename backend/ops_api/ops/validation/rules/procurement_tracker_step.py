from models import ProcurementTrackerStep
from ops_api.ops.services.ops_service import AuthorizationError, ValidationError
from ops_api.ops.utils.agreements_helpers import check_user_association
from ops_api.ops.validation.base import ValidationRule
from ops_api.ops.validation.context import ValidationContext


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
                f"Procurement tracker step {procurement_tracker_step.id} is not linked to a valid agreement.",
                "ProcurementTrackerStep",
            )
        agreement = procurement_tracker_step.procurement_tracker.agreement
        # Check if user is associated with the procurement tracker step using existing helper
        if not check_user_association(agreement, context.user):
            raise AuthorizationError(
                f"User {context.user.id} is not authorized to update procurement tracker step {procurement_tracker_step.id}.",
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
        updated_fields = context.updated_fields
        if procurement_tracker_step.status == "COMPLETED" and "status" not in updated_fields:
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
        required_fields = ["status", "task_completed_by", "date_completed"]
        presolicitation_field_found = [field for field in required_fields if field in updated_fields]
        if presolicitation_field_found:
            missing_fields = [field for field in required_fields if field not in updated_fields]
            if missing_fields:
                raise ValidationError(
                    {
                        field: f"{field} is required when updating procurement tracker step with presolicitation package provided."
                        for field in missing_fields
                    }
                )
