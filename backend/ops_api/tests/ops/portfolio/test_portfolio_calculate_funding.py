from datetime import date
from decimal import Decimal

import pytest
from sqlalchemy import select

from models import (
    CAN,
    BudgetLineItemStatus,
    CANFundingBudget,
    CANFundingDetails,
    ContractBudgetLineItem,
    Portfolio,
)
from ops_api.ops.utils.portfolios import (
    _get_budget_line_item_total_by_status,
    _get_carry_forward_total,
    _get_total_fiscal_year_funding,
)


def test_portfolio_calc_funding_amounts_2022(auth_client, loaded_db, app_ctx):
    response = auth_client.get("/api/v1/portfolios/1/calcFunding/?fiscal_year=2022")

    assert response.status_code == 200
    assert response.json["total_funding"]["amount"] == 0.00
    assert response.json["available_funding"]["amount"] == 0.00
    assert response.json["in_execution_funding"]["amount"] == 0.00
    assert response.json["obligated_funding"]["amount"] == 0.00
    assert response.json["planned_funding"]["amount"] == 0.00
    assert response.json["carry_forward_funding"]["amount"] == 0.00


def test_portfolio_calc_funding_amounts_2023(auth_client, loaded_db, app_ctx):
    response = auth_client.get("/api/v1/portfolios/1/calcFunding/?fiscal_year=2023")

    assert response.status_code == 200
    assert response.json["total_funding"]["amount"] == 20000000.0
    assert response.json["available_funding"]["amount"] == 20000000.0
    assert response.json["in_execution_funding"]["amount"] == 0.00
    assert response.json["obligated_funding"]["amount"] == 0.00
    assert response.json["planned_funding"]["amount"] == 0.00
    assert response.json["carry_forward_funding"]["amount"] == 20000000.0


def test_portfolio_calc_funding_percents(auth_client, loaded_db, app_ctx):
    response = auth_client.get("/api/v1/portfolios/1/calcFunding/?fiscal_year=2023")
    assert response.status_code == 200
    assert response.json["available_funding"]["percent"] == "100.0"
    assert response.json["in_execution_funding"]["percent"] == "0.0"
    assert response.json["obligated_funding"]["percent"] == "0.0"
    assert response.json["planned_funding"]["percent"] == "0.0"


@pytest.fixture()
def db_loaded_with_data_for_total_fiscal_year_funding(app, loaded_db, app_ctx):
    # simple case with 1 CAN and 1 BLI
    portfolio = Portfolio(name="UNIT TEST PORTFOLIO", division_id=1)
    can = CAN(number="TEST_CAN")
    portfolio.cans.append(can)

    loaded_db.add(portfolio)
    loaded_db.commit()

    can_funding_details = CANFundingDetails(
        fiscal_year=2023,
        fund_code="BBXXXX20231DAD",
    )
    can.funding_details = can_funding_details
    loaded_db.add(can_funding_details)
    loaded_db.commit()

    can_funding_budget = CANFundingBudget(
        can_id=can.id,
        fiscal_year=2023,
        budget=Decimal(20000000.0),
    )

    loaded_db.add(can_funding_budget)
    loaded_db.commit()

    blin_1 = ContractBudgetLineItem(
        line_description="#1",
        amount=1.0,
        status=BudgetLineItemStatus.PLANNED,
        can_id=can.id,
        date_needed=date(2023, 1, 1),
    )
    blin_2 = ContractBudgetLineItem(
        line_description="#2",
        amount=2.0,
        status=BudgetLineItemStatus.IN_EXECUTION,
        can_id=can.id,
        date_needed=date(2023, 1, 1),
    )
    blin_3 = ContractBudgetLineItem(
        line_description="#3",
        amount=3.0,
        status=BudgetLineItemStatus.OBLIGATED,
        can_id=can.id,
        date_needed=date(2023, 1, 1),
    )
    blin_4 = ContractBudgetLineItem(
        line_description="#4",
        amount=4.0,
        status=BudgetLineItemStatus.DRAFT,
        can_id=can.id,
        date_needed=date(2023, 1, 1),
    )
    loaded_db.add_all([blin_1, blin_2, blin_3, blin_4])
    loaded_db.commit()

    yield loaded_db

    # Cleanup
    loaded_db.rollback()
    for obj in [
        portfolio,
        can,
        can_funding_budget,
        can_funding_details,
        blin_1,
        blin_2,
        blin_3,
        blin_4,
    ]:
        loaded_db.delete(obj)
    loaded_db.commit()


