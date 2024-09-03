from decimal import Decimal

import pytest
from sqlalchemy import select

from models import CAN, BudgetLineItem, BudgetLineItemStatus, Portfolio, PortfolioStatus
from ops_api.ops.utils.portfolios import (
    _get_budget_line_item_total_by_status,
    _get_carry_forward_total,
    _get_total_fiscal_year_funding,
)


@pytest.mark.usefixtures("app_ctx")
def test_portfolio_retrieve(loaded_db):
    portfolio = loaded_db.query(Portfolio).filter(Portfolio.name == "Child Care").one()

    assert portfolio is not None
    assert portfolio.name == "Child Care"
    assert portfolio.status == PortfolioStatus.IN_PROCESS
    assert portfolio.display_name == portfolio.name


@pytest.mark.usefixtures("app_ctx")
def test_portfolio_get_all(auth_client, loaded_db):
    num_portfolios = loaded_db.query(Portfolio).count()

    response = auth_client.get("/api/v1/portfolios/")
    assert response.status_code == 200
    assert len(response.json) == num_portfolios


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
    assert response.json["carry_forward_funding"]["amount"] == 0.00


@pytest.mark.usefixtures("app_ctx")
def test_portfolio_calc_funding_amounts_2023(auth_client, loaded_db):
    response = auth_client.get("/api/v1/portfolios/1/calcFunding/?fiscal_year=2023")

    assert response.status_code == 200
    assert response.json["total_funding"]["amount"] == 20000000.0
    assert response.json["available_funding"]["amount"] == 20000000.0
    assert response.json["in_execution_funding"]["amount"] == 0.00
    assert response.json["obligated_funding"]["amount"] == 0.00
    assert response.json["planned_funding"]["amount"] == 0.00
    assert response.json["carry_forward_funding"]["amount"] == 20000000.0


@pytest.mark.usefixtures("app_ctx")
def test_portfolio_calc_funding_percents(auth_client, loaded_db):
    response = auth_client.get("/api/v1/portfolios/1/calcFunding/?fiscal_year=2023")
    assert response.status_code == 200
    assert response.json["available_funding"]["percent"] == "100.0"
    assert response.json["in_execution_funding"]["percent"] == "0.0"
    assert response.json["obligated_funding"]["percent"] == "0.0"
    assert response.json["planned_funding"]["percent"] == "0.0"


@pytest.mark.usefixtures("app_ctx")
def test_portfolio_nested_members(auth_client, loaded_db):
    response = auth_client.get("/api/v1/portfolios/1")
    assert response.status_code == 200
    assert len(response.json["cans"]) == 2
    assert len(response.json["team_leaders"]) == 1
    assert response.json["status"] == "IN_PROCESS"


@pytest.fixture()
@pytest.mark.usefixtures("app_ctx")
def db_loaded_with_data_for_total_fiscal_year_funding(app, loaded_db):
    # simple case with 1 CAN and 1 BLI
    portfolio = Portfolio(name="UNIT TEST PORTFOLIO", division_id=1)
    can = CAN(number="TEST_CAN")
    portfolio.cans.append(can)

    loaded_db.add(portfolio)
    loaded_db.commit()

    # cfy = CANFiscalYear(can_id=can.id, fiscal_year=2023, expected_funding=2.0)

    blin_1 = BudgetLineItem(
        line_description="#1",
        amount=1.0,
        status=BudgetLineItemStatus.PLANNED,
        can_id=can.id,
    )
    blin_2 = BudgetLineItem(
        line_description="#2",
        amount=2.0,
        status=BudgetLineItemStatus.IN_EXECUTION,
        can_id=can.id,
    )
    blin_3 = BudgetLineItem(
        line_description="#3",
        amount=3.0,
        status=BudgetLineItemStatus.OBLIGATED,
        can_id=can.id,
    )
    loaded_db.add_all([blin_1, blin_2, blin_3])
    loaded_db.commit()

    yield loaded_db

    # Cleanup
    loaded_db.rollback()
    for obj in [portfolio, can, blin_1, blin_2, blin_3]:
        loaded_db.delete(obj)
    loaded_db.commit()


