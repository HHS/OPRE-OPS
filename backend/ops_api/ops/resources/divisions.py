from flask import Response
from models.base import BaseModel
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI
from ops_api.ops.utils.auth import Permission, PermissionType, is_authorized
from typing_extensions import override


class DivisionsItemAPI(BaseItemAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    @override
    @is_authorized(PermissionType.GET, Permission.DIVISION)
    def get(self, id: int) -> Response:
        return super().get(id)


class DivisionsListAPI(BaseListAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    @override
    @is_authorized(PermissionType.GET, Permission.DIVISION)
    def get(self) -> Response:
        return super().get()
