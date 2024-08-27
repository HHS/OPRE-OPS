import pytest
from flask import url_for


@pytest.mark.usefixtures("app_ctx")
def test_get_roles(auth_client):
    response = auth_client.get(url_for("auth.roles_get"))
    assert response.status_code == 200

    assert {"id": 1, "name": "admin"} in response.json
    assert {"id": 2, "name": "user"} in response.json
    assert {"id": 3, "name": "unassigned"} in response.json
    assert {"id": 4, "name": "division-director"} in response.json
    assert {"id": 5, "name": "USER_ADMIN"} in response.json
    assert {"id": 6, "name": "BUDGET_TEAM"} in response.json
    assert {"id": 7, "name": "read-only"} in response.json


@pytest.mark.usefixtures("app_ctx")
def test_get_roles_with_filter_by_id(auth_client):
    response = auth_client.get(url_for("auth.roles_get", id=3))
    assert response.status_code == 200
    assert len(response.json) == 1
    assert {"id": 3, "name": "unassigned"} in response.json


@pytest.mark.usefixtures("app_ctx")
def test_get_roles_with_filter_by_name(auth_client):
    response = auth_client.get(url_for("auth.roles_get", name="unassigned"))
    assert response.status_code == 200
    assert len(response.json) == 1
    assert {"id": 3, "name": "unassigned"} in response.json


@pytest.mark.usefixtures("app_ctx")
def test_get_roles_with_filter_by_id_and_name(auth_client):
    response = auth_client.get(url_for("auth.roles_get", id=3, name="unassigned"))
    assert response.status_code == 200
    assert len(response.json) == 1
    assert {"id": 3, "name": "unassigned"} in response.json


@pytest.mark.usefixtures("app_ctx")
def test_get_roles_with_filter_none_found(auth_client):
    response = auth_client.get(url_for("auth.roles_get", id=3, name="user"))
    assert response.status_code == 200
    assert len(response.json) == 0
