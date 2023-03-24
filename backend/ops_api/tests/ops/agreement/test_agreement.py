import pytest
from models.cans import Agreement
from sqlalchemy import func, select


@pytest.mark.usefixtures("app_ctx")
def test_agreement_retrieve(loaded_db):
    stmt = select(Agreement).where(Agreement.id == 1)
    agreement = loaded_db.session.scalar(stmt)

    assert agreement is not None
    assert (
        agreement.name
        == "Contract #1: African American Child and Family Research Center"
    )
    assert agreement.id == 1


@pytest.mark.usefixtures("app_ctx")
def test_agreements_get_all(auth_client, loaded_db):
    stmt = select(func.count()).select_from(Agreement)
    count = loaded_db.session.scalar(stmt)
    assert count == 6

    response = auth_client.get("/api/v1/agreements/")
    assert response.status_code == 200
    assert len(response.json) == count


@pytest.mark.usefixtures("app_ctx")
def test_agreements_get_by_id(auth_client, loaded_db):
    response = auth_client.get("/api/v1/agreements/1")
    assert response.status_code == 200
    assert (
        response.json["name"]
        == "Contract #1: African American Child and Family Research Center"
    )


@pytest.mark.usefixtures("app_ctx")
def test_agreements_get_by_id_404(auth_client, loaded_db):
    response = auth_client.get("/api/v1/agreements/1000")
    assert response.status_code == 404


@pytest.mark.usefixtures("app_ctx")
def test_agreements_serialization(auth_client, loaded_db):
    response = auth_client.get("/api/v1/agreements/1")
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
def test_agreements_with_research_project_empty(auth_client, loaded_db):
    response = auth_client.get("/api/v1/agreements/?research_project_id=")
    assert response.status_code == 200
    assert len(response.json) == 6


@pytest.mark.usefixtures("app_ctx")
def test_agreements_with_research_project_found(auth_client, loaded_db):
    response = auth_client.get("/api/v1/agreements/?research_project_id=1")
    assert response.status_code == 200
    assert len(response.json) == 2

    assert response.json[0]["id"] == 1
    assert response.json[1]["id"] == 2


@pytest.mark.usefixtures("app_ctx")
def test_agreements_with_research_project_not_found(auth_client, loaded_db):
    response = auth_client.get("/api/v1/agreements/?research_project_id=1000")
    assert response.status_code == 200
    assert len(response.json) == 0


def test_agreement_search(auth_client, loaded_db):
    response = auth_client.get("/api/v1/agreements/?search=")

    assert response.status_code == 200
    assert len(response.json) == 0

    response = auth_client.get("/api/v1/agreements/?search=contract")

    assert response.status_code == 200
    assert len(response.json) == 2

    response = auth_client.get("/api/v1/agreements/?search=fcl")

    assert response.status_code == 200
    assert len(response.json) == 2


@pytest.mark.usefixtures("app_ctx")
def test_agreements_get_by_id_auth(client, loaded_db):
    response = client.get("/api/v1/agreements/1")
    assert response.status_code == 401


@pytest.mark.usefixtures("app_ctx")
def test_agreements_auth(client, loaded_db):
    response = client.get("/api/v1/agreements/")
    assert response.status_code == 401
