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
    approve_url = (
        f"{fe_url}/agreements/approve/{agreement_id}?type=status-change"
        if change_request.has_status_change
        else f"{fe_url}/agreements/approve/{agreement_id}?type=budget-change"
    )

    if not (change_request.requested_change_data is None or change_request.requested_change_data.get("status") is None):
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
