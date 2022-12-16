from flask import jsonify
from flask import Response
from ops.user.models import User


def get_all_users() -> Response:
    users = User.query.order_by(User.updated.desc()).all()
    return jsonify([user.to_dict() for user in users])
