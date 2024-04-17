from flask import Response
from typing_extensions import override

from models.base import BaseModel
from ops_api.ops.auth.auth_enum import Permission, PermissionType
from ops_api.ops.auth.decorators import is_authorized
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI, handle_api_error

ENDPOINT_STRING = "/package"


class PackageItemAPI(BaseItemAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    @override
    @is_authorized(PermissionType.GET, Permission.WORKFLOW)
    @handle_api_error
    def get(self, id: int) -> Response:
        return self._get_item_with_try(id)


class PackageListAPI(BaseListAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    @override
    @is_authorized(PermissionType.GET, Permission.WORKFLOW)
    @handle_api_error
    def get(self) -> Response:
        return super().get()


class PackageSnapshotItemAPI(BaseItemAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    @override
    @is_authorized(PermissionType.GET, Permission.WORKFLOW)
    @handle_api_error
    def get(self, id: int) -> Response:
        return self._get_item_with_try(id)


class PackageSnapshotListAPI(BaseListAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    @override
    @is_authorized(PermissionType.GET, Permission.WORKFLOW)
    @handle_api_error
    def get(self) -> Response:
        return super().get()
