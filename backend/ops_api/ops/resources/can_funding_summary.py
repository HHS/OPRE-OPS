from flask import jsonify
from flask import request
from ops.base_views import BaseItemAPI
from ops.utils.cans import get_can_funding_summary
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


class CANFundingSummaryItemAPI(BaseItemAPI):
    def __init__(self, model):
        super().__init__(model)

    @override
    def _get_item(self, id, fiscal_year):
        can = self.model.query.filter_by(id=id).first_or_404()
        can_funding = get_can_funding_summary(can, fiscal_year)
        return can_funding

    @override
    def get(self, id):
        fiscal_year = request.args.get("fiscal_year")
        can_funding_summary = self._get_item(id, fiscal_year)
        response = jsonify(can_funding_summary)
        response.headers.add("Access-Control-Allow-Origin", "*")
        return response
