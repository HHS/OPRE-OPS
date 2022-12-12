from flask import jsonify
from flask import Response
from ops.base_views import BaseItemAPI
from ops.base_views import BaseListAPI
from ops.models.portfolios import Portfolio
from typing_extensions import override


class PortfolioItemAPI(BaseItemAPI):
    def __init__(self, model):
        super().__init__(model)

    @override
    def _get_item(self, id) -> Portfolio:
        portfolio = self.model.query.filter_by(id=id).first_or_404()
        return portfolio

    @override
    def get(self, id) -> Response:
        portfolio = self._get_item(id)
        response = jsonify(portfolio.to_dict())
        response.headers.add("Access-Control-Allow-Origin", "*")
        return response


class PortfolioListAPI(BaseListAPI):
    def __init__(self, model):
        super().__init__(model)
