import uuid

from flask import url_for

from models import AdministrativeAndSupportProject, ProjectType
from ops_api.ops.resources.administrative_and_support_projects import (
    AdministrativeAndSupportProjectListAPI,
)


def test_administrative_and_support_projects_get_all(auth_client, loaded_db):
    count = loaded_db.query(AdministrativeAndSupportProject).count()

    response = auth_client.get(url_for("api.administrative-and-support-projects-group"))
    assert response.status_code == 200
    assert len(response.json) == count


def test_administrative_and_support_projects_get_by_id(auth_client, loaded_db):
    response = auth_client.get(url_for("api.administrative-and-support-projects-item", id="1013"))
    assert response.status_code == 200
    assert response.json["title"] == "Support Project #1"


def test_administrative_and_support_projects_get_by_id_404(auth_client, loaded_db):
    response = auth_client.get(url_for("api.administrative-and-support-projects-item", id="1000"))
    assert response.status_code == 404


def test_administrative_and_support_projects_serialization(auth_client, loaded_db, test_user):
    response = auth_client.get(url_for("api.administrative-and-support-projects-item", id="1013"))
    assert response.status_code == 200
    assert response.json["id"] == 1013
    assert response.json["title"] == "Support Project #1"
    assert response.json["team_leaders"][0]["id"] == test_user.id
    assert response.json["team_leaders"][0]["full_name"] == test_user.full_name


def test_administrative_and_support_projects_with_fiscal_year_found(auth_client, loaded_db):
    response = auth_client.get(url_for("api.administrative-and-support-projects-group", fiscal_year=2023))
    assert response.status_code == 200
    assert len(response.json) == 1
    assert response.json[0]["title"] == "Support Project #1"
    assert response.json[0]["id"] == 1013


def test_administrative_and_support_projects_with_fiscal_year_not_found(auth_client, loaded_db):
    response = auth_client.get(url_for("api.administrative-and-support-projects-group", fiscal_year=2000))
    assert response.status_code == 200
    assert len(response.json) == 0


def test_get_query_for_fiscal_year_with_fiscal_year_found(loaded_db, app_ctx):
    stmt = AdministrativeAndSupportProjectListAPI._get_query(2023)
    result = loaded_db.execute(stmt).fetchall()
    assert len(result) == 1
    assert result[0][0].title == "Support Project #1"
    assert result[0][0].id == 1013


def test_get_query_for_fiscal_year_with_fiscal_year_not_found(loaded_db, app_ctx):
    stmt = AdministrativeAndSupportProjectListAPI._get_query(1900)
    result = loaded_db.execute(stmt).fetchall()
    assert len(result) == 0


def test_get_query_for_fiscal_year_with_portfolio_id_found(loaded_db, app_ctx):
    stmt = AdministrativeAndSupportProjectListAPI._get_query(2023, 3)
    result = loaded_db.execute(stmt).fetchall()
    assert len(result) == 1
    assert result[0][0].title == "Support Project #1"
    assert result[0][0].id == 1013


def test_get_query_for_fiscal_year_with_portfolio_id_not_found(loaded_db, app_ctx):
    stmt = AdministrativeAndSupportProjectListAPI._get_query(2023, 6)
    result = loaded_db.execute(stmt).fetchall()
    assert len(result) == 0


def test_administrative_and_support_projects_search(auth_client, loaded_db):
    response = auth_client.get(url_for("api.administrative-and-support-projects-group", search=""))

    assert response.status_code == 200
    assert len(response.json) == 0

    response = auth_client.get(url_for("api.administrative-and-support-projects-group", search="su"))

    assert response.status_code == 200
    assert len(response.json) == 2

    response = auth_client.get(url_for("api.administrative-and-support-projects-group", search="#2"))

    assert response.status_code == 200
    assert len(response.json) == 1

    response = auth_client.get(url_for("api.administrative-and-support-projects-group", search="blah"))

    assert response.status_code == 200
    assert len(response.json) == 0


def test_administrative_and_support_projects_get_by_id_auth(client, loaded_db):
    response = client.get(url_for("api.administrative-and-support-projects-item", id=14))
    assert response.status_code == 401


def test_administrative_and_support_projects_auth(client, loaded_db):
    response = client.get(url_for("api.administrative-and-support-projects-group"))
    assert response.status_code == 401


def test_post_administrative_and_support_projects(auth_client, loaded_db):
    data = {
        "project_type": ProjectType.RESEARCH.name,
        "title": "Research Project #1",
        "short_title": "RP1" + uuid.uuid4().hex,
        "description": "blah blah blah",
        "url": "https://example.com",
        "team_leaders": [{"id": 500}, {"id": 501}, {"id": 502}],
    }
    response = auth_client.post(url_for("api.administrative-and-support-projects-group"), json=data)
    assert response.status_code == 201
    assert response.json["title"] == "Research Project #1"
    assert response.json["team_leaders"] == [
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


def test_post_administrative_and_support_projects_minimum(auth_client, loaded_db):
    data = {
        "project_type": ProjectType.RESEARCH.name,
        "title": "Research Project #1",
        "short_title": "RP1" + uuid.uuid4().hex,
    }
    response = auth_client.post(url_for("api.administrative-and-support-projects-group"), json=data)
    assert response.status_code == 201
    assert response.json["title"] == "Research Project #1"
    assert response.json["team_leaders"] == []


def test_post_administrative_and_support_projects_empty_post(auth_client, loaded_db):
    response = auth_client.post(url_for("api.administrative-and-support-projects-group"), json={})
    assert response.status_code == 400


def test_post_administrative_and_support_projects_bad_team_leaders(auth_client, loaded_db):
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
    response = auth_client.post(url_for("api.administrative-and-support-projects-group"), json=data)
    assert response.status_code == 400


def test_post_administrative_and_support_projects_missing_title(auth_client, loaded_db):
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
    response = auth_client.post(url_for("api.administrative-and-support-projects-group"), json=data)
    assert response.status_code == 400


def test_post_administrative_and_support_projects_auth_required(client, loaded_db):
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
    response = client.post(url_for("api.administrative-and-support-projects-group"), json=data)
    assert response.status_code == 401
