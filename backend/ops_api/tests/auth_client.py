from flask import current_app
from flask.testing import FlaskClient
from flask_jwt_extended import create_access_token, create_refresh_token

from models.users import User
from ops_api.ops.auth.service import _get_or_create_user_session


def _get_user_for_auth(user_id: int, **defaults) -> tuple[User, dict]:
    """Load user from session when possible to avoid detached instance / recursion issues."""
    session = getattr(current_app, "db_session", None)
    if session is not None:
        user = session.get(User, user_id)
        if user is not None:
            claims = {"roles": [r.name for r in user.roles]} if user.roles else {}
            return user, claims
    user = User(id=user_id, **defaults)
    return user, {}


class AuthClient(FlaskClient):
    def open(self, *args, **kwargs):
        user, additional_claims = _get_user_for_auth(
            503,
            oidc_id="00000000-0000-1111-a111-000000000004",
            email="unit-test@ops-api.gov",
            first_name="Unit",
            last_name="Test",
            division=1,
        )
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
        user, _ = _get_user_for_auth(
            506,
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
    A standard user with User group permissions. Does not have SYSTEM_OWNER permissions.
    """

    def open(self, *args, **kwargs):
        user, additional_claims = _get_user_for_auth(
            521,
            oidc_id="00000000-0000-1111-a111-000000000019",
            email="user.demo@email.com",
            first_name="User",
            last_name="Demo",
            division=3,
        )
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
    A budget team user with relevant role permissions. Does not have SYSTEM_OWNER permissions.
    """

    def open(self, *args, **kwargs):
        user, additional_claims = _get_user_for_auth(
            523,
            oidc_id="00000000-0000-1111-a111-000000000021",
            email="budget.team@email.com",
            first_name="Budget",
            last_name="Team",
            division=1,
        )
        access_token = create_access_token(identity=user, additional_claims=additional_claims)
        refresh_token = create_refresh_token(identity=user)
        kwargs.setdefault("headers", {"Authorization": f"Bearer {access_token}"})

        user_session = _get_or_create_user_session(user, access_token=access_token, refresh_token=refresh_token)
        user_session.access_token = access_token
        user_session.refresh_token = refresh_token
        current_app.db_session.add(user_session)
        current_app.db_session.commit()

        return super().open(*args, **kwargs)


class DivisionDirectorAuthClient(FlaskClient):
    """
    A Division Director
    """

    def open(self, *args, **kwargs):
        user, additional_claims = _get_user_for_auth(
            522,
            oidc_id="00000000-0000-1111-a111-000000000020",
            email="dave.director@email.com",
            first_name="Dave",
            last_name="Director",
            division=1,
        )
        access_token = create_access_token(identity=user, additional_claims=additional_claims)
        refresh_token = create_refresh_token(identity=user)
        kwargs.setdefault("headers", {"Authorization": f"Bearer {access_token}"})

        user_session = _get_or_create_user_session(user, access_token=access_token, refresh_token=refresh_token)
        user_session.access_token = access_token
        user_session.refresh_token = refresh_token
        current_app.db_session.add(user_session)
        current_app.db_session.commit()

        return super().open(*args, **kwargs)


class Division6DirectorAuthClient(FlaskClient):
    """
    Auth Client for Director of Division 6
    """

    def open(self, *args, **kwargs):
        user, additional_claims = _get_user_for_auth(
            525,
            oidc_id="00000000-0000-1111-a111-000000000022",
            email="director.derrek@email.com",
            first_name="Director",
            last_name="Derrek",
            division=6,
        )
        access_token = create_access_token(identity=user, additional_claims=additional_claims)
        refresh_token = create_refresh_token(identity=user)
        kwargs.setdefault("headers", {"Authorization": f"Bearer {access_token}"})

        user_session = _get_or_create_user_session(user, access_token=access_token, refresh_token=refresh_token)
        user_session.access_token = access_token
        user_session.refresh_token = refresh_token
        current_app.db_session.add(user_session)
        current_app.db_session.commit()

        return super().open(*args, **kwargs)


class SystemOwnerAuthClient(FlaskClient):
    def open(self, *args, **kwargs):
        user, additional_claims = _get_user_for_auth(
            520,
            oidc_id="00000000-0000-1111-a111-000000000018",
            email="system.owner@email.com",
            first_name="System",
            last_name="Owner",
            division=6,
        )
        access_token = create_access_token(identity=user, additional_claims=additional_claims)
        refresh_token = create_refresh_token(identity=user)
        kwargs.setdefault("headers", {"Authorization": f"Bearer {access_token}"})

        user_session = _get_or_create_user_session(user, access_token=access_token, refresh_token=refresh_token)
        user_session.access_token = access_token
        user_session.refresh_token = refresh_token
        current_app.db_session.add(user_session)
        current_app.db_session.commit()

        return super().open(*args, **kwargs)


class PowerUserAuthClient(FlaskClient):
    def open(self, *args, **kwargs):
        user, additional_claims = _get_user_for_auth(
            528,
            oidc_id="00000000-0000-1111-a111-000000000028",
            email="power.user@email.com",
            first_name="Power",
            last_name="Owner",
            division=1,
        )
        access_token = create_access_token(identity=user, additional_claims=additional_claims)
        refresh_token = create_refresh_token(identity=user)
        kwargs.setdefault("headers", {"Authorization": f"Bearer {access_token}"})

        user_session = _get_or_create_user_session(user, access_token=access_token, refresh_token=refresh_token)
        user_session.access_token = access_token
        user_session.refresh_token = refresh_token
        current_app.db_session.add(user_session)
        current_app.db_session.commit()

        return super().open(*args, **kwargs)
