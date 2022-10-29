from flask import Blueprint
from ops_api.ops.portfolios import views

bp = Blueprint("portfolio", __name__)

bp.add_url_rule("/", views.portfolio_list)
bp.add_url_rule("/<int:pk>/", views.get_portfolio)
bp.add_url_rule("/<int:pk>/calcFunding/", views.calc_funding)
