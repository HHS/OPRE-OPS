from typing import Dict

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
    def _get_item(self, id: int, fiscal_year: int) -> Dict[str, object]:
        portfolio = self.model.query.filter_by(id=id).first_or_404()
        portfolio_funding = get_total_funding(portfolio, fiscal_year)
        return portfolio_funding

    @override
    def get(self, id: int) -> Response:
        fiscal_year = request.args.get("fiscal_year")

        if not fiscal_year:
            fiscal_year = get_current_fiscal_year()

        portfolio_funding_summary = self._get_item(id, fiscal_year)
        response = jsonify(portfolio_funding_summary)
        response.headers.add("Access-Control-Allow-Origin", "*")
        return response
