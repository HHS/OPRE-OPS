from flask import Response
from typing_extensions import override

from models.base import BaseModel
from ops_api.ops.auth.auth_enum import Permission, PermissionType
from ops_api.ops.auth.authorization import is_authorized
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI, handle_api_error

ENDPOINT_STRING = "/workflow-step-template"


class WorkflowStepTemplateItemAPI(BaseItemAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    @override
    @is_authorized(PermissionType.GET, Permission.WORKFLOW)
    @handle_api_error
    def get(self, id: int) -> Response:
        return self._get_item_with_try(id)


class WorkflowStepTemplateListAPI(BaseListAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    @override
    @is_authorized(PermissionType.GET, Permission.WORKFLOW)
    @handle_api_error
    def get(self) -> Response:
        return super().get()
