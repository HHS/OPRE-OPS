from flask import Blueprint

bp = Blueprint("auth", __name__)

from ops_api.ops.auth.api import login_post, logout_post, refresh_post  # noqa: E402, F401
