from flask import Response, current_app, request
from flask_jwt_extended import jwt_required

from ops_api.ops.auth.auth_types import Permission, PermissionType
from ops_api.ops.auth.decorators import is_authorized
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI
from ops_api.ops.schemas.special_topics import (
    SpecialTopicsRequestSchema,
    SpecialTopicsSchema,
)
from ops_api.ops.services.special_topics import SpecialTopicsService
from ops_api.ops.utils.errors import error_simulator
from ops_api.ops.utils.response import make_response_with_headers


class SpecialTopicsItemAPI(BaseItemAPI):
    def __init__(self, model):
        super().__init__(model)

    @is_authorized(PermissionType.GET, Permission.AGREEMENT)
    def get(self, id: int) -> Response:
        schema = SpecialTopicsSchema()
        service = SpecialTopicsService(current_app.db_session)
        item = service.get(id)
        return make_response_with_headers(schema.dump(item))


class SpecialTopicsListAPI(BaseListAPI):
    def __init__(self, model):
        super().__init__(model)

    @is_authorized(PermissionType.GET, Permission.AGREEMENT)
    @jwt_required()
    @error_simulator
    def get(self) -> Response:
        service = SpecialTopicsService(current_app.db_session)
        request_schema = SpecialTopicsRequestSchema()
        data = request_schema.load(request.args)
        result = service.get_list(data["limit"], data["offset"])
        special_topics_schema = SpecialTopicsSchema()
        return make_response_with_headers([special_topics_schema.dump(special_topics) for special_topics in result])
