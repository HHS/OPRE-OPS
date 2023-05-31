import pytest
from models.research_projects import ResearchProject
from ops_api.ops.resources.research_projects import RequestBody, ResearchProjectListAPI


@pytest.mark.usefixtures("app_ctx")
def test_research_project_retrieve(loaded_db):
    research_project = (
        loaded_db.query(ResearchProject)
        .filter(ResearchProject.title == "African American Child and Family Research Center")
        .one()
    )

    assert research_project is not None
    assert research_project.title == "African American Child and Family Research Center"
    assert research_project.id == 10


@pytest.mark.usefixtures("app_ctx")
def test_research_projects_get_all(auth_client, loaded_db):
    assert loaded_db.query(ResearchProject).count() == 13

    response = auth_client.get("/api/v1/research-projects/")
    assert response.status_code == 200
    assert len(response.json) == 13


@pytest.mark.usefixtures("app_ctx")
def test_research_projects_get_by_id(auth_client, loaded_db):
    response = auth_client.get("/api/v1/research-projects/1")
    assert response.status_code == 200
    assert response.json["title"] == "Human Services Interoperability Support"


@pytest.mark.usefixtures("app_ctx")
def test_research_projects_get_by_id_404(auth_client, loaded_db):
    response = auth_client.get("/api/v1/research-projects/1000")
    assert response.status_code == 404


@pytest.mark.usefixtures("app_ctx")
def test_research_projects_serialization(auth_client, loaded_db):
    response = auth_client.get("/api/v1/research-projects/1")
    assert response.status_code == 200
    assert response.json["id"] == 1
    assert response.json["title"] == "Human Services Interoperability Support"
    assert response.json["origination_date"] == "2021-01-01"
    assert len(response.json["methodologies"]) == 7
    assert response.json["methodologies"][0] == "SURVEY"
    assert len(response.json["populations"]) == 1
    assert response.json["populations"][0] == "POPULATION_1"


@pytest.mark.usefixtures("app_ctx")
def test_research_projects_with_fiscal_year_found(auth_client, loaded_db):
    response = auth_client.get("/api/v1/research-projects/?fiscal_year=2023")
    assert response.status_code == 200
    assert len(response.json) == 2
    assert response.json[0]["title"] == "Human Services Interoperability Support"
    assert response.json[0]["id"] == 1


@pytest.mark.usefixtures("app_ctx")
def test_research_projects_with_fiscal_year_not_found(auth_client, loaded_db):
    response = auth_client.get("/api/v1/research-projects/?fiscal_year=2000")
    assert response.status_code == 200
    assert len(response.json) == 0


@pytest.mark.usefixtures("app_ctx")
def test_get_query_for_fiscal_year_with_fiscal_year_found(loaded_db):
    stmt = ResearchProjectListAPI._get_query(2023)
    result = loaded_db.execute(stmt).fetchall()
    assert len(result) == 2
    assert result[0][0].title == "Human Services Interoperability Support"
    assert result[0][0].id == 1


@pytest.mark.usefixtures("app_ctx")
def test_get_query_for_fiscal_year_with_fiscal_year_not_found(loaded_db):
    stmt = ResearchProjectListAPI._get_query(1900)
    result = loaded_db.execute(stmt).fetchall()
    assert len(result) == 0


@pytest.mark.usefixtures("app_ctx")
def test_get_query_for_fiscal_year_with_portfolio_id_found(loaded_db):
    stmt = ResearchProjectListAPI._get_query(2023, 6)
    result = loaded_db.execute(stmt).fetchall()
    assert len(result) == 1
    assert result[0][0].title == "Human Services Interoperability Support"
    assert result[0][0].id == 1


@pytest.mark.usefixtures("app_ctx")
def test_get_query_for_fiscal_year_with_portfolio_id_not_found(loaded_db):
    stmt = ResearchProjectListAPI._get_query(2023, 3)
    result = loaded_db.execute(stmt).fetchall()
    assert len(result) == 1


def test_research_project_search(auth_client, loaded_db):
    response = auth_client.get("/api/v1/research-projects/?search=")

    assert response.status_code == 200
    assert len(response.json) == 0

    response = auth_client.get("/api/v1/research-projects/?search=fa")

    assert response.status_code == 200
    assert len(response.json) == 4

    response = auth_client.get("/api/v1/research-projects/?search=father")

    assert response.status_code == 200
    assert len(response.json) == 2

    response = auth_client.get("/api/v1/research-projects/?search=ExCELS")

    assert response.status_code == 200
    assert len(response.json) == 1

    response = auth_client.get("/api/v1/research-projects/?search=blah")

    assert response.status_code == 200
    assert len(response.json) == 0


@pytest.mark.usefixtures("app_ctx")
def test_research_projects_get_by_id_auth(client, loaded_db):
    response = client.get("/api/v1/research-projects/1")
    assert response.status_code == 401


