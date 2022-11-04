from flask import Blueprint
from ops_api.ops import views

bp = Blueprint("root", __name__)

bp.add_url_rule("/", views.index)
bp.add_url_rule("/portfolio_cal", views.port_calc, methods=["GET"])
