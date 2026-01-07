"""Validation rules specific to awarded agreements."""

from models import Agreement
from ops_api.ops.services.ops_service import ValidationError
from ops_api.ops.validation.base import ValidationRule
from ops_api.ops.validation.context import ValidationContext


class ImmutableAwardedFieldsRule(ValidationRule):
    """
    Validates that immutable fields are not modified on awarded agreements.

    Uses the agreement's immutable_awarded_fields property to determine
    which fields cannot be changed.
    """

    @property
    def name(self) -> str:
        return "Immutable Awarded Fields"

    def validate(self, agreement: Agreement, context: ValidationContext) -> None:
        if not agreement.is_awarded:
            return  # Only applies to awarded agreements

        if context.user.is_superuser:
            return  # Superusers can bypass this rule

        immutable_fields = agreement.immutable_awarded_fields
        if not immutable_fields:
            return  # No immutable fields for this agreement type

        updated_fields = context.updated_fields

        # Check for attempts to modify immutable fields
        attempted_changes = []
        for field in immutable_fields:
            if field in updated_fields:
                # Check if the value is actually changing
                new_value = updated_fields[field]

                # Special handling for vendor: compare vendor names
                if field == "vendor":
                    current_vendor_name = getattr(agreement.vendor, "name", None) if agreement.vendor else None
                    if current_vendor_name != new_value:
                        attempted_changes.append(field)
                else:
                    current_value = getattr(agreement, field, None)
                    if current_value != new_value:
                        attempted_changes.append(field)

        if attempted_changes:
            raise ValidationError(
                {field: f"Cannot update immutable field '{field}' on awarded agreement" for field in attempted_changes}
            )
