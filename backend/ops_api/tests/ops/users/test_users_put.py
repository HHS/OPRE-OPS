# flake8: noqa: S105, S106
from datetime import datetime

import pytest
from flask import url_for
from flask_jwt_extended import create_access_token

from models import UserSession, UserStatus
from models.users import User
from ops_api.ops.auth.utils import get_all_active_user_sessions


@pytest.fixture
def new_user(app, loaded_db):
    # Needed to set the new user's created_by and updated_by fields
    app.config["SKIP_SETTING_CREATED_BY"] = True

    system_user = User(
        email="system@example.com",
        first_name="automated",
        last_name="system",
        division=1,
    )

    loaded_db.add(system_user)
    loaded_db.commit()

    user = User(
        email="blah@example.com",
        first_name="blah",
        last_name="blah",
        division=1,
        created_by=system_user.id,
        updated_by=system_user.id,
    )
    loaded_db.add(user)
    loaded_db.commit()

    app.config["SKIP_SETTING_CREATED_BY"] = False
    yield user

    loaded_db.delete(user)
    loaded_db.commit()


def test_put_user_no_user_found(auth_client, app_ctx):
    response = auth_client.put(url_for("api.users-item", id=9999), json={"first_name": "New First Name"})
    assert response.status_code == 404


def test_put_user_no_auth(client, test_user, app_ctx):
    response = client.put(
        url_for("api.users-item", id=test_user.id),
        json={"first_name": "New First Name"},
    )
    assert response.status_code == 401


def test_put_user_unauthorized_different_user(client, loaded_db, test_non_admin_user, test_user, app_ctx):
    """
    Test that a regular user cannot update another user's details.
    """
    access_token = create_access_token(identity=test_non_admin_user)
    response = client.put(
        url_for("api.users-item", id=test_user.id),
        json={
            "id": test_user.id,
            "email": "new_user@example.com",
            "first_name": "New First Name",
        },
        headers={"Authorization": f"Bearer {str(access_token)}"},
    )
    assert response.status_code == 400


def test_put_user_min_params(auth_client, new_user, loaded_db, test_admin_user, app_ctx):
    original_user = new_user.to_dict()

    response = auth_client.put(
        url_for("api.users-item", id=new_user.id),
        json={"email": "new_user@example.com"},
    )
    assert response.status_code == 200
    response_data = response.json

    # Check that the response data matches the request data for the fields that were updated
    assert response_data["id"] == new_user.id
    assert response_data["email"] == "new_user@example.com", "should be updated"

    # Check that the attributes auto-set by the DB are correct
    assert response_data["created_by"] == new_user.created_by
    assert response_data["updated_by"] == new_user.updated_by
    assert response_data["created_on"] == f"{new_user.created_on.isoformat()}Z"
    assert response_data["updated_on"] == f"{new_user.updated_on.isoformat()}Z"

    # Check that the attributes not present in the request data are set to None
    assert response_data["first_name"] is None, "schema default"
    assert response_data["last_name"] is None, "schema default"
    assert response_data["status"] == UserStatus.INACTIVE.name, "schema default"
    assert response_data["division"] is None, "schema default"
    assert response_data["roles"] == [], "schema default"

    # Test that the user was updated in the database
    updated_user = loaded_db.get(User, new_user.id)
    assert updated_user.first_name is None, "schema default"
    assert updated_user.last_name is None, "schema default"
    assert updated_user.email == "new_user@example.com", "should be updated"
    assert updated_user.status == UserStatus.INACTIVE, "schema default"
    assert updated_user.division is None, "schema default"
    assert updated_user.roles == [], "schema default"
    assert updated_user.created_by == original_user.get("created_by"), "should be the same as the original user"
    assert updated_user.updated_by == test_admin_user.id, "should be updated by the admin user"
    assert f"{updated_user.created_on.isoformat()}Z" == original_user.get(
        "created_on"
    ), "should be the same as the original user"
    assert updated_user.updated_on != original_user.get("updated_on"), "should be updated"


