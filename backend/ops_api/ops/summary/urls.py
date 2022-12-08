from flask import Blueprint
from flask import jsonify
from flask import request
from flask import Response
from ops.can.utils import get_can_funding_summary as get_can_funding
from ops.models.cans import CAN
from ops.portfolio.models import Portfolio
from ops.portfolio.utils import get_total_funding as get_portfolio_funding


def funding_summary() -> Response:
    can_id = request.args.get("can_id")
    portfolio_id = request.args.get("portfolio_id")
    fiscal_year = request.args.get("fiscal_year")
    if can_id:
        return get_can_funding_summary(can_id, fiscal_year)

    if portfolio_id:
        return get_portfolio_funding(portfolio_id, fiscal_year)

    return {}


def get_can_funding_summary(pk: int, fiscal_year: int) -> Response:
    can = CAN.query.filter(CAN.id == pk).one()
    response = jsonify(get_can_funding(can, fiscal_year))
    response.headers.add("Access-Control-Allow-Origin", "*")
    return response


def get_portfolio_funding_summary(pk: int, fiscal_year: int) -> Response:
    portfolio = Portfolio.query.filter(Portfolio.id == pk).one()
    response = jsonify(get_portfolio_funding(portfolio, fiscal_year))
    response.headers.add("Access-Control-Allow-Origin", "*")
    return response


bp = Blueprint(
    "funding_summary",
    __name__,
    url_prefix="/ops",
)
# fundingSummary
# bp.add_url_rule("/fundingSummary", view_func=funding_summary)