@pytest.mark.usefixtures("app_ctx")
def test_get_total_fiscal_year_funding(
    db_loaded_with_data_for_total_fiscal_year_funding,
):
    # get Portfolio for test
    stmt = select(Portfolio).where(Portfolio.name == "UNIT TEST PORTFOLIO")
    portfolio = db_loaded_with_data_for_total_fiscal_year_funding.execute(stmt).scalar()

    result = _get_total_fiscal_year_funding(portfolio.id, 2023)
    assert result == Decimal(0), "No funding"

    result = _get_total_fiscal_year_funding(portfolio.id, 1900)
    assert result == Decimal(0), "No funding"

    result = _get_total_fiscal_year_funding(1000, 2023)
    assert result == Decimal(0), "No Portfolio"


@pytest.mark.usefixtures("app_ctx")
def test_get_carry_forward_total(db_loaded_with_data_for_total_fiscal_year_funding):
    # get Portfolio for test
    stmt = select(Portfolio).where(Portfolio.name == "UNIT TEST PORTFOLIO")
    portfolio = db_loaded_with_data_for_total_fiscal_year_funding.execute(stmt).scalar()

    result = _get_carry_forward_total(portfolio.id, 2023)
    assert result == Decimal(0), "No funding"

    result = _get_carry_forward_total(portfolio.id, 1900)
    assert result == Decimal(0), "No funding"

    result = _get_carry_forward_total(1000, 2023)
    assert result == Decimal(0), "No Portfolio"


@pytest.mark.usefixtures("app_ctx")
def test_get_budget_line_item_total_planned(
    db_loaded_with_data_for_total_fiscal_year_funding,
):
    # get Portfolio for test
    stmt = select(Portfolio).where(Portfolio.name == "UNIT TEST PORTFOLIO")
    portfolio = db_loaded_with_data_for_total_fiscal_year_funding.execute(stmt).scalar()

    result = _get_budget_line_item_total_by_status(portfolio.id, 2023, BudgetLineItemStatus.PLANNED)
    assert result == Decimal(0), "Nothing Planned"

    result = _get_budget_line_item_total_by_status(1000, 2023, BudgetLineItemStatus.PLANNED)
    assert result == Decimal(0), "No Portfolio"


@pytest.mark.usefixtures("app_ctx")
def test_get_budget_line_item_total_in_execution(
    db_loaded_with_data_for_total_fiscal_year_funding,
):
    # get Portfolio for test
    stmt = select(Portfolio).where(Portfolio.name == "UNIT TEST PORTFOLIO")
    portfolio = db_loaded_with_data_for_total_fiscal_year_funding.execute(stmt).scalar()

    result = _get_budget_line_item_total_by_status(portfolio.id, 2023, BudgetLineItemStatus.IN_EXECUTION)
    assert result == Decimal(0), "Nothing In Execution"

    result = _get_budget_line_item_total_by_status(1000, 2023, BudgetLineItemStatus.IN_EXECUTION)
    assert result == Decimal(0), "No Portfolio"


@pytest.mark.usefixtures("app_ctx")
def test_get_budget_line_item_total_obligated(
    db_loaded_with_data_for_total_fiscal_year_funding,
):
    # get Portfolio for test
    stmt = select(Portfolio).where(Portfolio.name == "UNIT TEST PORTFOLIO")
    portfolio = db_loaded_with_data_for_total_fiscal_year_funding.execute(stmt).scalar()

    result = _get_budget_line_item_total_by_status(portfolio.id, 2023, BudgetLineItemStatus.OBLIGATED)
    assert result == Decimal(0), "Nothing Obligated"

    result = _get_budget_line_item_total_by_status(1000, 2023, BudgetLineItemStatus.OBLIGATED)
    assert result == Decimal(0), "No Portfolio"
