import uuid

from flask import url_for

from models import Project, ProjectType
from models.projects import ResearchProject


def test_research_projects_get_all(auth_client, loaded_db):
    count = loaded_db.query(ResearchProject).count()

    response = auth_client.get(url_for("api.projects-group", project_type=ProjectType.RESEARCH.name))
    assert response.status_code == 200
    assert "data" in response.json
    assert response.json["count"] == count
    assert len(response.json["data"]) == min(count, 10)  # Default limit is 10


def test_research_projects_get_by_id(auth_client, loaded_db, test_project, app_ctx):
    response = auth_client.get(url_for("api.projects-item", id=test_project.id))
    assert response.status_code == 200
    assert response.json["title"] == "Human Services Interoperability Support"


def test_research_projects_get_by_id_404(auth_client, loaded_db, app_ctx):
    response = auth_client.get(url_for("api.projects-item", id="1000000"))
    assert response.status_code == 404


def test_research_projects_serialization(auth_client, loaded_db, test_user, test_project, app_ctx):
    response = auth_client.get(url_for("api.projects-item", id=test_project.id))
    test_project_leader_ids = [tl.id for tl in test_project.team_leaders]
    assert response.status_code == 200
    assert response.json["id"] == test_project.id
    assert response.json["title"] == "Human Services Interoperability Support"
    assert response.json["origination_date"] == "2021-01-01"
    assert response.json["team_leaders"][0]["id"] in test_project_leader_ids
    assert "full_name" in response.json["team_leaders"][0]


def test_research_projects_with_fiscal_year_found(auth_client, loaded_db, test_project, app_ctx):
    response = auth_client.get(url_for("api.projects-group", fiscal_year=2044, project_type=ProjectType.RESEARCH.name))
    assert response.status_code == 200
    assert response.json["count"] == 3
    assert len(response.json["data"]) == 3
    assert response.json["data"][0]["title"] == "Human Services Interoperability Support"
    assert response.json["data"][0]["id"] == test_project.id


def test_research_projects_with_fiscal_year_not_found(auth_client, loaded_db, app_ctx):
    response = auth_client.get(url_for("api.projects-group", fiscal_year=2000, project_type=ProjectType.RESEARCH.name))
    assert response.status_code == 200
    assert response.json["count"] == 0
    assert len(response.json["data"]) == 0


def test_research_project_search(auth_client, loaded_db):
    # Empty string returns no results
    response = auth_client.get(
        url_for("api.projects-group", project_search=[""], project_type=[ProjectType.RESEARCH.name])
    )

    assert response.status_code == 200
    assert response.json["count"] == 0
    assert len(response.json["data"]) == 0

    # Search by exact short_title "RFH" (Responsible Fatherhood project)
    response = auth_client.get(
        url_for("api.projects-group", project_search=["RFH"], project_type=[ProjectType.RESEARCH.name])
    )

    assert response.status_code == 200
    assert response.json["count"] == 1
    assert len(response.json["data"]) == 1

    # Search by multiple exact short_titles - "RFH" and "FCL" (Fathers and Continuous Learning)
    response = auth_client.get(
        url_for("api.projects-group", project_search=["RFH", "FCL"], project_type=[ProjectType.RESEARCH.name])
    )

    assert response.status_code == 200
    assert response.json["count"] == 2
    assert len(response.json["data"]) == 2

    # Search by exact short_title "ECE" (Early Care and Education Leadership Study)
    response = auth_client.get(
        url_for("api.projects-group", project_search=["ECE"], project_type=[ProjectType.RESEARCH.name])
    )

    assert response.status_code == 200
    assert response.json["count"] == 1
    assert len(response.json["data"]) == 1

    # Search with non-existent title returns no results
    response = auth_client.get(
        url_for("api.projects-group", project_search=["blah"], project_type=[ProjectType.RESEARCH.name])
    )

    assert response.status_code == 200
    assert response.json["count"] == 0
    assert len(response.json["data"]) == 0


def test_research_projects_get_by_id_auth(client, loaded_db, app_ctx):
    response = client.get(url_for("api.projects-item", id="1"))
    assert response.status_code == 401


def test_research_projects_auth(client, loaded_db, app_ctx):
    response = client.get(url_for("api.projects-group"))
    assert response.status_code == 401


def test_post_research_projects(auth_client, app_ctx, loaded_db):
    team_leader_ids = [500, 501, 502]
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
    assert project.team_leaders[0].id in team_leader_ids
    assert project.team_leaders[1].id in team_leader_ids
    assert project.team_leaders[2].id in team_leader_ids


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
    response = auth_client.get(url_for("api.projects-group", project_type=[ProjectType.RESEARCH.name]))
    assert response.status_code == 200
    assert "data" in response.json
    assert len(response.json["data"]) > 0

    project = response.json["data"][0]

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

    # Verify project metadata fields from project_list_metadata are present (inherited from ProjectListResponse)
    assert "start_date" in project
    assert "end_date" in project
    assert "fiscal_year_totals" in project
    assert "project_total" in project

    # Verify fiscal_year_totals is a dict (or None)
    assert project["fiscal_year_totals"] is None or isinstance(project["fiscal_year_totals"], dict)

    # Verify project_total is an string (or None) to preserve precision (since it can be a large decimal), and is not a float which could lose precision
    assert project["project_total"] is None or isinstance(project["project_total"], str)

    # Verify expensive nested fields are NOT present (performance optimization)
    assert "team_leaders" not in project, "Nested 'team_leaders' should not be in list response (causes N+1 queries)"
    assert "created_by" not in project, "Unused 'created_by' field should not be in list response"
