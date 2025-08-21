from typing import Optional
from flask import current_app
from loguru import logger
from sqlalchemy import Integer, func, select, cast
from sqlalchemy.exc import NoResultFound
from sqlalchemy.orm import InstrumentedAttribute
from werkzeug.exceptions import NotFound

from models import CAN, CANSortCondition
from models.cans import CANFundingDetails
from ops_api.ops.utils.cans import get_can_funding_summary
from ops_api.ops.utils.query_helpers import QueryHelper


class CANService:
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

        current_app.db_session.add(new_can)
        current_app.db_session.commit()
        return new_can

    def update(self, updated_fields, id: int) -> CAN:
        """
        Update a CAN with only the provided values in updated_fields.
        """
        try:
            old_can: CAN = current_app.db_session.execute(select(CAN).where(CAN.id == id)).scalar_one()

            can_was_updated = self._update_fields(old_can, updated_fields)
            if can_was_updated:
                current_app.db_session.add(old_can)
                current_app.db_session.commit()

            return old_can
        except NoResultFound as err:
            logger.exception(f"Could not find a CAN with id {id}")
            raise NotFound() from err

    def delete(self, id: int):
        """
        Delete a CAN with given id. Throw a NotFound error if no CAN corresponding to that ID exists."""
        try:
            old_can: CAN = current_app.db_session.execute(select(CAN).where(CAN.id == id)).scalar_one()
            current_app.db_session.delete(old_can)
            current_app.db_session.commit()
        except NoResultFound as err:
            logger.exception(f"Could not find a CAN with id {id}")
            raise NotFound() from err

    def get(self, id: int) -> CAN:
        """
        Get an individual CAN by id.
        """
        stmt = select(CAN).where(CAN.id == id).order_by(CAN.id)
        can = current_app.db_session.scalar(stmt)

        if can:
            return can
        else:
            logger.exception(f"Could not find a CAN with id {id}")
            raise NotFound()

    def get_list(self, search=None, fiscal_year=None, sort_conditions=None, sort_descending=None) -> list[CAN]:
        """
        Get a list of CANs, optionally filtered by a search parameter.
        """
        """
        1. if no fiscal_year is provided, we will return all CANs
        2. if fiscal_year is provided, filter out CANs that do not have funding_details
            a. get all 1-year CANs
            b. get all multiple-year CANs
            c. get all 0-year CANs
        """
        # search_query = self._get_query(search)
        # results = current_app.db_session.execute(search_query).all()
        # cursor_results = [can for item in results for can in item]
        # sorted_results = self._sort_results(cursor_results, fiscal_year, sort_conditions, sort_descending)
        # return sorted_results

        if fiscal_year is None:
            search_query = self._get_query(search)
            results = current_app.db_session.execute(search_query).all()
            cursor_results = [can for item in results for can in item]
        else:
            # Execute three separate queries and combine results
            base_stmt = select(CAN).join(CANFundingDetails, CAN.funding_details_id == CANFundingDetails.id)
            one_year_cans = self._get_one_year_cans(base_stmt, fiscal_year, search)
            multiple_year_cans = self._get_multiple_year_cans(base_stmt, fiscal_year, search)
            zero_year_cans = self._get_zero_year_cans(base_stmt, fiscal_year, search)

            all_results = one_year_cans + multiple_year_cans + zero_year_cans
            # Remove duplicates by converting to dict with CAN id as key, then back to list
            unique_results = {can.id: can for can in all_results}
            cursor_results = list(unique_results.values())

        sorted_results = self._sort_results(cursor_results, fiscal_year, sort_conditions, sort_descending)
        return sorted_results

    def _get_one_year_cans(self, base_stmt, fiscal_year, search=None) -> list[CAN]:
        active_period_expr = cast(func.substr(CANFundingDetails.fund_code, 11, 1), Integer)
        stmt = base_stmt.where(active_period_expr == 1, CANFundingDetails.fiscal_year == fiscal_year).order_by(CAN.id)

        if search is not None and len(search) > 0:
            query_helper = QueryHelper(stmt)
            query_helper.add_search(cast(InstrumentedAttribute, CAN.number), search)
            stmt = query_helper.get_stmt()

        return current_app.db_session.execute(stmt).scalars().all()

    def _get_multiple_year_cans(self, base_stmt, fiscal_year, search=None) -> list[CAN]:
        active_period_expr = cast(func.substr(CANFundingDetails.fund_code, 11, 1), Integer)
        stmt = base_stmt.where(
            active_period_expr > 1,
            CANFundingDetails.fiscal_year <= fiscal_year,
            CANFundingDetails.fiscal_year + active_period_expr > fiscal_year,
        ).order_by(CAN.id)

        if search is not None and len(search) > 0:
            query_helper = QueryHelper(stmt)
            query_helper.add_search(cast(InstrumentedAttribute, CAN.number), search)
            stmt = query_helper.get_stmt()

        return current_app.db_session.execute(stmt).scalars().all()

    def _get_zero_year_cans(self, base_stmt, fiscal_year, search=None) -> list[CAN]:
        active_period_expr = cast(func.substr(CANFundingDetails.fund_code, 11, 1), Integer)
        stmt = base_stmt.where(active_period_expr == 0, CANFundingDetails.fiscal_year >= fiscal_year).order_by(CAN.id)

        if search is not None and len(search) > 0:
            query_helper = QueryHelper(stmt)
            query_helper.add_search(cast(InstrumentedAttribute, CAN.number), search)
            stmt = query_helper.get_stmt()

        return current_app.db_session.execute(stmt).scalars().all()

    @staticmethod
    def _sort_results(results, fiscal_year, sort_condition, sort_descending):
        match sort_condition:
            case CANSortCondition.CAN_NAME:
                return sorted(results, key=lambda can: can.number, reverse=sort_descending)
            case CANSortCondition.PORTFOLIO:
                return sorted(results, key=lambda can: can.portfolio.abbreviation, reverse=sort_descending)
            case CANSortCondition.ACTIVE_PERIOD:
                return sorted(results, key=lambda can: can.active_period, reverse=sort_descending)
            case CANSortCondition.OBLIGATE_BY:
                return sorted(results, key=lambda can: can.obligate_by, reverse=sort_descending)
            case CANSortCondition.FY_BUDGET:
                decorated_results = [
                    (get_can_funding_summary(can, fiscal_year).get("total_funding"), i, can)
                    for i, can in enumerate(results)
                ]
                decorated_results.sort(reverse=sort_descending)
                return [can for _, _, can in decorated_results]
            case CANSortCondition.FUNDING_RECEIVED:
                # We need to sort by funding received for the provided year so we're going to use the
                # decorate-sort-undecorate idiom to accomplish it
                decorated_results = [
                    (CANService.get_can_funding_received(can, fiscal_year=fiscal_year), i, can)
                    for i, can in enumerate(results)
                ]
                decorated_results.sort(reverse=sort_descending)
                return [can for _, _, can in decorated_results]
            case CANSortCondition.AVAILABLE_BUDGET:
                decorated_results = [
                    (get_can_funding_summary(can, fiscal_year).get("available_funding"), i, can)
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
            query_helper.add_search(cast(InstrumentedAttribute, CAN.number), search)

        stmt = query_helper.get_stmt()
        logger.debug(f"SQL: {stmt}")

        return stmt
