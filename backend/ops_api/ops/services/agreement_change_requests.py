from typing import Any

from models.change_requests import AgreementChangeRequest
from ops_api.ops.services.ops_service import OpsService, ResourceNotFoundError


class ChangeRequestService(OpsService[AgreementChangeRequest]):
    def __init__(self, db_session):
        self.db_session = db_session

    def create(self, create_request: dict[str, Any]) -> AgreementChangeRequest:
        change_request = AgreementChangeRequest(**create_request)
        self.db_session.add(change_request)
        self.db_session.commit()
        return change_request

    def update(self, id: int, updated_fields: dict[str, Any]) -> tuple[AgreementChangeRequest, int]:
        change_request = self.db_session.get(AgreementChangeRequest, id)
        if not change_request:
            raise ResourceNotFoundError("AgreementChangeRequest", id)
        for key, value in updated_fields.items():
            if hasattr(change_request, key):
                setattr(change_request, key, value)
        self.db_session.add(change_request)
        self.db_session.commit()
        return change_request, 200

    def delete(self, id: int) -> None:
        change_request = self.db_session.get(AgreementChangeRequest, id)
        if not change_request:
            raise ResourceNotFoundError("AgreementChangeRequest", id)
        self.db_session.delete(change_request)
        self.db_session.commit()

    def get(self, id: int) -> AgreementChangeRequest:
        change_request = self.db_session.get(AgreementChangeRequest, id)
        if not change_request:
            raise ResourceNotFoundError("AgreementChangeRequest", id)
        return change_request

    def get_list(self, data: dict | None) -> tuple[list[AgreementChangeRequest], dict | None]:
        query = self.db_session.query(AgreementChangeRequest)
        # Add filtering/pagination
        results = query.all()
        return results, None
