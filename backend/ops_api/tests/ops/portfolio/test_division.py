from ops.models.portfolios import Division
import pytest


@pytest.mark.usefixtures("app_ctx")
def test_division_lookup(loaded_db):
    division = loaded_db.session.query(Division).get(1)
    assert division is not None
    assert division.name == "Division-1"
    assert division.abbreviation == "DV1"


def test_division_create():
    division = Division(name="Division-3", abbreviation="DV3")
    assert division.to_dict()["name"] == "Division-3"
    assert division.to_dict()["abbreviation"] == "DV3"


@pytest.mark.usefixtures("app_ctx")
def test_get_divisions_list(client):
    response = client.get("/api/v1/divisions/")
    assert response.status_code == 200
    assert len(response.json) == 2


@pytest.mark.usefixtures("app_ctx")
def test_get_divisions_by_id(client):
    response = client.get("/api/v1/divisions/1")
    assert response.status_code == 200
    assert response.json["id"] == 1
