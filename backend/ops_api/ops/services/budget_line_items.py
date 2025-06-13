from ctypes import Array
from typing import Any, Optional, Tuple

from flask import current_app
from flask_jwt_extended import get_current_user
from loguru import logger
from sqlalchemy import Select, case, inspect, select

from models import (
    CAN,
    Agreement,
    AgreementType,
    BudgetLineItem,
    BudgetLineItemChangeRequest,
    BudgetLineItemStatus,
    BudgetLineSortCondition,
    ContractBudgetLineItem,
    DirectObligationBudgetLineItem,
    Division,
    GrantBudgetLineItem,
    IAABudgetLineItem,
    OpsEventType,
    Portfolio,
)
from ops_api.ops.schemas.budget_line_items import BudgetLineItemListFilterOptionResponseSchema, PATCHRequestBodySchema
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
        sort_conditions = data.get("sort_conditions", [])
        sort_descending = data.get("sort_descending", [])

        query = select(BudgetLineItem)
        if sort_conditions:
            query = self.create_sort_query(query, sort_conditions[0], sort_descending[0])
        else:
            # The default behavior when no sort condition is specified is to sort by id ascending
            query = (
                select(BudgetLineItem, Agreement.name)
                .outerjoin(Agreement, Agreement.id == BudgetLineItem.agreement_id)
                .order_by(Agreement.name, BudgetLineItem.service_component_name_for_sort)
            )
        query = self.filter_query(
            fiscal_years, budget_line_statuses, portfolios, can_ids, agreement_ids, statuses, sort_conditions, query
        )

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

    def filter_query(
        self,
        fiscal_years: list[str],
        budget_line_statuses: list[BudgetLineItemStatus],
        portfolios: list[str],
        can_ids: list[str],
        agreement_ids: list[str],
        statuses: list[str],
        sort_conditions: list[BudgetLineSortCondition],
        query,
    ):
        """
        Apply filters to the BudgetLineItem query based on the provided parameters.
        """
        if fiscal_years:
            query = query.where(BudgetLineItem.fiscal_year.in_(fiscal_years))
        if budget_line_statuses:
            query = query.where(BudgetLineItem.status.in_(budget_line_statuses))
        if portfolios:
            if sort_conditions and BudgetLineSortCondition.CAN_NUMBER in sort_conditions:
                # If sorting by CAN number, we have already joined the CAN table and need to refer to CAN's portfolio id in order
                # for sqlalchemy to form the correct SQL
                query = query.where(CAN.portfolio_id.in_(portfolios))
            else:
                query = query.where(BudgetLineItem.portfolio_id.in_(portfolios))
        if can_ids:
            query = query.where(BudgetLineItem.can_id.in_(can_ids))
        if agreement_ids:
            query = query.where(BudgetLineItem.agreement_id.in_(agreement_ids))
        if statuses:
            query = query.where(BudgetLineItem.status.in_(statuses))
        return query

    def create_sort_query(
        self, query: Select[Tuple[BudgetLineItem]], sort_condition: BudgetLineSortCondition, sort_descending: bool
    ):
        match sort_condition:
            case BudgetLineSortCondition.ID_NUMBER:
                query = (
                    query.order_by(BudgetLineItem.id.desc()) if sort_descending else query.order_by(BudgetLineItem.id)
                )
            case BudgetLineSortCondition.AGREEMENT_NAME:
                query = select(BudgetLineItem, Agreement.name).outerjoin(
                    Agreement, Agreement.id == BudgetLineItem.agreement_id
                )
                query = query.order_by(Agreement.name.desc()) if sort_descending else query.order_by(Agreement.name)
            case BudgetLineSortCondition.SERVICE_COMPONENT:
                query = (
                    query.order_by(BudgetLineItem.service_component_name_for_sort.desc())
                    if sort_descending
                    else query.order_by(BudgetLineItem.service_component_name_for_sort)
                )
            case BudgetLineSortCondition.OBLIGATE_BY:
                query = (
                    query.order_by(BudgetLineItem.date_needed.desc())
                    if sort_descending
                    else query.order_by(BudgetLineItem.date_needed)
                )
            case BudgetLineSortCondition.FISCAL_YEAR:
                query = (
                    query.order_by(BudgetLineItem.date_needed.desc())
                    if sort_descending
                    else query.order_by(BudgetLineItem.date_needed)
                )
            case BudgetLineSortCondition.CAN_NUMBER:
                query = select(BudgetLineItem, CAN.number).outerjoin(CAN, CAN.id == BudgetLineItem.can_id)
                query = query.order_by(CAN.number.desc()) if sort_descending else query.order_by(CAN.number)
            case BudgetLineSortCondition.TOTAL:
                query = (
                    query.order_by(BudgetLineItem.total.desc())
                    if sort_descending
                    else query.order_by(BudgetLineItem.total)
                )
            case BudgetLineSortCondition.FEE:
                query = (
                    query.order_by(BudgetLineItem.fees.desc())
                    if sort_descending
                    else query.order_by(BudgetLineItem.fees)
                )
            case BudgetLineSortCondition.STATUS:
                # Construct a specific order for budget line statuses in sort that is not alphabetical.
                when_list = {"DRAFT": 0, "PLANNED": 1, "IN_EXECUTION": 2, "OBLIGATED": 3, "OVERCOME_BY_EVENTS": 4}
                sort_logic = case(when_list, value=BudgetLineItem.status, else_=100)
                query = query.order_by(sort_logic.desc()) if sort_descending else query.order_by(sort_logic)
        return query

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
        if budget_line_item.in_review or budget_line_item.status in [BudgetLineItemStatus.OVERCOME_BY_EVENTS]:
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

    def get_filter_options(self, data: dict | None) -> dict[str, Array]:
        """
        Get filter options for the Budget Line Item list.
        """
        only_my = data.get("only_my", [])

        query = select(BudgetLineItem).distinct()
        logger.debug("Beginning bli queries")
        all_results = self.db_session.scalars(query).all()

        if only_my and True in only_my:
            # filter out BLIs not associated with the current user
            user = get_current_user()
            results = [bli for bli in all_results if check_user_association(bli.agreement, user)]
        else:
            results = all_results

        fiscal_years = {result.fiscal_year for result in results if result.fiscal_year}
        budget_line_statuses = {result.status for result in results if result.status}

        portfolio_dict = {
            result.can.portfolio.id: {"id": result.can.portfolio.id, "name": result.can.portfolio.name}
            for result in results
            if result.can and result.can.portfolio
        }

        portfolios = list(portfolio_dict.values())

        budget_line_statuses_list = [status.name for status in budget_line_statuses]
        status_sort_order = [
            BudgetLineItemStatus.DRAFT.name,
            BudgetLineItemStatus.PLANNED.name,
            BudgetLineItemStatus.IN_EXECUTION.name,
            BudgetLineItemStatus.OBLIGATED.name,
            BudgetLineItemStatus.OVERCOME_BY_EVENTS.name,
        ]

        filters = {
            "fiscal_years": sorted(fiscal_years, reverse=True),
            "statuses": sorted(budget_line_statuses_list, key=status_sort_order.index),
            "portfolios": sorted(portfolios, key=lambda x: x["name"]),
        }
        filter_response_schema = BudgetLineItemListFilterOptionResponseSchema()
        filter_options = filter_response_schema.dump(filters)

        return filter_options


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
        total_amount = sum([result.amount + result.fees for result in all_results if result.amount])
        total_draft_amount = sum(
            [
                result.amount + result.fees
                for result in all_results
                if result.amount and result.status == BudgetLineItemStatus.DRAFT
            ]
        )
        total_planned_amount = sum(
            [
                result.amount + result.fees
                for result in all_results
                if result.amount and result.status == BudgetLineItemStatus.PLANNED
            ]
        )
        total_in_execution_amount = sum(
            [
                result.amount + result.fees
                for result in all_results
                if result.amount and result.status == BudgetLineItemStatus.IN_EXECUTION
            ]
        )
        total_obligated_amount = sum(
            [
                result.amount + result.fees
                for result in all_results
                if result.amount and result.status == BudgetLineItemStatus.OBLIGATED
            ]
        )
        total_overcome_by_events_amount = sum(
            [
                result.amount + result.fees
                for result in all_results
                if result.amount and result.status == BudgetLineItemStatus.OVERCOME_BY_EVENTS
            ]
        )
    else:
        total_amount = sum([result.amount for result in all_results if result.amount])
        total_draft_amount = sum(
            [result.amount for result in all_results if result.amount and result.status == BudgetLineItemStatus.DRAFT]
        )
        total_planned_amount = sum(
            [result.amount for result in all_results if result.amount and result.status == BudgetLineItemStatus.PLANNED]
        )
        total_in_execution_amount = sum(
            [
                result.amount
                for result in all_results
                if result.amount and result.status == BudgetLineItemStatus.IN_EXECUTION
            ]
        )
        total_obligated_amount = sum(
            [
                result.amount
                for result in all_results
                if result.amount and result.status == BudgetLineItemStatus.OBLIGATED
            ]
        )
        total_overcome_by_events_amount = sum(
            [
                result.amount + result.fees
                for result in all_results
                if result.amount and result.status == BudgetLineItemStatus.OVERCOME_BY_EVENTS
            ]
        )
    return {
        "total_amount": total_amount,
        "total_draft_amount": total_draft_amount,
        "total_in_execution_amount": total_in_execution_amount,
        "total_obligated_amount": total_obligated_amount,
        "total_planned_amount": total_planned_amount,
        "total_overcome_by_events_amount": total_overcome_by_events_amount,
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
