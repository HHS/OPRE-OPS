from flask import Response, current_app, request
from flask_jwt_extended import jwt_required

from ops_api.ops.auth.auth_types import Permission, PermissionType
from ops_api.ops.auth.decorators import is_authorized
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI
from ops_api.ops.schemas.research_methodology import (
    ResearchMethodologyRequestSchema,
    ResearchMethodologySchema,
)
from ops_api.ops.services.research_methodology import ResearchMethodologyService
from ops_api.ops.utils.errors import error_simulator
from ops_api.ops.utils.response import make_response_with_headers


class ResearchMethodologyItemAPI(BaseItemAPI):
    def __init__(self, model):
        super().__init__(model)

    @is_authorized(PermissionType.GET, Permission.AGREEMENT)
    def get(self, id: int) -> Response:
        schema = ResearchMethodologySchema()
        service = ResearchMethodologyService(current_app.db_session)
        item = service.get(id)
        return make_response_with_headers(schema.dump(item))


class ResearchMethodologyListAPI(BaseListAPI):
    def __init__(self, model):
        super().__init__(model)

    @is_authorized(PermissionType.GET, Permission.AGREEMENT)
    @jwt_required()
    @error_simulator
    def get(self) -> Response:
        service = ResearchMethodologyService(current_app.db_session)
        request_schema = ResearchMethodologyRequestSchema()
        data = request_schema.load(request.args)
        result = service.get_list(data["limit"], data["offset"])
        research_methodology_schema = ResearchMethodologySchema()
        return make_response_with_headers(
            [
                research_methodology_schema.dump(research_methodology)
                for research_methodology in result
            ]
        )
