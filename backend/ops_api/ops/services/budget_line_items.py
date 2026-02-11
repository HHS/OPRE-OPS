from ctypes import Array
from dataclasses import dataclass
from datetime import date, datetime
from decimal import Decimal
from typing import Any, Optional, Tuple

from flask import current_app
from flask_jwt_extended import current_user, get_current_user
from loguru import logger
from sqlalchemy import Select, String, case, cast, func, select
from sqlalchemy.orm import selectinload

from models import (
    CAN,
    Agreement,
    AgreementReason,
    AgreementType,
    BudgetLineItem,
    BudgetLineItemChangeRequest,
    BudgetLineItemStatus,
    BudgetLineSortCondition,
    Portfolio,
    ServicesComponent,
)
from ops_api.ops.schemas.agreements import MetaSchema
from ops_api.ops.schemas.budget_line_items import (
    BudgetLineItemListFilterOptionResponseSchema,
)
from ops_api.ops.services.change_requests import ChangeRequestService
from ops_api.ops.services.ops_service import (
    AuthorizationError,
    ResourceNotFoundError,
    ValidationError,
)
from ops_api.ops.utils.agreements_helpers import (
    associated_with_agreement,
    check_user_association,
)
from ops_api.ops.utils.api_helpers import validate_and_prepare_change_data
from ops_api.ops.utils.budget_line_items_helpers import (
    bli_associated_with_agreement,
    create_budget_line_item_instance,
    is_bli_editable,
    update_data,
)
from ops_api.ops.utils.users import is_super_user


