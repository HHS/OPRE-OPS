from flask import url_for
from flask_jwt_extended import create_access_token

from models import UserStatus
from models.users import User


def test_post_user_no_auth(client, test_user, app_ctx):
    response = client.post(url_for("api.users-group"), json={"first_name": "New First Name"})
    assert response.status_code == 401


def test_post_user_unauthorized_different_user(client, loaded_db, test_non_admin_user, test_user, app_ctx):
    """
    Test that a regular user cannot create a new user.
    """
    access_token = create_access_token(identity=test_non_admin_user)
    response = client.post(
        url_for("api.users-group"),
        json={"email": "new_user@example.com", "first_name": "New First Name"},
        headers={"Authorization": f"Bearer {str(access_token)}"},
    )
    assert response.status_code == 403


def test_post_user_min_params(auth_client, loaded_db, test_admin_user, app_ctx):
    response = auth_client.post(
        url_for("api.users-group"),
        json={"email": "new_user@example.com"},
    )
    assert response.status_code == 202
    response_data = response.json

    # Check that the response data matches the request data for the fields that were updated
    assert response_data["email"] == "new_user@example.com"

    # Check that the attributes auto-set by the DB are correct
    assert response_data["created_by"] == test_admin_user.id
    assert response_data["updated_by"] == test_admin_user.id
    assert response_data["created_on"] is not None
    assert response_data["updated_on"] is not None

    # Test that the user was created in the database
    new_user = loaded_db.get(User, response_data["id"])
    assert new_user.email == "new_user@example.com"

    # Clean up
    loaded_db.delete(new_user)
    loaded_db.commit()


def test_post_user_max_params(auth_client, loaded_db, test_admin_user, app_ctx):
    response = auth_client.post(
        url_for("api.users-group"),
        json={
            "email": "new_user@example.com",
            "first_name": "New First Name",
            "last_name": "New Last Name",
            "division": 1,
            "status": UserStatus.ACTIVE.name,
            "roles": ["SYSTEM_OWNER"],
        },
    )
    assert response.status_code == 202
    response_data = response.json

    # Check that the response data matches the request data for the fields that were created
    assert response_data["email"] == "new_user@example.com"
    assert response_data["first_name"] == "New First Name"
    assert response_data["last_name"] == "New Last Name"
    assert response_data["division"] == 1
    assert response_data["status"] == UserStatus.ACTIVE.name
    assert response_data["roles"] == [
        {"id": 1, "is_superuser": False, "name": "SYSTEM_OWNER"},
    ]

    # Check that the attributes auto-set by the DB are correct
    assert response_data["created_by"] == test_admin_user.id
    assert response_data["updated_by"] == test_admin_user.id
    assert response_data["created_on"] is not None
    assert response_data["updated_on"] is not None

    # Test that the user was updated in the database
    new_user = loaded_db.get(User, response_data["id"])
    assert new_user.email == "new_user@example.com"
    assert new_user.first_name == "New First Name"
    assert new_user.last_name == "New Last Name"
    assert new_user.division == 1
    assert new_user.status == UserStatus.ACTIVE
    assert new_user.roles[0].id == 1
    assert new_user.created_by == test_admin_user.id
    assert new_user.updated_by == test_admin_user.id

    # Clean up
    loaded_db.delete(new_user)
    loaded_db.commit()
