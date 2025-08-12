from ctypes import Array
from datetime import date, datetime
from decimal import Decimal
from typing import Any, Tuple

from flask import current_app
from flask_jwt_extended import get_current_user
from loguru import logger
from sqlalchemy import Select, case, select, func

from models import (
    CAN,
    Agreement,
    AgreementReason,
    BudgetLineItem,
    BudgetLineItemChangeRequest,
    BudgetLineItemStatus,
    BudgetLineSortCondition,
    ServicesComponent,
)
from ops_api.ops.schemas.budget_line_items import BudgetLineItemListFilterOptionResponseSchema
from ops_api.ops.services.change_requests import ChangeRequestService
from ops_api.ops.services.ops_service import AuthorizationError, ResourceNotFoundError, ValidationError
from ops_api.ops.utils.agreements_helpers import associated_with_agreement, check_user_association
from ops_api.ops.utils.api_helpers import validate_and_prepare_change_data
from ops_api.ops.utils.budget_line_items_helpers import create_budget_line_item_instance, update_data


class BudgetLineItemService:

    def __init__(self, db_session):
        self.db_session = db_session

    def create(self, create_request: dict[str, Any]) -> BudgetLineItem:
        """
        Create a new Budget Line Item and save it to the database.
        """
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

        agreement = self.db_session.get(Agreement, agreement_id)

        new_bli = create_budget_line_item_instance(agreement.agreement_type, create_request)

        self.db_session.add(new_bli)
        self.db_session.commit()
        return new_bli

    def delete(self, id: int) -> None:
        """
        Delete a Budget Line Item with the given id.
        """
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

        # Handle optional is_obe field: treat NULL as False (not OBE)
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

        query = query.where(func.coalesce(BudgetLineItem.is_obe, False).is_(False))
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
                when_list = {"DRAFT": 0, "PLANNED": 1, "IN_EXECUTION": 2, "OBLIGATED": 3}
                sort_logic = case(when_list, value=BudgetLineItem.status, else_=100)
                query = query.order_by(sort_logic.desc()) if sort_descending else query.order_by(sort_logic)
        return query

    def update(self, id: int, updated_fields: dict[str, Any]) -> tuple[BudgetLineItem, int]:
        budget_line_item = self._get_budget_line_item(id)
        self._validation(budget_line_item, updated_fields)

        # Extract key elements from updated_fields
        request = updated_fields.get("request")
        schema = updated_fields.get("schema")

        # Determine what kind of changes we're making
        diff_data = self._get_diff_data(request, schema)
        has_status_change = self._has_status_change(schema.load(request.json, partial=True), budget_line_item)
        has_non_status_change = self._has_non_status_change(diff_data, budget_line_item)

        # Validate status and non-status changes aren't mixed
        if has_status_change and has_non_status_change:
            raise ValidationError({"status": "When the status is changing other edits are not allowed"})

        # Determine if direct edit or change request is needed
        directly_editable = not has_status_change and budget_line_item.status in [BudgetLineItemStatus.DRAFT]

        change_request_ids = []
        if directly_editable:
            self._apply_direct_edits(budget_line_item, updated_fields)
        else:
            change_request_ids = self._handle_change_requests(budget_line_item, id, request, schema, updated_fields)

        logger.debug(f"Updated BLI: {budget_line_item.to_dict()}")

        return budget_line_item, 202 if change_request_ids else 200

    def _get_budget_line_item(self, id: int) -> BudgetLineItem:
        """Retrieve budget line item by ID or raise appropriate error"""
        budget_line_item = self.db_session.get(BudgetLineItem, id)
        if not budget_line_item:
            raise ResourceNotFoundError("BudgetLineItem", id)
        return budget_line_item

    @staticmethod
    def _get_diff_data(request, schema):
        """Extract and normalize data from the request"""
        return schema.load(request.json, unknown="exclude", partial=True) if schema else request.json

    @staticmethod
    def _has_status_change(updated_fields: dict, budget_line_item: BudgetLineItem) -> bool:
        """Check if there's a status change in the updated fields"""
        return "status" in updated_fields and updated_fields["status"] != budget_line_item.status

    @staticmethod
    def _has_non_status_change(diff_data: dict, budget_line_item: BudgetLineItem) -> bool:
        """Check if there are non-status changes in the updated fields"""
        for key in diff_data:
            if key not in ["status", "agreement_id", "method", "schema", "request", "requestor_notes"]:
                if key == "amount":
                    diff_val = diff_data.get(key)
                    orig_val = getattr(budget_line_item, key, None)
                    if diff_val and orig_val:
                        if float(diff_val) != float(orig_val):
                            return True
                    elif diff_val != orig_val:
                        return True
                elif diff_data.get(key) != getattr(budget_line_item, key, None):
                    return True
        return False

    def _apply_direct_edits(self, budget_line_item: BudgetLineItem, updated_fields: dict) -> None:
        """Apply direct edits to the budget line item"""
        filtered_dict = {
            k: v for k, v in updated_fields.items() if k not in ["method", "request", "schema", "requestor_notes"]
        }
        update_data(budget_line_item, filtered_dict)
        budget_line_item.updated_on = datetime.now()
        budget_line_item.updated_by = get_current_user().id
        self.db_session.add(budget_line_item)
        self.db_session.commit()

    def _handle_change_requests(
        self, budget_line_item: BudgetLineItem, id: int, request, schema, updated_fields: dict
    ) -> list:
        """Handle changes that require change requests"""
        change_data, changing_from_data = validate_and_prepare_change_data(
            request.json,
            budget_line_item,
            schema,
            ["id", "agreement_id"],
            partial=False,
        )

        changed_budget_or_status_prop_keys = list(
            set(change_data.keys()) & (set(BudgetLineItemChangeRequest.budget_field_names + ["status"]))
        )

        if changed_budget_or_status_prop_keys:
            change_request_service = ChangeRequestService(self.db_session)
            return change_request_service.add_bli_change_requests(
                id,
                budget_line_item,
                changing_from_data,
                change_data,
                changed_budget_or_status_prop_keys,
                updated_fields.get("requestor_notes"),
            )
        return []

    def _validation(self, budget_line_item, updated_fields):
        """
        Validate the updated fields for a Budget Line Item.
        """
        if budget_line_item.agreement and not bli_associated_with_agreement(budget_line_item.id):
            raise AuthorizationError(
                f"User is not associated with the agreement for BudgetLineItem {id}",
                "BudgetLineItem",
            )
        if "agreement_id" in updated_fields and updated_fields["agreement_id"] != budget_line_item.agreement_id:
            raise ValidationError({"agreement_id": "Changing the agreement_id of a Budget Line Item is not allowed."})
        if not self.is_bli_editable(budget_line_item):
            raise ValidationError({"status": "Budget Line Item is not in an editable state."})

        sc = self.db_session.get(ServicesComponent, updated_fields.get("services_component_id"))
        if sc and sc.contract_agreement_id != budget_line_item.agreement_id:
            raise ValidationError({"services_component_id": "Services Component does not belong to the Agreement."})

        # validate the can_id if it is being updated
        can_id = updated_fields.get("can_id", None)
        can = self.db_session.get(CAN, can_id)
        if can_id and not can:
            raise ResourceNotFoundError("CAN", can_id)

        self._validation_change_status_higher_than_draft(budget_line_item, updated_fields)

    @staticmethod
    def _validation_change_status_higher_than_draft(budget_line_item, updated_fields):
        if (
            "status" in updated_fields
            and updated_fields["status"] != budget_line_item.status
            and budget_line_item.status in [BudgetLineItemStatus.DRAFT]
        ) or (budget_line_item.status not in [BudgetLineItemStatus.DRAFT]):
            # check required fields on budget line item
            bli_required_fields = BudgetLineItem.get_required_fields_for_status_change()
            missing_fields = BudgetLineItemService._get_missing_fields(
                bli_required_fields, budget_line_item, updated_fields
            )
            if missing_fields:
                raise ValidationError({"status": "Budget Line Item is missing required fields."})

            # check required fields on agreement
            if not budget_line_item.agreement and (
                "agreement_id" not in updated_fields or updated_fields.get("agreement_id") is None
            ):
                raise ValidationError({"status": "Budget Line Item must be associated with an Agreement."})

            agreement_required_fields = Agreement.get_required_fields_for_status_change()
            missing_fields = BudgetLineItemService._get_missing_fields(
                agreement_required_fields, budget_line_item.agreement, updated_fields
            )
            if missing_fields:
                raise ValidationError({"status": "Budget Line Item's agreement is missing required fields."})

            # check if the agreement reason is Recompete or Logical Follow On and if the vendor_id is set
            if (
                budget_line_item.agreement.agreement_reason
                in [AgreementReason.RECOMPETE, AgreementReason.LOGICAL_FOLLOW_ON]
                and not budget_line_item.agreement.vendor_id
            ):
                raise ValidationError({"status": "Agreement vendor is required for Recompete or Logical Follow On."})

            # Check amount is set and greater than 0
            current_amount = budget_line_item.amount
            requested_amount = updated_fields.get("amount")
            final_amount = requested_amount if requested_amount is not None else current_amount

            if final_amount is None or not isinstance(final_amount, (Decimal, float, int)) or final_amount <= 0:
                raise ValidationError({"amount": "Amount must be greater than 0."})

            # Check if the date_needed is set and in the future
            today = date.today()
            current_date_needed = budget_line_item.date_needed
            requested_date_needed = updated_fields.get("date_needed")
            final_date_needed = requested_date_needed if requested_date_needed is not None else current_date_needed

            if final_date_needed is None or final_date_needed <= today:
                raise ValidationError(
                    {"date_needed": "BLI must have a Need By Date in the future when status is not DRAFT"}
                )

            # Check if the can_id is set
            current_can_id = budget_line_item.can_id
            requested_can_id = updated_fields.get("can_id")
            final_can_id = requested_can_id if requested_can_id is not None else current_can_id

            if not final_can_id:
                raise ValidationError({"can_id": "BLI must have a valid CAN when status is not DRAFT"})

    @staticmethod
    def _get_missing_fields(required_fields: list[str], obj: Any, updated_fields: dict[str, Any]) -> list[str]:
        """
        Check if required fields are missing in an object, considering both current and updated values.

        Args:
            required_fields: List of field names that are required
            obj: The object to check for missing fields
            updated_fields: Dictionary of fields being updated

        Returns:
            A list of field names that are missing or being set to empty values
        """
        missing_fields = []

        for field in required_fields:
            # Get current value from the object
            current_value = getattr(obj, field, None)

            # Check if field is being updated
            field_being_updated = field in updated_fields
            updated_value = updated_fields.get(field) if field_being_updated else None

            # Determine the final value (updated if present, otherwise current)
            final_value = updated_value if field_being_updated else current_value

            # Check if final value is empty
            is_empty = (
                final_value is None
                or final_value == ""
                or (isinstance(final_value, (list, dict, set, tuple)) and not final_value)
            )

            if is_empty:
                missing_fields.append(field)

        return missing_fields

    def is_bli_editable(self, budget_line_item):
        """A utility function that determines if a BLI is editable"""
        editable = budget_line_item.status in [
            BudgetLineItemStatus.DRAFT,
            BudgetLineItemStatus.PLANNED,
            BudgetLineItemStatus.IN_EXECUTION,
        ]

        # if the BLI is in review or is OBE, it cannot be edited
        if budget_line_item.in_review or budget_line_item.is_obe:
            editable = False

        return editable

    def get_filter_options(self, data: dict | None) -> dict[str, Array]:
        """
        Get filter options for the Budget Line Item list.
        """
        only_my = data.get("only_my", [])

        query = select(BudgetLineItem).distinct().where(func.coalesce(BudgetLineItem.is_obe, False).is_(False))
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
        ]

        filters = {
            "fiscal_years": sorted(fiscal_years, reverse=True),
            "statuses": sorted(budget_line_statuses_list, key=status_sort_order.index),
            "portfolios": sorted(portfolios, key=lambda x: x["name"]),
        }
        filter_response_schema = BudgetLineItemListFilterOptionResponseSchema()
        filter_options = filter_response_schema.dump(filters)

        return filter_options


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
            [result.amount + result.fees for result in all_results if result.amount and result.is_obe]
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
            [result.amount + result.fees for result in all_results if result.amount and result.is_obe]
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
