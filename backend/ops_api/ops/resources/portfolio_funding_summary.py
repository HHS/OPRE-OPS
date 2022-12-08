from flask import jsonify
from flask import request
from ops.base_views import BaseItemAPI
from ops.utils.portfolios import get_total_funding
from typing_extensions import override


class PortfolioFundingSummaryItemAPI(BaseItemAPI):
    def __init__(self, model):
        super().__init__(model)

    @override
    def _get_item(self, id, fiscal_year):
        portfolio = self.model.query.filter_by(id=id).first_or_404()
        portfolio_funding = get_total_funding(portfolio, fiscal_year)
        return portfolio_funding

    @override
    def get(self, id):
        fiscal_year = request.args.get("fiscal_year")
        portfolio_funding_summary = self._get_item(id, fiscal_year)
        response = jsonify(portfolio_funding_summary)
        response.headers.add("Access-Control-Allow-Origin", "*")
        return response
