from typing import Any, Optional

from flask import current_app
from flask_jwt_extended import get_current_user
from loguru import logger
from sqlalchemy import inspect, select

from models import (
    CAN,
    Agreement,
    AgreementType,
    BudgetLineItem,
    BudgetLineItemChangeRequest,
    BudgetLineItemStatus,
    ContractBudgetLineItem,
    DirectObligationBudgetLineItem,
    Division,
    GrantBudgetLineItem,
    IAABudgetLineItem,
    OpsEventType,
    Portfolio,
)
from ops_api.ops.schemas.budget_line_items import PATCHRequestBodySchema
from ops_api.ops.services.agreements import associated_with_agreement, check_user_association
from ops_api.ops.services.cans import CANService
from ops_api.ops.services.ops_service import AuthorizationError, ResourceNotFoundError, ValidationError
from ops_api.ops.utils.api_helpers import convert_date_strings_to_dates, validate_and_prepare_change_data
from ops_api.ops.utils.change_requests import create_notification_of_new_request_to_reviewer
from ops_api.ops.utils.events import OpsEventHandler


class BudgetLineItemService:
    def create(self, create_request: dict[str, Any]) -> BudgetLineItem:
        """
        Create a new Budget Line Item and save it to the database.
        """
        with OpsEventHandler(OpsEventType.CREATE_BLI) as meta:
            agreement_id = create_request["agreement_id"]

            if not associated_with_agreement(agreement_id):
                raise AuthorizationError(
                    f"User is not associated with the agreement {agreement_id}",
                    "BudgetLineItem",
                )

            if create_request.get("can_id"):
                can = self.db_session.get(CAN, create_request["can_id"])
                if not can:
                    raise ResourceNotFoundError("CAN", create_request["can_id"])

            # TODO: These types should have been validated in the schema
            create_request["status"] = (
                BudgetLineItemStatus[create_request["status"]] if create_request.get("status") else None
            )
            data = convert_date_strings_to_dates(create_request)

            agreement = self.db_session.get(Agreement, agreement_id)

            match agreement.agreement_type:
                case AgreementType.CONTRACT:
                    new_bli = ContractBudgetLineItem(**data)
                case AgreementType.GRANT:
                    new_bli = GrantBudgetLineItem(**data)
                case AgreementType.DIRECT_OBLIGATION:
                    new_bli = DirectObligationBudgetLineItem(**data)
                case AgreementType.IAA:
                    new_bli = IAABudgetLineItem(**data)
                case _:
                    raise RuntimeError(f"Invalid bli type: {agreement.agreement_type}")

            current_app.db_session.add(new_bli)
            current_app.db_session.commit()
            meta.metadata.update({"new_bli": new_bli.to_dict()})
            return new_bli

    def __init__(self, db_session):
        self.db_session = db_session

    def delete(self, id: int) -> None:
        """
        Delete a Budget Line Item with the given id.
        """
        with OpsEventHandler(OpsEventType.DELETE_BLI) as meta:
            # validation and authorization checks
            bli = self.db_session.get(BudgetLineItem, id)

            if not bli:
                raise ResourceNotFoundError(
                    "BudgetLineItem",
                    id,
                )

            if not bli_associated_with_agreement(id):
                raise AuthorizationError(
                    f"User is not associated with the agreement for BudgetLineItem {id}",
                    "BudgetLineItem",
                )

            self.db_session.delete(bli)
            self.db_session.commit()
            meta.metadata.update({"Deleted BudgetLineItem": id})
            return bli

    def get(self, id: int) -> BudgetLineItem:
        """
        Get an individual Budget Line Item by id.
        """
        budget_line_item = self.db_session.get(BudgetLineItem, id)

        if budget_line_item:
            return budget_line_item
        else:
            raise ResourceNotFoundError("BudgetLineItem", id)

    def get_list(self, data: dict | None) -> type[list[BudgetLineItem], dict | None]:
        """
        Get a list of Budget Line Items, optionally filtered.
        """
        fiscal_years = data.get("fiscal_year", [])
        budget_line_statuses = data.get("budget_line_status", [])
        portfolios = data.get("portfolio", [])
        can_ids = data.get("can_id", [])
        agreement_ids = data.get("agreement_id", [])
        statuses = data.get("status", [])
        only_my = data.get("only_my", [])
        include_fees = data.get("include_fees", [])
        limit = data.get("limit", [])
        offset = data.get("offset", [])
        sort_condition = data.get("sort_conditions", [])
        logger.debug("Sort conditions: ")
        logger.debug(sort_condition)

        query = select(BudgetLineItem).distinct().order_by(BudgetLineItem.id)

        if fiscal_years:
            query = query.where(BudgetLineItem.fiscal_year.in_(fiscal_years))
        if budget_line_statuses:
            query = query.where(BudgetLineItem.status.in_(budget_line_statuses))
        if portfolios:
            query = query.where(BudgetLineItem.portfolio_id.in_(portfolios))
        if can_ids:
            query = query.where(BudgetLineItem.can_id.in_(can_ids))
        if agreement_ids:
            query = query.where(BudgetLineItem.agreement_id.in_(agreement_ids))
        if statuses:
            query = query.where(BudgetLineItem.status.in_(statuses))

        logger.debug("Beginning bli queries")
        # it would be better to use count() here, but SQLAlchemy should cache this anyway and
        # the where clauses are not forming correct SQL
        all_results = self.db_session.scalars(query).all()
        count = len(all_results)
        totals = _get_totals_with_or_without_fees(all_results, include_fees)

        # TODO: can't use this SQL for now because only_my is using a function rather than SQL
        # if limit and offset:
        #     query = query.limit(limit[0]).offset(offset[0])
        #
        # result = current_app.db_session.scalars(query).all()

        if only_my and True in only_my:
            # filter out BLIs not associated with the current user
            user = get_current_user()
            results = [bli for bli in all_results if check_user_association(bli.agreement, user)]
        else:
            results = all_results

        # slice the results if limit and offset are provided
        if limit and offset:
            limit_value = int(limit[0])
            offset_value = int(offset[0])
            results = results[offset_value : offset_value + limit_value]

        logger.debug("BLI queries complete")

        return results, {"count": count, "totals": totals}

    def update(self, id: int, updated_fields: dict[str, Any]) -> tuple[BudgetLineItem, int]:
        with OpsEventHandler(OpsEventType.UPDATE_BLI) as meta:
            # validation and authorization checks
            if not bli_associated_with_agreement(id):
                raise AuthorizationError(
                    f"User is not associated with the agreement for BudgetLineItem {id}",
                    "BudgetLineItem",
                )

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

            # TODO: This needs to be refactored to use the schema
            method = updated_fields.get("method")
            request = updated_fields.get("request")
            schema = updated_fields.get("schema")

            schema.context["id"] = id
            schema.context["method"] = method

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

            meta.metadata.update({"bli": budget_line_item.to_dict()})
            current_app.logger.debug(f"Updated BLI: {budget_line_item.to_dict()}")
            return budget_line_item, 202 if change_request_ids else 200

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


