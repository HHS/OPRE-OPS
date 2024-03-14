from flask import Response
from typing_extensions import override

from models.base import BaseModel
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI, handle_api_error
from ops_api.ops.utils.auth import Permission, PermissionType, is_authorized

ENDPOINT_STRING = "/workflow-template"


class WorkflowTemplateItemAPI(BaseItemAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    @override
    @is_authorized(PermissionType.GET, Permission.WORKFLOW)
    @handle_api_error
    def get(self, id: int) -> Response:
        return self._get_item_with_try(id)


class WorkflowTemplateListAPI(BaseListAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    @override
    @is_authorized(PermissionType.GET, Permission.WORKFLOW)
    @handle_api_error
    def get(self) -> Response:
        return super().get()
