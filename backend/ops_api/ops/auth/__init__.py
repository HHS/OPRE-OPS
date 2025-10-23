from flask import Blueprint

bp = Blueprint("auth", __name__)

from ops_api.ops.auth.api import (  # noqa: E402, F401
    login_post,
    logout_post,
    refresh_post,
)