@dataclass
class BudgetLineItemFilters:
    """Data class to encapsulate all filter parameters for Budget Line Items."""

    fiscal_years: Optional[list[str]] = None
    budget_line_statuses: Optional[list[BudgetLineItemStatus]] = None
    portfolios: Optional[list[str]] = None
    can_ids: Optional[list[str]] = None
    agreement_ids: Optional[list[str]] = None
    statuses: Optional[list[str]] = None
    only_my: Optional[list[bool]] = None
    include_fees: Optional[list[bool]] = None
    limit: Optional[list[int]] = None
    offset: Optional[list[int]] = None
    sort_conditions: Optional[list[BudgetLineSortCondition]] = None
    sort_descending: Optional[list[bool]] = None
    enable_obe: Optional[list[bool]] = None
    budget_line_total_min: Optional[list[float]] = None
    budget_line_total_max: Optional[list[float]] = None
    agreement_types: Optional[list[str]] = None
    agreement_names: Optional[list[str]] = None
    can_active_periods: Optional[list[str]] = None

    @classmethod
    def parse_filters(cls, data: dict) -> "BudgetLineItemFilters":
        return cls(
            fiscal_years=data.get("fiscal_year", []),
            budget_line_statuses=data.get("budget_line_status", []),
            portfolios=data.get("portfolio", []),
            can_ids=data.get("can_id", []),
            agreement_ids=data.get("agreement_id", []),
            statuses=data.get("status", []),
            only_my=data.get("only_my", []),
            include_fees=data.get("include_fees", []),
            limit=data.get("limit", []),
            offset=data.get("offset", []),
            sort_conditions=data.get("sort_conditions", []),
            sort_descending=data.get("sort_descending", []),
            enable_obe=data.get("enable_obe", []),
            budget_line_total_min=data.get("budget_line_total_min", []),
            budget_line_total_max=data.get("budget_line_total_max", []),
            agreement_types=data.get("agreement_type", []),
            agreement_names=data.get("agreement_name", []),
            can_active_periods=data.get("can_active_period", []),
        )


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
        # Create filters object from request data
        filters = BudgetLineItemFilters.parse_filters(data or {})

        # Start with explicit select_from
        query = select(BudgetLineItem).select_from(BudgetLineItem)
        agreement_already_joined = False

        # Determine which joins are needed upfront
        needs_agreement_join = bool(filters.agreement_types or filters.agreement_names)

        # Apply sorting (which may add joins)
        if filters.sort_conditions:
            query, agreement_already_joined = self.create_sort_query(
                query,
                filters.sort_conditions[0],
                filters.sort_descending[0] if filters.sort_descending else False,
            )
        else:
            # The default behavior when no sort condition is specified is to sort by agreement name
            query = query.join(Agreement, Agreement.id == BudgetLineItem.agreement_id, isouter=True).order_by(
                Agreement.name, BudgetLineItem.service_component_name_for_sort
            )
            agreement_already_joined = True

        # Add Agreement join if needed for filtering and not already joined
        if needs_agreement_join and not agreement_already_joined:
            query = query.join(Agreement, Agreement.id == BudgetLineItem.agreement_id, isouter=True)

        # Now apply all filter conditions
        query = self.filter_query(query, filters)

        logger.debug("Beginning bli queries")
        # it would be better to use count() here, but SQLAlchemy should cache this anyway and
        # the where clauses are not forming correct SQL
        all_results = self.db_session.scalars(query).all()

        # Apply Python-level filters
        results = self._apply_python_filters(all_results, filters)

        # Calculate count and totals after all Python-level filters are applied
        count = len(results)
        totals = _get_totals_with_or_without_fees(results, filters.include_fees)

        # slice the results if limit and offset are provided
        if filters.limit and filters.offset:
            limit_value = int(filters.limit[0])
            offset_value = int(filters.offset[0])
            results = results[offset_value : offset_value + limit_value]

        logger.debug("BLI queries complete")

        return results, {"count": count, "totals": totals}

    def _apply_python_filters(self, all_results, filters):
        """Apply Python-level filters to budget line items."""
        # Filter by user association if only_my is enabled
        if filters.only_my and True in filters.only_my:
            user = get_current_user()
            results = [bli for bli in all_results if check_user_association(bli.agreement, user)]
        else:
            results = all_results

        # Apply budget line total range filter
        results = self._apply_budget_total_range_filter(results, filters)

        # Apply CAN active period filter
        results = self._apply_can_active_period_python_filter(results, filters)

        return results

    def _apply_budget_total_range_filter(self, results, filters):
        """Apply budget line total range filter in Python to avoid correlation issues."""
        if not (filters.budget_line_total_min or filters.budget_line_total_max):
            return results

        min_total = filters.budget_line_total_min[0] if filters.budget_line_total_min else None
        max_total = filters.budget_line_total_max[0] if filters.budget_line_total_max else None

        filtered_results = []
        for bli in results:
            budget_line_total = bli.total or 0
            if min_total is not None and budget_line_total < min_total:
                continue
            if max_total is not None and budget_line_total > max_total:
                continue
            filtered_results.append(bli)

        return filtered_results

    def _apply_can_active_period_python_filter(self, results, filters):
        """Apply CAN active period filter in Python to avoid correlation issues with joins."""
        if not filters.can_active_periods:
            return results

        # Extract numeric periods from filter values like "1 Year"
        target_periods = set()
        for period in filters.can_active_periods:
            try:
                if isinstance(period, str):
                    period_num = int(period.split()[0])
                else:
                    period_num = int(period)
                target_periods.add(period_num)
            except (ValueError, IndexError):
                continue

        if not target_periods:
            return results

        filtered_results = []
        for bli in results:
            if bli.can and bli.can.active_period in target_periods:
                filtered_results.append(bli)

        return filtered_results

    def _obe_status_filter(self, query, status_list: list[str]):
        statuses = [status for status in status_list if status != "Overcome by Events"]
        has_obe = "Overcome by Events" in status_list

        if statuses and has_obe:
            # If we have both regular statuses and OBE
            query = query.where((BudgetLineItem.status.in_(statuses)) | (BudgetLineItem.is_obe))
        elif has_obe:
            # If we only have OBE status
            query = query.where(BudgetLineItem.is_obe)
        elif statuses:
            # If we only have regular statuses
            query = query.where(BudgetLineItem.status.in_(statuses))

        return query

    def filter_query(
        self,
        query,
        filters: BudgetLineItemFilters,
    ):
        """
        Apply filters to the BudgetLineItem query based on the provided parameters.
        """
        query = self._apply_fiscal_year_filter(query, filters.fiscal_years)
        query = self._apply_status_filters(query, filters.budget_line_statuses, filters.enable_obe)
        query = self._apply_portfolio_filter(query, filters.portfolios, filters.sort_conditions)
        query = self._apply_can_filter(query, filters.can_ids)
        query = self._apply_agreement_filter(query, filters.agreement_ids)
        query = self._apply_status_filter(query, filters.statuses, filters.enable_obe)
        query = self._apply_agreement_type_filter(query, filters.agreement_types)
        query = self._apply_agreement_name_filter(query, filters.agreement_names)
        # Note: budget_line_total_range and can_active_period filters are applied in Python
        # after fetching results to avoid SQLAlchemy correlation issues
        query = self._apply_obe_exclusion_filter(query, filters.enable_obe)

        return query

    def _apply_fiscal_year_filter(self, query, fiscal_years):
        """Apply fiscal year filter if provided."""
        if fiscal_years:
            query = query.where(BudgetLineItem.fiscal_year.in_(fiscal_years))
        return query

    def _apply_status_filters(self, query, budget_line_statuses, enable_obe):
        """Apply budget line status filter with OBE consideration."""
        if budget_line_statuses:
            if enable_obe and True in enable_obe:
                query = self._obe_status_filter(query, budget_line_statuses)
            else:
                query = query.where(BudgetLineItem.status.in_(budget_line_statuses))
        return query

    def _apply_portfolio_filter(self, query, portfolios, sort_conditions):
        """Apply portfolio filter with sort condition consideration."""
        if portfolios:
            if sort_conditions and (
                BudgetLineSortCondition.CAN_NUMBER in sort_conditions
                or BudgetLineSortCondition.PORTFOLIO in sort_conditions
            ):
                query = query.where(CAN.portfolio_id.in_(portfolios))
            else:
                query = query.where(BudgetLineItem.portfolio_id.in_(portfolios))
        return query

    def _apply_can_filter(self, query, can_ids):
        """Apply CAN filter if provided."""
        if can_ids:
            query = query.where(BudgetLineItem.can_id.in_(can_ids))
        return query

    def _apply_agreement_filter(self, query, agreement_ids):
        """Apply agreement filter if provided."""
        if agreement_ids:
            query = query.where(BudgetLineItem.agreement_id.in_(agreement_ids))
        return query

    def _apply_status_filter(self, query, statuses, enable_obe):
        """Apply general status filter with OBE consideration."""
        if statuses:
            if enable_obe and True in enable_obe:
                query = self._obe_status_filter(query, statuses)
            else:
                query = query.where(BudgetLineItem.status.in_(statuses))
        return query

    def _apply_obe_exclusion_filter(self, query, enable_obe):
        """Exclude OBE items unless explicitly enabled."""
        if not enable_obe or True not in enable_obe:
            query = query.where(func.coalesce(BudgetLineItem.is_obe, False).is_(False))
        return query

    def _apply_agreement_type_filter(self, query, agreement_types):
        """Apply agreement type filter if provided."""
        if agreement_types:
            # Convert string enum names to AgreementType enum objects
            enum_types = []
            for at in agreement_types:
                try:
                    enum_types.append(AgreementType[at])
                except KeyError:
                    logger.warning(f"Invalid agreement type: {at}")
                    raise ValidationError({"agreement_type": f"Invalid agreement type: {at}"})
            if enum_types:
                query = query.where(Agreement.agreement_type.in_(enum_types))
        return query

    def _apply_agreement_name_filter(self, query, agreement_names):
        """Apply agreement name filter if provided."""
        if agreement_names:
            query = query.where(Agreement.name.in_(agreement_names))
        return query

    def create_sort_query(
        self,
        query: Select[Tuple[BudgetLineItem]],
        sort_condition: BudgetLineSortCondition,
        sort_descending: bool,
    ):
        """Create a sorted query. Returns tuple of (query, agreement_joined)."""
        agreement_joined = False
        match sort_condition:
            case BudgetLineSortCondition.ID_NUMBER:
                query = (
                    query.order_by(BudgetLineItem.id.desc()) if sort_descending else query.order_by(BudgetLineItem.id)
                )
            case BudgetLineSortCondition.AGREEMENT_NAME:
                query = query.join(Agreement, Agreement.id == BudgetLineItem.agreement_id, isouter=True).order_by(
                    Agreement.name.desc() if sort_descending else Agreement.name
                )
                agreement_joined = True
            case BudgetLineSortCondition.AGREEMENT_TYPE:
                query = query.join(Agreement, Agreement.id == BudgetLineItem.agreement_id, isouter=True).order_by(
                    cast(Agreement.agreement_type, String).desc()
                    if sort_descending
                    else cast(Agreement.agreement_type, String)
                )
                agreement_joined = True
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
                query = query.join(CAN, CAN.id == BudgetLineItem.can_id, isouter=True).order_by(
                    CAN.number.desc() if sort_descending else CAN.number
                )
            case BudgetLineSortCondition.PORTFOLIO:
                query = (
                    query.join(CAN, CAN.id == BudgetLineItem.can_id, isouter=True)
                    .join(Portfolio, Portfolio.id == CAN.portfolio_id, isouter=True)
                    .order_by(Portfolio.abbreviation.desc() if sort_descending else Portfolio.abbreviation)
                )
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
                when_list = {
                    "DRAFT": 0,
                    "PLANNED": 1,
                    "IN_EXECUTION": 2,
                    "OBLIGATED": 3,
                }
                sort_logic = case(
                    (BudgetLineItem.is_obe, 4),
                    else_=case(when_list, value=BudgetLineItem.status, else_=100),
                )
                query = query.order_by(sort_logic.desc()) if sort_descending else query.order_by(sort_logic)
        return query, agreement_joined

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
        directly_editable = is_super_user(current_user, current_app) or (
            not has_status_change and budget_line_item.status in [BudgetLineItemStatus.DRAFT]
        )

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
            if key not in [
                "status",
                "agreement_id",
                "method",
                "schema",
                "request",
                "requestor_notes",
            ]:
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
        self,
        budget_line_item: BudgetLineItem,
        id: int,
        request,
        schema,
        updated_fields: dict,
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
        if not is_bli_editable(budget_line_item):
            raise ValidationError({"status": "Budget Line Item is not in an editable state."})

        sc = self.db_session.get(ServicesComponent, updated_fields.get("services_component_id"))
        if sc and sc.agreement_id != budget_line_item.agreement_id:
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
            bli_required_fields = (
                BudgetLineItem.get_required_fields_for_status_change()
                if not is_super_user(current_user, current_app)
                else []
            )

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

            agreement_required_fields = budget_line_item.agreement.__class__.get_required_fields_for_status_change()
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

            # Validate that date_needed is not None for all users
            if final_date_needed is None:
                raise ValidationError({"date_needed": "BLI must have a Need By Date when status is not DRAFT"})

            # Validate that date_needed is not in the past for non-superusers
            if not is_super_user(current_user, current_app) and final_date_needed <= today:
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

    def get_filter_options(self, data: dict | None) -> dict[str, Array]:
        """
        Get filter options for the Budget Line Item list.
        """
        only_my = data.get("only_my", [])
        enable_obe = data.get("enable_obe", [])

        query = (
            select(BudgetLineItem)
            .distinct()
            .options(
                selectinload(BudgetLineItem.agreement).selectinload(Agreement.team_members),
                selectinload(BudgetLineItem.agreement).selectinload(Agreement.budget_line_items).selectinload(
                    BudgetLineItem.can
                ).selectinload(CAN.portfolio),
                selectinload(BudgetLineItem.can).selectinload(CAN.portfolio),
            )
        )
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
        has_obe = any(result.is_obe for result in results)

        portfolio_dict = {
            result.can.portfolio.id: {
                "id": result.can.portfolio.id,
                "name": result.can.portfolio.name,
            }
            for result in results
            if result.can and result.can.portfolio
        }

        portfolios = list(portfolio_dict.values())

        # Collect agreement types
        agreement_types = {
            result.agreement.agreement_type
            for result in results
            if result.agreement and result.agreement.agreement_type
        }

        # Collect agreement names (display_name)
        agreement_name_dict = {
            result.agreement.id: {
                "id": result.agreement.id,
                "name": result.agreement.display_name,
            }
            for result in results
            if result.agreement and result.agreement.display_name
        }
        agreement_names = list(agreement_name_dict.values())

        # Collect CAN active periods
        can_active_periods = {result.can.active_period for result in results if result.can and result.can.active_period}

        budget_line_statuses_list = [status.name for status in budget_line_statuses]
        if has_obe and (enable_obe and True in enable_obe):
            budget_line_statuses_list.append("Overcome by Events")

        status_sort_order = [
            BudgetLineItemStatus.DRAFT.name,
            BudgetLineItemStatus.PLANNED.name,
            BudgetLineItemStatus.IN_EXECUTION.name,
            BudgetLineItemStatus.OBLIGATED.name,
            "Overcome by Events",
        ]

        # Calculate budget line total range (amount + fees) in a single pass
        budget_line_total_min = None
        budget_line_total_max = None
        for result in results:
            total = result.total
            if total is not None:
                if budget_line_total_min is None or total < budget_line_total_min:
                    budget_line_total_min = total
                if budget_line_total_max is None or total > budget_line_total_max:
                    budget_line_total_max = total

        # Default to 0 if no results with totals
        budget_line_total_min = budget_line_total_min if budget_line_total_min is not None else 0
        budget_line_total_max = budget_line_total_max if budget_line_total_max is not None else 0

        filters = {
            "fiscal_years": sorted(fiscal_years, reverse=True),
            "statuses": sorted(budget_line_statuses_list, key=status_sort_order.index),
            "portfolios": sorted(portfolios, key=lambda x: x["name"]),
            "budget_line_total_range": {"min": budget_line_total_min, "max": budget_line_total_max},
            "agreement_types": sorted([at.name for at in agreement_types]),
            "agreement_names": sorted(agreement_names, key=lambda x: x["name"]),
            "can_active_periods": sorted(can_active_periods),
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


def get_is_editable_meta_data(serialized_bli):
    # add Meta data to the response
    meta_schema = MetaSchema()
    data_for_meta = {
        "isEditable": False,
    }

    is_budget_team = "BUDGET_TEAM" in (role.name for role in current_user.roles)
    budget_line_item = current_app.db_session.get(BudgetLineItem, serialized_bli.get("id"))

    if is_budget_team:
        # if the user has the BUDGET_TEAM role, they can edit all budget line items
        data_for_meta["isEditable"] = is_bli_editable(budget_line_item)
    elif serialized_bli.get("agreement_id"):
        data_for_meta["isEditable"] = bli_associated_with_agreement(serialized_bli.get("id")) and is_bli_editable(
            budget_line_item
        )
    else:
        data_for_meta["isEditable"] = False

    meta = meta_schema.dump(data_for_meta)

    return meta


def get_bli_is_editable_meta_data_for_agreements(serialized_agreement):
    bli_ids = [bli["id"] for bli in serialized_agreement["budget_line_items"] if bli.get("id")]

    budget_line_items = current_app.db_session.query(BudgetLineItem).filter(BudgetLineItem.id.in_(bli_ids)).all()
    bli_dict = {bli.id: bli for bli in budget_line_items}

    is_budget_team = "BUDGET_TEAM" in (role.name for role in current_user.roles)

    for bli in serialized_agreement["budget_line_items"]:
        bli_id = bli.get("id")

        budget_line_item = bli_dict.get(bli_id)

        if is_budget_team:
            is_editable = is_bli_editable(budget_line_item)
        elif bli.get("agreement_id"):
            is_editable = bli_associated_with_agreement(bli_id) and is_bli_editable(budget_line_item)
        else:
            is_editable = False

        bli["_meta"] = {"isEditable": is_editable}
