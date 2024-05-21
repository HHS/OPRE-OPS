"""Module containing views for Product Service Codes."""

from flask import Response

from models.base import BaseModel
from ops_api.ops.auth.auth_types import Permission, PermissionType
from ops_api.ops.auth.decorators import check_user_session, is_authorized
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI, handle_api_error


class ProductServiceCodeItemAPI(BaseItemAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    @handle_api_error
    @is_authorized(PermissionType.GET, Permission.AGREEMENT)
    @check_user_session
    def get(self, id: int) -> Response:
        return super().get(id)


class ProductServiceCodeListAPI(BaseListAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    @handle_api_error
    @is_authorized(PermissionType.GET, Permission.AGREEMENT)
    @check_user_session
    def get(self) -> Response:
        return super().get()
