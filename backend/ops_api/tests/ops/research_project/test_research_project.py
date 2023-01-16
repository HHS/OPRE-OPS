from ops.models.research_projects import ResearchProject
from ops.resources.research_projects import ResearchProjectListAPI
import pytest


@pytest.mark.usefixtures("app_ctx")
def test_research_project_retrieve(loaded_db):
    research_project = (
        loaded_db.session.query(ResearchProject).filter(ResearchProject.title == "Project 1").one()
    )

    assert research_project is not None
    assert research_project.title == "Project 1"
    assert research_project.id == 1


@pytest.mark.usefixtures("app_ctx")
def test_research_projects_get_all(client, loaded_db):
    assert loaded_db.session.query(ResearchProject).count() == 1

    response = client.get("/api/v1/research-projects/")
    assert response.status_code == 200
    assert len(response.json) == 1


@pytest.mark.usefixtures("app_ctx")
def test_research_projects_get_by_id(client, loaded_db):
    response = client.get("/api/v1/research-projects/1")
    assert response.status_code == 200
    assert response.json["title"] == "Project 1"


@pytest.mark.usefixtures("app_ctx")
def test_research_projects_get_by_id_404(client, loaded_db):
    response = client.get("/api/v1/research-projects/1000")
    assert response.status_code == 404


@pytest.mark.usefixtures("app_ctx")
def test_research_projects_serialization(client, loaded_db):
    response = client.get("/api/v1/research-projects/1")
    assert response.status_code == 200
    assert response.json["id"] == 1
    assert response.json["title"] == "Project 1"
    assert response.json["origination_date"] == "2000-01-01"
    assert len(response.json["cans"]) == 1
    assert response.json["cans"][0]["number"] == "ABCDEFG"
    assert len(response.json["methodologies"]) == 1
    assert response.json["methodologies"][0]["name"] == "type 1"
    assert len(response.json["populations"]) == 1
    assert response.json["populations"][0]["name"] == "pop 1"


@pytest.mark.usefixtures("app_ctx")
def test_research_projects_with_fiscal_year_found(client, loaded_db):
    response = client.get("/api/v1/research-projects/?fiscal_year=2023")
    assert response.status_code == 200
    assert len(response.json) == 1
    assert response.json[0]["title"] == "Project 1"
    assert response.json[0]["id"] == 1


@pytest.mark.usefixtures("app_ctx")
def test_research_projects_with_fiscal_year_not_found(client, loaded_db):
    response = client.get("/api/v1/research-projects/?fiscal_year=2000")
    assert response.status_code == 200
    assert len(response.json) == 0


@pytest.mark.usefixtures("app_ctx")
def test_get_query_for_fiscal_year_with_fiscal_year_found(client, loaded_db):
    stmt = ResearchProjectListAPI.get_query(2023)
    result = loaded_db.session.execute(stmt).fetchall()
    assert len(result) == 1
    assert result[0][0].title == "Project 1"
    assert result[0][0].id == 1


@pytest.mark.usefixtures("app_ctx")
def test_get_query_for_fiscal_year_with_fiscal_year_not_found(client, loaded_db):
    stmt = ResearchProjectListAPI.get_query(2022)
    result = loaded_db.session.execute(stmt).fetchall()
    assert len(result) == 0


@pytest.mark.usefixtures("app_ctx")
def test_get_query_for_fiscal_year_with_project_id_found(client, loaded_db):
    stmt = ResearchProjectListAPI.get_query(2023, 1)
    result = loaded_db.session.execute(stmt).fetchall()
    assert len(result) == 1
    assert result[0][0].title == "Project 1"
    assert result[0][0].id == 1


@pytest.mark.usefixtures("app_ctx")
def test_get_query_for_fiscal_year_with_project_id_not_found(client, loaded_db):
    stmt = ResearchProjectListAPI.get_query(2023, 2)
    result = loaded_db.session.execute(stmt).fetchall()
    assert len(result) == 0


@pytest.mark.usefixtures("app_ctx")
def test_research_project_no_cans(client, loaded_db):
    rp = ResearchProject(title="blah blah")

    loaded_db.session.add(rp)
    response = client.get("/api/v1/research-projects/")

    assert response.status_code == 200
    assert len(response.json) == 2


def test_research_project_no_cans_with_query_string(client, loaded_db):
    rp = ResearchProject(title="blah blah")

    loaded_db.session.add(rp)
    response = client.get("/api/v1/research-projects/?fiscal_year=2023")

    assert response.status_code == 200
    assert len(response.json) == 1
