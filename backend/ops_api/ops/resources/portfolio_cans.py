from typing import Optional

from flask import Response, current_app, request
from sqlalchemy import select

from models import CAN, BaseModel, CANFundingBudget, CANFundingDetails
from ops_api.ops.auth.auth_types import Permission, PermissionType
from ops_api.ops.auth.decorators import is_authorized
from ops_api.ops.base_views import BaseItemAPI
from ops_api.ops.schemas.portfolios import PortfolioCansRequestSchema
from ops_api.ops.utils.cans import filter_active_cans
from ops_api.ops.utils.response import make_response_with_headers


class PortfolioCansAPI(BaseItemAPI):
    """
    API endpoint for retrieving CANs scoped to a specific portfolio.

    **Endpoint:** ``GET /portfolios/{id}/cans/``

    This is a **portfolio detail view** endpoint with specialized behavior:
      - Filters by active period using :func:`~ops_api.ops.utils.cans.filter_active_cans`
      - Supports ``includeInactive`` to bypass active-period filtering
      - Filters each CAN's ``budget_line_items`` in-memory by ``budgetFiscalYear``
      - Returns a **bare JSON array** (no pagination wrapper)
      - Sorts results by appropriation year descending, then CAN number ascending

    **Frontend consumers:**
      - ``PortfolioSpending`` — fetches all CANs (including inactive) to extract BLI IDs
      - ``PortfolioFunding`` — fetches active-only CANs to render CAN cards

    .. note::
        **Relationship to GET /cans/ (CANListAPI):**

        There is functional overlap with ``GET /cans/?portfolio_id={id}`` but important differences:

        +---------------------------+-----------------------------------+----------------------------------------+
        | Feature                   | This endpoint                     | GET /cans/                             |
        +===========================+===================================+========================================+
        | Response shape            | Bare JSON array                   | ``{ data, count, limit, offset }``     |
        | Serializer                | ``CAN.to_dict()``                 | ``CANListSchema`` (Marshmallow)        |
        | Active-period filtering   | Shared ``filter_active_cans``     | SQL-level via three queries + shared   |
        |                           |                                   | ``filter_active_cans`` post-filter     |
        | ``includeInactive``       | Supported                         | Not supported                          |
        | BLI fiscal year filtering | In-memory per-CAN BLI filtering   | Not supported                          |
        | Pagination                | None                              | limit/offset                           |
        | Sorting                   | Hardcoded: appropriation yr desc  | User-configurable (7 sort fields)      |
        | Search                    | Not supported                     | ILIKE on CAN number                    |
        | Multi-field filtering     | year, budgetFiscalYear            | active_period, transfer, portfolio,    |
        |                           |                                   | budget range, etc.                     |
        +---------------------------+-----------------------------------+----------------------------------------+

        **Future consolidation plan:**
        The goal is to eventually migrate consumers to ``GET /cans/`` by adding the missing
        features (``includeInactive``, BLI filtering, appropriation-year sort) and deprecating
        this endpoint. See :func:`~ops_api.ops.utils.cans.is_can_active_for_year` for details.
    """

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
                    bli for bli in can.budget_line_items if bli.fiscal_year is None or bli.fiscal_year == bli_year
                ]

        return can_set

    @staticmethod
    def _include_only_active_cans(cans=None, bli_year=None) -> set[CAN]:
        """
        Filter a set of CANs to include only those considered "active" for the given budget fiscal year.

        Delegates to the shared :func:`~ops_api.ops.utils.cans.filter_active_cans` utility
        which is the single source of truth for active-period logic.

        :param cans: Set of CAN instances to filter.
        :param bli_year: The budget fiscal year to check against the CAN's active period.
        :return: A filtered set of active CANs, or the original set if no budget fiscal year is provided.
        """
        return filter_active_cans(cans, bli_year)

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

        include_inactive = data.get("includeInactive", False)

        cans_unfiltered = self._get_item(id, data.get("year"), data.get("budgetFiscalYear"))

        if include_inactive:
            cans = set(cans_unfiltered) if cans_unfiltered else set()

        else:
            cans = self._include_only_active_cans(
                self._get_item(id, data.get("year"), data.get("budgetFiscalYear")),
                data.get("budgetFiscalYear"),
            )

        sorted_cans = self._sort_by_appropriation_year(cans)
        return make_response_with_headers([can.to_dict() for can in sorted_cans])
