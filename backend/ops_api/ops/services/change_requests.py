from typing import Any

from numpy import number
from backend.models.change_requests import AgreementChangeRequest


class ChangeRequestService:
    def __init__(self, db_session):
        self.db_session = db_session

    def create(self, create_request: dict[str, Any]) -> number:
        """
        Create a new change request.
        returns the ID of the created change request.
        """
        # TODO: implement create change request
        change_request = AgreementChangeRequest()

        self.db_session.add(change_request)
        self.db_session.commit()
        return change_request.id
