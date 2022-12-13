import pytest


@pytest.mark.usefixtures("app_ctx")
def test_get_users_list(client):
    response = client.get("/api/v1/users/")
    assert response.status_code == 200
    assert len(response.json) == 1


@pytest.mark.usefixtures("app_ctx")
def test_get_users_by_id(client):
    response = client.get("/api/v1/users/1")
    assert response.status_code == 200
    assert response.json["id"] == 1
