import uuid

import pytest
from flask import url_for

from models import ProjectType
from models.projects import ResearchProject
from ops_api.ops.resources.research_projects import ResearchProjectListAPI


def test_research_projects_get_all(auth_client, loaded_db):
    count = loaded_db.query(ResearchProject).count()

    response = auth_client.get(url_for("api.research-projects-group"))
    assert response.status_code == 200
    assert len(response.json) == count


@pytest.mark.usefixtures("app_ctx")
def test_research_projects_get_by_id(auth_client, loaded_db, test_project):
    response = auth_client.get(url_for("api.research-projects-item", id=test_project.id))
    assert response.status_code == 200
    assert response.json["title"] == "Human Services Interoperability Support"


@pytest.mark.usefixtures("app_ctx")
def test_research_projects_get_by_id_404(auth_client, loaded_db):
    response = auth_client.get(url_for("api.research-projects-item", id="1000000"))
    assert response.status_code == 404


@pytest.mark.usefixtures("app_ctx")
def test_research_projects_serialization(auth_client, loaded_db, test_user, test_project):
    response = auth_client.get(url_for("api.research-projects-item", id=test_project.id))
    assert response.status_code == 200
    assert response.json["id"] == test_project.id
    assert response.json["title"] == "Human Services Interoperability Support"
    assert response.json["origination_date"] == "2021-01-01"
    assert len(response.json["methodologies"]) == 7
    assert response.json["methodologies"][0] == "SURVEY"
    assert len(response.json["populations"]) == 1
    assert response.json["populations"][0] == "POPULATION_1"
    assert response.json["team_leaders"][0]["id"] == test_user.id
    assert response.json["team_leaders"][0]["full_name"] == "Chris Fortunato"


@pytest.mark.usefixtures("app_ctx")
def test_research_projects_with_fiscal_year_found(auth_client, loaded_db, test_project):
    response = auth_client.get(url_for("api.research-projects-group", fiscal_year=2023))
    assert response.status_code == 200
    assert len(response.json) == 3
    assert response.json[0]["title"] == "Human Services Interoperability Support"
    assert response.json[0]["id"] == test_project.id


@pytest.mark.usefixtures("app_ctx")
def test_research_projects_with_fiscal_year_not_found(auth_client, loaded_db):
    response = auth_client.get(url_for("api.research-projects-group", fiscal_year=2000))
    assert response.status_code == 200
    assert len(response.json) == 0


@pytest.mark.usefixtures("app_ctx")
def test_get_query_for_fiscal_year_with_fiscal_year_found(loaded_db, test_project):
    stmt = ResearchProjectListAPI._get_query(2023)
    result = loaded_db.execute(stmt).fetchall()
    assert len(result) == 3
    assert result[0][0].title == "Human Services Interoperability Support"
    assert result[0][0].id == test_project.id


@pytest.mark.usefixtures("app_ctx")
def test_get_query_for_fiscal_year_with_fiscal_year_not_found(loaded_db):
    stmt = ResearchProjectListAPI._get_query(1900)
    result = loaded_db.execute(stmt).fetchall()
    assert len(result) == 0


@pytest.mark.usefixtures("app_ctx")
def test_get_query_for_fiscal_year_with_portfolio_id_found(loaded_db, test_project):
    stmt = ResearchProjectListAPI._get_query(2023, 6)
    result = loaded_db.execute(stmt).fetchall()
    assert len(result) == 1
    assert result[0][0].title == "Human Services Interoperability Support"
    assert result[0][0].id == test_project.id


@pytest.mark.usefixtures("app_ctx")
def test_get_query_for_fiscal_year_with_portfolio_id_not_found(loaded_db):
    stmt = ResearchProjectListAPI._get_query(2023, 3)
    result = loaded_db.execute(stmt).fetchall()
    assert len(result) == 2


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


@pytest.mark.usefixtures("app_ctx")
def test_research_projects_get_by_id_auth(client, loaded_db):
    response = client.get(url_for("api.research-projects-item", id="1"))
    assert response.status_code == 401


