from flask import jsonify
from flask import request
from flask import Response
from ops.portfolio.models import Portfolio
from ops.portfolio.utils import get_total_funding


def portfolio_list() -> Response:
    portfolios = Portfolio.query.all()
    return jsonify([portfolio.to_dict() for portfolio in portfolios])


def get_portfolio(pk: int) -> Response:
    portfolio = Portfolio.query.filter(Portfolio.id == pk).one()
    return portfolio.to_dict(nested=True)


def calc_funding(pk: int) -> Response:

    portfolio = Portfolio.query.filter(Portfolio.id == pk).one()
    fiscal_year = request.args.get("fiscal_year")

    return jsonify(get_total_funding(portfolio, fiscal_year))
