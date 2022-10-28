from hmac import compare_digest

from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class User(db.MappedAsDataclass, db.Model):
    __tablename__ = "users"
    id: db.Mapped[int] = db.mapped_column(primary_key=True, init=False)
    username: db.Mapped[str] = db.mapped_column(unique=True)
    email: db.Mapped[str]
    first_name: db.Mapped[str]

    # NOTE: In a real application make sure to properly hash and salt passwords
    def check_password(self, password):
        return compare_digest(password, "password")


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
