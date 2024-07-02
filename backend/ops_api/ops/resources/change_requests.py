import copy
from datetime import datetime
from functools import partial

from flask import Response, current_app, request
from flask_jwt_extended import current_user, jwt_required
from sqlalchemy import or_, select

from models import BudgetLineItem, BudgetLineItemChangeRequest, ChangeRequest, ChangeRequestStatus, Division
from ops_api.ops.auth.auth_types import Permission, PermissionType
from ops_api.ops.auth.decorators import is_authorized
from ops_api.ops.base_views import BaseListAPI
from ops_api.ops.resources import budget_line_items
from ops_api.ops.resources.budget_line_items import validate_and_prepare_change_data
from ops_api.ops.schemas.budget_line_items import PATCHRequestBodySchema
from ops_api.ops.schemas.change_requests import GenericChangeRequestResponseSchema
from ops_api.ops.utils import procurement_workflow_helper
from ops_api.ops.utils.change_requests import create_notification_of_reviews_request_to_submitter
from ops_api.ops.utils.response import make_response_with_headers


def division_director_of_change_request(self) -> bool:
    current_user_id = current_user.id
    request_data = request.json
    change_request_id = request_data.get("change_request_id", None)
    if change_request_id is None:
        return False
    change_request: ChangeRequest = current_app.db_session.get(ChangeRequest, change_request_id)
    if not change_request or not change_request.managing_division_id:
        return False
    division: Division = current_app.db_session.get(Division, change_request.managing_division_id)
    if division is None:
        return False
    return division.division_director_id == current_user_id or division.deputy_division_director_id == current_user_id


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
    should_create_procurement_workflow = False

    # If approved, then apply the changes
    if status_after_review == ChangeRequestStatus.APPROVED:
        if isinstance(change_request, BudgetLineItemChangeRequest):
            budget_line_item = session.get(BudgetLineItem, change_request.budget_line_item_id)
            should_create_procurement_workflow = (
                change_request.has_status_change and change_request.requested_change_data["status"] == "IN_EXECUTION"
            )
            # need to copy to avoid changing the original data in the ChangeRequest and triggering an update
            data = copy.deepcopy(change_request.requested_change_data)
            schema = PATCHRequestBodySchema()
            schema.context["id"] = change_request.budget_line_item_id
            schema.context["method"] = "PATCH"

            change_data, changing_from_data = validate_and_prepare_change_data(
                data,
                budget_line_item,
                schema,
                ["id", "agreement_id"],
                partial=False,
            )

            budget_line_items.update_data(budget_line_item, change_data)
            session.add(budget_line_item)

    session.add(change_request)
    session.commit()

    create_notification_of_reviews_request_to_submitter(change_request)

    if should_create_procurement_workflow:
        procurement_workflow_helper.create_procurement_workflow(change_request.agreement_id)

    return change_request


# TODO: add more query options, for now this just returns CRs in review for
#  the current user as a division director or deputy division director
def find_change_requests(limit: int = 10, offset: int = 0):

    current_user_id = getattr(current_user, "id", None)

    stmt = (
        select(ChangeRequest)
        .join(Division, ChangeRequest.managing_division_id == Division.id)
        .where(ChangeRequest.status == ChangeRequestStatus.IN_REVIEW)
        .where(
            or_(
                Division.division_director_id == current_user_id,
                Division.deputy_division_director_id == current_user_id,
            )
        )
    )
    stmt = stmt.limit(limit)
    if offset:
        stmt = stmt.offset(int(offset))
    results = current_app.db_session.execute(stmt).all()
    return results


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
        results = find_change_requests(limit=limit, offset=offset)
        change_requests = [row[0] for row in results] if results else None
        if change_requests:
            response = make_response_with_headers(self._response_schema_collection.dump(change_requests))
        else:
            response = make_response_with_headers([], 200)
        return response


class ChangeRequestReviewAPI(BaseListAPI):
    def __init__(self, model: ChangeRequest = ChangeRequest):
        super().__init__(model)

    @is_authorized(
        PermissionType.POST,
        Permission.CHANGE_REQUEST_REVIEW,
        extra_check=partial(
            division_director_of_change_request,
        ),
        groups=["Budget Team", "Admins"],
    )
    @jwt_required()
    def post(self) -> Response:
        request_json = request.get_json()
        change_request_id = request_json.get("change_request_id")
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
