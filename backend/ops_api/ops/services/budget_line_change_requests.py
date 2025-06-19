from typing import Any

from models import BudgetLineItemChangeRequest
from ops_api.ops.services.ops_service import OpsService, ResourceNotFoundError


class BudgetLineChangeRequestsService(OpsService[BudgetLineItemChangeRequest]):
    def __init__(self, db_session):
        self.db_session = db_session

    def create(self, create_request: dict[str, Any]) -> BudgetLineItemChangeRequest:
        change_request = BudgetLineItemChangeRequest(**create_request)
        self.db_session.add(change_request)
        self.db_session.commit()
        return change_request

    def update(self, id: int, updated_fields: dict[str, Any]) -> tuple[BudgetLineItemChangeRequest, int]:
        change_request = self.db_session.get(BudgetLineItemChangeRequest, id)
        if not change_request:
            raise ResourceNotFoundError("BudgetLineItemChangeRequest", id)
        for key, value in updated_fields.items():
            if hasattr(change_request, key):
                setattr(change_request, key, value)
        self.db_session.add(change_request)
        self.db_session.commit()
        return change_request, 200

    def delete(self, id: int) -> None:
        change_request = self.db_session.get(BudgetLineItemChangeRequest, id)
        if not change_request:
            raise ResourceNotFoundError("BudgetLineItemChangeRequest", id)
        self.db_session.delete(change_request)
        self.db_session.commit()

    def get(self, id: int) -> BudgetLineItemChangeRequest:
        change_request = self.db_session.get(BudgetLineItemChangeRequest, id)
        if not change_request:
            raise ResourceNotFoundError("BudgetLineItemChangeRequest", id)
        return change_request

    def get_list(self, data: dict | None) -> tuple[list[BudgetLineItemChangeRequest], dict | None]:
        query = self.db_session.query(BudgetLineItemChangeRequest)
        # Add filtering/pagination
        results = query.all()
        return results, None
