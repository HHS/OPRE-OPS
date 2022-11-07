from flask import Blueprint
from ops.can import views

bp = Blueprint("auth", __name__, url_prefix="/cans")

bp.add_url_rule("/", view_func=views.all_cans)
bp.add_url_rule("/<int:pk>", view_func=views.load_can)
