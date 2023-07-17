from typing_extensions import override
from flask import Response
from models.base import BaseModel
from ops_api.ops.base_views import BaseListAPI
from ops_api.ops.utils.auth import is_authorized, PermissionType, Permission


class OpsDBHistoryListAPI(BaseListAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    @override
    @is_authorized(PermissionType.GET, Permission.HISTORY)
    def get(self) -> Response:
        return super().get()
