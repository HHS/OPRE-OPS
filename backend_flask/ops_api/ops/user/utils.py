from hmac import compare_digest

from flask_sqlalchemy import SQLAlchemy
from ops.user.models import User

db = SQLAlchemy()


def process_user(userinfo):
    user = User.query.filter_by(email=userinfo["email"]).one_or_none()
    print(f"User: {user}")
    if not user:
        # Create new user
        user = User(
            email=userinfo["email"],
            username=userinfo["sub"],
            first_name=userinfo["given_name"],
        )

        db.session.add(user)
        db.session.commit()
        print(f"User: {user}")
    return user
