from flask import Blueprint
from ops.portfolio import views

bp = Blueprint("portfolio", __name__, url_prefix="/ops/portfolios")

bp.add_url_rule("/", view_func=views.portfolio_list)
bp.add_url_rule("/<int:pk>/", view_func=views.get_portfolio)
bp.add_url_rule("/<int:pk>/calcFunding/", view_func=views.calc_funding)
