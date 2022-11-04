from flask import Blueprint
from ops_api.ops.user import views

bp = Blueprint("portfolio", __name__, url_prefix="/users")

bp.add_url_rule("/", views.get_all_users)
