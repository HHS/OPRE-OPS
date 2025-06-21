from datetime import date
from typing import Any, Optional, Type

from flask import current_app

from models import CAN, BudgetLineItem, BudgetLineItemStatus, Division, NotificationType, Portfolio
from models.change_requests import AgreementChangeRequest, BudgetLineItemChangeRequest, ChangeRequest, ChangeRequestType
from ops_api.ops.schemas.budget_line_items import PATCHRequestBodySchema
from ops_api.ops.services.notifications import NotificationService
from ops_api.ops.services.ops_service import OpsService, ResourceNotFoundError

CHANGE_REQUEST_MODEL_MAP = {
    ChangeRequestType.CHANGE_REQUEST: ChangeRequest,
    ChangeRequestType.AGREEMENT_CHANGE_REQUEST: AgreementChangeRequest,
    ChangeRequestType.BUDGET_LINE_ITEM_CHANGE_REQUEST: BudgetLineItemChangeRequest,
}


class ChangeRequestService(OpsService[ChangeRequest]):
    def __init__(self, db_session):
        self.db_session = db_session
        self.notification_service = NotificationService(db_session)

    # --- Generic CRUD Methods ---

    def _get_model_class(self, request_type: ChangeRequestType) -> Type[ChangeRequest]:
        model_class = CHANGE_REQUEST_MODEL_MAP.get(request_type)
        if model_class is None:
            raise ValueError(f"Unsupported change request type: {request_type}")
        return model_class

    def create(self, create_request: dict[str, Any]) -> ChangeRequest:
        request_type = create_request.get("change_request_type")
        if request_type is None:
            raise ValueError("Missing 'change_request_type' in request data")

        model_class = self._get_model_class(request_type)
        change_request = model_class(**create_request)
        self.db_session.add(change_request)
        self.db_session.commit()

        self._notify_division_reviewers(change_request)

        return change_request

    def update(self, id: int, updated_fields: dict[str, Any]) -> tuple[ChangeRequest, int]:
        change_request = self.db_session.get(ChangeRequest, id)
        if not change_request:
            raise ResourceNotFoundError("ChangeRequest", id)

        for key, value in updated_fields.items():
            if hasattr(change_request, key):
                setattr(change_request, key, value)

        self.db_session.commit()
        return change_request, 200

    def delete(self, id: int) -> None:
        change_request = self.db_session.get(ChangeRequest, id)
        if not change_request:
            raise ResourceNotFoundError("ChangeRequest", id)

        self.db_session.delete(change_request)
        self.db_session.commit()

    def get(self, id: int) -> ChangeRequest:
        change_request = self.db_session.get(ChangeRequest, id)
        if not change_request:
            raise ResourceNotFoundError("ChangeRequest", id)
        return change_request

    def get_list(self, filters: dict | None = None) -> tuple[list[ChangeRequest], dict | None]:
        query = self.db_session.query(ChangeRequest)
        # TODO: Filters and pagination
        results = query.all()
        return results, None

    # --- BudgetLineItem-specific Helpers (inline for now) ---

    # This should go into a utility file
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

    def add_bli_change_requests(
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
                "agreement_id": budget_line_item.agreement_id,  # Can update the class to capture agreement_id
                "managing_division_id": managing_division.id if managing_division else None,
                "requested_change_data": requested_change_data,
                "requested_change_diff": requested_change_diff,
                "requested_change_info": {"target_display_name": budget_line_item.display_name},
                "requestor_notes": requestor_notes,
                "change_request_type": ChangeRequestType.BUDGET_LINE_ITEM_CHANGE_REQUEST,
            }

            change_request = self.create(change_request_data)
            change_request_ids.append(change_request.id)

        return change_request_ids

    def _build_approve_url(self, change_request: ChangeRequest, agreement_id: int, fe_url: str) -> str:
        approve_url = (
            f"{fe_url}/agreements/approve/{agreement_id}?type=status-change"
            if change_request.has_status_change
            else f"{fe_url}/agreements/approve/{agreement_id}?type=budget-change"
        )

        if not (
            change_request.requested_change_data is None or change_request.requested_change_data.get("status") is None
        ):
            change_status = change_request.requested_change_data.get("status")
            to_status = None
            if change_status == BudgetLineItemStatus.PLANNED.name:
                to_status = "planned"
            elif change_status == BudgetLineItemStatus.IN_EXECUTION.name:
                to_status = "executing"
            if to_status is not None:
                approve_url = f"{approve_url}&to={to_status}"

        return approve_url

    def _notify_division_reviewers(self, change_request):
        if isinstance(change_request, AgreementChangeRequest):
            return  # we only have messages here for Agreement related change requests for now

        agreement_id = change_request.agreement_id

        division_director_ids = set()
        division: Division = current_app.db_session.get(Division, change_request.managing_division_id)
        if division.division_director_id:
            division_director_ids.add(division.division_director_id)
        if division.deputy_division_director_id:
            division_director_ids.add(division.deputy_division_director_id)

        fe_url = current_app.config.get("OPS_FRONTEND_URL")
        approve_url = self._build_approve_url(change_request, agreement_id, fe_url)

        message = (
            f"An Agreement Approval Request has been submitted. "
            f"Please review and approve. \n\\\n\\\n[Link]({approve_url})"
        )

        for division_director_id in division_director_ids:
            self.notification_service.create(
                {
                    "change_request_id": change_request.id,
                    "title": "Approval Request",
                    "message": message,
                    "is_read": False,
                    "recipient_id": division_director_id,
                    "notification_type": NotificationType.CHANGE_REQUEST_NOTIFICATION,
                    "expires": date(2031, 12, 31),  # what should this be?
                }
            )
