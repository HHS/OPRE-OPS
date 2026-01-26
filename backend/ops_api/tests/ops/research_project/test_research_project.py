import uuid

from flask import url_for

from models import ProjectType
from models.projects import ResearchProject
from ops_api.ops.resources.research_projects import ResearchProjectListAPI


def test_research_projects_get_all(auth_client, loaded_db):
    count = loaded_db.query(ResearchProject).count()

    response = auth_client.get(url_for("api.research-projects-group"))
    assert response.status_code == 200
    assert len(response.json) == count


def test_research_projects_get_by_id(auth_client, loaded_db, test_project, app_ctx):
    response = auth_client.get(url_for("api.research-projects-item", id=test_project.id))
    assert response.status_code == 200
    assert response.json["title"] == "Human Services Interoperability Support"


def test_research_projects_get_by_id_404(auth_client, loaded_db, app_ctx):
    response = auth_client.get(url_for("api.research-projects-item", id="1000000"))
    assert response.status_code == 404


def test_research_projects_serialization(auth_client, loaded_db, test_user, test_project, app_ctx):
    response = auth_client.get(url_for("api.research-projects-item", id=test_project.id))
    assert response.status_code == 200
    assert response.json["id"] == test_project.id
    assert response.json["title"] == "Human Services Interoperability Support"
    assert response.json["origination_date"] == "2021-01-01"
    assert response.json["team_leaders"][0]["id"] == test_user.id
    assert response.json["team_leaders"][0]["full_name"] == "Chris Fortunato"


def test_research_projects_with_fiscal_year_found(auth_client, loaded_db, test_project, app_ctx):
    response = auth_client.get(url_for("api.research-projects-group", fiscal_year=2023))
    assert response.status_code == 200
    assert len(response.json) == 4
    assert response.json[0]["title"] == "Human Services Interoperability Support"
    assert response.json[0]["id"] == test_project.id


def test_research_projects_with_fiscal_year_not_found(auth_client, loaded_db, app_ctx):
    response = auth_client.get(url_for("api.research-projects-group", fiscal_year=2000))
    assert response.status_code == 200
    assert len(response.json) == 0


def test_get_query_for_fiscal_year_with_fiscal_year_found(loaded_db, test_project, app_ctx):
    stmt = ResearchProjectListAPI._get_query(2023)
    result = loaded_db.execute(stmt).fetchall()
    assert len(result) == 4
    assert result[0][0].title == "Human Services Interoperability Support"
    assert result[0][0].id == test_project.id


def test_get_query_for_fiscal_year_with_fiscal_year_not_found(loaded_db, app_ctx):
    stmt = ResearchProjectListAPI._get_query(1900)
    result = loaded_db.execute(stmt).fetchall()
    assert len(result) == 0


def test_get_query_for_fiscal_year_with_portfolio_id_found(loaded_db, test_project, app_ctx):
    stmt = ResearchProjectListAPI._get_query(2023, 6)
    result = loaded_db.execute(stmt).fetchall()
    assert len(result) == 2
    assert result[0][0].title == "Human Services Interoperability Support"
    assert result[0][0].id == test_project.id


def test_get_query_for_fiscal_year_with_portfolio_id_not_found(loaded_db, app_ctx):
    stmt = ResearchProjectListAPI._get_query(2023, 3)
    result = loaded_db.execute(stmt).fetchall()
    assert len(result) == 3


def test_research_project_search(auth_client, loaded_db):
    response = auth_client.get(url_for("api.research-projects-group", search=""))

    assert response.status_code == 200
    assert len(response.json) == 0

    response = auth_client.get(url_for("api.research-projects-group", search="fa"))

    assert response.status_code == 200
    assert len(response.json) == 4

    response = auth_client.get(url_for("api.research-projects-group", search="father"))

    assert response.status_code == 200
    assert len(response.json) == 2

    response = auth_client.get(url_for("api.research-projects-group", search="ExCELS"))

    assert response.status_code == 200
    assert len(response.json) == 1

    response = auth_client.get(url_for("api.research-projects-group", search="blah"))

    assert response.status_code == 200
    assert len(response.json) == 0


def test_research_projects_get_by_id_auth(client, loaded_db, app_ctx):
    response = client.get(url_for("api.research-projects-item", id="1"))
    assert response.status_code == 401


def test_research_projects_auth(client, loaded_db, app_ctx):
    response = client.get(url_for("api.research-projects-group"))
    assert response.status_code == 401


def test_post_research_projects(auth_client, app_ctx):
    data = {
        "project_type": ProjectType.RESEARCH.name,
        "title": "Research Project #1",
        "short_title": "RP1" + uuid.uuid4().hex,
        "description": "blah blah blah",
        "url": "https://example.com",
        "origination_date": "2023-01-01",
        "team_leaders": [{"id": 500}, {"id": 501}, {"id": 502}],
    }
    response = auth_client.post(url_for("api.research-projects-group"), json=data)
    assert response.status_code == 201
    assert response.json["title"] == "Research Project #1"
    expected_team_leaders = [
        {
            "email": "chris.fortunato@example.com",
            "full_name": "Chris Fortunato",
            "id": 500,
        },
        {"email": "Amy.Madigan@example.com", "full_name": "Amy Madigan", "id": 501},
        {
            "email": "Ivelisse.Martinez-Beck@example.com",
            "full_name": "Ivelisse Martinez-Beck",
            "id": 502,
        },
    ]
    assert [person in expected_team_leaders for person in response.json["team_leaders"]]


def test_post_research_projects_minimum(auth_client, app_ctx):
    data = {
        "project_type": ProjectType.RESEARCH.name,
        "title": "Research Project #1",
        "short_title": "RP1" + uuid.uuid4().hex,
    }
    response = auth_client.post(url_for("api.research-projects-group"), json=data)
    assert response.status_code == 201
    assert response.json["title"] == "Research Project #1"
    assert response.json["team_leaders"] == []


def test_post_research_projects_empty_post(auth_client, app_ctx):
    response = auth_client.post(url_for("api.research-projects-group"), json={})
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
    response = auth_client.post(url_for("api.research-projects-group"), json=data)
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
    response = auth_client.post(url_for("api.research-projects-group"), json=data)
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
    response = auth_client.post(url_for("api.research-projects-group"), json=data)
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
    response = client.post(url_for("api.research-projects-group"), json=data)
    assert response.status_code == 401
