import pytest
from flask_jwt_extended import create_access_token
from models import UserStatus
from models.users import User


@pytest.mark.skip("Need to rework this endpoint.")
@pytest.mark.usefixtures("app_ctx")
def test_get_users_by_id_without_auth(client):
    response = client.get("/api/v1/users/4")
    assert response.status_code == 401


@pytest.mark.usefixtures("app_ctx")
def test_get_users_by_id_with_auth(auth_client, loaded_db):
    user = loaded_db.get(User, "4")
    access_token = create_access_token(identity=user)

    response = auth_client.get("/api/v1/users/4", headers={"Authorization": f"Bearer {str(access_token)}"})
    assert response.status_code == 200
    assert response.json["id"] == 4
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
def test_put_user(auth_client):
    # Send a PUT request to update the user
    response = auth_client.put(
        "/api/v1/users/4",
        json={"first_name": "New First Name"},
    )

    # Check that the response status code is 200 OK
    assert response.status_code == 200

    # Check that the response data matches the updated user data
    print(response.json)
    assert response.json["first_name"] == "New First Name"

    # Check that the user was updated in the database
    updated_user = User.query.get(4)
    assert updated_user.first_name == "New First Name"

    # Revert changes back to original values
    response = auth_client.put(
        "/api/users/4",
        json={"first_name": "Amelia"},
    )