def test_get_total_fiscal_year_funding(db_loaded_with_data_for_total_fiscal_year_funding, app_ctx):
    # get Portfolio for test
    stmt = select(Portfolio).where(Portfolio.name == "UNIT TEST PORTFOLIO")
    portfolio = db_loaded_with_data_for_total_fiscal_year_funding.execute(stmt).scalar()

    result = _get_total_fiscal_year_funding(portfolio.id, 2023)
    assert result == Decimal(20000000), "Funding for 2023 is 20,000,000"

    result = _get_total_fiscal_year_funding(portfolio.id, 1900)
    assert result == Decimal(0), "No funding"

    result = _get_total_fiscal_year_funding(1000, 2023)
    assert result == Decimal(0), "No Portfolio"


def test_get_carry_forward_total(db_loaded_with_data_for_total_fiscal_year_funding, app_ctx):
    # get Portfolio for test
    stmt = select(Portfolio).where(Portfolio.name == "UNIT TEST PORTFOLIO")
    portfolio = db_loaded_with_data_for_total_fiscal_year_funding.execute(stmt).scalar()

    result = _get_carry_forward_total(portfolio.id, 2023)
    assert result == Decimal(0), "No funding"

    result = _get_carry_forward_total(portfolio.id, 1900)
    assert result == Decimal(0), "No funding"

    result = _get_carry_forward_total(1000, 2023)
    assert result == Decimal(0), "No Portfolio"


def test_get_budget_line_item_total_draft(db_loaded_with_data_for_total_fiscal_year_funding, app_ctx):
    # get Portfolio for test
    stmt = select(Portfolio).where(Portfolio.name == "UNIT TEST PORTFOLIO")
    portfolio = db_loaded_with_data_for_total_fiscal_year_funding.execute(stmt).scalar()

    result = _get_budget_line_item_total_by_status(portfolio.id, 2023, BudgetLineItemStatus.DRAFT)
    assert result == Decimal(4), "$4 Planned"

    result = _get_budget_line_item_total_by_status(1000, 2023, BudgetLineItemStatus.DRAFT)
    assert result == Decimal(0), "No Portfolio"


def test_get_budget_line_item_total_planned(db_loaded_with_data_for_total_fiscal_year_funding, app_ctx):
    # get Portfolio for test
    stmt = select(Portfolio).where(Portfolio.name == "UNIT TEST PORTFOLIO")
    portfolio = db_loaded_with_data_for_total_fiscal_year_funding.execute(stmt).scalar()

    result = _get_budget_line_item_total_by_status(portfolio.id, 2023, BudgetLineItemStatus.PLANNED)
    assert result == Decimal(1), "$1 Planned"

    result = _get_budget_line_item_total_by_status(1000, 2023, BudgetLineItemStatus.PLANNED)
    assert result == Decimal(0), "No Portfolio"


def test_get_budget_line_item_total_in_execution(db_loaded_with_data_for_total_fiscal_year_funding, app_ctx):
    # get Portfolio for test
    stmt = select(Portfolio).where(Portfolio.name == "UNIT TEST PORTFOLIO")
    portfolio = db_loaded_with_data_for_total_fiscal_year_funding.execute(stmt).scalar()

    result = _get_budget_line_item_total_by_status(portfolio.id, 2023, BudgetLineItemStatus.IN_EXECUTION)
    assert result == Decimal(2), "$2 in Execution"

    result = _get_budget_line_item_total_by_status(1000, 2023, BudgetLineItemStatus.IN_EXECUTION)
    assert result == Decimal(0), "No Portfolio"


def test_get_budget_line_item_total_obligated(db_loaded_with_data_for_total_fiscal_year_funding, app_ctx):
    # get Portfolio for test
    stmt = select(Portfolio).where(Portfolio.name == "UNIT TEST PORTFOLIO")
    portfolio = db_loaded_with_data_for_total_fiscal_year_funding.execute(stmt).scalar()

    result = _get_budget_line_item_total_by_status(portfolio.id, 2023, BudgetLineItemStatus.OBLIGATED)
    assert result == Decimal(3), "$3 Obligated"

    result = _get_budget_line_item_total_by_status(1000, 2023, BudgetLineItemStatus.OBLIGATED)
    assert result == Decimal(0), "No Portfolio"
