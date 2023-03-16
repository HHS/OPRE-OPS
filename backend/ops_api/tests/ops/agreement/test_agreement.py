import pytest
from models.cans import Agreement
from models.research_projects import ResearchProject
from ops_api.ops.resources.research_projects import ResearchProjectListAPI
from sqlalchemy import func, select


@pytest.mark.usefixtures("app_ctx")
def test_agreement_retrieve(loaded_db):
    stmt = select(Agreement).where(Agreement.id == 1)
    agreement = loaded_db.session.scalar(stmt)

    assert agreement is not None
    assert agreement.name == "Contract #1: African American Child and Family Research Center"
    assert agreement.id == 1


@pytest.mark.usefixtures("app_ctx")
def test_agreements_get_all(client, loaded_db):
    stmt = select(func.count()).select_from(Agreement)
    count = loaded_db.session.scalar(stmt)
    assert count == 6

    response = client.get("/api/v1/agreements/")
    assert response.status_code == 200
    assert len(response.json) == count


@pytest.mark.usefixtures("app_ctx")
def test_agreements_get_by_id(client, loaded_db):
    response = client.get("/api/v1/agreements/1")
    assert response.status_code == 200
    assert response.json["name"] == "Contract #1: African American Child and Family Research Center"


@pytest.mark.usefixtures("app_ctx")
def test_agreements_get_by_id_404(client, loaded_db):
    response = client.get("/api/v1/agreements/1000")
    assert response.status_code == 404


@pytest.mark.usefixtures("app_ctx")
def test_agreements_serialization(client, loaded_db):
    response = client.get("/api/v1/agreements/1")
    assert response.status_code == 200

    # Remove extra keys that make test flaky
    json_to_compare = response.json  # response.json seems to be immutable
    del json_to_compare["created_on"]
    del json_to_compare["updated_on"]

    assert json_to_compare == {
        "id": 1,
        "name": "Contract #1: African American Child and Family Research Center",
        "agreement_type": "CONTRACT",
        "research_project_id": 1,
        "created_by": None,
    }


@pytest.mark.usefixtures("app_ctx")
def test_research_projects_with_fiscal_year_found(client, loaded_db):
    response = client.get("/api/v1/research-projects/?fiscal_year=2023")
    assert response.status_code == 200
    assert len(response.json) == 1
    assert response.json[0]["title"] == "African American Child and Family Research Center"
    assert response.json[0]["id"] == 1


@pytest.mark.usefixtures("app_ctx")
def test_research_projects_with_fiscal_year_not_found(client, loaded_db):
    response = client.get("/api/v1/research-projects/?fiscal_year=2000")
    assert response.status_code == 200
    assert len(response.json) == 0


@pytest.mark.usefixtures("app_ctx")
def test_get_query_for_fiscal_year_with_fiscal_year_found(client, loaded_db):
    stmt = ResearchProjectListAPI._get_query(2023)
    result = loaded_db.session.execute(stmt).fetchall()
    assert len(result) == 1
    assert result[0][0].title == "African American Child and Family Research Center"
    assert result[0][0].id == 1


@pytest.mark.usefixtures("app_ctx")
def test_get_query_for_fiscal_year_with_fiscal_year_not_found(client, loaded_db):
    stmt = ResearchProjectListAPI._get_query(2022)
    result = loaded_db.session.execute(stmt).fetchall()
    assert len(result) == 0


@pytest.mark.usefixtures("app_ctx")
def test_get_query_for_fiscal_year_with_portfolio_id_found(client, loaded_db):
    stmt = ResearchProjectListAPI._get_query(2023, 3)
    result = loaded_db.session.execute(stmt).fetchall()
    assert len(result) == 1
    assert result[0][0].title == "African American Child and Family Research Center"
    assert result[0][0].id == 1


@pytest.mark.usefixtures("app_ctx")
def test_get_query_for_fiscal_year_with_portfolio_id_not_found(client, loaded_db):
    stmt = ResearchProjectListAPI._get_query(2023, 1)
    result = loaded_db.session.execute(stmt).fetchall()
    assert len(result) == 0


@pytest.mark.usefixtures("app_ctx")
def test_research_project_no_cans(client, loaded_db):
    rp = ResearchProject(id=999, title="blah blah", portfolio_id=1)
    loaded_db.session.add(rp)

    response = client.get("/api/v1/research-projects/999")

    assert response.status_code == 200
    assert response.json["id"] == 999


def test_research_project_no_cans_with_query_string(client, loaded_db):
    response = client.get("/api/v1/research-projects/?fiscal_year=2023")

    assert response.status_code == 200
    assert len(response.json) == 1


def test_research_project_search(client, loaded_db):
    response = client.get("/api/v1/research-projects/?search=fa")

    assert response.status_code == 200
    assert len(response.json) == 2

    response = client.get("/api/v1/research-projects/?search=father")

    assert response.status_code == 200
    assert len(response.json) == 1

    response = client.get("/api/v1/research-projects/?search=ExCELS")

    assert response.status_code == 200
    assert len(response.json) == 1

    response = client.get("/api/v1/research-projects/?search=blah")

    assert response.status_code == 200
    assert len(response.json) == 0
