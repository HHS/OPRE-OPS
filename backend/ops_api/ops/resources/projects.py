import desert
from flask import Response
from models.base import BaseModel
from models.projects import ResearchProject
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI, handle_sql_error
from ops_api.ops.resources.research_projects import (
    RequestBody,
    ResearchProjectItemAPI,
    ResearchProjectListAPI,
    ResearchProjectResponse,
)
from ops_api.ops.utils.auth import Permission, PermissionType, is_authorized
from typing_extensions import override

ENDPOINT_STRING = "/projects"


class ProjectItemAPI(BaseItemAPI):
    def __init__(self, model: BaseModel = ResearchProject):
        super().__init__(model)

    @override
    @is_authorized(PermissionType.GET, Permission.RESEARCH_PROJECT)
    def get(self, id: int) -> Response:
        with handle_sql_error():
            return ResearchProjectItemAPI.get(self, id)


class ProjectListAPI(BaseListAPI):
    def __init__(self, model: BaseModel = ResearchProject):
        super().__init__(model)

    @override
    @is_authorized(PermissionType.GET, Permission.RESEARCH_PROJECT)
    def get(self) -> Response:
        with handle_sql_error():
            return ResearchProjectListAPI.get(self)

    @override
    @is_authorized(PermissionType.POST, Permission.RESEARCH_PROJECT)
    def post(self) -> Response:
        with handle_sql_error():
            self._post_schema = desert.schema(RequestBody)
            self._response_schema = desert.schema(ResearchProjectResponse)
            return ResearchProjectListAPI.post(self)
