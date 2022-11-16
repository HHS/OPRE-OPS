from flask import Blueprint
from ops.portfolio import views

bp_portfolio = Blueprint("portfolio", __name__, url_prefix="/ops/portfolios")
bp_portfolio.add_url_rule("/", view_func=views.portfolio_list)
bp_portfolio.add_url_rule("/<int:pk>/", view_func=views.get_portfolio)
bp_portfolio.add_url_rule("/<int:pk>/calcFunding/", view_func=views.calc_funding)


bp_portfolio_status = Blueprint(
    "portfolio_status", __name__, url_prefix="/ops/portfolio_status"
)
bp_portfolio_status.add_url_rule("/", view_func=views.portfolio_status_list)
bp_portfolio_status.add_url_rule("/<int:pk>/", view_func=views.get_portfolio_status)

bp_division = Blueprint("division", __name__, url_prefix="/ops/division")
bp_division.add_url_rule("/", view_func=views.division_list)
bp_division.add_url_rule("/<int:pk>", view_func=views.get_division)
