from flask import jsonify
from flask import request
from ops.base_views import BaseItemAPI
from ops.portfolio.utils import get_total_funding
from typing_extensions import override

# def funding_summary() -> Response:
#     can_id = request.args.get("can_id")
#     portfolio_id = request.args.get("portfolio_id")
#     fiscal_year = request.args.get("fiscal_year")
#     if can_id:
#         return get_can_funding_summary(can_id, fiscal_year)
#
#     if portfolio_id:
#         return get_portfolio_funding(portfolio_id, fiscal_year)
#
#     return {}


# def get_can_funding_summary(pk: int, fiscal_year: int) -> Response:
#     can = CAN.query.filter(CAN.id == pk).one()
#     response = jsonify(get_can_funding(can, fiscal_year))
#     response.headers.add("Access-Control-Allow-Origin", "*")
#     return response
#
#
# def get_portfolio_funding_summary(pk: int, fiscal_year: int) -> Response:
#     portfolio = Portfolio.query.filter(Portfolio.id == pk).one()
#     response = jsonify(get_portfolio_funding(portfolio, fiscal_year))
#     response.headers.add("Access-Control-Allow-Origin", "*")
#     return response


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
