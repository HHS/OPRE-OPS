import uuid

import pytest
from models import Project, ProjectType
from models.projects import ResearchType


@pytest.mark.usefixtures("app_ctx")
def test_project_retrieve(loaded_db):
    project = (
        loaded_db.query(Project).filter(Project.title == "African American Child and Family Research Center").one()
    )

    assert project is not None
    assert project.title == "African American Child and Family Research Center"
    assert project.display_name == project.title
    assert project.url == "https://www.acf.hhs.gov/opre/project/african-american-child-and-family-research-center"


def test_projects_get_all(auth_client, loaded_db):
    count = loaded_db.query(Project).count()

    response = auth_client.get("/api/v1/projects/")
    assert response.status_code == 200
    assert len(response.json) == count


def test_projects_get_by_id(auth_client, loaded_db):
    response = auth_client.get("/api/v1/projects/1")
    assert response.status_code == 200
    assert response.json["title"] == "Human Services Interoperability Support"


def test_projects_get_by_id_404(auth_client, loaded_db):
    response = auth_client.get("/api/v1/projects/1000")
    assert response.status_code == 404


def test_projects_serialization(auth_client, loaded_db):
    response = auth_client.get("/api/v1/projects/1")
    assert response.status_code == 200
    assert response.json["id"] == 1
    assert response.json["title"] == "Human Services Interoperability Support"
    assert response.json["origination_date"] == "2021-01-01"
    assert len(response.json["methodologies"]) == 7
    assert response.json["methodologies"][0] == "SURVEY"
    assert len(response.json["populations"]) == 1
    assert response.json["populations"][0] == "POPULATION_1"
    assert response.json["team_leaders"][0]["id"] == 1
    assert response.json["team_leaders"][0]["full_name"] == "Chris Fortunato"


def test_projects_with_fiscal_year_found(auth_client, loaded_db):
    response = auth_client.get("/api/v1/projects/?fiscal_year=2023")
    assert response.status_code == 200
    assert len(response.json) == 4
    assert response.json[0]["title"] == "Human Services Interoperability Support"
    assert response.json[0]["id"] == 1


def test_projects_with_fiscal_year_not_found(auth_client, loaded_db):
    response = auth_client.get("/api/v1/projects/?fiscal_year=2000")
    assert response.status_code == 200
    assert len(response.json) == 0


@pytest.mark.usefixtures("loaded_db")
def test_project_search(auth_client):
    response = auth_client.get("/api/v1/projects/?search=")

    assert response.status_code == 200
    assert len(response.json) == 0

    response = auth_client.get("/api/v1/projects/?search=fa")

    assert response.status_code == 200
    assert len(response.json) == 4

    response = auth_client.get("/api/v1/projects/?search=father")

    assert response.status_code == 200
    assert len(response.json) == 2

    response = auth_client.get("/api/v1/projects/?search=ExCELS")

    assert response.status_code == 200
    assert len(response.json) == 1

    response = auth_client.get("/api/v1/projects/?search=blah")

    assert response.status_code == 200
    assert len(response.json) == 0


def test_projects_get_by_id_auth(client):
    response = client.get("/api/v1/projects/1")
    assert response.status_code == 401


def test_projects_auth(client):
    response = client.get("/api/v1/projects/")
    assert response.status_code == 401


@pytest.mark.usefixtures("loaded_db")
def test_post_projects(auth_client):
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
    response = auth_client.post("/api/v1/projects/", json=data)
    assert response.status_code == 201
    assert response.json["title"] == "Research Project #1"
    assert response.json["team_leaders"] == [
        {
            "email": "chris.fortunato@example.com",
            "full_name": "Chris Fortunato",
            "id": 1,
        },
        {"email": "Amy.Madigan@example.com", "full_name": "Amy Madigan", "id": 2},
        {
            "email": "Ivelisse.Martinez-Beck@example.com",
            "full_name": "Ivelisse Martinez-Beck",
            "id": 3,
        },
    ]


@pytest.mark.usefixtures("loaded_db")
def test_post_projects_minimum(auth_client):
    data = {
        "project_type": ProjectType.RESEARCH.name,
        "title": "Research Project #1",
        "short_title": "RP1" + uuid.uuid4().hex,
    }
    response = auth_client.post("/api/v1/projects/", json=data)
    assert response.status_code == 201
    assert response.json["title"] == "Research Project #1"
    assert response.json["team_leaders"] == []


@pytest.mark.usefixtures("loaded_db")
def test_post_projects_empty_post(auth_client):
    response = auth_client.post("/api/v1/projects/", json={})
    assert response.status_code == 400


@pytest.mark.usefixtures("loaded_db")
def test_post_projects_bad_team_leaders(auth_client):
    data = {
        "project_type": ProjectType.RESEARCH.name,
        "title": "Research Project #1",
        "short_title": "RP1" + uuid.uuid4().hex,
        "description": "blah blah blah",
        "url": "https://example.com",
        "origination_date": "2023-01-01",
        "methodologies": ["FIELD_RESEARCH", "PARTICIPANT_OBSERVATION"],
        "populations": ["POPULATION_1", "POPULATION_2"],
        "team_leaders": [{"id": 100000}, {"id": 2}, {"id": 3}],
    }
    response = auth_client.post("/api/v1/projects/", json=data)
    assert response.status_code == 400


@pytest.mark.usefixtures("loaded_db")
def test_post_projects_missing_title(auth_client):
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
    response = auth_client.post("/api/v1/projects/", json=data)
    assert response.status_code == 400


@pytest.mark.usefixtures("loaded_db")
def test_post_projects_auth_required(client):
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
    response = client.post("/api/v1/projects/", json=data)
    assert response.status_code == 401


@pytest.mark.usefixtures("app_ctx")
def test_get_research_types(auth_client):
    response = auth_client.get("/api/v1/research-types/")
    assert response.status_code == 200
    assert response.json == {e.name: e.value for e in ResearchType}
