from flask import Response, current_app, request
from sqlalchemy import select

from models import Portfolio
from models.base import BaseModel
from ops_api.ops.auth.auth_types import Permission, PermissionType
from ops_api.ops.auth.decorators import is_authorized
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI
from ops_api.ops.schemas.cans import DivisionSchema
from ops_api.ops.schemas.portfolio_funding_summary import (
    RequestSchema,
    ResponseListSchema,
    ResponseSchema,
)
from ops_api.ops.utils.fiscal_year import get_current_fiscal_year
from ops_api.ops.utils.portfolios import get_total_funding
from ops_api.ops.utils.response import make_response_with_headers


def _extract_first_or_default(value_list, default=None):
    """
    Extract the first value from a list, or return default if list is empty/None.

    This helper handles the flat=False query parameter parsing where all values
    come as lists, even single-value parameters.

    Args:
        value_list: List of values or None
        default: Default value to return if list is empty/None

    Returns:
        First value from list, or default
    """
    return value_list[0] if value_list and len(value_list) > 0 else default


class PortfolioFundingSummaryItemAPI(BaseItemAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    @is_authorized(PermissionType.GET, Permission.PORTFOLIO)
    def get(self, id: int) -> Response:
        """
        /portfolio-funding-summary/<int:id>?fiscal_year=2026
        """
        schema = RequestSchema()
        data = schema.load(request.args.to_dict(flat=False))

        fiscal_year = _extract_first_or_default(data.get("fiscal_year"), get_current_fiscal_year())

        portfolio = self._get_item(id)

        response_schema = ResponseSchema()
        portfolio_funding_summary = response_schema.dump(get_total_funding(portfolio, fiscal_year))
        return make_response_with_headers(portfolio_funding_summary)


class PortfolioFundingSummaryListAPI(BaseListAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    def _parse_request_params(self, data: dict) -> tuple:
        """Extract and parse request parameters from loaded schema data."""
        fiscal_year = _extract_first_or_default(data.get("fiscal_year"), get_current_fiscal_year())
        portfolio_ids = data.get("portfolio_ids", [])
        budget_min = _extract_first_or_default(data.get("budget_min"))
        budget_max = _extract_first_or_default(data.get("budget_max"))
        available_pct_ranges = data.get("available_pct", [])

        return fiscal_year, portfolio_ids, budget_min, budget_max, available_pct_ranges

    def _matches_budget_range(self, total_amount: float, budget_min: float, budget_max: float) -> bool:
        """Check if total amount is within budget range."""
        if budget_min is not None and total_amount < budget_min:
            return False
        if budget_max is not None and total_amount > budget_max:
            return False
        return True

    def _matches_available_pct_range(self, available_pct: float, range_code: str) -> bool:
        """Check if available percentage matches the given range code."""
        if range_code == "over90":
            return available_pct >= 90
        elif range_code == "75-90":
            return 75 <= available_pct < 90
        elif range_code == "50-75":
            return 50 <= available_pct < 75
        elif range_code == "25-50":
            return 25 <= available_pct < 50
        elif range_code == "under25":
            return available_pct < 25
        return False

    def _apply_available_pct_filter(self, funding: dict, available_pct_ranges: list) -> bool:
        """Check if portfolio matches available percentage filter. Returns True if it matches."""
        if not available_pct_ranges:
            return True

        available_amount = funding["available_funding"]["amount"]
        total_amount = funding["total_funding"]["amount"]

        if total_amount == 0:
            return False

        available_pct = (available_amount / total_amount) * 100
        return any(self._matches_available_pct_range(available_pct, code) for code in available_pct_ranges)

    def _build_portfolio_summary(self, portfolio: Portfolio, funding: dict) -> dict:
        """Build portfolio summary dict with division info and funding data."""
        division_schema = DivisionSchema(
            only=["id", "name", "abbreviation", "division_director_id", "deputy_division_director_id"]
        )
        return {
            "id": portfolio.id,
            "name": portfolio.name,
            "abbreviation": portfolio.abbreviation,
            "division_id": portfolio.division_id,
            "division": division_schema.dump(portfolio.division) if portfolio.division else None,
            **funding,
        }

    @is_authorized(PermissionType.GET, Permission.PORTFOLIO)
    def get(self) -> Response:
        """
        GET /portfolio-funding-summary/?fiscal_year=2026&portfolio_ids=1&portfolio_ids=2&budget_min=1000000&budget_max=5000000&available_pct=over90&available_pct=75-90
        Returns filtered portfolios with their funding summaries
        """
        schema = RequestSchema()
        data = schema.load(request.args.to_dict(flat=False))

        fiscal_year, portfolio_ids, budget_min, budget_max, available_pct_ranges = self._parse_request_params(data)

        # Get all portfolios (or filtered by IDs if specified)
        if portfolio_ids:
            stmt = select(Portfolio).where(Portfolio.id.in_(portfolio_ids))
            portfolios = current_app.db_session.execute(stmt).scalars().all()
        else:
            portfolios = self._get_all_items()

        # Build response with funding for each portfolio
        portfolio_summaries = []
        for portfolio in portfolios:
            funding = get_total_funding(portfolio, fiscal_year)

            # Apply filters
            total_amount = funding["total_funding"]["amount"]
            if not self._matches_budget_range(total_amount, budget_min, budget_max):
                continue

            if not self._apply_available_pct_filter(funding, available_pct_ranges):
                continue

            portfolio_summaries.append(self._build_portfolio_summary(portfolio, funding))

        response_schema = ResponseListSchema()
        return make_response_with_headers(response_schema.dump({"portfolios": portfolio_summaries}))
