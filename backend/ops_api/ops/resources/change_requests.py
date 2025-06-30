import copy
from datetime import datetime

from flask import Response, current_app, request
from flask_jwt_extended import current_user, jwt_required

from marshmallow.experimental.context import Context
from models import BudgetLineItem, BudgetLineItemChangeRequest, ChangeRequest, ChangeRequestStatus
from ops_api.ops.auth.auth_types import Permission, PermissionType
from ops_api.ops.auth.decorators import is_authorized
from ops_api.ops.base_views import BaseListAPI
from ops_api.ops.schemas.budget_line_items import PATCHRequestBodySchema
from ops_api.ops.schemas.change_requests import BudgetLineItemChangeRequestResponseSchema
from ops_api.ops.services.budget_line_items import update_data
from ops_api.ops.services.change_request import ChangeRequestService

# from ops_api.ops.services.ops_service import ResourceNotFoundError, AuthorizationError
from ops_api.ops.utils import procurement_tracker_helper
from ops_api.ops.utils.api_helpers import validate_and_prepare_change_data
from ops_api.ops.utils.change_requests import create_notification_of_reviews_request_to_submitter
from ops_api.ops.utils.response import make_response_with_headers


def review_change_request(
    change_request_id: int,
    status_after_review: ChangeRequestStatus,
    reviewed_by_user_id: int,
    reviewer_notes: str = None,
) -> ChangeRequest:
    session = current_app.db_session
    change_request = session.get(ChangeRequest, change_request_id)
    change_request.reviewed_by_id = reviewed_by_user_id
    change_request.reviewed_on = datetime.now()
    change_request.status = status_after_review
    change_request.reviewer_notes = reviewer_notes
    session.add(change_request)
    should_create_procurement_tracker = False

    # If approved, then apply the changes
    if status_after_review == ChangeRequestStatus.APPROVED:
        if isinstance(change_request, BudgetLineItemChangeRequest):
            budget_line_item = session.get(BudgetLineItem, change_request.budget_line_item_id)
            should_create_procurement_tracker = (
                change_request.has_status_change and change_request.requested_change_data["status"] == "IN_EXECUTION"
            )
            # need to copy to avoid changing the original data in the ChangeRequest and triggering an update
            data = copy.deepcopy(change_request.requested_change_data)
            schema = PATCHRequestBodySchema()
            with Context({"method": "PATCH", "id": change_request.budget_line_item_id}):
                change_data, _ = validate_and_prepare_change_data(
                    data,
                    budget_line_item,
                    schema,
                    ["id", "agreement_id"],
                    partial=False,
                )

            update_data(budget_line_item, change_data)
            # add transient property to track that the BLI was changed by this CR in the history for it's update
            budget_line_item.acting_change_request_id = change_request.id
            session.add(budget_line_item)

    session.commit()

    create_notification_of_reviews_request_to_submitter(change_request)

    if should_create_procurement_tracker:
        procurement_tracker_helper.create_procurement_tracker(change_request.agreement_id)

    return change_request


def build_change_request_response(change_request: ChangeRequest):
    resp = change_request.to_dict()
    if isinstance(change_request, BudgetLineItemChangeRequest):
        resp["has_budget_change"] = change_request.has_budget_change
        resp["has_status_change"] = change_request.has_status_change
    return resp


class ChangeRequestListAPI(BaseListAPI):
    def __init__(self, model: ChangeRequest = ChangeRequest):
        super().__init__(model)
        self._response_schema = BudgetLineItemChangeRequestResponseSchema()
        self._response_schema_collection = BudgetLineItemChangeRequestResponseSchema(many=True)

    @is_authorized(PermissionType.GET, Permission.CHANGE_REQUEST)
    def get(self) -> Response:
        limit = request.args.get("limit", 10, type=int)
        offset = request.args.get("offset", 0, type=int)
        user_id = request.args.get("userId")

        filters = {
            "status": ChangeRequestStatus.IN_REVIEW,
            "reviewer_user_id": user_id,
            "limit": limit,
            "offset": offset,
        }

        service = ChangeRequestService(current_app.db_session)
        change_requests, _ = service.get_list(data=filters)

        if change_requests:
            response = make_response_with_headers(self._response_schema_collection.dump(change_requests))
        else:
            response = make_response_with_headers([], 200)
        return response

    @is_authorized(PermissionType.POST, Permission.CHANGE_REQUEST)
    @jwt_required()
    def post(self) -> Response:
        request_json = request.get_json()
        change_request_id = request_json.get("change_request_id")

        service = ChangeRequestService(current_app.db_session)
        # try:
        #     change_request, _ = service.update(change_request_id, request_json)
        #     return make_response_with_headers(change_request.to_dict(), 200)
        # except AuthorizationError:
        #     return make_response_with_headers({"error": "Forbidden"}, 403)
        # except (ValueError, ResourceNotFoundError) as e:
        #     return make_response_with_headers({"error": str(e)}, 400)
        #
        can_update_request = service._is_division_director_of_change_request(change_request_id)
        if not change_request_id or not can_update_request:
            return make_response_with_headers({}, 403)

        reviewer_notes = request_json.get("reviewer_notes", None)
        action = request_json.get("action", "").upper()

        if action == "APPROVE":
            status_after_review = ChangeRequestStatus.APPROVED
        elif action == "REJECT":
            status_after_review = ChangeRequestStatus.REJECTED
        else:
            raise ValueError(f"Invalid action: {action}")

        reviewed_by_user_id = current_user.id

        change_request = review_change_request(
            change_request_id, status_after_review, reviewed_by_user_id, reviewer_notes
        )

        return make_response_with_headers(change_request.to_dict(), 200)
