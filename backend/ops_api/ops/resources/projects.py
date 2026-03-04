from flask import Response, current_app, request
from typing_extensions import List

from models import Project, ProjectType
from models.base import BaseModel
from models.events import OpsEventType
from ops_api.ops.auth.auth_types import Permission, PermissionType
from ops_api.ops.auth.decorators import is_authorized
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI
from ops_api.ops.resources.administrative_and_support_projects import (
    AdministrativeAndSupportProjectListAPI,
)
from ops_api.ops.resources.research_projects import (
    ResearchProjectListAPI,
)
from ops_api.ops.schemas.projects import (
    ProjectCreationRequestSchema,
    ProjectListGetRequestSchema,
    ProjectResponse,
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
        # Old implementation (commented out - keeping until service is fully implemented):
        # item = self._get_item(id)
        # if not item:
        #     return make_response_with_headers({}, 404)
        # match item.project_type:
        #     case ProjectType.RESEARCH:
        #         return ResearchProjectItemAPI.get(self, id)
        #     case ProjectType.ADMINISTRATIVE_AND_SUPPORT:
        #         return AdministrativeAndSupportProjectItemAPI.get(self, id)
        #     case _:
        #         return make_response_with_headers({}, 404)

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


class ProjectListAPI(BaseListAPI):
    def __init__(self, model: BaseModel = Project):
        super().__init__(model)

    @is_authorized(PermissionType.GET, Permission.RESEARCH_PROJECT)
    def get(self) -> Response:
        projects_service = ProjectsService(current_app.db_session)
        request_schema = ProjectListGetRequestSchema()
        data = request_schema.load(request.args)
        research_projects, admin_support_projects = projects_service.get_list(data)

        project_response: List[dict] = []
        if research_projects:
            project_response.extend(ResearchProjectListAPI._list_response_schema.dump(research_projects, many=True))
        if admin_support_projects:
            project_response.extend(
                AdministrativeAndSupportProjectListAPI._list_response_schema.dump(admin_support_projects, many=True)
            )

        return make_response_with_headers(project_response)

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
