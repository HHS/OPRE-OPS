from datetime import datetime

from flask.testing import FlaskClient
from flask_jwt_extended import create_access_token
from models.users import User


class AuthClient(FlaskClient):
    def open(self, *args, **kwargs):
        user = User(
            id="4",
            oidc_id="00000000-0000-1111-a111-000000000004",
            email="unit-test@ops-api.gov",
            first_name="Unit",
            last_name="Test",
            date_joined=datetime.now(),
            updated=datetime.now(),
            division=1,
        )
        access_token = create_access_token(identity=user)
        kwargs.setdefault("headers", {"Authorization": f"Bearer {access_token}"})
        return super().open(*args, **kwargs)
