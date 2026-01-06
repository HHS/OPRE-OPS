"""Concrete validation rules for agreement updates."""

from models import Agreement, BudgetLineItemStatus, ResearchMethodology, SpecialTopic
from ops_api.ops.services.ops_service import (
    AuthorizationError,
    ResourceNotFoundError,
    ValidationError,
)
from ops_api.ops.utils.agreements_helpers import check_user_association
from ops_api.ops.validation.base import ValidationRule
from ops_api.ops.validation.context import ValidationContext


class ResourceExistsRule(ValidationRule):
    """Validates that the agreement exists."""

    @property
    def name(self) -> str:
        return "Resource Exists"

    def validate(self, agreement: Agreement, context: ValidationContext) -> None:
        if not agreement:
            raise ResourceNotFoundError("Agreement", context.updated_fields.get("id"))


class AuthorizationRule(ValidationRule):
    """
    Validates that the user is authorized to update the agreement.

    Uses the user from the validation context and the existing
    check_user_association helper to verify authorization.
    """

    @property
    def name(self) -> str:
        return "Authorization Check"

    def validate(self, agreement: Agreement, context: ValidationContext) -> None:
        # Check if user is associated with the agreement using existing helper
        if not check_user_association(agreement, context.user):
            raise AuthorizationError(
                f"User {context.user.id} is not authorized to update agreement {agreement.id}.",
                "Agreement",
            )


class BudgetLineStatusRule(ValidationRule):
    """Validates that no budget lines are in execution or obligated status."""

    @property
    def name(self) -> str:
        return "Budget Line Status Check"

    def validate(self, agreement: Agreement, context: ValidationContext) -> None:
        if any(
            bli.status in [BudgetLineItemStatus.IN_EXECUTION, BudgetLineItemStatus.OBLIGATED]
            for bli in agreement.budget_line_items
        ):
            raise ValidationError(
                {"budget_line_items": "Cannot update an Agreement with Budget Lines that are in Execution or higher."}
            )


class AgreementTypeImmutableRule(ValidationRule):
    """Validates that the agreement type cannot be changed."""

    @property
    def name(self) -> str:
        return "Agreement Type Immutable"

    def validate(self, agreement: Agreement, context: ValidationContext) -> None:
        updated_fields = context.updated_fields
        if updated_fields.get("agreement_type") and updated_fields.get("agreement_type") != agreement.agreement_type:
            raise ValidationError({"agreement_type": "Cannot change the agreement type of an existing agreement."})


class ProcurementShopChangeRule(ValidationRule):
    """Validates procurement shop changes based on budget line status."""

    @property
    def name(self) -> str:
        return "Procurement Shop Change Validation"

    def validate(self, agreement: Agreement, context: ValidationContext) -> None:
        updated_fields = context.updated_fields
        if "awarding_entity_id" in updated_fields and agreement.awarding_entity_id != updated_fields.get(
            "awarding_entity_id"
        ):
            if any(
                list(BudgetLineItemStatus.__members__.values()).index(bli.status)
                >= list(BudgetLineItemStatus.__members__.values()).index(BudgetLineItemStatus.IN_EXECUTION)
                for bli in agreement.budget_line_items
            ):
                raise ValidationError(
                    {
                        "awarding_entity_id": "Cannot change Procurement Shop for an Agreement if any Budget Lines are in Execution or higher."
                    }
                )

            if agreement.change_requests_in_review and any(
                cr.has_proc_shop_change for cr in agreement.change_requests_in_review
            ):
                raise ValidationError(
                    {
                        "awarding_entity_id": "Cannot change Procurement Shop for an Agreement that is currently in review."
                    }
                )


class ResearchMetadataRule(ValidationRule):
    """Validates research methodologies and special topics."""

    @property
    def name(self) -> str:
        return "Research Metadata Validation"

    def validate(self, agreement: Agreement, context: ValidationContext) -> None:
        updated_fields = context.updated_fields
        if "research_methodologies" not in updated_fields and "special_topics" not in updated_fields:
            return

        # Validate research methodologies
        if "research_methodologies" in updated_fields:
            invalid_ids = []
            for rm in updated_fields.get("research_methodologies", []):
                research_methodology = context.db_session.get(ResearchMethodology, rm["id"])
                if not research_methodology or rm["name"] != research_methodology.name:
                    invalid_ids.append(rm["id"])

            if invalid_ids:
                raise ValidationError(
                    {"research_methodologies": [f"Research Methodology IDs do not exist: {invalid_ids}"]}
                )

        # Validate special topics
        if "special_topics" in updated_fields:
            invalid_ids = []
            for st in updated_fields.get("special_topics", []):
                special_topic = context.db_session.get(SpecialTopic, st["id"])
                if not special_topic or st["name"] != special_topic.name:
                    invalid_ids.append(st["id"])

            if invalid_ids:
                raise ValidationError({"special_topics": [f"Special Topic IDs do not exist: {invalid_ids}"]})
