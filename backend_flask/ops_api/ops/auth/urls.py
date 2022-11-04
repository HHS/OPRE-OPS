from flask import Blueprint
from ops_api.ops.auth import views

bp = Blueprint("auth", __name__)

bp.add_url_rule("/login", views.login, methods=["POST"])
bp.add_url_rule("/refresh", views.refresh, methods=["POST"])
