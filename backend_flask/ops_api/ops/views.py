from hmac import compare_digest

from flask import Blueprint
from flask import current_app as app
from flask import jsonify
from flask import request
from flask import render_template

from flask_jwt_extended import create_access_token
from flask_jwt_extended import current_user
from flask_jwt_extended import jwt_required
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from ops.user.models import User


bp = Blueprint("root", __name__)

@bp.route("/")
def index():
    app.logger.warning("It's Alive!!!")
    return render_template("index.html")


@bp.route("/portfolio_cal", methods=["GET"])
def port_calc():
    return 42


@bp.route("/who_am_i", methods=["GET"])
@jwt_required()
def protected():
    # We can now access our sqlalchemy User object via `current_user`.
    return jsonify(
        id=current_user.id,
        email=current_user.email,
        username=current_user.username,
    )
