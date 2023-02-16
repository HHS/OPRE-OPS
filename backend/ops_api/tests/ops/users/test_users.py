import pytest
from flask_jwt_extended import create_access_token
from models.users import User


@pytest.mark.usefixtures("app_ctx")
def test_get_users_by_id_without_auth(client):
    response = client.get("/api/v1/users/00000000-0000-1111-a111-000000000004")
    assert response.status_code == 401
    # assert response.json["id"] == "00000000-0000-1111-a111-000000000004"


# @pytest.mark.skip("Need to fixture up an auth token first")
@pytest.mark.usefixtures("app_ctx")
def test_get_users_by_id_with_auth(auth_client, loaded_db):
    user = loaded_db.session.get(User, "00000000-0000-1111-a111-000000000004")
    access_token = create_access_token(identity=user)

    response = auth_client.get(
        "/api/v1/users/00000000-0000-1111-a111-000000000004", headers={"Authorization": f"Bearer {str(access_token)}"}
    )
    assert response.status_code == 200
    assert response.json["id"] == "00000000-0000-1111-a111-000000000004"


@pytest.mark.usefixtures("app_ctx")
def test_get_someone_else_user_with_auth(auth_client, loaded_db):
    user = loaded_db.session.get(User, "00000000-0000-1111-a111-000000000004")
    access_token = create_access_token(identity=user)

    response = auth_client.get(
        "/api/v1/users/00000000-0000-1111-a111-000000000001", headers={"Authorization": f"Bearer {str(access_token)}"}
    )
    assert response.status_code == 401


@pytest.mark.usefixtures("app_ctx")
def test_get_all_users_with_auth(auth_client, loaded_db):
    user = loaded_db.session.get(User, "00000000-0000-1111-a111-000000000004")
    access_token = create_access_token(identity=user)

    response = auth_client.get("/api/v1/users/", headers={"Authorization": f"Bearer {str(access_token)}"})
    assert response.status_code == 200
    assert len(response.json) == 5


@pytest.mark.usefixtures("app_ctx")
def test_get_all_users_without_auth(client):
    response = client.get("/api/v1/users/")
    assert response.status_code == 401


@pytest.mark.usefixtures("app_ctx")
def test_get_all_users_with_auth_fixture(auth_client):
    response = auth_client.get("/api/v1/users/")
    assert response.status_code == 200