@pytest.mark.usefixtures("app_ctx")
def test_research_projects_auth(client, loaded_db):
    response = client.get("/api/v1/research-projects/")
    assert response.status_code == 401


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_post_research_projects(auth_client):
    data = RequestBody(
        title="Research Project #1",
        short_title="RP#1",
        description="blah blah blah",
        url="https://example.com",
        origination_date="2023-01-01",
        methodologies=["SURVEY", "FIELD_RESEARCH", "PARTICIPANT_OBSERVATION"],
        populations=["POPULATION_1", "POPULATION_2"],
        team_leaders=[{"id": 1}, {"id": 2}, {"id": 3}],
    )
    response = auth_client.post("/api/v1/research-projects/", json=data.__dict__)
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


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_post_research_projects_minimum(auth_client):
    data = {
        "title": "Research Project #1",
    }
    response = auth_client.post("/api/v1/research-projects/", json=data)
    assert response.status_code == 201
    assert response.json["title"] == "Research Project #1"
    assert response.json["team_leaders"] == []


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_post_research_projects_empty_post(auth_client):
    response = auth_client.post("/api/v1/research-projects/", json={})
    assert response.status_code == 400


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_post_research_projects_bad_origination_date(auth_client):
    data = RequestBody(
        title="Research Project #1",
        short_title="RP#1",
        description="blah blah blah",
        url="https://example.com",
        origination_date="123",
        methodologies=["SURVEY", "FIELD_RESEARCH", "PARTICIPANT_OBSERVATION"],
        populations=["POPULATION_1", "POPULATION_2"],
        team_leaders=[{"id": 1}, {"id": 2}, {"id": 3}],
    )
    response = auth_client.post("/api/v1/research-projects/", json=data.__dict__)
    assert response.status_code == 400


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_post_research_projects_bad_methodologies(auth_client):
    data = RequestBody(
        title="Research Project #1",
        short_title="RP#1",
        description="blah blah blah",
        url="https://example.com",
        origination_date="2023-01-01",
        methodologies=["blah blah", "FIELD_RESEARCH", "PARTICIPANT_OBSERVATION"],
        populations=["POPULATION_1", "POPULATION_2"],
        team_leaders=[{"id": 1}, {"id": 2}, {"id": 3}],
    )
    response = auth_client.post("/api/v1/research-projects/", json=data.__dict__)
    assert response.status_code == 400


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_post_research_projects_bad_populations(auth_client):
    data = RequestBody(
        title="Research Project #1",
        short_title="RP#1",
        description="blah blah blah",
        url="https://example.com",
        origination_date="2023-01-01",
        methodologies=["FIELD_RESEARCH", "PARTICIPANT_OBSERVATION"],
        populations=["blah blah", "POPULATION_2"],
        team_leaders=[{"id": 1}, {"id": 2}, {"id": 3}],
    )
    response = auth_client.post("/api/v1/research-projects/", json=data.__dict__)
    assert response.status_code == 400


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_post_research_projects_bad_team_leaders(auth_client):
    data = RequestBody(
        title="Research Project #1",
        short_title="RP#1",
        description="blah blah blah",
        url="https://example.com",
        origination_date="2023-01-01",
        methodologies=["FIELD_RESEARCH", "PARTICIPANT_OBSERVATION"],
        populations=["POPULATION_1", "POPULATION_2"],
        team_leaders=[{"id": 100000}, {"id": 2}, {"id": 3}],
    )
    response = auth_client.post("/api/v1/research-projects/", json=data.__dict__)
    assert response.status_code == 400


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_post_research_projects_missing_title(auth_client):
    data = {
        "short_title": "RP#1",
        "description": "blah blah blah",
        "url": "https://example.com",
        "origination_date": "2023-01-01",
        "methodologies": ["FIELD_RESEARCH", "PARTICIPANT_OBSERVATION"],
        "populations": ["POPULATION_1", "POPULATION_2"],
        "team_leaders": [{"id": 100000}, {"id": 2}, {"id": 3}],
    }
    response = auth_client.post("/api/v1/research-projects/", json=data)
    assert response.status_code == 400


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_post_research_projects_auth_required(client):
    data = RequestBody(
        title="Research Project #1",
        short_title="RP#1",
        description="blah blah blah",
        url="https://example.com",
        origination_date="2023-01-01",
        methodologies=["SURVEY", "FIELD_RESEARCH", "PARTICIPANT_OBSERVATION"],
        populations=["POPULATION_1", "POPULATION_2"],
        team_leaders=[{"id": 1}, {"id": 2}, {"id": 3}],
    )
    response = client.post("/api/v1/research-projects/", json=data.__dict__)
    assert response.status_code == 401
