from flask import Blueprint
from ops.auth import views

bp = Blueprint("authenticate", __name__, url_prefix="/auth")

bp.add_url_rule("/login", view_func=views.login, methods=["POST"])
bp.add_url_rule("/refresh", view_func=views.refresh, methods=["POST"])
