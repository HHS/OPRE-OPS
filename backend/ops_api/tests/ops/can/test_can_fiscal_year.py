import pytest
from models.cans import CANFiscalYear


@pytest.mark.usefixtures("app_ctx")
def test_can_fiscal_year_lookup(loaded_db):
    cfy = loaded_db.query(CANFiscalYear).filter(CANFiscalYear.can_id == 3, CANFiscalYear.fiscal_year == 2022).one()
    assert cfy is not None
    assert cfy.fiscal_year == 2022
    assert cfy.total_fiscal_year_funding == 7000000.00
    assert cfy.potential_additional_funding == 3000000.00
    assert cfy.can_lead is None
    assert cfy.notes == ""


def test_can_fiscal_year_create():
    cfy = CANFiscalYear(
        can_id=1,
        fiscal_year=2023,
        total_fiscal_year_funding=55000,
        potential_additional_funding=100,
        can_lead="Ralph",
        notes="all-the-notes!",
    )
    assert cfy.to_dict()["fiscal_year"] == 2023


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_can_get_can_fiscal_year_list(auth_client):
    response = auth_client.get("/api/v1/can-fiscal-year/")
    assert response.status_code == 200
    assert len(response.json) == 30
    assert response.json[0]["can_id"] == 1
    assert response.json[1]["can_id"] == 2
    assert response.json[2]["can_id"] == 3
    assert response.json[3]["can_id"] == 3
    assert response.json[4]["can_id"] == 3


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_can_get_can_fiscal_year_by_id(auth_client):
    response = auth_client.get("/api/v1/can-fiscal-year/1")
    assert response.status_code == 200
    assert len(response.json) == 1
    assert response.json[0]["can_id"] == 1


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_can_get_can_fiscal_year_by_year(auth_client):
    response = auth_client.get("/api/v1/can-fiscal-year/?year=2022")
    assert response.status_code == 200
    assert len(response.json) == 4
    assert response.json[0]["can_id"] == 3
    assert response.json[1]["can_id"] == 5


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_can_get_can_fiscal_year_by_can(auth_client):
    response = auth_client.get("/api/v1/can-fiscal-year/?can_id=1")
    assert response.status_code == 200
    assert len(response.json) == 1
    assert response.json[0]["can_id"] == 1


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_can_get_can_fiscal_year_by_can_and_year(auth_client):
    response = auth_client.get("/api/v1/can-fiscal-year/?can_id=3&year=2022")
    assert response.status_code == 200
    assert len(response.json) == 1
    assert response.json[0]["can_id"] == 3
