from typing import Any, Optional

from flask import current_app

from models import CAN, BudgetLineItem, BudgetLineItemChangeRequest, Division, Portfolio
from ops_api.ops.schemas.budget_line_items import PATCHRequestBodySchema
from ops_api.ops.services.ops_service import OpsService, ResourceNotFoundError
from ops_api.ops.utils.change_requests import create_notification_of_new_request_to_reviewer


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

    def get_division_for_budget_line_item(self, bli_id: int) -> Optional[Division]:
        division = (
            current_app.db_session.query(Division)
            .join(Portfolio, Division.id == Portfolio.division_id)
            .join(CAN, Portfolio.id == CAN.portfolio_id)
            .join(BudgetLineItem, CAN.id == BudgetLineItem.can_id)
            .filter(BudgetLineItem.id == bli_id)
            .one_or_none()
        )
        return division

    def add_change_requests(
        self,
        bli_id,
        budget_line_item,
        changing_from_data,
        change_data,
        changed_budget_or_status_prop_keys,
        requestor_notes,
    ) -> list[int]:
        """
        Creates one change request per changed field.
        """
        change_request_ids = []

        for key in changed_budget_or_status_prop_keys:
            change_keys = [key]
            schema = PATCHRequestBodySchema(only=change_keys)
            requested_change_data = schema.dump(change_data)
            old_values = schema.dump(changing_from_data)
            requested_change_diff = {
                key: {"new": requested_change_data.get(key, None), "old": old_values.get(key, None)}
                for key in change_keys
            }

            managing_division = self.get_division_for_budget_line_item(bli_id)

            change_request_data = {
                "budget_line_item_id": bli_id,
                "agreement_id": budget_line_item.agreement_id,
                "managing_division_id": managing_division.id if managing_division else None,
                "requested_change_data": requested_change_data,
                "requested_change_diff": requested_change_diff,
                "requested_change_info": {"target_display_name": budget_line_item.display_name},
                "requestor_notes": requestor_notes,
            }

            change_request = self.create(change_request_data)

            create_notification_of_new_request_to_reviewer(change_request)
            change_request_ids.append(change_request.id)

        return change_request_ids
