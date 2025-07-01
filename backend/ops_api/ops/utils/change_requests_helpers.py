from typing import Type

from flask import current_app
from sqlalchemy import or_, select

from models import (
    AgreementChangeRequest,
    BudgetLineItemChangeRequest,
    BudgetLineItemStatus,
    ChangeRequest,
    ChangeRequestStatus,
    ChangeRequestType,
    Division,
)
from ops_api.ops.utils.budget_line_items_helpers import convert_BLI_status_name_to_pretty_string

CHANGE_REQUEST_MODEL_MAP = {
    ChangeRequestType.CHANGE_REQUEST: ChangeRequest,
    ChangeRequestType.AGREEMENT_CHANGE_REQUEST: AgreementChangeRequest,
    ChangeRequestType.BUDGET_LINE_ITEM_CHANGE_REQUEST: BudgetLineItemChangeRequest,
}


def get_model_class_by_type(request_type: ChangeRequestType) -> Type[ChangeRequest]:
    model_class = CHANGE_REQUEST_MODEL_MAP.get(request_type)
    if model_class is None:
        raise ValueError(f"Unsupported change request type: {request_type}")
    return model_class


def build_approve_url(change_request: ChangeRequest, agreement_id: int, fe_url: str) -> str:
    if getattr(change_request, "has_status_change", False):
        change_type = "status-change"
    elif getattr(change_request, "has_budget_change", False):
        change_type = "budget-change"
    elif getattr(change_request, "has_proc_shop_field_names_change", False):
        change_type = "procurement-shop-change"
    else:
        raise ValueError(f"Unrecognized change request type for ChangeRequest ID {change_request.id}")

    approve_url = f"{fe_url}/agreements/approve/{agreement_id}?type={change_type}"

    if change_request.requested_change_data and change_request.requested_change_data.get("status"):
        change_status = change_request.requested_change_data.get("status")
        to_status = None
        if change_status == BudgetLineItemStatus.PLANNED.name:
            to_status = "planned"
        elif change_status == BudgetLineItemStatus.IN_EXECUTION.name:
            to_status = "executing"

        if to_status is not None:
            approve_url = f"{approve_url}&to={to_status}"

    return approve_url


# TODO: add more query options, for now this just returns CRs in review for
#  the current user as a division director or deputy division director
# This will not work for agreements with multiple divisions since we're dynamically calculating the managing divisions
def find_in_review_requests_by_user(user_id, limit: int = 10, offset: int = 0):
    stmt = (
        select(ChangeRequest)
        .join(Division, ChangeRequest.managing_division_id == Division.id)
        .where(ChangeRequest.status == ChangeRequestStatus.IN_REVIEW)
    )
    if user_id:
        stmt = stmt.where(
            or_(
                Division.division_director_id == user_id,
                Division.deputy_division_director_id == user_id,
            )
        )
    stmt = stmt.limit(limit).offset(offset)

    return [row for (row,) in current_app.db_session.execute(stmt).all()]


def build_review_outcome_title_and_message(change_request: ChangeRequest) -> tuple[str | None, str | None]:
    """
    Helper method to build the title and message for the review outcome notification.
    """
    status = change_request.status

    if change_request.change_request_type == ChangeRequestType.AGREEMENT_CHANGE_REQUEST:
        if status == ChangeRequestStatus.APPROVED:
            return "Procurement Shop Change Approved", "Your procurement shop change request has been approved."
        elif status == ChangeRequestStatus.REJECTED:
            return "Procurement Shop Change Rejected", "Your procurement shop change request has been rejected."
        else:
            return None, None  # Unknown status

    elif change_request.change_request_type == ChangeRequestType.BUDGET_LINE_ITEM_CHANGE_REQUEST:
        if change_request.has_status_change:
            status_diff = change_request.requested_change_diff["status"]
            new_status = convert_BLI_status_name_to_pretty_string(status_diff["new"])
            old_status = convert_BLI_status_name_to_pretty_string(status_diff["old"])

            if status == ChangeRequestStatus.APPROVED:
                return (
                    f"Budget Lines Approved from {old_status} to {new_status} Status",
                    f"The status change you submitted was approved: {old_status} → {new_status}.",
                )
            elif status == ChangeRequestStatus.REJECTED:
                return (
                    f"Budget Lines Declined from {old_status} to {new_status} Status",
                    f"The status change you submitted was rejected: {old_status} → {new_status}.",
                )
            else:
                return None, None  # Unknown status
        else:
            return (
                f"Budget Change Request {status.name}",
                f"Your budget change request has been {status.name.lower()}.",
            )

    return None, None
