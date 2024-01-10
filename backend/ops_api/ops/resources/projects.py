from flask import Response, current_app, request
from models.base import BaseModel
from models.projects import ResearchProject
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI, handle_sql_error
from ops_api.ops.resources.administrative_and_support_projects import AdministrativeAndSupportProjectListAPI
from ops_api.ops.resources.research_projects import ResearchProjectItemAPI, ResearchProjectListAPI
from ops_api.ops.utils.auth import Permission, PermissionType, is_authorized
from ops_api.ops.utils.response import make_response_with_headers
from typing_extensions import Any, List, override

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
            fiscal_year = request.args.get("fiscal_year")
            portfolio_id = request.args.get("portfolio_id")
            search = request.args.get("search")

            rp_stmt = ResearchProjectListAPI._get_query(fiscal_year, portfolio_id, search)
            as_stmt = AdministrativeAndSupportProjectListAPI._get_query(fiscal_year, portfolio_id, search)

            result = []
            result.extend(current_app.db_session.execute(rp_stmt).all())
            result.extend(current_app.db_session.execute(as_stmt).all())

            project_response: List[dict] = []
            for item in result:
                for project in item:
                    additional_fields = add_additional_fields_to_project_response(project)
                    project_dict = project.to_dict()
                    project_dict.update(additional_fields)
                    project_response.append(project_dict)

            return make_response_with_headers(project_response)

    @override
    @is_authorized(PermissionType.POST, Permission.RESEARCH_PROJECT)
    def post(self) -> Response:
        with handle_sql_error():
            return ResearchProjectListAPI.post(self)


def add_additional_fields_to_project_response(
    research_project: ResearchProject,
) -> dict[str, Any]:
    """
    Add additional fields to the project response.

    N.B. This is a temporary solution to add additional fields to the response.
    This should be refactored to use marshmallow.
    Also, the frontend/OpenAPI needs to be refactored to not use these fields.
    """
    if not research_project:
        return {}

    return {
        "team_leaders": [tm.to_dict() for tm in research_project.team_leaders],
    }
