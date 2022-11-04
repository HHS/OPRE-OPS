from flask import Blueprint
from flask import current_app as app
from flask import jsonify, render_template
from flask_jwt_extended import current_user, jwt_required


def index():
    app.logger.warning("It's Alive!!!")
    return render_template("index.html")


def port_calc():
    return 42


@jwt_required()
def protected():
    # We can now access our sqlalchemy User object via `current_user`.
    return jsonify(
        id=current_user.id,
        email=current_user.email,
        username=current_user.username,
    )
