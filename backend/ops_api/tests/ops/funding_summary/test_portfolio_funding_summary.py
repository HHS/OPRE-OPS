from datetime import date
from decimal import Decimal

import pytest
from flask import url_for
from sqlalchemy import select

from models import CAN, BudgetLineItem, BudgetLineItemStatus, CANFundingBudget, Portfolio


@pytest.fixture()
@pytest.mark.usefixtures("app_ctx")
def db_loaded_with_data_for_total_fiscal_year_funding(app, loaded_db):
    portfolio = Portfolio(name="UNIT TEST PORTFOLIO", division_id=1)
    can = CAN(number="TEST_CAN")
    portfolio.cans.append(can)

    loaded_db.add(portfolio)
    loaded_db.commit()

    can_funding_budget = CANFundingBudget(
        can_id=can.id,
        fiscal_year=2023,
        budget=Decimal(20000000.0),
    )

    loaded_db.add(can_funding_budget)
    loaded_db.commit()

    blin_1 = BudgetLineItem(
        line_description="#1",
        amount=1.0,
        status=BudgetLineItemStatus.PLANNED,
        can_id=can.id,
        date_needed=date(2023, 1, 1),
    )
    blin_2 = BudgetLineItem(
        line_description="#2",
        amount=2.0,
        status=BudgetLineItemStatus.IN_EXECUTION,
        can_id=can.id,
        date_needed=date(2023, 1, 1),
    )
    blin_3 = BudgetLineItem(
        line_description="#3",
        amount=3.0,
        status=BudgetLineItemStatus.OBLIGATED,
        can_id=can.id,
        date_needed=date(2023, 1, 1),
    )
    blin_4 = BudgetLineItem(
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
    for obj in [portfolio, can, can_funding_budget, blin_1, blin_2, blin_3, blin_4]:
        loaded_db.delete(obj)
    loaded_db.commit()


@pytest.mark.usefixtures("app_ctx")
def test_get_portfolio_funding_summary(auth_client, db_loaded_with_data_for_total_fiscal_year_funding):
    response = auth_client.get(url_for("api.portfolio-funding-summary-item", id=1))
    assert response.status_code == 200
    assert response.json == {
        "available_funding": {"amount": 20000000.0, "percent": "100.0"},
        "carry_forward_funding": {"amount": 20000000.0, "percent": "Carry-Forward"},
        "in_execution_funding": {"amount": 0.0, "percent": "0.0"},
        "obligated_funding": {"amount": 0.0, "percent": "0.0"},
        "planned_funding": {"amount": 0.0, "percent": "0.0"},
        "total_funding": {"amount": 20000000.0, "percent": "Total"},
    }


@pytest.mark.usefixtures("app_ctx")
def test_get_portfolio_funding_summary_2023(auth_client, db_loaded_with_data_for_total_fiscal_year_funding):
    portfolio = db_loaded_with_data_for_total_fiscal_year_funding.execute(
        select(Portfolio).where(Portfolio.name == "UNIT TEST PORTFOLIO")
    ).scalar()
    response = auth_client.get(url_for("api.portfolio-funding-summary-item", id=portfolio.id, fiscal_year=2023))
    assert response.status_code == 200
    assert response.json == {
        "available_funding": {"amount": 19999994.0, "percent": "100.0"},
        "carry_forward_funding": {"amount": 0, "percent": "Carry-Forward"},
        "in_execution_funding": {"amount": 2.0, "percent": "0.0"},
        "obligated_funding": {"amount": 3.0, "percent": "0.0"},
        "planned_funding": {"amount": 1.0, "percent": "0.0"},
        "total_funding": {"amount": 20000000.0, "percent": "Total"},
    }
