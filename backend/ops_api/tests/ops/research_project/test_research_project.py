from ops.models.research_projects import ResearchProject
import pytest


@pytest.mark.usefixtures("app_ctx")
def test_research_projects_get_all(client, db_with_research_projects):
    assert db_with_research_projects.session.query(ResearchProject).count() == 1

    response = client.get("/api/v1/research-projects/")
    assert response.status_code == 200
    assert len(response.json) == 1


@pytest.mark.usefixtures("app_ctx")
def test_research_projects_get_by_id(client, db_with_research_projects):
    response = client.get("/api/v1/research-projects/1")
    assert response.status_code == 200
    assert response.json["title"] == "Project 1"


@pytest.mark.usefixtures("app_ctx")
def test_research_projects_get_by_id_404(client, db_with_research_projects):
    response = client.get("/api/v1/research-projects/1000")
    assert response.status_code == 404


@pytest.mark.usefixtures("app_ctx")
def test_research_projects_serialization(client, db_with_research_projects):
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
