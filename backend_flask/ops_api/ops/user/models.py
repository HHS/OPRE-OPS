from datetime import datetime
from hmac import compare_digest

from ops.utils import db


class User(db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    oidc_id = db.Column(db.String(128), unique=True, index=True)
    username = db.Column(db.String(128), nullable=False, unique=True, index=True)
    email = db.Column(db.String, index=True, nullable=False)
    first_name = db.Column(db.String)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    is_staff = db.Column(db.Boolean, default=False, nullable=False)
    is_superuser = db.Column(db.Boolean, default=False, nullable=False)
    date_joined = db.Column(db.DateTime, default=datetime.utcnow(), nullable=False)
    updated = db.Column(db.DateTime, default=datetime.utcnow(), nullable=False)
    role = db.Column(db.String(255), index=True, nullable=False)

    # NOTE: In a real application make sure to properly hash and salt passwords
    def check_password(self, password):
        return compare_digest(password, "password")
