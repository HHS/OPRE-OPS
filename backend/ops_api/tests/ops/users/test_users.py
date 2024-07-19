import pytest
from flask_jwt_extended import create_access_token

from models import UserStatus
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


@pytest.mark.skip("Need to rework this endpoint.")
@pytest.mark.usefixtures("app_ctx")
def test_get_users_by_id_without_auth(client):
    response = client.get("/api/v1/users/4")
    assert response.status_code == 401


@pytest.mark.usefixtures("app_ctx")
def test_get_users_by_id_with_auth(auth_client, loaded_db, test_admin_user):
    response = auth_client.get(f"/api/v1/users/{test_admin_user.id}")
    assert response.status_code == 200
    assert response.json["id"] == test_admin_user.id
    assert response.json["status"] == UserStatus.ACTIVE.name


@pytest.mark.skip("Need to rework this endpoint.")
@pytest.mark.usefixtures("app_ctx")
def test_get_someone_else_user_with_auth(auth_client, loaded_db):
    user = loaded_db.get(User, "4")
    access_token = create_access_token(identity=user)

    response = auth_client.get("/api/v1/users/1", headers={"Authorization": f"Bearer {str(access_token)}"})
    assert response.status_code == 401


@pytest.mark.skip("Need to rework this endpoint.")
@pytest.mark.usefixtures("app_ctx")
def test_get_all_users_with_auth(auth_client, loaded_db):
    user = loaded_db.get(User, "4")
    access_token = create_access_token(identity=user)

    response = auth_client.get("/api/v1/users/", headers={"Authorization": f"Bearer {str(access_token)}"})
    assert response.status_code == 200
    assert len(response.json) == 12


@pytest.mark.usefixtures("app_ctx")
def test_get_all_users_without_auth(client):
    response = client.get("/api/v1/users/")
    assert response.status_code == 401


@pytest.mark.usefixtures("app_ctx")
def test_get_all_users_with_auth_fixture(auth_client):
    response = auth_client.get("/api/v1/users/")
    assert response.status_code == 200


def test_user_to_dict():
    user = User(
        id=1,
        oidc_id="abcd",
        email="example@example.com",
        first_name="blah",
        last_name="blah",
        division=1,
    )
    assert user.to_dict()["id"] == 1
    assert user.to_dict()["oidc_id"] == "abcd"


@pytest.mark.usefixtures("app_ctx")
def test_put_user_invalid_id(auth_client):
    # Send a PUT request with an invalid user ID
    response = auth_client.put("/api/v1/users/999", json={"first_name": "New First Name"})

    # Check that the response status code is 404 Not Found
    assert response.status_code == 400


@pytest.mark.usefixtures("app_ctx")
def test_put_user_unauthorized(client):
    # Send a PUT request without authorization
    response = client.put("/api/v1/users/4", json={"first_name": "New First Name"})

    # Check that the response status code is 401 Unauthorized
    assert response.status_code == 401


@pytest.mark.usefixtures("app_ctx")
def test_put_user(auth_client, new_user):
    # Send a PUT request to update the user
    response = auth_client.put(
        f"/api/v1/users/{new_user.id}",
        json={"first_name": "New First Name"},
    )

    # Check that the response status code is 200 OK
    assert response.status_code == 200

    # Check that the response data matches the updated user data
    assert response.json["first_name"] == "New First Name"

    # Check that the user was updated in the database
    updated_user = User.query.get(new_user.id)
    assert updated_user.first_name == "New First Name"


@pytest.mark.usefixtures("app_ctx")
def test_get_safe_user(auth_client, loaded_db, new_user):
    system_user = loaded_db.get(User, new_user.created_by)
    response = auth_client.get(f"/api/v1/users/{new_user.id}")
    assert response.status_code == 200
    user = response.json
    assert user["id"] == new_user.id
    assert len(user["created_by_user"]) == 2
    assert len(user["updated_by_user"]) == 2
    assert user["created_by_user"]["id"] == system_user.id
    assert user["created_by_user"]["full_name"] == system_user.full_name
    assert user["updated_by_user"]["id"] == system_user.id
    assert user["updated_by_user"]["full_name"] == system_user.full_name
