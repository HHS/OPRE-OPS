from flask import Blueprint
from ops_api.ops.can import views

bp = Blueprint("auth", __name__, url_prefix="/cans")

bp.add_url_rule("/", views.all_cans)
bp.add_url_rule("/<int: pk>", views.load_can)
bp.add_url_rule("/fiscal_year/<int:can_id>/<int:fiscal_year>", views.fiscal_year_by_can)
