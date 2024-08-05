from datetime import date

from flask import current_app

from models import (
    AgreementChangeRequest,
    BudgetLineItemChangeRequest,
    ChangeRequest,
    ChangeRequestNotification,
    ChangeRequestStatus,
    Division,
)
from models.cans import BudgetLineItemStatus


def get_expires_date():
    return date(2031, 12, 31)  # what should this be?


def create_notification_of_new_request_to_reviewer(change_request: ChangeRequest):
    if not isinstance(change_request, AgreementChangeRequest):
        return  # we only have messages here for Agreement related change requests for now
    agreement_id = change_request.agreement_id
    division_director_ids = set()
    division: Division = current_app.db_session.get(Division, change_request.managing_division_id)
    if division.division_director_id:
        division_director_ids.add(division.division_director_id)
    if division.deputy_division_director_id:
        division_director_ids.add(division.deputy_division_director_id)
    fe_url = current_app.config.get("OPS_FRONTEND_URL")

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

    for division_director_id in division_director_ids:
        notification = ChangeRequestNotification(
            change_request_id=change_request.id,
            title="Approval Request",
            message=f"An Agreement Approval Request has been submitted. "
            f"Please review and approve. \n\\\n\\\n[Link]({approve_url})",
            is_read=False,
            recipient_id=division_director_id,
            expires=get_expires_date(),
        )
        current_app.db_session.add(notification)
    current_app.db_session.commit()


def create_notification_of_reviews_request_to_submitter(change_request: ChangeRequest):
    if not isinstance(change_request, BudgetLineItemChangeRequest):
        return  # we only have messages here for BLI change requests for now

    if change_request.has_status_change:
        status_diff = change_request.requested_change_diff["status"]
        new_status = status_diff["new"]
        old_status = status_diff["old"]
        if change_request.status == ChangeRequestStatus.APPROVED:
            notification = ChangeRequestNotification(
                change_request_id=change_request.id,
                title=f"Budget Lines Approved from {old_status} to {new_status} Status",
                message=f"The budget lines you sent to your Division Director were approved from {old_status} to {new_status} status. "
                "The amounts have been subtracted from the FY budget.",
                is_read=False,
                recipient_id=change_request.created_by,
                expires=get_expires_date(),
            )
            current_app.db_session.add(notification)
            current_app.db_session.commit()
        elif change_request.status == ChangeRequestStatus.REJECTED:
            notification = ChangeRequestNotification(
                change_request_id=change_request.id,
                title=f"Budget Lines Declined from {old_status} to {new_status} Status",
                message=f"The budget lines you sent to your Division Director were declined from {old_status} to {new_status} status. ",
                is_read=False,
                recipient_id=change_request.created_by,
                expires=get_expires_date(),
            )
            current_app.db_session.add(notification)
            current_app.db_session.commit()
    else:  # non-status change request
        # just a generic message for now
        notification = ChangeRequestNotification(
            change_request_id=change_request.id,
            title=f"Budget Line Change Request {change_request.status}",
            message=f"Your budget line change request has been {change_request.status}",
            is_read=False,
            recipient_id=change_request.created_by,
            expires=get_expires_date(),
        )
        current_app.db_session.add(notification)
        current_app.db_session.commit()
