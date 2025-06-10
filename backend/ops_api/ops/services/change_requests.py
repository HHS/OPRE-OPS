from typing import Any

from numpy import number

from models.change_requests import AgreementChangeRequest
from ops_api.ops.schemas.agreements import AgreementData


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

    def add_agreement_change_requests(self, agreement, change_data):
        change_request = AgreementChangeRequest()
        change_request.agreement_id = agreement.id
        change_request.agreement = agreement
        schema = AgreementData(only=["awarding_entity_id"])
        requested_change_data = schema.dump({"awarding_entity_id": change_data})
        change_request.requested_change_data = requested_change_data
        old_values = schema.dump(agreement)
        requested_change_diff = {
            "awarding_entity_id": {
                "new": requested_change_data.get("awarding_entity_id", None),
                "old": old_values.get("awarding_entity_id", None),
            }
        }
        change_request.requested_change_diff = requested_change_diff
        requested_change_info = {"target_display_name": agreement.name}
        change_request.requested_change_info = requested_change_info
        self.db_session.add(change_request)
        self.db_session.commit()

        return change_request.id
