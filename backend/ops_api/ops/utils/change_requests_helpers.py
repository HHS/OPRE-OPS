from typing import Type

from flask import current_app
from sqlalchemy import and_, func, or_, select
from sqlalchemy.orm import with_polymorphic

from models import (
    CAN,
    Agreement,
    AgreementChangeRequest,
    BudgetLineItem,
    BudgetLineItemChangeRequest,
    BudgetLineItemStatus,
    ChangeRequest,
    ChangeRequestStatus,
    ChangeRequestType,
    Division,
    Portfolio,
)
from ops_api.ops.utils.budget_line_items_helpers import (
    convert_BLI_status_name_to_pretty_string,
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
    if getattr(change_request, "has_status_change", False):
        change_type = "status-change"
    elif getattr(change_request, "has_budget_change", False):
        change_type = "budget-change"
    elif getattr(change_request, "has_delete_change", False):
        # A deletion request reviews on the budget-change surface (BudgetChangeReviewCard).
        change_type = "budget-change"
    elif getattr(change_request, "has_proc_shop_change", False):
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


def get_division_ids_user_can_review_for(user_id: int) -> set[int]:
    """Return division IDs where user is a director or deputy."""
    stmt = select(Division.id).where(
        or_(
            Division.division_director_id == user_id,
            Division.deputy_division_director_id == user_id,
        )
    )
    return {row[0] for row in current_app.db_session.execute(stmt).all()}


def _get_reviewable_agreement_ids_subquery(user_id: int):
    """Subquery returning agreement IDs where the user is a division director or deputy via BLI→CAN→Portfolio→Division."""
    return (
        select(Agreement.id)
        .distinct()
        .join(Agreement.budget_line_items)
        .join(BudgetLineItem.can)
        .join(CAN.portfolio)
        .join(Portfolio.division)
        .where(
            or_(
                Division.division_director_id == user_id,
                Division.deputy_division_director_id == user_id,
            )
        )
        .scalar_subquery()
    )


def find_in_review_requests_by_user(user_id: int, limit: int = 10, offset: int = 0):
    cr_poly = with_polymorphic(ChangeRequest, [AgreementChangeRequest, BudgetLineItemChangeRequest])

    reviewable_division_ids = get_division_ids_user_can_review_for(user_id)
    reviewable_agreement_ids_subq = _get_reviewable_agreement_ids_subquery(user_id)

    bli_filter = and_(
        ChangeRequest.change_request_type == ChangeRequestType.BUDGET_LINE_ITEM_CHANGE_REQUEST,
        BudgetLineItemChangeRequest.managing_division_id.in_(reviewable_division_ids),
    )
    agr_filter = and_(
        ChangeRequest.change_request_type == ChangeRequestType.AGREEMENT_CHANGE_REQUEST,
        AgreementChangeRequest.agreement_id.in_(reviewable_agreement_ids_subq),
    )

    stmt = (
        select(cr_poly)
        .where(ChangeRequest.status == ChangeRequestStatus.IN_REVIEW)
        .where(or_(bli_filter, agr_filter))
        .order_by(ChangeRequest.id.desc())
    )

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total_count = current_app.db_session.execute(count_stmt).scalar()
    results = current_app.db_session.execute(stmt.limit(limit).offset(offset)).scalars().all()
    return results, total_count


def build_review_outcome_title_and_message(
    change_request: ChangeRequest,
) -> tuple[str | None, str | None]:
    """
    Helper method to build the title and message for the review outcome notification.
    """
    status = change_request.status

    if status not in {ChangeRequestStatus.APPROVED, ChangeRequestStatus.REJECTED}:
        raise ValueError(f"Unsupported status: {status.name}")

    if change_request.change_request_type == ChangeRequestType.AGREEMENT_CHANGE_REQUEST:
        if status == ChangeRequestStatus.APPROVED:
            return (
                "Procurement Shop Change Approved",
                "Your procurement shop change request has been approved.",
            )
        elif status == ChangeRequestStatus.REJECTED:
            return (
                "Procurement Shop Change Rejected",
                "Your procurement shop change request has been rejected.",
            )
        else:
            return None, None  # Unknown status

    elif change_request.change_request_type == ChangeRequestType.BUDGET_LINE_ITEM_CHANGE_REQUEST:
        if getattr(change_request, "has_status_change", False):
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
