from datetime import date

from flask import current_app

from models import AgreementChangeRequest, ChangeRequest, Division, Notification


def create_notification_for_review(change_request: ChangeRequest):
    if not isinstance(change_request, AgreementChangeRequest):
        return  # only notify for AgreementChangeRequests
    agreement_id = change_request.agreement_id
    division_director_ids = set()
    # temp dev DD IDs
    division_director_ids.add(21)
    division_director_ids.add(23)
    division: Division = current_app.db_session.get(Division, change_request.managing_division_id)
    if division.division_director_id:
        division_director_ids.add(division.division_director_id)
    if division.deputy_division_director_id:
        division_director_ids.add(division.deputy_division_director_id)
    fe_url = current_app.config.get("OPS_FRONTEND_URL")

    approve_url = f"{fe_url}/agreements/approve/{agreement_id}"
    for division_director_id in division_director_ids:
        notification = Notification(
            title="Approval Request",
            # NOTE: approve_url only renders as plain text in default react-markdown
            message=f"An Agreement Approval Request has been submitted. "
            f"Please review and approve. \n\\\n\\[Link]({approve_url})",
            is_read=False,
            recipient_id=division_director_id,
            expires=date(2031, 12, 31),
        )
        current_app.db_session.add(notification)
    current_app.db_session.commit()
