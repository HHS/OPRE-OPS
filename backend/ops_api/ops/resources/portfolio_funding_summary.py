from flask import Response, jsonify, request
from models.base import BaseModel
from ops_api.ops.base_views import BaseItemAPI
from ops_api.ops.utils.fiscal_year import get_current_fiscal_year
from ops_api.ops.utils.portfolios import get_total_funding
from typing_extensions import override


class PortfolioFundingSummaryItemAPI(BaseItemAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    @override
    def get(self, id: int) -> Response:
        fiscal_year = request.args.get("fiscal_year")

        if not fiscal_year:
            fiscal_year = get_current_fiscal_year()

        portfolio = self._get_item(id)
        portfolio_funding_summary = get_total_funding(portfolio, fiscal_year)
        response = jsonify(portfolio_funding_summary)
        response.headers.add("Access-Control-Allow-Origin", "*")
        return response
