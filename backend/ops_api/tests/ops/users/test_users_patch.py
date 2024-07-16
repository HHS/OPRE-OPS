import pytest
from flask import url_for
from flask_jwt_extended import create_access_token

from models.users import User


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


@pytest.mark.usefixtures("app_ctx")
def test_put_user_invalid_id(auth_client):
    response = auth_client.put(url_for("api.users-item", id=9999), json={"first_name": "New First Name"})
    assert response.status_code == 404


@pytest.mark.usefixtures("app_ctx")
def test_put_user_unauthorized_no_credentials(client, test_user):
    response = client.put(url_for("api.users-item", id=test_user.id), json={"first_name": "New First Name"})
    assert response.status_code == 401


@pytest.mark.usefixtures("app_ctx")
def test_put_user_unauthorized_different_user(client, loaded_db, test_non_admin_user, test_user):
    """
    Test that a regular user cannot update another user's details.
    """
    access_token = create_access_token(identity=test_non_admin_user)
    response = client.put(
        url_for("api.users-item", id=test_user.id),
        json={"id": test_user.id, "email": "new_user@example.com", "first_name": "New First Name"},
        headers={"Authorization": f"Bearer {str(access_token)}"},
    )
    assert response.status_code == 403


@pytest.mark.usefixtures("app_ctx")
def test_put_user_with_admin(auth_client, new_user, loaded_db, test_admin_user):
    response = auth_client.put(
        url_for("api.users-item", id=new_user.id),
        json={"id": new_user.id, "email": "new_user@example.com", "first_name": "New First Name"},
    )
    assert response.status_code == 200
    response_data = response.json
    assert response_data["first_name"] == "New First Name"
    assert response_data["email"] == "new_user@example.com"
    assert response_data["id"] == new_user.id
    assert response_data["created_by"] == new_user.created_by
    assert response_data["updated_by"] == new_user.updated_by
    assert response_data["created_on"] == new_user.created_on.isoformat()
    assert response_data["updated_on"] == new_user.updated_on.isoformat()
    assert response_data["status"] == new_user.status.name
    assert response_data["division"] == new_user.division

    updated_user = loaded_db.get(User, new_user.id)
    assert updated_user.first_name == "New First Name"
