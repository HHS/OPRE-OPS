from flask import Response, jsonify
from ops.user.models import User
from ops.user.utls import user_dumper
from ops.utils import db


def get_all_users() -> Response:
    users = db.session.execute(db.select(User).order_by(User.updated.desc())).all()
    return jsonify([user_dumper(user) for user in users])
