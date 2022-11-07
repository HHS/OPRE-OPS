from flask import Response, jsonify
from ops.user.models import User
from ops.user.utils import user_dumper


def get_all_users() -> Response:
    users = User.query.order_by(User.updated.desc()).all()
    return jsonify([user_dumper(user) for user in users])
