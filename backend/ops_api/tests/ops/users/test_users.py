import pytest
from flask_jwt_extended import create_access_token
from models.users import User


@pytest.mark.usefixtures("app_ctx")
def test_get_users_by_id_without_auth(client):
    response = client.get("/api/v1/users/4")
    assert response.status_code == 401


# @pytest.mark.skip("Need to fixture up an auth token first")
@pytest.mark.usefixtures("app_ctx")
def test_get_users_by_id_with_auth(auth_client, loaded_db):
    user = loaded_db.get(User, "4")
    access_token = create_access_token(identity=user)

    response = auth_client.get("/api/v1/users/4", headers={"Authorization": f"Bearer {str(access_token)}"})
    assert response.status_code == 200
    assert response.json["id"] == 4


@pytest.mark.usefixtures("app_ctx")
def test_get_someone_else_user_with_auth(auth_client, loaded_db):
    user = loaded_db.get(User, "4")
    access_token = create_access_token(identity=user)

    response = auth_client.get("/api/v1/users/1", headers={"Authorization": f"Bearer {str(access_token)}"})
    assert response.status_code == 401


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
