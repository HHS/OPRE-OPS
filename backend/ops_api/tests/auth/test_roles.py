from flask import url_for


def test_get_roles(auth_client, app_ctx):
    response = auth_client.get(url_for("auth.roles_get"))
    assert response.status_code == 200

    assert {"id": 1, "name": "SYSTEM_OWNER", "is_superuser": False} in response.json
    assert {"id": 2, "name": "VIEWER_EDITOR", "is_superuser": False} in response.json
    assert {
        "id": 3,
        "name": "REVIEWER_APPROVER",
        "is_superuser": False,
    } in response.json
    assert {"id": 4, "name": "USER_ADMIN", "is_superuser": False} in response.json
    assert {"id": 5, "name": "BUDGET_TEAM", "is_superuser": False} in response.json
    assert {"id": 6, "name": "PROCUREMENT_TEAM", "is_superuser": False} in response.json
    assert {"id": 7, "name": "SUPER_USER", "is_superuser": True} in response.json


def test_get_roles_with_filter_by_id(auth_client, app_ctx):
    response = auth_client.get(url_for("auth.roles_get", id=1))
    assert response.status_code == 200
    assert len(response.json) == 1
    assert {"id": 1, "name": "SYSTEM_OWNER", "is_superuser": False} in response.json


def test_get_roles_with_filter_by_name(auth_client, app_ctx):
    response = auth_client.get(url_for("auth.roles_get", name="SYSTEM_OWNER"))
    assert response.status_code == 200
    assert len(response.json) == 1
    assert {"id": 1, "name": "SYSTEM_OWNER", "is_superuser": False} in response.json


def test_get_roles_with_filter_by_id_and_name(auth_client, app_ctx):
    response = auth_client.get(url_for("auth.roles_get", id=1, name="SYSTEM_OWNER"))
    assert response.status_code == 200
    assert len(response.json) == 1
    assert {"id": 1, "name": "SYSTEM_OWNER", "is_superuser": False} in response.json


def test_get_roles_with_filter_none_found(auth_client, app_ctx):
    response = auth_client.get(url_for("auth.roles_get", id=3, name="user"))
    assert response.status_code == 200
    assert len(response.json) == 0