def test_put_user_max_params(auth_client, new_user, loaded_db, test_admin_user, app_ctx):
    original_user = new_user.to_dict()

    response = auth_client.put(
        url_for("api.users-item", id=new_user.id),
        json={
            "id": new_user.id,
            "email": "new_user@example.com",
            "first_name": "New First Name",
            "last_name": "New Last Name",
            "division": 1,
            "status": UserStatus.ACTIVE.name,
            "roles": ["SYSTEM_OWNER"],
        },
    )
    assert response.status_code == 200
    response_data = response.json

    # Check that the response data matches the request data for the fields that were updated
    assert response_data["id"] == new_user.id
    assert response_data["email"] == "new_user@example.com", "should be updated"
    assert response_data["first_name"] == "New First Name", "should be updated"
    assert response_data["last_name"] == "New Last Name", "should be updated"
    assert response_data["division"] == 1, "should be updated"
    assert response_data["status"] == UserStatus.ACTIVE.name, "should be updated"
    assert response_data["roles"] == [{"id": 1, "is_superuser": False, "name": "SYSTEM_OWNER"}], "should be updated"

    # Check that the attributes auto-set by the DB are correct
    assert response_data["created_by"] == new_user.created_by
    assert response_data["updated_by"] == new_user.updated_by
    assert response_data["created_on"] == f"{new_user.created_on.isoformat()}Z"
    assert response_data["updated_on"] == f"{new_user.updated_on.isoformat()}Z"

    # Test that the user was updated in the database
    updated_user = loaded_db.get(User, new_user.id)
    assert updated_user.email == "new_user@example.com", "should be updated"
    assert updated_user.first_name == "New First Name", "should be updated"
    assert updated_user.last_name == "New Last Name", "should be updated"
    assert updated_user.division == 1, "should be updated"
    assert updated_user.status == UserStatus.ACTIVE, "should be updated"
    assert updated_user.roles[0].id == 1, "should be updated"
    assert updated_user.created_by == original_user.get("created_by"), "should be the same as the original user"
    assert updated_user.updated_by == test_admin_user.id, "should be updated by the admin user"
    assert f"{updated_user.created_on.isoformat()}Z" == original_user.get(
        "created_on"
    ), "should be the same as the original user"
    assert updated_user.updated_on != original_user.get("updated_on"), "should be updated"


def test_put_user_wrong_user(auth_client, new_user, loaded_db, test_admin_user, app_ctx):
    response = auth_client.put(
        url_for("api.users-item", id=new_user.id),
        json={"id": 0, "email": "new_user@example.com"},
    )
    assert response.status_code == 400


def test_put_user_must_be_user_admin_to_change_status(client, test_user, test_non_admin_user):
    """
    Test that a regular user cannot change their User details (including status).
    """
    access_token = create_access_token(identity=test_non_admin_user)
    response = client.put(
        url_for("api.users-item", id=test_non_admin_user.id),
        json={"id": test_non_admin_user.id, "status": UserStatus.ACTIVE.name},
        headers={"Authorization": f"Bearer {str(access_token)}"},
    )
    assert response.status_code == 400


def test_put_user_changing_status_deactivates_user_session(auth_client, new_user, loaded_db):
    """
    If the status of a user is changed to INACTIVE or LOCKED, all of their sessions should be invalidated.
    """
    # setup a user session
    user_session = UserSession(
        user_id=new_user.id,
        is_active=True,
        ip_address="fake ip",
        access_token="fake token",
        refresh_token="fake token",
        last_active_at=datetime.now(),
    )
    loaded_db.add(user_session)
    loaded_db.commit()

    response = auth_client.put(
        url_for("api.users-item", id=new_user.id),
        json={
            "id": new_user.id,
            "email": "new_user@example.com",
            "first_name": "New First Name",
            "last_name": "New Last Name",
            "division": 1,
            "status": UserStatus.INACTIVE.name,
            "roles": ["SYSTEM_OWNER"],
        },
    )
    assert response.status_code == 200

    user_sessions = get_all_active_user_sessions(new_user.id, loaded_db)
    for session in user_sessions:
        assert not session.is_active, "all sessions should be inactive"
        assert session.last_active_at is not None, "last_active_at should be set"

    # cleanup
    loaded_db.delete(user_session)
    loaded_db.commit()


def test_put_user__cannot_deactivate_yourself(auth_client, new_user, loaded_db, test_admin_user, app_ctx):
    response = auth_client.put(
        url_for("api.users-item", id=test_admin_user.id),
        json={"email": "new_user@example.com", "status": UserStatus.INACTIVE.name},
    )
    assert response.status_code == 400
