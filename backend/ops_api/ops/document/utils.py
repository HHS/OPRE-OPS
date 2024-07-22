from flask import current_app
from sqlalchemy.future import select

from models import Agreement


def is_user_linked_to_agreement(user, agreement_id: int) -> bool:
    """
    Check the agreement table to see if the user is associated with the agreement.
    """
    agreement_stmt = select(Agreement).where(Agreement.id == agreement_id)
    agreement = current_app.db_session.scalar(agreement_stmt)

    if not agreement:
        return False

    # Check if the user is the project officer
    if agreement.project_officer_id == user.id:
        return True

    # Check if the user is a team member
    for team_member in agreement.team_members:
        if team_member.id == user.id:
            return True

    return False