@pytest.mark.usefixtures("app_ctx")
def test_research_projects_auth(client, loaded_db):
    response = client.get(url_for("api.research-projects-group"))
    assert response.status_code == 401


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_post_research_projects(auth_client):
    data = {
        "project_type": ProjectType.RESEARCH.name,
        "title": "Research Project #1",
        "short_title": "RP1" + uuid.uuid4().hex,
        "description": "blah blah blah",
        "url": "https://example.com",
        "origination_date": "2023-01-01",
        "methodologies": ["SURVEY", "FIELD_RESEARCH", "PARTICIPANT_OBSERVATION"],
        "populations": ["POPULATION_1", "POPULATION_2"],
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


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_post_research_projects_minimum(auth_client):
    data = {
        "project_type": ProjectType.RESEARCH.name,
        "title": "Research Project #1",
        "short_title": "RP1" + uuid.uuid4().hex,
    }
    response = auth_client.post(url_for("api.research-projects-group"), json=data)
    assert response.status_code == 201
    assert response.json["title"] == "Research Project #1"
    assert response.json["team_leaders"] == []


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_post_research_projects_empty_post(auth_client):
    response = auth_client.post(url_for("api.research-projects-group"), json={})
    assert response.status_code == 400


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_post_research_projects_bad_origination_date(auth_client):
    data = {
        "project_type": ProjectType.RESEARCH.name,
        "title": "Research Project #1",
        "short_title": "RP1" + uuid.uuid4().hex,
        "description": "blah blah blah",
        "url": "https://example.com",
        "origination_date": "123",
        "methodologies": ["SURVEY", "FIELD_RESEARCH", "PARTICIPANT_OBSERVATION"],
        "populations": ["POPULATION_1", "POPULATION_2"],
        "team_leaders": [{"id": 1}, {"id": 2}, {"id": 3}],
    }
    response = auth_client.post(url_for("api.research-projects-group"), json=data)
    assert response.status_code == 400


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_post_research_projects_bad_methodologies(auth_client):
    data = {
        "project_type": ProjectType.RESEARCH.name,
        "title": "Research Project #1",
        "short_title": "RP1" + uuid.uuid4().hex,
        "description": "blah blah blah",
        "url": "https://example.com",
        "origination_date": "2023-01-01",
        "methodologies": ["blah blah", "FIELD_RESEARCH", "PARTICIPANT_OBSERVATION"],
        "populations": ["POPULATION_1", "POPULATION_2"],
        "team_leaders": [{"id": 1}, {"id": 2}, {"id": 3}],
    }
    response = auth_client.post(url_for("api.research-projects-group"), json=data)
    assert response.status_code == 400


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_post_research_projects_bad_populations(auth_client):
    data = {
        "project_type": ProjectType.RESEARCH.name,
        "title": "Research Project #1",
        "short_title": "RP1" + uuid.uuid4().hex,
        "description": "blah blah blah",
        "url": "https://example.com",
        "origination_date": "2023-01-01",
        "methodologies": ["SURVEY", "FIELD_RESEARCH", "PARTICIPANT_OBSERVATION"],
        "populations": ["POPULATION_1", "blah blah"],
        "team_leaders": [{"id": 1}, {"id": 2}, {"id": 3}],
    }
    response = auth_client.post(url_for("api.research-projects-group"), json=data)
    assert response.status_code == 400


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_post_research_projects_bad_team_leaders(auth_client):
    data = {
        "project_type": ProjectType.RESEARCH.name,
        "title": "Research Project #1",
        "short_title": "RP1" + uuid.uuid4().hex,
        "description": "blah blah blah",
        "url": "https://example.com",
        "origination_date": "2023-01-01",
        "methodologies": ["SURVEY", "FIELD_RESEARCH", "PARTICIPANT_OBSERVATION"],
        "populations": ["POPULATION_1", "POPULATION_2"],
        "team_leaders": [{"id": 100000000}, {"id": 2}, {"id": 3}],
    }
    response = auth_client.post(url_for("api.research-projects-group"), json=data)
    assert response.status_code == 400


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_post_research_projects_missing_title(auth_client):
    data = {
        "project_type": ProjectType.RESEARCH.name,
        "short_title": "RP1" + uuid.uuid4().hex,
        "description": "blah blah blah",
        "url": "https://example.com",
        "origination_date": "2023-01-01",
        "methodologies": ["FIELD_RESEARCH", "PARTICIPANT_OBSERVATION"],
        "populations": ["POPULATION_1", "POPULATION_2"],
        "team_leaders": [{"id": 100000}, {"id": 2}, {"id": 3}],
    }
    response = auth_client.post(url_for("api.research-projects-group"), json=data)
    assert response.status_code == 400


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_post_research_projects_auth_required(client):
    data = {
        "project_type": ProjectType.RESEARCH.name,
        "title": "Research Project #1",
        "short_title": "RP1" + uuid.uuid4().hex,
        "description": "blah blah blah",
        "url": "https://example.com",
        "origination_date": "2023-01-01",
        "methodologies": ["SURVEY", "FIELD_RESEARCH", "PARTICIPANT_OBSERVATION"],
        "populations": ["POPULATION_1", "POPULATION_2"],
        "team_leaders": [{"id": 1}, {"id": 2}, {"id": 3}],
    }
    response = client.post(url_for("api.research-projects-group"), json=data)
    assert response.status_code == 401
