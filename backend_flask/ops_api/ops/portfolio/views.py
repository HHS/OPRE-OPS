from flask import Response, jsonify
from flask_sqlalchemy import SQLAlchemy
from ops_api.ops.portfolio.models import Portfolio, PortfolioStatus

db = SQLAlchemy()


def portfolio_list() -> Response:
    result = db.session.execute(db.select(Portfolio)).scalars()
    return jsonify(result)


def get_portfolio(pk: int) -> Response:
    portfolio = db.session.execute(
        db.select(
            Portfolio.name,
            Portfolio.description,
            db.label("status", PortfolioStatus.name),
            Portfolio.current_fiscal_year_funding,
        ).where(Portfolio.id == pk)
    ).one()
    return jsonify(
        {
            "name": portfolio.name,
            "description": portfolio.description,
            "label": portfolio.label,
            "current_fiscal_year_funding": portfolio.current_fiscal_year_funding,
            # TODO: get cans?
        }
    )


def calc_funding(pk: int) -> Response:
    portfolio = db.session.execute(
        db.select(Portfolio).where(Portfolio.id == pk),
    ).one()
    return jsonify({"total_funding": portfolio.current_fiscal_year_funding})
