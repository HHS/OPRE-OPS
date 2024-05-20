import copy
from datetime import datetime

import marshmallow_dataclass as mmdc
from flask import Response, current_app, request
from flask_jwt_extended import current_user
from sqlalchemy import select

from models import BudgetLineItem, BudgetLineItemChangeRequest, ChangeRequest, ChangeRequestStatus
from ops_api.ops.auth.auth_types import Permission, PermissionType
from ops_api.ops.auth.decorators import is_authorized
from ops_api.ops.base_views import BaseListAPI, handle_api_error
from ops_api.ops.resources import budget_line_items
from ops_api.ops.resources.budget_line_items import validate_and_prepare_change_data
from ops_api.ops.schemas.budget_line_items import PATCHRequestBody
from ops_api.ops.utils.response import make_response_with_headers


def review_change_request(
    change_request_id: int, status_after_review: ChangeRequestStatus, reviewed_by_user_id: int
) -> ChangeRequest:
    session = current_app.db_session
    change_request = session.get(ChangeRequest, change_request_id)
    change_request.reviewed_by_id = reviewed_by_user_id
    change_request.reviewed_on = datetime.now()
    change_request.status = status_after_review

    # If approved, then apply the changes
    if status_after_review == ChangeRequestStatus.APPROVED:
        if isinstance(change_request, BudgetLineItemChangeRequest):
            budget_line_item = session.get(BudgetLineItem, change_request.budget_line_item_id)
            # need to copy to avoid changing the original data in the ChangeRequest and triggering an update
            data = copy.deepcopy(change_request.requested_change_data)
            schema = mmdc.class_schema(PATCHRequestBody)()
            schema.context["id"] = change_request.budget_line_item_id
            schema.context["method"] = "PATCH"

            change_data, changing_from_data = validate_and_prepare_change_data(
                data,
                budget_line_item,
                schema,
                ["id", "status", "agreement_id"],
                partial=False,
            )

            budget_line_items.update_data(budget_line_item, change_data)
            session.add(budget_line_item)

    session.add(change_request)
    session.commit()
    return change_request


# TODO: Implement the queries needed for the For Approvals page, for now it's just a placeholder
class ChangeRequestListAPI(BaseListAPI):
    def __init__(self, model: ChangeRequest = ChangeRequest):
        super().__init__(model)

    @handle_api_error
    @is_authorized(PermissionType.GET, Permission.CHANGE_REQUEST)
    def get(self) -> Response:
        limit = request.args.get("limit", 10, type=int)
        offset = request.args.get("offset", 0, type=int)
        stmt = select(ChangeRequest).where(ChangeRequest.status == ChangeRequestStatus.IN_REVIEW)
        stmt = stmt.limit(limit)
        if offset:
            stmt = stmt.offset(int(offset))
        results = current_app.db_session.execute(stmt).all()
        change_requests = [row[0] for row in results] if results else None
        if change_requests:
            response = make_response_with_headers([change_request.to_dict() for change_request in change_requests])
        else:
            response = make_response_with_headers([], 200)
        return response


class ChangeRequestReviewAPI(BaseListAPI):
    def __init__(self, model: ChangeRequest = ChangeRequest):
        super().__init__(model)

    @handle_api_error
    @is_authorized(PermissionType.POST, Permission.CHANGE_REQUEST_REVIEW)
    def post(self) -> Response:
        request_json = request.get_json()
        change_request_id = request_json.get("change_request_id")
        action = request_json.get("action", "").upper()
        if action == "APPROVE":
            status_after_review = ChangeRequestStatus.APPROVED
        elif action == "REJECT":
            status_after_review = ChangeRequestStatus.REJECTED
        else:
            raise ValueError(f"Invalid action: {action}")

        reviewed_by_user_id = current_user.id

        change_request = review_change_request(change_request_id, status_after_review, reviewed_by_user_id)

        return make_response_with_headers(change_request.to_dict(), 200)
