from typing import Any, Optional, Protocol, TypeVar

T = TypeVar("T")


class OpsService(Protocol[T]):
    def create(self, create_request: dict[str, Any]) -> T: ...

    def update(self, updated_fields: dict[str, Any], id: int) -> T: ...

    def delete(self, id: int) -> None: ...

    def get(self, id: int) -> T: ...

    def get_list(self, search: Optional[str] = None) -> list[T]: ...


class ServiceError(Exception):
    """Base exception class for all service-related errors."""

    def __init__(self, message: str, details: Optional[dict[str, Any]] = None):
        self.message = message
        self.details = details or {}
        super().__init__(message)


class ResourceNotFoundError(ServiceError):
    """Raised when a requested resource doesn't exist."""

    def __init__(self, resource_type: str, resource_id: Any):
        self.resource_type = resource_type
        self.resource_id = resource_id
        message = f"{resource_type} with id {resource_id} not found"
        super().__init__(message, {"resource_type": resource_type, "resource_id": resource_id})


class ValidationError(ServiceError):
    """Raised when input data fails validation."""

    def __init__(self, errors: dict[str, Any]):
        self.validation_errors = errors
        message = "Validation failed"
        super().__init__(message, {"errors": errors})


class DuplicateResourceError(ServiceError):
    """Raised when attempting to create a resource that already exists."""

    def __init__(self, resource_type: str, identifier: dict[str, Any]):
        self.resource_type = resource_type
        self.identifier = identifier
        message = f"{resource_type} with these attributes already exists"
        super().__init__(message, {"resource_type": resource_type, "identifier": identifier})


class DatabaseError(ServiceError):
    """Raised when a database operation fails."""

    def __init__(self, operation: str, details: Optional[dict[str, Any]] = None):
        self.operation = operation
        message = f"Database operation '{operation}' failed"
        super().__init__(message, details)


class AuthorizationError(ServiceError):
    """Raised when a user is not authorized to perform the requested action."""

    def __init__(self, action: str, resource_type: Optional[str] = None):
        self.action = action
        self.resource_type = resource_type
        message = f"Not authorized to {action}"
        if resource_type:
            message += f" on {resource_type}"
        super().__init__(message, {"action": action, "resource_type": resource_type})
