from flask import Blueprint
from ops.user import views

bp = Blueprint("portfolio", __name__, url_prefix="/users")

bp.add_url_rule("/", view_func=views.get_all_users)
