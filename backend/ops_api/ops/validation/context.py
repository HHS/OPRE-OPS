"""Validation context for passing data through validation chain."""

from dataclasses import dataclass, field
from typing import Any, Dict

from sqlalchemy.orm import Session

from models import User


@dataclass
class ValidationContext:
    """
    Context object passed through the validation chain.

    Encapsulates all information needed for validation rules to execute,
    including the requesting user, updated fields, and database session.
    """

    user: User
    """The user making the request."""

    updated_fields: Dict[str, Any]
    """Dictionary of fields being updated."""

    db_session: Session
    """Database session for queries."""

    metadata: Dict[str, Any] = field(default_factory=dict)
    """Optional metadata for custom validation context."""

    def get_metadata(self, key: str, default: Any = None) -> Any:
        """
        Get a metadata value.

        Args:
            key: Metadata key
            default: Default value if key not found

        Returns:
            Metadata value or default
        """
        return self.metadata.get(key, default)

    def set_metadata(self, key: str, value: Any) -> None:
        """
        Set a metadata value.

        Args:
            key: Metadata key
            value: Metadata value
        """
        self.metadata[key] = value
