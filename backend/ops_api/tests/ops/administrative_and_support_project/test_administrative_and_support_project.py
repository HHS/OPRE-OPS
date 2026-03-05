import uuid

from flask import url_for

from models import AdministrativeAndSupportProject, ProjectType


def test_administrative_and_support_projects_get_all(auth_client, loaded_db):
    count = loaded_db.query(AdministrativeAndSupportProject).count()

    response = auth_client.get(url_for("api.projects-group"))
    assert response.status_code == 200
    # Note: projects-group returns all projects (research + admin/support), so we need to filter
    admin_support_projects = [
        p for p in response.json if p.get("project_type") == ProjectType.ADMINISTRATIVE_AND_SUPPORT.name
    ]
    assert len(admin_support_projects) == count


def test_administrative_and_support_projects_get_by_id(auth_client, loaded_db):
    response = auth_client.get(url_for("api.projects-item", id="1013"))
    assert response.status_code == 200
    assert response.json["title"] == "Support Project #1"


def test_administrative_and_support_projects_get_by_id_404(auth_client, loaded_db):
    response = auth_client.get(url_for("api.projects-item", id="9999"))
    assert response.status_code == 404


def test_administrative_and_support_projects_serialization(auth_client, loaded_db, test_user):
    response = auth_client.get(url_for("api.projects-item", id="1013"))
    assert response.status_code == 200
    assert response.json["id"] == 1013
    assert response.json["title"] == "Support Project #1"
    assert response.json["team_leaders"][0]["id"] == test_user.id
    assert response.json["team_leaders"][0]["full_name"] == test_user.full_name


def test_administrative_and_support_projects_with_fiscal_year_found(auth_client, loaded_db):
    response = auth_client.get(
        url_for("api.projects-group", fiscal_year=2023, project_type=ProjectType.ADMINISTRATIVE_AND_SUPPORT.name)
    )
    assert response.status_code == 200
    # Filter for administrative and support projects
    admin_support_projects = [
        p for p in response.json if p.get("project_type") == ProjectType.ADMINISTRATIVE_AND_SUPPORT.name
    ]
    assert len(admin_support_projects) == 1
    assert admin_support_projects[0]["title"] == "Support Project #1"
    assert admin_support_projects[0]["id"] == 1013


def test_administrative_and_support_projects_with_fiscal_year_not_found(auth_client, loaded_db):
    response = auth_client.get(
        url_for("api.projects-group", fiscal_year=2000, project_type=ProjectType.ADMINISTRATIVE_AND_SUPPORT.name)
    )
    assert response.status_code == 200
    # Filter for administrative and support projects
    admin_support_projects = [
        p for p in response.json if p.get("project_type") == ProjectType.ADMINISTRATIVE_AND_SUPPORT.name
    ]
    assert len(admin_support_projects) == 0


def test_administrative_and_support_projects_search(auth_client, loaded_db):
    response = auth_client.get(
        url_for("api.projects-group", search="", project_type=ProjectType.ADMINISTRATIVE_AND_SUPPORT.name)
    )

    assert response.status_code == 200
    assert len(response.json) == 0

    response = auth_client.get(
        url_for("api.projects-group", search="su", project_type=ProjectType.ADMINISTRATIVE_AND_SUPPORT.name)
    )

    assert response.status_code == 200
    # Filter for administrative and support projects
    admin_support_projects = [
        p for p in response.json if p.get("project_type") == ProjectType.ADMINISTRATIVE_AND_SUPPORT.name
    ]
    assert len(admin_support_projects) == 2

    response = auth_client.get(
        url_for("api.projects-group", search="#2", project_type=ProjectType.ADMINISTRATIVE_AND_SUPPORT.name)
    )

    assert response.status_code == 200
    # Filter for administrative and support projects
    admin_support_projects = [
        p for p in response.json if p.get("project_type") == ProjectType.ADMINISTRATIVE_AND_SUPPORT.name
    ]
    assert len(admin_support_projects) == 1

    response = auth_client.get(
        url_for("api.projects-group", search="blah", project_type=ProjectType.ADMINISTRATIVE_AND_SUPPORT.name)
    )

    assert response.status_code == 200
    assert len(response.json) == 0


