from ops.utils import db


class User(db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    oidc_id = db.Column(db.String(128), unique=True, index=True)
    email = db.Column(db.String, index=True, nullable=False)
    first_name = db.Column(db.String)
    date_joined = db.Column(db.DateTime, server_default=db.func.now())
    updated = db.Column(db.DateTime, onupdate=db.func.now())
    role = db.Column(db.String(255), index=True)
    division = db.Column(db.Integer, db.ForeignKey("division.id"))
