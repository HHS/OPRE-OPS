from flask import Response
from typing_extensions import override

from models.base import BaseModel
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI, handle_api_error
from ops_api.ops.utils.auth import Permission, PermissionType, is_authorized


class DivisionsItemAPI(BaseItemAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    @override
    @is_authorized(PermissionType.GET, Permission.DIVISION)
    @handle_api_error
    def get(self, id: int) -> Response:
        return super().get(id)


class DivisionsListAPI(BaseListAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    @override
    @is_authorized(PermissionType.GET, Permission.DIVISION)
    @handle_api_error
    def get(self) -> Response:
        return super().get()