def test_administrative_and_support_projects_get_by_id_auth(client, loaded_db):
    response = client.get(url_for("api.projects-item", id=14))
    assert response.status_code == 401


def test_administrative_and_support_projects_auth(client, loaded_db):
    response = client.get(url_for("api.projects-group"))
    assert response.status_code == 401


def test_post_administrative_and_support_projects(auth_client, loaded_db):
    data = {
        "project_type": ProjectType.ADMINISTRATIVE_AND_SUPPORT.name,
        "title": "Administrative Project #1",
        "short_title": "AP1" + uuid.uuid4().hex,
        "description": "blah blah blah",
        "url": "https://example.com",
        "team_leaders": [{"id": 500}, {"id": 501}, {"id": 502}],
    }
    response = auth_client.post(url_for("api.projects-group"), json=data)
    assert response.status_code == 201
    id = response.json["id"]
    # verify project was created in db with correct values
    project = loaded_db.get(AdministrativeAndSupportProject, id)
    assert project is not None
    assert project.title == "Administrative Project #1"
    assert len(project.team_leaders) == 3
    assert project.team_leaders[0].id == 500
    assert project.team_leaders[1].id == 501
    assert project.team_leaders[2].id == 502


def test_post_administrative_and_support_projects_minimum(auth_client, loaded_db):
    data = {
        "project_type": ProjectType.ADMINISTRATIVE_AND_SUPPORT.name,
        "title": "Administrative Project #1",
        "short_title": "AP1" + uuid.uuid4().hex,
    }
    response = auth_client.post(url_for("api.projects-group"), json=data)
    assert response.status_code == 201
    id = response.json["id"]
    # verify project was created in db with correct values
    project = loaded_db.get(AdministrativeAndSupportProject, id)
    assert project is not None
    assert project.title == "Administrative Project #1"
    assert project.team_leaders == []


def test_post_administrative_and_support_projects_empty_post(auth_client, loaded_db):
    response = auth_client.post(url_for("api.projects-group"), json={})
    assert response.status_code == 400


def test_post_administrative_and_support_projects_bad_team_leaders(auth_client, loaded_db):
    data = {
        "project_type": ProjectType.ADMINISTRATIVE_AND_SUPPORT.name,
        "title": "Administrative Project #1",
        "short_title": "AP1" + uuid.uuid4().hex,
        "description": "blah blah blah",
        "url": "https://example.com",
        "origination_date": "2023-01-01",
        "team_leaders": [{"id": 100000000}, {"id": 2}, {"id": 3}],
    }
    response = auth_client.post(url_for("api.projects-group"), json=data)
    assert response.status_code == 400


def test_post_administrative_and_support_projects_missing_title(auth_client, loaded_db):
    data = {
        "project_type": ProjectType.ADMINISTRATIVE_AND_SUPPORT.name,
        "short_title": "AP1" + uuid.uuid4().hex,
        "description": "blah blah blah",
        "url": "https://example.com",
        "origination_date": "2023-01-01",
        "team_leaders": [{"id": 100000}, {"id": 2}, {"id": 3}],
    }
    response = auth_client.post(url_for("api.projects-group"), json=data)
    assert response.status_code == 400


def test_post_administrative_and_support_projects_auth_required(client, loaded_db):
    data = {
        "project_type": ProjectType.ADMINISTRATIVE_AND_SUPPORT.name,
        "title": "Administrative Project #1",
        "short_title": "AP1" + uuid.uuid4().hex,
        "description": "blah blah blah",
        "url": "https://example.com",
        "origination_date": "2023-01-01",
        "team_leaders": [{"id": 1}, {"id": 2}, {"id": 3}],
    }
    response = client.post(url_for("api.projects-group"), json=data)
    assert response.status_code == 401
