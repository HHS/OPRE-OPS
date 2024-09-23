from flask import current_app
from flask.testing import FlaskClient
from flask_jwt_extended import create_access_token, create_refresh_token

from models.users import User
from ops_api.ops.auth.service import _get_or_create_user_session


class AuthClient(FlaskClient):
    def open(self, *args, **kwargs):
        user = User(
            id="503",
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
        refresh_token = create_refresh_token(identity=user)
        kwargs.setdefault("headers", {"Authorization": f"Bearer {access_token}"})

        user_session = _get_or_create_user_session(user, access_token=access_token, refresh_token=refresh_token)
        user_session.access_token = access_token
        user_session.refresh_token = refresh_token
        current_app.db_session.add(user_session)
        current_app.db_session.commit()

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
            id="506",
            oidc_id="00000000-0000-1111-a111-000000000007",
            email="unit-test-no-perms@ops-api.gov",
            first_name="Unit",
            last_name="Test",
            division=1,
        )
        access_token = create_access_token(identity=user, additional_claims={})
        refresh_token = create_refresh_token(identity=user)
        kwargs.setdefault("headers", {"Authorization": f"Bearer {access_token}"})

        user_session = _get_or_create_user_session(user, access_token=access_token, refresh_token=refresh_token)
        user_session.access_token = access_token
        user_session.refresh_token = refresh_token
        current_app.db_session.add(user_session)
        current_app.db_session.commit()

        return super().open(*args, **kwargs)


class BasicUserAuthClient(FlaskClient):
    """
    A standard user with User group permissions. Does not have admin permissions.
    """

    def open(self, *args, **kwargs):
        user = User(
            id="521",
            oidc_id="00000000-0000-1111-a111-000000000019",
            email="user.demo@email.com",
            first_name="User",
            last_name="Demo",
            division=3,
        )

        additional_claims = {}
        if user.roles:
            additional_claims["roles"] = [role.name for role in user.roles]

        access_token = create_access_token(identity=user, additional_claims=additional_claims)
        refresh_token = create_refresh_token(identity=user)
        kwargs.setdefault("headers", {"Authorization": f"Bearer {access_token}"})

        user_session = _get_or_create_user_session(user, access_token=access_token, refresh_token=refresh_token)
        user_session.access_token = access_token
        user_session.refresh_token = refresh_token
        current_app.db_session.add(user_session)
        current_app.db_session.commit()

        return super().open(*args, **kwargs)


class BudgetTeamAuthClient(FlaskClient):
    """
    A budget team user with relevant role permissions. Does not have admin permissions.
    """

    def open(self, *args, **kwargs):
        user = User(
            id="523",
            oidc_id="00000000-0000-1111-a111-000000000021",
            email="budget.team@email.com",
            first_name="Budget",
            last_name="Team",
            division=1,
        )

        additional_claims = {}
        if user.roles:
            additional_claims["roles"] = [role.name for role in user.roles]

        access_token = create_access_token(identity=user, additional_claims=additional_claims)
        refresh_token = create_refresh_token(identity=user)
        kwargs.setdefault("headers", {"Authorization": f"Bearer {access_token}"})

        user_session = _get_or_create_user_session(user, access_token=access_token, refresh_token=refresh_token)
        user_session.access_token = access_token
        user_session.refresh_token = refresh_token
        current_app.db_session.add(user_session)
        current_app.db_session.commit()

        return super().open(*args, **kwargs)
