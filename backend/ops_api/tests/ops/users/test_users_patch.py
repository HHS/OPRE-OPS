# flake8: noqa: S105, S106
from datetime import datetime

import pytest
from flask import url_for
from flask_jwt_extended import create_access_token

from models import Role, UserSession, UserStatus
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
    yield user

    loaded_db.delete(user)
    loaded_db.commit()


def test_patch_user_no_user_found(auth_client, app_ctx):
    response = auth_client.patch(url_for("api.users-item", id=9999), json={"first_name": "New First Name"})
    assert response.status_code == 404


def test_patch_user_no_auth(client, test_user, app_ctx):
    response = client.patch(
        url_for("api.users-item", id=test_user.id),
        json={"first_name": "New First Name"},
    )
    assert response.status_code == 401


def test_patch_user_unauthorized_different_user(client, loaded_db, test_non_admin_user, test_user, app_ctx):
    """
    Test that a regular user cannot update another user's details.
    """
    access_token = create_access_token(identity=test_non_admin_user)
    response = client.patch(
        url_for("api.users-item", id=test_user.id),
        json={
            "id": test_user.id,
            "email": "new_user@example.com",
            "first_name": "New First Name",
        },
        headers={"Authorization": f"Bearer {str(access_token)}"},
    )
    assert response.status_code == 400


def test_patch_user(auth_client, new_user, loaded_db, test_admin_user, app_ctx):
    # add a couple roles to the user
    new_user.roles.append(loaded_db.get(Role, 1))
    new_user.roles.append(loaded_db.get(Role, 2))
    loaded_db.commit()

    original_user = new_user.to_dict()

    response = auth_client.patch(
        url_for("api.users-item", id=new_user.id),
        json={
            "id": new_user.id,
            "email": "new_user@example.com",
            "first_name": "New First Name",
        },
    )
    assert response.status_code == 200
    response_data = response.json
    assert response_data["first_name"] == "New First Name"
    assert response_data["last_name"] == original_user.get("last_name")
    assert response_data["email"] == "new_user@example.com"
    assert response_data["id"] == new_user.id
    assert response_data["created_by"] == original_user.get("created_by")
    assert response_data["updated_by"] == new_user.updated_by
    assert response_data["created_on"] == original_user.get("created_on")
    assert response_data["updated_on"] == f"{new_user.updated_on.isoformat()}Z"
    assert response_data["status"] == original_user.get("status")
    assert response_data["division"] == original_user.get("division")
    assert response_data["roles"] == [
        {"id": 1, "is_superuser": False, "name": "SYSTEM_OWNER"},
        {"id": 2, "is_superuser": False, "name": "VIEWER_EDITOR"},
    ]

    updated_user = loaded_db.get(User, new_user.id)
    assert updated_user.first_name == "New First Name"
    assert updated_user.last_name == original_user.get("last_name")
    assert updated_user.email == "new_user@example.com"
    assert updated_user.id == new_user.id
    assert updated_user.created_by == original_user.get("created_by")
    assert updated_user.updated_by == new_user.updated_by
    assert f"{updated_user.created_on.isoformat()}Z" == original_user.get("created_on")
    assert updated_user.updated_on == new_user.updated_on
    assert updated_user.status.name == original_user.get("status")
    assert updated_user.division == original_user.get("division")
    assert updated_user.roles == new_user.roles


def test_patch_user_must_be_user_admin_to_change_status(client, test_user, test_non_admin_user):
    """
    Test that a regular user cannot change their User details (including status).
    """
    access_token = create_access_token(identity=test_non_admin_user)
    response = client.patch(
        url_for("api.users-item", id=test_non_admin_user.id),
        json={"id": test_non_admin_user.id, "status": UserStatus.ACTIVE.name},
        headers={"Authorization": f"Bearer {str(access_token)}"},
    )
    assert response.status_code == 400


def test_patch_user_changing_status_deactivates_user_session(auth_client, new_user, loaded_db):
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

    response = auth_client.patch(
        url_for("api.users-item", id=new_user.id),
        json={
            "id": new_user.id,
            "status": UserStatus.INACTIVE.name,
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


def test_patch_user_cannot_deactivate_yourself(auth_client, new_user, loaded_db, test_admin_user, app_ctx):
    response = auth_client.patch(
        url_for("api.users-item", id=test_admin_user.id),
        json={
            "id": test_admin_user.id,
            "status": UserStatus.INACTIVE.name,
        },
    )
    assert response.status_code == 400
