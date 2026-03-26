from flask import Response, current_app, request
from typing_extensions import List

from models import AdministrativeAndSupportProject, Project, ProjectType, ResearchProject
from models.base import BaseModel
from models.events import OpsEventType
from models.utils.fiscal_year import get_current_fiscal_year
from ops_api.ops.auth.auth_types import Permission, PermissionType
from ops_api.ops.auth.decorators import is_authorized
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI
from ops_api.ops.schemas.projects import (
    ProjectCreationRequestSchema,
    ProjectFundingRequestSchema,
    ProjectFundingResponseSchema,
    ProjectListFilterOptionResponseSchema,
    ProjectListGetRequestSchema,
    ProjectListResponse,
    ProjectResponse,
    ProjectUpdateRequestSchema,
    ResearchProjectListResponse,
    ResearchProjectResponse,
)
from ops_api.ops.services.projects import ProjectsService
from ops_api.ops.utils.events import OpsEventHandler
from ops_api.ops.utils.response import make_response_with_headers


class ProjectItemAPI(BaseItemAPI):
    def __init__(self, model: BaseModel = Project):
        super().__init__(model)

    @is_authorized(PermissionType.GET, Permission.RESEARCH_PROJECT)
    def get(self, id: int) -> Response:
        # New implementation using ProjectsService:
        service = ProjectsService(current_app.db_session)

        project = service.get(id)
        match project.project_type:
            case ProjectType.RESEARCH:
                research_schema = ResearchProjectResponse()
                serialized_project = research_schema.dump(project)
            case ProjectType.ADMINISTRATIVE_AND_SUPPORT:
                # No separate schema for admin project yet but there will be
                admin_schema = ProjectResponse()
                serialized_project = admin_schema.dump(project)
            case _:
                general_schema = ProjectResponse()
                serialized_project = general_schema.dump(project)

        return make_response_with_headers(serialized_project)

    @is_authorized(PermissionType.PATCH, Permission.RESEARCH_PROJECT)
    def patch(self, id: int) -> Response:
        with OpsEventHandler(OpsEventType.UPDATE_PROJECT) as meta:
            request_schema = ProjectUpdateRequestSchema(partial=True)
            data = request_schema.load(request.json)
            service = ProjectsService(current_app.db_session)
            updated_project, status_code = service.update(id, data)
            meta.metadata.update({"updated_project": updated_project.to_dict()})
            return make_response_with_headers({"id": updated_project.id}, status_code)


class ProjectListAPI(BaseListAPI):
    def __init__(self, model: BaseModel = Project):
        super().__init__(model)

    @is_authorized(PermissionType.GET, Permission.RESEARCH_PROJECT)
    def get(self) -> Response:
        projects_service = ProjectsService(current_app.db_session)
        request_schema = ProjectListGetRequestSchema()
        val = request.args.to_dict(flat=False)
        data = request_schema.load(val)
        projects, metadata = projects_service.get_list(data)
        research_schema = ResearchProjectListResponse()
        admin_schema = ProjectListResponse()

        project_response: List[dict] = []
        for project in projects:
            if isinstance(project, ResearchProject):
                project_response.append(research_schema.dump(project))
            elif isinstance(project, AdministrativeAndSupportProject):
                project_response.append(admin_schema.dump(project))

        # Return wrapped response with pagination metadata
        response_data = {
            "data": project_response,
            "count": metadata["count"],
            "limit": metadata["limit"],
            "offset": metadata["offset"],
            "summary": metadata["summary"],
        }

        return make_response_with_headers(response_data)

    @is_authorized(PermissionType.POST, Permission.RESEARCH_PROJECT)
    def post(self) -> Response:
        with OpsEventHandler(OpsEventType.CREATE_PROJECT) as meta:
            request_schema = ProjectCreationRequestSchema()
            data = request_schema.load(request.json)
            project_type = data.get("project_type", None)
            if not project_type:
                return make_response_with_headers({}, 400)
            service = ProjectsService(current_app.db_session)
            project = service.create(data)
            meta.metadata.update({"new_project": project.to_dict()})
            return make_response_with_headers({"id": project.id}, 201)


class ProjectListFilterOptionAPI(BaseItemAPI):
    """Get filter options for Projects"""

    def __init__(self, model: BaseModel = Project):
        super().__init__(model)

    @is_authorized(PermissionType.GET, Permission.RESEARCH_PROJECT)
    def get(self) -> Response:
        service = ProjectsService(current_app.db_session)
        filters = service.get_filter_options()

        schema = ProjectListFilterOptionResponseSchema()
        serialized_filters = schema.dump(filters)
        # The service already returns a dict in the correct format, so we can return it directly
        return make_response_with_headers(serialized_filters)


class ProjectFundingAPI(BaseItemAPI):
    def __init__(self, model: BaseModel = Project):
        super().__init__(model)

    @is_authorized(PermissionType.GET, Permission.RESEARCH_PROJECT)
    def get(self, id: int) -> Response:
        request_schema = ProjectFundingRequestSchema()
        data = request_schema.load(request.args.to_dict())
        fiscal_year = data.get("fiscal_year") or get_current_fiscal_year()

        service = ProjectsService(current_app.db_session)
        funding = service.get_project_funding(id, fiscal_year)

        response_schema = ProjectFundingResponseSchema()
        return make_response_with_headers(response_schema.dump(funding))
