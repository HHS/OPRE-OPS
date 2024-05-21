from flask import Response

from models.base import BaseModel
from ops_api.ops.auth.auth_types import Permission, PermissionType
from ops_api.ops.auth.decorators import is_authorized
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI

ENDPOINT_STRING = "/workflow-step-template"


class WorkflowStepTemplateItemAPI(BaseItemAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    @is_authorized(PermissionType.GET, Permission.WORKFLOW)
    def get(self, id: int) -> Response:
        return self._get_item_with_try(id)


class WorkflowStepTemplateListAPI(BaseListAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    @is_authorized(PermissionType.GET, Permission.WORKFLOW)
    def get(self) -> Response:
        return super().get()
