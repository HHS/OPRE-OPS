from decimal import Decimal

import pytest
from models.cans import CAN, BudgetLineItem, CANFiscalYear
from models.portfolios import Portfolio
from ops_api.ops.utils.portfolios import _get_total_fiscal_year_funding


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


@pytest.fixture()
@pytest.mark.usefixtures("app_ctx")
def db_loaded_with_data_for_total_fiscal_year_funding(app, loaded_db):
    with app.app_context():
        instances = []

        # simple case with 1 CAN and 1 BLI
        portfolio_100 = Portfolio(id=100, name="PORTFOLIO100")
        can_100 = CAN(id=100, number="CAN100")
        portfolio_100.cans.append(can_100)
        can_100_fy_2023 = CANFiscalYear(can=can_100, fiscal_year=2023, total_fiscal_year_funding=2.0)
        blin_1 = BudgetLineItem(id=100, amount=1.0)
        blin_1.can_fiscal_year = can_100_fy_2023

        instances.extend(
            [
                portfolio_100,
                can_100,
                can_100_fy_2023,
                blin_1,
            ]
        )

        loaded_db.session.add_all(instances)

        loaded_db.session.commit()
        yield loaded_db

        # Cleanup
        for instance in instances:
            loaded_db.session.delete(instance)
        loaded_db.session.commit()


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("db_loaded_with_data_for_total_fiscal_year_funding")
def test_get_research_project_funding_summary():
    result = _get_total_fiscal_year_funding(100, 2023)
    assert result == Decimal(2), "1 CFY in 2023 with $2"

    result = _get_total_fiscal_year_funding(100, 1900)
    assert result == Decimal(0), "No CFY"

    result = _get_total_fiscal_year_funding(1000, 2023)
    assert result == Decimal(0), "No Portfolio"
