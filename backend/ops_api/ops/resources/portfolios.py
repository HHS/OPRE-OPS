from flask import Response, jsonify
from models.base import BaseModel
from models.portfolios import Portfolio
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI
from typing_extensions import override


class PortfolioItemAPI(BaseItemAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    @override
    def _get_item(self, id: int) -> Portfolio:
        portfolio = self.model.query.filter_by(id=id).first_or_404()
        return portfolio

    @override
    def get(self, id: int) -> Response:
        portfolio = self._get_item(id)
        response = jsonify(portfolio.to_dict())
        response.headers.add("Access-Control-Allow-Origin", "*")
        return response


class PortfolioListAPI(BaseListAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)
