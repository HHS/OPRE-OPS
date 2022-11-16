from flask import jsonify
from flask import request
from flask import Response
from ops.portfolio.models import Division
from ops.portfolio.models import Portfolio
from ops.portfolio.models import PortfolioStatus
from ops.portfolio.utils import get_total_funding


# Portfolio
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


# PortfolioStatus
def portfolio_status_list() -> Response:
    portfolio_statuses = PortfolioStatus.query.all()
    return jsonify([status.to_dict() for status in portfolio_statuses])


def get_portfolio_status(pk: int) -> Response:
    portfolio_status = PortfolioStatus.query.filter(PortfolioStatus.id == pk).one()
    return portfolio_status.to_dict()


# Division
def division_list() -> Response:
    divisions = Division.query.all()
    return jsonify([division.to_dict() for division in divisions])


def get_division(pk: int) -> Response:
    division = Division.query.filter(Division.id == pk).one()
    return division.to_dict(nested=True)
