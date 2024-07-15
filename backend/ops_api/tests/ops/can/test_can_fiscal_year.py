import pytest
from sqlalchemy import select

from models.cans import CANFiscalYear


@pytest.mark.usefixtures("app_ctx")
def test_can_fiscal_year_lookup(loaded_db):
    # cfy = loaded_db.query(CANFiscalYear).filter(CANFiscalYear.can_id == 3, CANFiscalYear.fiscal_year == 2022).one()
    cfy = loaded_db.execute(
        select(CANFiscalYear).where(CANFiscalYear.can_id == 502, CANFiscalYear.fiscal_year == 2022)
    ).scalar()
    assert cfy is not None
    assert cfy.fiscal_year == 2022
    assert cfy.total_funding == 7000000.00
    assert cfy.potential_additional_funding == 3000000.00
    assert cfy.notes == ""
    assert cfy.display_name == "G99PHS9:2022"


@pytest.mark.usefixtures("loaded_db")
def test_can_fiscal_year_create():
    cfy = CANFiscalYear(
        can_id=1,
        fiscal_year=2023,
        received_funding=100,
        expected_funding=200,
        potential_additional_funding=100,
        notes="all-the-notes!",
    )
    assert cfy.to_dict()["fiscal_year"] == 2023


def test_can_get_can_fiscal_year_list(auth_client, loaded_db):
    count = loaded_db.query(CANFiscalYear).count()
    response = auth_client.get("/api/v1/can-fiscal-year/")
    assert response.status_code == 200
    assert len(response.json) == count
    assert response.json[0]["can_id"] == 500
    assert response.json[1]["can_id"] == 501
    assert response.json[2]["can_id"] == 502
    assert response.json[3]["can_id"] == 502
    assert response.json[4]["can_id"] == 502


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_can_get_can_fiscal_year_by_id(auth_client, test_can):
    response = auth_client.get(f"/api/v1/can-fiscal-year/{test_can.id}")
    assert response.status_code == 200
    assert len(response.json) == 1
    assert response.json[0]["can_id"] == test_can.id


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_can_get_can_fiscal_year_by_year(auth_client):
    response = auth_client.get("/api/v1/can-fiscal-year/?year=2022")
    assert response.status_code == 200
    assert len(response.json) == 4
    assert response.json[0]["can_id"] == 502
    assert response.json[1]["can_id"] == 504


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_can_get_can_fiscal_year_by_can(auth_client, test_can):
    response = auth_client.get(f"/api/v1/can-fiscal-year/?can_id={test_can.id}")
    assert response.status_code == 200
    assert len(response.json) == 1
    assert response.json[0]["can_id"] == test_can.id


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_can_get_can_fiscal_year_by_can_and_year(auth_client):
    response = auth_client.get("/api/v1/can-fiscal-year/?can_id=502&year=2022")
    assert response.status_code == 200
    assert len(response.json) == 1
    assert response.json[0]["can_id"] == 502
