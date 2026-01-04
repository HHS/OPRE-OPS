from flask import Response, jsonify, request

from models.base import BaseModel
from ops_api.ops.auth.auth_types import Permission, PermissionType
from ops_api.ops.auth.decorators import is_authorized
from ops_api.ops.base_views import BaseItemAPI
from ops_api.ops.schemas.portfolio_funding_summary import RequestSchema
from ops_api.ops.utils.portfolios import get_total_funding


class PortfolioCalculateFundingAPI(BaseItemAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    @is_authorized(PermissionType.GET, Permission.PORTFOLIO)
    def get(self, id: int) -> Response:
        """
        GET the total funding for a portfolio for a given fiscal year.

        /portfolios/<int:id>/calcFunding/
        """
        schema = RequestSchema()
        data = schema.load(request.args.to_dict(flat=False))

        # Extract fiscal_year from list (Flask query params with flat=False wraps everything in lists)
        fiscal_year_list = data.get("fiscal_year")
        fiscal_year = fiscal_year_list[0] if fiscal_year_list and len(fiscal_year_list) > 0 else None

        portfolio = self._get_item(id)
        total_funding = get_total_funding(portfolio, fiscal_year)
        return jsonify(total_funding)
