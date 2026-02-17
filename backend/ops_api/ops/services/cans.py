from typing import Any, Optional

from flask import current_app
from loguru import logger
from sqlalchemy import Integer, cast, distinct, func, select, union_all
from sqlalchemy.exc import NoResultFound
from werkzeug.exceptions import NotFound

from models import CAN, CANSortCondition
from models.cans import CANFundingBudget, CANFundingDetails
from models.portfolios import Portfolio
from ops_api.ops.schemas.cans import CANListFilterOptionResponseSchema
from ops_api.ops.utils.cans import get_can_funding_summary
from ops_api.ops.utils.query_helpers import QueryHelper


class CANService:
    def __init__(self, db_session=None):
        """
        Initialize CANService with a database session.

        Args:
            db_session: SQLAlchemy session. If None, uses current_app.db_session
        """
        self.db_session = db_session or current_app.db_session

    def _update_fields(self, old_can: CAN, can_update) -> bool:
        """
        Update fields on the CAN based on the fields passed in can_update.
        Returns true if any fields were updated.
        """
        is_changed = False
        for attr, value in can_update.items():
            if getattr(old_can, attr) != value:
                setattr(old_can, attr, value)
                is_changed = True

        return is_changed

    def create(self, create_can_request) -> CAN:
        """
        Create a new Common Accounting Number (CAN) object and save it to the database.
        """
        new_can = CAN(**create_can_request)

        self.db_session.add(new_can)
        self.db_session.commit()
        return new_can

    def update(self, updated_fields, id: int) -> CAN:
        """
        Update a CAN with only the provided values in updated_fields.
        """
        try:
            old_can: CAN = self.db_session.execute(select(CAN).where(CAN.id == id)).scalar_one()

            can_was_updated = self._update_fields(old_can, updated_fields)
            if can_was_updated:
                self.db_session.add(old_can)
                self.db_session.commit()

            return old_can
        except NoResultFound as err:
            logger.exception(f"Could not find a CAN with id {id}")
            raise NotFound() from err

    def delete(self, id: int):
        """
        Delete a CAN with given id. Throw a NotFound error if no CAN corresponding to that ID exists.
        """
        try:
            old_can: CAN = self.db_session.execute(select(CAN).where(CAN.id == id)).scalar_one()
            self.db_session.delete(old_can)
            self.db_session.commit()
        except NoResultFound as err:
            logger.exception(f"Could not find a CAN with id {id}")
            raise NotFound() from err

    def get(self, id: int) -> CAN:
        """
        Get an individual CAN by id.
        """
        stmt = select(CAN).where(CAN.id == id).order_by(CAN.id)
        can = self.db_session.scalar(stmt)

        if can:
            return can
        else:
            logger.exception(f"Could not find a CAN with id {id}")
            raise NotFound()

    def get_list(
        self,
        search=None,
        fiscal_year=None,
        sort_conditions=None,
        sort_descending=None,
        limit=None,
        offset=None,
        active_period=None,
        transfer=None,
        portfolio=None,
        can_ids=None,
        budget_min=None,
        budget_max=None,
    ) -> tuple[list[CAN], dict[str, int]]:
        """
        Get a list of CANs, optionally filtered by a search parameter or fiscal year.

        1. if no fiscal_year is provided, return all CANs
        2. if fiscal_year is provided, filter out CANs that do not have funding_details
            a. get all 1-year CANs
            b. get all multiple-year CANs
            c. get all 0-year CANs
        3. join the results and remove duplicates
        4. apply additional filters (active_period, transfer, portfolio, budget range)
        5. sort results
        6. apply pagination
        """

        # Extract values from lists (schema wraps all params in lists)
        search_value = search[0] if search and len(search) > 0 else None
        fiscal_year_value = fiscal_year[0] if fiscal_year and len(fiscal_year) > 0 else None
        sort_conditions_value = sort_conditions[0] if sort_conditions and len(sort_conditions) > 0 else None
        sort_descending_value = sort_descending[0] if sort_descending and len(sort_descending) > 0 else None

        # Extract filter values (these are already lists from schema)
        active_period_values = active_period if active_period is not None else []
        transfer_values = transfer if transfer is not None else []
        portfolio_values = portfolio if portfolio is not None else []
        can_ids_values = can_ids if can_ids is not None else []
        # budget_min, budget_max are semantically single values but wrapped in lists
        budget_min_value = budget_min[0] if budget_min and len(budget_min) > 0 else None
        budget_max_value = budget_max[0] if budget_max and len(budget_max) > 0 else None

        if fiscal_year_value is None:
            search_query = self._get_query(search_value)
            results = self.db_session.execute(search_query).all()
            cursor_results = [can for item in results for can in item]
        else:
            # Execute three separate queries and combine results
            base_stmt = select(CAN).join(CANFundingDetails, CAN.funding_details_id == CANFundingDetails.id)
            one_year_cans = self._get_one_year_cans(base_stmt, fiscal_year_value, search_value)
            multiple_year_cans = self._get_multiple_year_cans(base_stmt, fiscal_year_value, search_value)
            zero_year_cans = self._get_zero_year_cans(base_stmt, fiscal_year_value, search_value)

            all_results = one_year_cans + multiple_year_cans + zero_year_cans
            unique_results = {can.id: can for can in all_results}
            cursor_results = list(unique_results.values())

        # Apply additional filters
        filtered_results = self._apply_filters(
            cursor_results,
            fiscal_year_value,
            active_period_values,
            transfer_values,
            portfolio_values,
            can_ids_values,
            budget_min_value,
            budget_max_value,
        )

        sorted_results = self._sort_results(
            filtered_results,
            fiscal_year_value,
            sort_conditions_value,
            sort_descending_value,
        )

        # Calculate total count before pagination
        total_count = len(sorted_results)

        # Apply pagination slicing
        if limit is not None and offset is not None:
            # Handle list-wrapped values from schema
            limit_value = limit[0] if isinstance(limit, list) else limit
            offset_value = offset[0] if isinstance(offset, list) else offset
            paginated_results = sorted_results[offset_value : offset_value + limit_value]
        else:
            paginated_results = sorted_results
            limit_value = total_count
            offset_value = 0

        # Build metadata
        metadata = {
            "count": total_count,
            "limit": limit_value,
            "offset": offset_value,
        }

        return paginated_results, metadata

    def _get_one_year_cans(self, base_stmt, fiscal_year, search=None) -> list[CAN]:
        active_period_expr = cast(func.substr(CANFundingDetails.fund_code, 11, 1), Integer)
        stmt = base_stmt.where(active_period_expr == 1, CANFundingDetails.fiscal_year == fiscal_year).order_by(CAN.id)

        if search is not None and len(search) > 0:
            query_helper = QueryHelper(stmt)
            query_helper.add_search(CAN.number, search)
            stmt = query_helper.get_stmt()

        return self.db_session.execute(stmt).scalars().all()

    def _get_multiple_year_cans(self, base_stmt, fiscal_year, search=None) -> list[CAN]:
        active_period_expr = cast(func.substr(CANFundingDetails.fund_code, 11, 1), Integer)
        stmt = base_stmt.where(
            active_period_expr > 1,
            CANFundingDetails.fiscal_year <= fiscal_year,
            CANFundingDetails.fiscal_year + active_period_expr > fiscal_year,
        ).order_by(CAN.id)

        if search is not None and len(search) > 0:
            query_helper = QueryHelper(stmt)
            query_helper.add_search(CAN.number, search)
            stmt = query_helper.get_stmt()

        return self.db_session.execute(stmt).scalars().all()

    def _get_zero_year_cans(self, base_stmt, fiscal_year, search=None) -> list[CAN]:
        active_period_expr = cast(func.substr(CANFundingDetails.fund_code, 11, 1), Integer)
        stmt = base_stmt.where(active_period_expr == 0, CANFundingDetails.fiscal_year >= fiscal_year).order_by(CAN.id)

        if search is not None and len(search) > 0:
            query_helper = QueryHelper(stmt)
            query_helper.add_search(CAN.number, search)
            stmt = query_helper.get_stmt()

        return self.db_session.execute(stmt).scalars().all()

    def get_filter_options(self, data: dict | None) -> dict[str, Any]:
        """
        Get filter options for the CAN list.

        Returns distinct portfolios, nick_names, and FY budget range
        for CANs matching the optional fiscal_year filter.

        Uses database-level aggregation to avoid loading full ORM objects.
        """
        fiscal_year = data.get("fiscal_year", []) if data else []
        fiscal_year_value = fiscal_year[0] if fiscal_year and len(fiscal_year) > 0 else None

        # Build a CAN IDs subquery instead of loading full ORM objects
        if fiscal_year_value is None:
            can_ids_subquery = select(CAN.id)
        else:
            active_period_expr = cast(func.substr(CANFundingDetails.fund_code, 11, 1), Integer)
            base_id_stmt = select(CAN.id).join(CANFundingDetails, CAN.funding_details_id == CANFundingDetails.id)

            one_year_ids = base_id_stmt.where(
                active_period_expr == 1,
                CANFundingDetails.fiscal_year == fiscal_year_value,
            )
            multiple_year_ids = base_id_stmt.where(
                active_period_expr > 1,
                CANFundingDetails.fiscal_year <= fiscal_year_value,
                CANFundingDetails.fiscal_year + active_period_expr > fiscal_year_value,
            )
            zero_year_ids = base_id_stmt.where(
                active_period_expr == 0,
                CANFundingDetails.fiscal_year >= fiscal_year_value,
            )
            can_ids_subquery = union_all(one_year_ids, multiple_year_ids, zero_year_ids)

        # Extract distinct portfolios via SQL
        portfolios_query = (
            select(distinct(Portfolio.id), Portfolio.name, Portfolio.abbreviation)
            .join(CAN, Portfolio.id == CAN.portfolio_id)
            .where(CAN.id.in_(can_ids_subquery))
        )
        portfolio_rows = self.db_session.execute(portfolios_query).all()
        portfolios = sorted(
            [{"id": row[0], "name": row[1], "abbreviation": row[2]} for row in portfolio_rows],
            key=lambda x: x["name"],
        )

        # Extract distinct nick_names via SQL
        nick_names_query = select(CAN.id, CAN.nick_name).where(CAN.id.in_(can_ids_subquery), CAN.nick_name.isnot(None))
        nick_name_rows = self.db_session.execute(nick_names_query).all()
        nick_names = sorted(
            [{"id": row[0], "nick_name": row[1]} for row in nick_name_rows],
            key=lambda x: x["nick_name"],
        )

        # Compute FY budget range via SQL MIN/MAX aggregation
        budget_query = select(func.min(CANFundingBudget.budget), func.max(CANFundingBudget.budget)).where(
            CANFundingBudget.can_id.in_(can_ids_subquery),
            CANFundingBudget.budget.isnot(None),
        )
        if fiscal_year_value is not None:
            budget_query = budget_query.where(CANFundingBudget.fiscal_year == fiscal_year_value)
        budget_row = self.db_session.execute(budget_query).one()
        fy_budget_min = float(budget_row[0]) if budget_row[0] is not None else 0.0
        fy_budget_max = float(budget_row[1]) if budget_row[1] is not None else 0.0

        filters = {
            "portfolios": portfolios,
            "nick_names": nick_names,
            "fy_budget_range": {"min": fy_budget_min, "max": fy_budget_max},
        }

        filter_response_schema = CANListFilterOptionResponseSchema()
        return filter_response_schema.dump(filters)

    @staticmethod
    def _sort_results(results, fiscal_year, sort_condition, sort_descending):
        match sort_condition:
            case CANSortCondition.CAN_NAME:
                return sorted(results, key=lambda can: can.number, reverse=sort_descending)
            case CANSortCondition.PORTFOLIO:
                return sorted(
                    results,
                    key=lambda can: can.portfolio.abbreviation,
                    reverse=sort_descending,
                )
            case CANSortCondition.ACTIVE_PERIOD:
                return sorted(results, key=lambda can: can.active_period, reverse=sort_descending)
            case CANSortCondition.OBLIGATE_BY:
                return sorted(results, key=lambda can: can.obligate_by, reverse=sort_descending)
            case CANSortCondition.FY_BUDGET:
                decorated_results = [
                    (
                        get_can_funding_summary(can, fiscal_year).get("total_funding"),
                        i,
                        can,
                    )
                    for i, can in enumerate(results)
                ]
                decorated_results.sort(reverse=sort_descending)
                return [can for _, _, can in decorated_results]
            case CANSortCondition.FUNDING_RECEIVED:
                # We need to sort by funding received for the provided year so we're going to use the
                # decorate-sort-undecorate idiom to accomplish it
                decorated_results = [
                    (
                        CANService.get_can_funding_received(can, fiscal_year=fiscal_year),
                        i,
                        can,
                    )
                    for i, can in enumerate(results)
                ]
                decorated_results.sort(reverse=sort_descending)
                return [can for _, _, can in decorated_results]
            case CANSortCondition.AVAILABLE_BUDGET:
                decorated_results = [
                    (
                        get_can_funding_summary(can, fiscal_year).get("available_funding"),
                        i,
                        can,
                    )
                    for i, can in enumerate(results)
                ]
                decorated_results.sort(reverse=sort_descending)
                return [can for _, _, can in decorated_results]
            case _:
                # Default to sorting by CAN number if no sort condition is provided
                return sorted(results, key=lambda can: can.number, reverse=False)

    @staticmethod
    def get_can_funding_received(can: CAN, fiscal_year: Optional[int] = None):
        if fiscal_year:
            temp_val = sum([c.funding for c in can.funding_received if c.fiscal_year == fiscal_year])
            return temp_val or 0
        else:
            return sum([c.funding for c in can.funding_received]) or 0

    @staticmethod
    def get_can_available_budget(can: CAN, fiscal_year: Optional[int] = None):
        can_funding_summary = get_can_funding_summary(can, fiscal_year)
        return can_funding_summary.get("available_funding")

    @staticmethod
    def _get_query(search=None):
        """
        Construct a search query that can be used to retrieve a list of CANs.
        """
        stmt = select(CAN).order_by(CAN.id)

        query_helper = QueryHelper(stmt)

        if search is not None and len(search) == 0:
            query_helper.return_none()
        elif search:
            query_helper.add_search(CAN.number, search)

        stmt = query_helper.get_stmt()
        logger.debug(f"SQL: {stmt}")

        return stmt

    def _apply_filters(
        self,
        cans: list[CAN],
        fiscal_year: int,
        active_period_values: list[int],
        transfer_values: list[str],
        portfolio_values: list[str],
        can_ids_values: list[int],
        budget_min_value: float,
        budget_max_value: float,
    ) -> list[CAN]:
        """
        Apply additional filters to the CANs list.

        Args:
            cans: List of CANs to filter
            fiscal_year: Fiscal year for budget filtering
            active_period_values: List of active period IDs to filter by
            transfer_values: List of transfer method strings to filter by
            portfolio_values: List of portfolio abbreviations to filter by
            can_ids_values: List of CAN IDs to filter by
            budget_min_value: Minimum budget filter
            budget_max_value: Maximum budget filter

        Returns:
            Filtered list of CANs
        """
        filtered_cans = cans

        # Filter by CAN IDs
        if can_ids_values and len(can_ids_values) > 0:
            can_ids_set = set(can_ids_values)
            filtered_cans = [can for can in filtered_cans if can.id in can_ids_set]

        # Filter by active period
        if active_period_values and len(active_period_values) > 0:
            filtered_cans = [can for can in filtered_cans if can.active_period in active_period_values]

        # Filter by transfer method
        if transfer_values and len(transfer_values) > 0:
            filtered_cans = [
                can
                for can in filtered_cans
                if can.funding_details
                and can.funding_details.method_of_transfer
                and can.funding_details.method_of_transfer.name in transfer_values
            ]

        # Filter by portfolio
        if portfolio_values and len(portfolio_values) > 0:
            filtered_cans = [
                can for can in filtered_cans if can.portfolio and can.portfolio.abbreviation in portfolio_values
            ]

        # Filter by budget range
        if budget_min_value is not None or budget_max_value is not None:
            filtered_cans = self._filter_by_budget_range(filtered_cans, fiscal_year, budget_min_value, budget_max_value)

        return filtered_cans

    def _filter_by_budget_range(
        self, cans: list[CAN], fiscal_year: int, min_budget: float, max_budget: float
    ) -> list[CAN]:
        """
        Filter CANs by budget range for the given fiscal year.

        Args:
            cans: List of CANs to filter
            fiscal_year: Fiscal year to check budgets for
            min_budget: Minimum budget (inclusive), None to skip min check
            max_budget: Maximum budget (inclusive), None to skip max check

        Returns:
            List of CANs with budgets in the specified range
        """
        filtered = []
        for can in cans:
            # Get valid budgets for this CAN in the fiscal year
            valid_budgets = [
                fb.budget for fb in can.funding_budgets or [] if fb.fiscal_year == fiscal_year and fb.budget is not None
            ]

            # Skip CANs with no valid budgets
            if not valid_budgets:
                continue

            # Check if any budget falls within range
            for budget in valid_budgets:
                if min_budget is not None and budget < min_budget:
                    continue
                if max_budget is not None and budget > max_budget:
                    continue
                # Budget is in range, add CAN and stop checking
                filtered.append(can)
                break  # Only add CAN once

        return filtered