def _get_totals_with_or_without_fees(all_results, include_fees):
    if include_fees and True in include_fees:
        total_amount = sum([result.amount + result.fees for result in all_results])
        total_draft_amount = sum(
            [result.amount + result.fees for result in all_results if result.status == BudgetLineItemStatus.DRAFT]
        )
        total_planned_amount = sum(
            [result.amount + result.fees for result in all_results if result.status == BudgetLineItemStatus.PLANNED]
        )
        total_in_execution_amount = sum(
            [
                result.amount + result.fees
                for result in all_results
                if result.status == BudgetLineItemStatus.IN_EXECUTION
            ]
        )
        total_obligated_amount = sum(
            [result.amount + result.fees for result in all_results if result.status == BudgetLineItemStatus.OBLIGATED]
        )
    else:
        total_amount = sum([result.amount for result in all_results])
        total_draft_amount = sum(
            [result.amount for result in all_results if result.status == BudgetLineItemStatus.DRAFT]
        )
        total_planned_amount = sum(
            [result.amount for result in all_results if result.status == BudgetLineItemStatus.PLANNED]
        )
        total_in_execution_amount = sum(
            [result.amount for result in all_results if result.status == BudgetLineItemStatus.IN_EXECUTION]
        )
        total_obligated_amount = sum(
            [result.amount for result in all_results if result.status == BudgetLineItemStatus.OBLIGATED]
        )
    return {
        "total_amount": total_amount,
        "total_draft_amount": total_draft_amount,
        "total_in_execution_amount": total_in_execution_amount,
        "total_obligated_amount": total_obligated_amount,
        "total_planned_amount": total_planned_amount,
    }


def update_budget_line_item(data: dict[str, Any], id: int):
    budget_line_item = current_app.db_session.get(BudgetLineItem, id)
    if not budget_line_item:
        raise RuntimeError("Invalid BLI id.")
    update_data(budget_line_item, data)
    current_app.db_session.add(budget_line_item)
    current_app.db_session.commit()
    return budget_line_item


def bli_associated_with_agreement(id: int) -> bool:
    """
    In order to edit a budget line or agreement, the budget line must be associated with an Agreement, and the
    user must be authenticated and meet on of these conditions:
        -  The user is the agreement creator.
        -  The user is the project officer of the agreement.
        -  The user is a team member on the agreement.
        -  The user is a budget team member.

    :param id: The id of the budget line item
    """
    user = get_current_user()

    budget_line_item = current_app.db_session.get(BudgetLineItem, id)

    if not user.id or not budget_line_item:
        raise ResourceNotFoundError("BudgetLineItem", id)

    if not budget_line_item.agreement:
        raise AuthorizationError(
            f"BudgetLineItem {id} does not have an associated agreement. Cannot check association.",
            "BudgetLineItem",
        )

    return associated_with_agreement(budget_line_item.agreement.id)
