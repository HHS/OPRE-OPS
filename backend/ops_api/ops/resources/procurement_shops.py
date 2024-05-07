"""Module containing views for Procurement Shops."""

from flask import Response
from typing_extensions import override

from models.base import BaseModel
from ops_api.ops.auth.auth_types import Permission, PermissionType
from ops_api.ops.auth.decorators import is_authorized
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI, handle_api_error


class ProcurementShopsItemAPI(BaseItemAPI):  # type: ignore [misc]
    """View to get individual Procurement Shop item."""

    def __init__(self, model: BaseModel):
        """Initialize the class."""
        super().__init__(model)

    @override
    @is_authorized(PermissionType.GET, Permission.AGREEMENT)
    @handle_api_error
    def get(self, id: int) -> Response:
        return super().get(id)


class ProcurementShopsListAPI(BaseListAPI):  # type: ignore [misc]
    """View to get list of Procurement Shop items."""

    def __init__(self, model: BaseModel):
        """Initialize the class."""
        super().__init__(model)

    @override
    @is_authorized(PermissionType.GET, Permission.AGREEMENT)
    @handle_api_error
    def get(self) -> Response:
        return super().get()
