import uuid

from flask import url_for

from models import Project, ProjectType
from models.projects import ResearchProject


def test_research_projects_get_all(auth_client, loaded_db):
    count = loaded_db.query(ResearchProject).count()

    response = auth_client.get(url_for("api.projects-group", project_type=ProjectType.RESEARCH.name))
    assert response.status_code == 200
    assert len(response.json) == count


def test_research_projects_get_by_id(auth_client, loaded_db, test_project, app_ctx):
    response = auth_client.get(url_for("api.projects-item", id=test_project.id))
    assert response.status_code == 200
    assert response.json["title"] == "Human Services Interoperability Support"


def test_research_projects_get_by_id_404(auth_client, loaded_db, app_ctx):
    response = auth_client.get(url_for("api.projects-item", id="1000000"))
    assert response.status_code == 404


def test_research_projects_serialization(auth_client, loaded_db, test_user, test_project, app_ctx):
    response = auth_client.get(url_for("api.projects-item", id=test_project.id))
    assert response.status_code == 200
    assert response.json["id"] == test_project.id
    assert response.json["title"] == "Human Services Interoperability Support"
    assert response.json["origination_date"] == "2021-01-01"
    assert response.json["team_leaders"][0]["id"] == test_user.id
    assert response.json["team_leaders"][0]["full_name"] == "Chris Fortunato"


def test_research_projects_with_fiscal_year_found(auth_client, loaded_db, test_project, app_ctx):
    response = auth_client.get(url_for("api.projects-group", fiscal_year=2023, project_type=ProjectType.RESEARCH.name))
    assert response.status_code == 200
    assert len(response.json) == 4
    assert response.json[0]["title"] == "Human Services Interoperability Support"
    assert response.json[0]["id"] == test_project.id


def test_research_projects_with_fiscal_year_not_found(auth_client, loaded_db, app_ctx):
    response = auth_client.get(url_for("api.projects-group", fiscal_year=2000, project_type=ProjectType.RESEARCH.name))
    assert response.status_code == 200
    assert len(response.json) == 0


def test_research_project_search(auth_client, loaded_db):
    response = auth_client.get(
        url_for("api.projects-group", project_search=[""], project_type=[ProjectType.RESEARCH.name])
    )

    assert response.status_code == 200
    assert len(response.json) == 0

    response = auth_client.get(
        url_for("api.projects-group", project_search=["fa"], project_type=[ProjectType.RESEARCH.name])
    )

    assert response.status_code == 200
    assert len(response.json) == 4

    response = auth_client.get(
        url_for("api.projects-group", project_search=["father"], project_type=[ProjectType.RESEARCH.name])
    )

    assert response.status_code == 200
    assert len(response.json) == 2

    response = auth_client.get(
        url_for("api.projects-group", project_search=["ExCELS"], project_type=[ProjectType.RESEARCH.name])
    )

    assert response.status_code == 200
    assert len(response.json) == 1

    response = auth_client.get(
        url_for("api.projects-group", project_search=["blah"], project_type=[ProjectType.RESEARCH.name])
    )

    assert response.status_code == 200
    assert len(response.json) == 0


def test_research_projects_get_by_id_auth(client, loaded_db, app_ctx):
    response = client.get(url_for("api.projects-item", id="1"))
    assert response.status_code == 401


def test_research_projects_auth(client, loaded_db, app_ctx):
    response = client.get(url_for("api.projects-group"))
    assert response.status_code == 401


def test_post_research_projects(auth_client, app_ctx, loaded_db):
    data = {
        "project_type": ProjectType.RESEARCH.name,
        "title": "Research Project #1",
        "short_title": "RP1" + uuid.uuid4().hex,
        "description": "blah blah blah",
        "url": "https://example.com",
        "origination_date": "2023-01-01",
        "team_leaders": [{"id": 500}, {"id": 501}, {"id": 502}],
    }
    response = auth_client.post(url_for("api.projects-group"), json=data)
    assert response.status_code == 201
    id = response.json["id"]
    # verify project was created in db with correct values
    project = loaded_db.get(Project, id)
    assert project is not None
    assert project.title == "Research Project #1"
    assert project.origination_date.strftime("%Y-%m-%d") == "2023-01-01"
    assert len(project.team_leaders) == 3
    assert project.team_leaders[0].id == 500
    assert project.team_leaders[1].id == 501
    assert project.team_leaders[2].id == 502


