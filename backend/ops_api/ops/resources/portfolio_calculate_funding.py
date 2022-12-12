from typing import List

from flask import jsonify
from flask import request
from flask import Response
from ops.base_views import BaseItemAPI
from ops.models.portfolios import Portfolio
from ops.utils.portfolios import get_total_funding
from typing_extensions import override


class PortfolioCalculateFundingAPI(BaseItemAPI):
    def __init__(self, model):
        super().__init__(model)

    @override
    def _get_item(self, id) -> List[Portfolio]:
        portfolio = self.model.query.filter_by(id=id).first_or_404()

        return portfolio

    @override
    def get(self, id) -> Response:
        portfolio = self._get_item(id)
        fiscal_year = request.args.get("fiscal_year")
        total_funding = get_total_funding(portfolio, fiscal_year)
        return jsonify(total_funding)
