import pytest
from models.portfolios import Portfolio


@pytest.mark.usefixtures("app_ctx")
def test_portfolio_retrieve(loaded_db):
    portfolio = loaded_db.session.query(Portfolio).filter(Portfolio.name == "Child Care").one()

    assert portfolio is not None
    assert portfolio.name == "Child Care"
    assert portfolio.status_id == 1


@pytest.mark.usefixtures("app_ctx")
def test_portfolio_get_all(auth_client, loaded_db):
    assert loaded_db.session.query(Portfolio).count() == 8

    response = auth_client.get("/api/v1/portfolios/")
    assert response.status_code == 200
    assert len(response.json) == 8


@pytest.mark.usefixtures("app_ctx")
def test_portfolio_get_by_id(auth_client, loaded_db):
    response = auth_client.get("/api/v1/portfolios/1")
    assert response.status_code == 200
    assert response.json["name"] == "Child Welfare Research"


@pytest.mark.usefixtures("app_ctx")
def test_portfolio_get_by_id_404(auth_client, loaded_db):
    response = auth_client.get("/api/v1/portfolios/10000000")
    assert response.status_code == 404


@pytest.mark.usefixtures("app_ctx")
def test_portfolio_calc_funding_amounts_2022(auth_client, loaded_db):
    response = auth_client.get("/api/v1/portfolios/1/calcFunding/?fiscal_year=2022")

    assert response.status_code == 200
    assert response.json["total_funding"]["amount"] == 0.00
    assert response.json["available_funding"]["amount"] == 0.00
    assert response.json["in_execution_funding"]["amount"] == 0.00
    assert response.json["obligated_funding"]["amount"] == 0.00
    assert response.json["planned_funding"]["amount"] == 0.00
    assert response.json["carry_over_funding"]["amount"] == 0.00


@pytest.mark.usefixtures("app_ctx")
def test_portfolio_calc_funding_amounts_2023(auth_client, loaded_db):
    response = auth_client.get("/api/v1/portfolios/1/calcFunding/?fiscal_year=2023")

    assert response.status_code == 200
    assert response.json["total_funding"]["amount"] == 20000000.0
    assert response.json["available_funding"]["amount"] == 12000000.0
    assert response.json["in_execution_funding"]["amount"] == 4000000.0
    assert response.json["obligated_funding"]["amount"] == 3000000.00
    assert response.json["planned_funding"]["amount"] == 1000000.0
    assert response.json["carry_over_funding"]["amount"] == 0.0


@pytest.mark.usefixtures("app_ctx")
def test_portfolio_calc_funding_percents(auth_client, loaded_db):
    response = auth_client.get("/api/v1/portfolios/1/calcFunding/?fiscal_year=2023")
    assert response.status_code == 200
    assert response.json["available_funding"]["percent"] == "60.0"
    assert response.json["in_execution_funding"]["percent"] == "20.0"
    assert response.json["obligated_funding"]["percent"] == "15.0"
    assert response.json["planned_funding"]["percent"] == "5.0"


@pytest.mark.usefixtures("app_ctx")
def test_portfolio_nested_members(auth_client, loaded_db):
    response = auth_client.get("/api/v1/portfolios/1")
    assert response.status_code == 200
    assert len(response.json["cans"]) == 2
    assert len(response.json["team_leaders"]) == 1
    assert response.json["status"] == "Active"
