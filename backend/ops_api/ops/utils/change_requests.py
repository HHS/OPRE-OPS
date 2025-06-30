from flask import current_app

from models import BudgetLineItemChangeRequest, ChangeRequest, ChangeRequestNotification, ChangeRequestStatus
from ops_api.ops.utils.budget_line_items_helpers import convert_BLI_status_name_to_pretty_string


def create_notification_of_reviews_request_to_submitter(change_request: ChangeRequest):
    if not isinstance(change_request, BudgetLineItemChangeRequest):
        return  # we only have messages here for BLI change requests for now

    if change_request.has_status_change:
        status_diff = change_request.requested_change_diff["status"]
        new_status = convert_BLI_status_name_to_pretty_string(status_diff["new"])
        old_status = convert_BLI_status_name_to_pretty_string(status_diff["old"])

        if change_request.status == ChangeRequestStatus.APPROVED:
            title = f"Budget Lines Approved from {old_status} to {new_status} Status"
            message = (
                f"The status change you sent to your Division Director were approved "
                f"from {old_status} to {new_status} status. "
            )
        elif change_request.status == ChangeRequestStatus.REJECTED:
            title = (f"Budget Lines Declined from {old_status} to {new_status} Status",)
            message = (
                f"The budget lines you sent to your Division Director were declined "
                f"from {old_status} to {new_status} status. "
            )
        else:
            return  # TODO: unknown status, do nothing? Throw an error?

        notification = ChangeRequestNotification(
            change_request_id=change_request.id,
            title=title,
            message=message,
            is_read=False,
            recipient_id=change_request.created_by,
        )

    else:
        # non-status change request
        notification = ChangeRequestNotification(
            change_request_id=change_request.id,
            title=f"Budget Change Request {change_request.status}",
            message=f"Your budget change request has been {change_request.status}",
            is_read=False,
            recipient_id=change_request.created_by,
        )

    if notification:
        current_app.db_session.add(notification)
        current_app.db_session.commit()
