from flask import Response, current_app, request
from flask_jwt_extended import jwt_required

from models import (
    BudgetLineItemChangeRequest,
    ChangeRequest,
    ChangeRequestStatus,
    OpsEventType,
)
from ops_api.ops.auth.auth_types import Permission, PermissionType
from ops_api.ops.auth.decorators import is_authorized
from ops_api.ops.base_views import BaseListAPI
from ops_api.ops.schemas.change_requests import (
    GenericChangeRequestResponseSchema,
)
from ops_api.ops.services.change_requests import ChangeRequestService
from ops_api.ops.utils.events import OpsEventHandler
from ops_api.ops.utils.response import make_response_with_headers


def build_change_request_response(change_request: ChangeRequest):
    resp = change_request.to_dict()
    if isinstance(change_request, BudgetLineItemChangeRequest):
        resp["has_budget_change"] = change_request.has_budget_change
        resp["has_status_change"] = change_request.has_status_change
    return resp


class ChangeRequestListAPI(BaseListAPI):
    def __init__(self, model: ChangeRequest = ChangeRequest):
        super().__init__(model)
        self._response_schema = GenericChangeRequestResponseSchema()
        self._response_schema_collection = GenericChangeRequestResponseSchema(many=True)

    @is_authorized(PermissionType.GET, Permission.CHANGE_REQUEST)
    def get(self) -> Response:
        limit = request.args.get("limit", 10, type=int)
        offset = request.args.get("offset", 0, type=int)
        user_id = request.args.get("userId")

        if not user_id:
            return make_response_with_headers(
                {"error": "Missing required parameter: userId"}, 400
            )

        filters = {
            "status": ChangeRequestStatus.IN_REVIEW,
            "reviewer_user_id": user_id,
            "limit": limit,
            "offset": offset,
        }

        service = ChangeRequestService(current_app.db_session)
        change_requests, _ = service.get_list(data=filters)

        if change_requests:
            response = make_response_with_headers(
                self._response_schema_collection.dump(change_requests)
            )
        else:
            response = make_response_with_headers([], 200)
        return response

    @is_authorized(PermissionType.POST, Permission.CHANGE_REQUEST)
    @jwt_required()
    def patch(self) -> Response:
        with OpsEventHandler(OpsEventType.UPDATE_CHANGE_REQUEST) as meta:
            request_json = request.get_json()
            change_request_id = request_json.get("change_request_id")

            if not change_request_id:
                return make_response_with_headers(
                    {"error": "change_request_id is required"}, 400
                )

            service = ChangeRequestService(current_app.db_session)

            change_request, _ = service.update(change_request_id, request_json)
            meta.metadata.update({"change_request": change_request.to_dict()})
            return make_response_with_headers(change_request.to_dict(), 200)
