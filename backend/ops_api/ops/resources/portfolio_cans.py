from typing import Iterable, Optional

from flask import Response, current_app, request
from sqlalchemy import select

from models import CAN, BaseModel, CANFundingBudget, CANFundingDetails
from ops_api.ops.auth.auth_types import Permission, PermissionType
from ops_api.ops.auth.decorators import is_authorized
from ops_api.ops.base_views import BaseItemAPI
from ops_api.ops.schemas.portfolios import PortfolioCansRequestSchema
from ops_api.ops.utils.response import make_response_with_headers


class PortfolioCansAPI(BaseItemAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    def _get_item(self, id: int, year: Optional[int] = None, bli_year: Optional[int] = None) -> set[CAN]:
        can_stmt = (
            select(CAN)
            .outerjoin(CANFundingDetails, CAN.funding_details_id == CANFundingDetails.id)
            .outerjoin(CANFundingBudget, CAN.id == CANFundingBudget.can_id)
            .where(CAN.portfolio_id == id)
        )

        if year:
            can_stmt = can_stmt.where(CANFundingBudget.fiscal_year == year)

        can_set = set(current_app.db_session.execute(can_stmt).scalars().all())

        if bli_year:
            bli_year = int(bli_year)
            for can in can_set:
                can.budget_line_items = [
                    bli for bli in can.budget_line_items if bli.date_needed is None or bli.date_needed.year == bli_year
                ]

        return can_set

    @staticmethod
    def _include_only_active_cans(cans: Optional[Iterable[CAN]] = None, bli_year: Optional[int] = None) -> set[CAN]:
        """
        Filter a set of CANs to include only those considered "active" for the given budget fiscal year.

        A CAN is considered active if:
        - It has a defined `funding_details` and `active_period`
        - The budget fiscal year falls within the CAN's active period
          (i.e., bli_year <= funding_details.fiscal_year + active_period)

        :param cans: Set of CAN instance to filter.
        :param bli_year: The budget fiscal year to check against the CAN's active period.
        :return: A filtered set of active CANs, or the original set if no budget fiscal year is provided.
        """
        if not cans:
            return set()

        if not bli_year:
            return set(cans)

        bli_year = int(bli_year)

        return {
            can
            for can in cans
            if can.funding_details
            and can.active_period is not None
            and can.funding_details.fiscal_year <= bli_year < (can.funding_details.fiscal_year + can.active_period)
        }

    @staticmethod
    def _sort_by_appropriation_year(can_set: set[CAN]) -> list[CAN]:
        """
        Sort a set of CANs by their appropriation year. Use CAN number as a secondary sort key.

        :param can_set: Set of CAN instance to sort.
        :return: A sorted list of CANs.
        """
        return sorted(
            can_set,
            key=lambda can: (
                -(
                    can.funding_details.fiscal_year
                    if can.funding_details and can.funding_details.fiscal_year is not None
                    else 0
                ),  # descending
                can.number,  # ascending
            ),
        )

    @is_authorized(PermissionType.GET, Permission.PORTFOLIO)
    def get(self, id: int) -> Response:
        request_schema = PortfolioCansRequestSchema()
        data = request_schema.load(request.args)
        cans = self._include_only_active_cans(
            self._get_item(id, data.get("year"), data.get("budgetFiscalYear")), data.get("budgetFiscalYear")
        )
        sorted_cans = self._sort_by_appropriation_year(cans)
        return make_response_with_headers([can.to_dict() for can in sorted_cans])
