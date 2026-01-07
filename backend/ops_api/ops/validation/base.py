"""Base validation rule interface."""
from abc import ABC, abstractmethod

from models import Agreement
from ops_api.ops.validation.context import ValidationContext


class ValidationRule(ABC):
    """
    Abstract base class for agreement validation rules.

    Each validation rule implements a single business rule that can raise
    a ValidationError if the validation fails.
    """

    @abstractmethod
    def validate(self, agreement: Agreement, context: ValidationContext) -> None:
        """
        Execute the validation rule.

        Args:
            agreement: The agreement being validated
            context: Validation context containing user, updated_fields, db_session, etc.

        Raises:
            ValidationError: If the validation fails
            ResourceNotFoundError: If a required resource is not found
            AuthorizationError: If authorization check fails
        """
        pass

    @property
    @abstractmethod
    def name(self) -> str:
        """Return a descriptive name for this validation rule."""
        pass
