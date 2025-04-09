from typing import Any, Optional

from flask import current_app
from sqlalchemy import inspect, select
from sqlalchemy.exc import NoResultFound
from werkzeug.exceptions import NotFound

from models import (
    CAN,
    BudgetLineItem,
    BudgetLineItemChangeRequest,
    BudgetLineItemStatus,
    Division,
    OpsEventType,
    Portfolio,
)
from ops_api.ops.schemas.budget_line_items import PATCHRequestBodySchema
from ops_api.ops.services.cans import CANService
from ops_api.ops.services.ops_service import AuthorizationError, ResourceNotFoundError, ValidationError
from ops_api.ops.utils.api_helpers import validate_and_prepare_change_data
from ops_api.ops.utils.change_requests import create_notification_of_new_request_to_reviewer
from ops_api.ops.utils.events import OpsEventHandler


class BudgetLineItemService:
    def create(self, create_request: dict[str, Any]) -> BudgetLineItem:
        """
        Create a new Budget Line Item and save it to the database.
        """
        new_budget_line_item = BudgetLineItem(**create_request)

        current_app.db_session.add(new_budget_line_item)
        current_app.db_session.commit()
        return new_budget_line_item

    def __init__(self, db_session):
        self.db_session = db_session

    def update(self, updated_fields: dict[str, Any], id: int) -> BudgetLineItem:
        """
        Update a Budget Line Item with only the provided values in updated_fields.
        """
        try:
            budget_line_item: BudgetLineItem = current_app.db_session.execute(
                select(BudgetLineItem).where(BudgetLineItem.id == id)
            ).scalar_one()

            for attr, value in updated_fields.items():
                if hasattr(budget_line_item, attr):
                    setattr(budget_line_item, attr, value)

            current_app.db_session.add(budget_line_item)
            current_app.db_session.commit()
            return budget_line_item
        except NoResultFound as err:
            current_app.logger.exception(f"Could not find a Budget Line Item with id {id}")
            raise NotFound() from err

    def delete(self, id: int) -> None:
        """
        Delete a Budget Line Item with the given id.
        """
        try:
            budget_line_item: BudgetLineItem = current_app.db_session.execute(
                select(BudgetLineItem).where(BudgetLineItem.id == id)
            ).scalar_one()

            current_app.db_session.delete(budget_line_item)
            current_app.db_session.commit()
        except NoResultFound as err:
            current_app.logger.exception(f"Could not find a Budget Line Item with id {id}")
            raise NotFound() from err

    def get(self, id: int) -> BudgetLineItem:
        """
        Get an individual Budget Line Item by id.
        """
        budget_line_item = self.db_session.get(BudgetLineItem, id)

        if budget_line_item:
            return budget_line_item
        else:
            raise ResourceNotFoundError("BudgetLineItem", id)

    def get_list(self, search: Optional[str] = None) -> list[BudgetLineItem]:
        """
        Get a list of Budget Line Items, optionally filtered by a search parameter.
        """
        stmt = select(BudgetLineItem)

        if search:
            # Implement search logic here based on your requirements
            # Example: stmt = stmt.where(BudgetLineItem.name.ilike(f"%{search}%"))
            pass

        results = current_app.db_session.execute(stmt).scalars().all()
        return list(results)

    def _update(self, id, method, schema, request) -> tuple[BudgetLineItem, int]:
        # message_prefix = f"{method} to {ENDPOINT_STRING}"

        with OpsEventHandler(OpsEventType.UPDATE_BLI) as meta:
            schema.context["id"] = id
            schema.context["method"] = method

            # determine if the BLI is in an editable state or one that supports change requests (requires approval)
            budget_line_item = self.db_session.get(BudgetLineItem, id)
            if not budget_line_item:
                raise ResourceNotFoundError("BudgetLineItem", id)

            editable = self.is_bli_editable(budget_line_item)

            # 403: forbidden to edit
            if not editable:
                raise AuthorizationError(
                    f"Budget Line Item {id} is not editable. Status: {budget_line_item.status}",
                    "BudgetLineItem",
                )

            # pull out requestor_notes from BLI data for change requests
            request_data = request.json
            requestor_notes = request_data.pop("requestor_notes", None)

            # validate and normalize the request data
            change_data, changing_from_data = validate_and_prepare_change_data(
                request_data,
                budget_line_item,
                schema,
                ["id", "agreement_id"],
                partial=False,
            )

            can_service = CANService()
            if "can_id" in request_data and request_data["can_id"] is not None:
                can_service.get(request_data["can_id"])

            has_status_change = "status" in change_data
            has_non_status_change = len(change_data) > 1 if has_status_change else len(change_data) > 0

            # determine if it can be edited directly or if a change request is required
            directly_editable = not has_status_change and budget_line_item.status in [BudgetLineItemStatus.DRAFT]

            # Status changes are not allowed with other changes
            if has_status_change and has_non_status_change:
                raise ValidationError({"status": "When the status is changing other edits are not allowed"})

            changed_budget_or_status_prop_keys = list(
                set(change_data.keys()) & (set(BudgetLineItemChangeRequest.budget_field_names + ["status"]))
            )
            other_changed_prop_keys = list(set(change_data.keys()) - set(changed_budget_or_status_prop_keys))

            direct_change_data = {
                key: value for key, value in change_data.items() if directly_editable or key in other_changed_prop_keys
            }

            if direct_change_data:
                update_data(budget_line_item, direct_change_data)
                current_app.db_session.add(budget_line_item)
                current_app.db_session.commit()

            change_request_ids = []

            if not directly_editable and changed_budget_or_status_prop_keys:
                change_request_ids = self.add_change_requests(
                    id,
                    budget_line_item,
                    changing_from_data,
                    change_data,
                    changed_budget_or_status_prop_keys,
                    requestor_notes,
                )

            # bli_dict = response_schema.dump(budget_line_item)
            meta.metadata.update({"bli": budget_line_item.to_dict()})
            current_app.logger.debug(f"Updated BLI: {budget_line_item.to_dict()}")
            return budget_line_item, 202 if change_request_ids else 200
            # if change_request_ids:
            #     return make_response_with_headers(bli_dict, 202)
            # else:
            #     return make_response_with_headers(bli_dict, 200)

    def is_bli_editable(self, budget_line_item):
        """A utility function that determines if a BLI is editable"""
        editable = budget_line_item.status in [
            BudgetLineItemStatus.DRAFT,
            BudgetLineItemStatus.PLANNED,
            BudgetLineItemStatus.IN_EXECUTION,
        ]

        # if the BLI is in review, it cannot be edited
        if budget_line_item.in_review:
            editable = False

        return editable

    def add_change_requests(
        self, id, budget_line_item, changing_from_data, change_data, changed_budget_or_status_prop_keys, requestor_notes
    ):
        change_request_ids = []
        # create a change request for each changed prop separately (for separate approvals)
        # the CR model can support multiple changes in a single request,
        # but we are limiting it to one change per request here
        for changed_prop_key in changed_budget_or_status_prop_keys:
            change_keys = [changed_prop_key]
            change_request = BudgetLineItemChangeRequest()
            change_request.budget_line_item_id = id
            change_request.agreement_id = budget_line_item.agreement_id
            managing_division = get_division_for_budget_line_item(id)
            change_request.managing_division_id = managing_division.id if managing_division else None
            schema = PATCHRequestBodySchema(only=change_keys)
            requested_change_data = schema.dump(change_data)
            change_request.requested_change_data = requested_change_data
            old_values = schema.dump(changing_from_data)
            requested_change_diff = {
                key: {"new": requested_change_data.get(key, None), "old": old_values.get(key, None)}
                for key in change_keys
            }
            change_request.requested_change_diff = requested_change_diff
            requested_change_info = {"target_display_name": budget_line_item.display_name}
            change_request.requested_change_info = requested_change_info
            change_request.requestor_notes = requestor_notes
            current_app.db_session.add(change_request)
            current_app.db_session.commit()
            create_notification_of_new_request_to_reviewer(change_request)
            change_request_ids.append(change_request.id)

        return change_request_ids


def get_division_for_budget_line_item(bli_id: int) -> Optional[Division]:
    division = (
        current_app.db_session.query(Division)
        .join(Portfolio, Division.id == Portfolio.division_id)
        .join(CAN, Portfolio.id == CAN.portfolio_id)
        .join(BudgetLineItem, CAN.id == BudgetLineItem.can_id)
        .filter(BudgetLineItem.id == bli_id)
        .one_or_none()
    )
    return division


def update_data(budget_line_item: BudgetLineItem, data: dict[str, Any]) -> None:
    for item in data:
        if item in [c_attr.key for c_attr in inspect(budget_line_item).mapper.column_attrs]:
            setattr(budget_line_item, item, data[item])
