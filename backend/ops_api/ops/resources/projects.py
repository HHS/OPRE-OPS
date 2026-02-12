from flask import Response, current_app, request
from typing_extensions import List

from models import Project, ProjectType
from models.base import BaseModel
from models.projects import ResearchProject
from ops_api.ops.auth.auth_types import Permission, PermissionType
from ops_api.ops.auth.decorators import is_authorized
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI
from ops_api.ops.resources.administrative_and_support_projects import (
    AdministrativeAndSupportProjectItemAPI,
    AdministrativeAndSupportProjectListAPI,
)
from ops_api.ops.resources.research_projects import (
    ResearchProjectItemAPI,
    ResearchProjectListAPI,
)
from ops_api.ops.utils.response import make_response_with_headers


class ProjectItemAPI(BaseItemAPI):
    def __init__(self, model: BaseModel = Project):
        super().__init__(model)

    @is_authorized(PermissionType.GET, Permission.RESEARCH_PROJECT)
    def get(self, id: int) -> Response:
        item = self._get_item(id)
        if not item:
            return make_response_with_headers({}, 404)
        match item.project_type:
            case ProjectType.RESEARCH:
                return ResearchProjectItemAPI.get(self, id)
            case ProjectType.ADMINISTRATIVE_AND_SUPPORT:
                return AdministrativeAndSupportProjectItemAPI.get(self, id)
            case _:
                return make_response_with_headers({}, 404)


class ProjectListAPI(BaseListAPI):
    def __init__(self, model: BaseModel = Project):
        super().__init__(model)

    @is_authorized(PermissionType.GET, Permission.RESEARCH_PROJECT)
    def get(self) -> Response:
        fiscal_year = request.args.get("fiscal_year")
        portfolio_id = request.args.get("portfolio_id")
        search = request.args.get("search")

        rp_stmt = ResearchProjectListAPI._get_query(fiscal_year, portfolio_id, search)
        as_stmt = AdministrativeAndSupportProjectListAPI._get_query(fiscal_year, portfolio_id, search)

        result = []
        result.extend(current_app.db_session.scalars(rp_stmt).all())
        result.extend(current_app.db_session.scalars(as_stmt).all())

        project_response: List[dict] = []
        for project in result:
            if isinstance(project, ResearchProject):
                project_response.append(ResearchProjectListAPI._list_response_schema.dump(project))
            else:
                project_response.append(AdministrativeAndSupportProjectListAPI._list_response_schema.dump(project))

        return make_response_with_headers(project_response)

    @is_authorized(PermissionType.POST, Permission.RESEARCH_PROJECT)
    def post(self) -> Response:
        project_type = request.json.get("project_type")
        if not project_type:
            return make_response_with_headers({}, 400)
        match ProjectType[project_type]:
            case ProjectType.RESEARCH:
                return ResearchProjectListAPI.post(self)
            case ProjectType.ADMINISTRATIVE_AND_SUPPORT:
                return AdministrativeAndSupportProjectListAPI.post(self)
            case _:
                return make_response_with_headers({}, 404)
