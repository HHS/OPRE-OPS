from flask import jsonify
from flask import Response
from ops.portfolio.models import Portfolio
from ops.portfolio.utils import portfolio_dumper


def portfolio_list() -> Response:
    portfolios = Portfolio.query.all()
    return jsonify([portfolio_dumper(portfolio) for portfolio in portfolios])


def get_portfolio(pk: int) -> Response:
    portfolio = Portfolio.query.filter(Portfolio.id == pk).one()
    return jsonify(portfolio_dumper(portfolio))


#  'http://localhost:8080/ops/portfolios/1/calcFunding?fiscal_year=2023'
def calc_funding(pk: int) -> Response:

    portfolio = Portfolio.query.filter(Portfolio.id == pk).one()
    return jsonify({"total_funding": portfolio.current_fiscal_year_funding})
