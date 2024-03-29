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
            division=1,
        )
        additional_claims = {}
        if user.roles:
            additional_claims["roles"] = [role.name for role in user.roles]

        access_token = create_access_token(identity=user, additional_claims=additional_claims)
        kwargs.setdefault("headers", {"Authorization": f"Bearer {access_token}"})
        return super().open(*args, **kwargs)


class NoPermsAuthClient(FlaskClient):
    """
    A test client that creates an access token for a user with no roles or groups.

    N.B. Instead of re-using a user from our test data it would be better to create
    a new user for this purpose. This would make it clear that the user has no
    permissions and would prevent the tests from breaking if the user's permissions
    were changed.
    """

    def open(self, *args, **kwargs):
        user = User(
            id="7",
            oidc_id="00000000-0000-1111-a111-000000000007",
            email="unit-test-no-perms@ops-api.gov",
            first_name="Unit",
            last_name="Test",
            division=1,
        )
        access_token = create_access_token(identity=user, additional_claims={})
        kwargs.setdefault("headers", {"Authorization": f"Bearer {access_token}"})
        return super().open(*args, **kwargs)
