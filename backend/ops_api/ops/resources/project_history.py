from flask import Response, request

from ops_api.ops.auth.auth_types import Permission, PermissionType
from ops_api.ops.auth.decorators import is_authorized
from ops_api.ops.base_views import BaseListAPI
from ops_api.ops.schemas.project_history import (
    GetProjectHistoryListQueryParametersSchema,
    ProjectHistoryItemSchema,
)
from ops_api.ops.services.project_history import ProjectHistoryService
from ops_api.ops.utils.response import make_response_with_headers


class ProjectHistoryListAPI(BaseListAPI):
    def __init__(self, model):
        super().__init__(model)
        self.service = ProjectHistoryService()
        self._get_schema = GetProjectHistoryListQueryParametersSchema()

    @is_authorized(PermissionType.GET, Permission.HISTORY)
    def get(self, id: int) -> Response:
        data = self._get_schema.dump(self._get_schema.load(request.args))
        result, metadata = self.service.get(
            id,
            data.get("limit"),
            data.get("offset"),
            data.get("sort_asc"),
        )
        project_history_schema = ProjectHistoryItemSchema()
        response_data = {
            "data": [project_history_schema.dump(project_history) for project_history in result],
            "count": metadata["count"],
            "limit": metadata["limit"],
            "offset": metadata["offset"],
        }
        return make_response_with_headers(response_data)