def test_post_research_projects_minimum(auth_client, app_ctx, loaded_db):
    data = {
        "project_type": ProjectType.RESEARCH.name,
        "title": "Research Project #1",
        "short_title": "RP1" + uuid.uuid4().hex,
    }
    response = auth_client.post(url_for("api.projects-group"), json=data)
    assert response.status_code == 201
    id = response.json["id"]
    # verify project was created in db with correct values
    project = loaded_db.get(Project, id)
    assert project.title == "Research Project #1"
    assert project.team_leaders == []


def test_post_research_projects_empty_post(auth_client, app_ctx):
    response = auth_client.post(url_for("api.projects-group"), json={})
    assert response.status_code == 400


def test_post_research_projects_bad_origination_date(auth_client, app_ctx):
    data = {
        "project_type": ProjectType.RESEARCH.name,
        "title": "Research Project #1",
        "short_title": "RP1" + uuid.uuid4().hex,
        "description": "blah blah blah",
        "url": "https://example.com",
        "origination_date": "123",
        "team_leaders": [{"id": 1}, {"id": 2}, {"id": 3}],
    }
    response = auth_client.post(url_for("api.projects-group"), json=data)
    assert response.status_code == 400


def test_post_research_projects_bad_team_leaders(auth_client, app_ctx):
    data = {
        "project_type": ProjectType.RESEARCH.name,
        "title": "Research Project #1",
        "short_title": "RP1" + uuid.uuid4().hex,
        "description": "blah blah blah",
        "url": "https://example.com",
        "origination_date": "2023-01-01",
        "team_leaders": [{"id": 100000000}, {"id": 2}, {"id": 3}],
    }
    response = auth_client.post(url_for("api.projects-group"), json=data)
    assert response.status_code == 400


def test_post_research_projects_missing_title(auth_client, app_ctx):
    data = {
        "project_type": ProjectType.RESEARCH.name,
        "short_title": "RP1" + uuid.uuid4().hex,
        "description": "blah blah blah",
        "url": "https://example.com",
        "origination_date": "2023-01-01",
        "team_leaders": [{"id": 100000}, {"id": 2}, {"id": 3}],
    }
    response = auth_client.post(url_for("api.projects-group"), json=data)
    assert response.status_code == 400


def test_post_research_projects_auth_required(client, app_ctx):
    data = {
        "project_type": ProjectType.RESEARCH.name,
        "title": "Research Project #1",
        "short_title": "RP1" + uuid.uuid4().hex,
        "description": "blah blah blah",
        "url": "https://example.com",
        "origination_date": "2023-01-01",
        "team_leaders": [{"id": 1}, {"id": 2}, {"id": 3}],
    }
    response = client.post(url_for("api.projects-group"), json=data)
    assert response.status_code == 401


def test_research_projects_list_uses_lightweight_schema(auth_client, loaded_db, app_ctx):
    """
    Test that the list endpoint returns lightweight schema without expensive nested relationships.
    This verifies the performance optimization that excludes: team_leaders.
    """
    response = auth_client.get(url_for("api.projects-group"))
    assert response.status_code == 200
    assert len(response.json) > 0

    project = response.json[0]

    # Verify required fields are present
    assert "id" in project
    assert "title" in project
    assert "short_title" in project
    assert "description" in project
    assert "url" in project
    assert "origination_date" in project
    assert "created_on" in project
    assert "updated_on" in project
    assert "project_type" in project

    # Verify expensive nested fields are NOT present (performance optimization)
    assert "team_leaders" not in project, "Nested 'team_leaders' should not be in list response (causes N+1 queries)"
    assert "created_by" not in project, "Unused 'created_by' field should not be in list response"
