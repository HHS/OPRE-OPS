from datetime import date
from decimal import Decimal
from unittest.mock import patch

import pytest
from flask import url_for
from sqlalchemy import select

from models import CAN, BudgetLineItemStatus, CANFundingBudget, ContractBudgetLineItem, Portfolio
from ops_api.ops.utils.portfolios import (
    _get_all_budgets,
    _get_all_carry_forward_budgets,
    _get_all_new_funding_budgets,
    _get_budget_line_item_total_by_status,
    _get_carry_forward_total,
    _get_new_funding_total,
    _get_total_fiscal_year_funding,
    get_percentage,
    get_total_funding,
)


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
        "draft_funding": {"amount": 0.0, "percent": "0.0"},
        "total_funding": {"amount": 20000000.0, "percent": "Total"},
        "new_funding": {"amount": 0.0, "percent": "New"},
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
        "draft_funding": {"amount": 4.0, "percent": "0.0"},
        "total_funding": {"amount": 20000000.0, "percent": "Total"},
        "new_funding": {"amount": 0, "percent": "New"},
    }


def test_get_portfolio_6_funding_summary_2023(auth_client):
    fy = 2023
    portfolio_id = 6
    response = auth_client.get(f"/api/v1/portfolio-funding-summary/{portfolio_id}?fiscal_year={fy}")
    assert response.status_code == 200
    assert response.json == {
        "available_funding": {"amount": 34560000.0, "percent": "100.0"},
        "carry_forward_funding": {"amount": 11140000.0, "percent": "Carry-Forward"},
        "draft_funding": {"amount": 0.0, "percent": "0.0"},
        "in_execution_funding": {"amount": 0.0, "percent": "0.0"},
        "new_funding": {"amount": 23420000.0, "percent": "New"},
        "obligated_funding": {"amount": 0.0, "percent": "0.0"},
        "planned_funding": {"amount": 0.0, "percent": "0.0"},
        "total_funding": {"amount": 34560000.0, "percent": "Total"},
    }
    cf = response.json["carry_forward_funding"]["amount"]
    nf = response.json["new_funding"]["amount"]
    tf = response.json["total_funding"]["amount"]
    assert cf == _get_carry_forward_total(portfolio_id, fy)
    assert nf == _get_new_funding_total(portfolio_id, fy)
    assert tf == _get_total_fiscal_year_funding(portfolio_id, fy)
    assert tf == cf + nf


def test_2023_portfolio_6_new_vs_carry_forward_funding(loaded_db):
    fy = 2023
    nf_budgets = _get_all_new_funding_budgets(6, fy)
    cf_budgets = _get_all_carry_forward_budgets(6, fy)
    tf_budgets = _get_all_budgets(6, fy)

    # carry forward funding
    assert len(cf_budgets) == 2
    assert cf_budgets[0].budget == Decimal("10000000.0")
    assert cf_budgets[0].fiscal_year == fy
    assert cf_budgets[0].can.display_name == "G99XXX7"
    assert cf_budgets[0].can.funding_details.fiscal_year == 2022
    assert cf_budgets[0].can.active_period == 5

    assert cf_budgets[1].budget == Decimal("1140000.0")
    assert cf_budgets[1].fiscal_year == fy
    assert cf_budgets[1].can.display_name == "G994648"
    assert cf_budgets[1].can.funding_details.fiscal_year == 2021
    assert cf_budgets[1].can.active_period == 5

    # new funding
    assert len(nf_budgets) == 5
    assert nf_budgets[0].budget == Decimal("1140000.0")
    assert nf_budgets[0].fiscal_year == fy
    assert nf_budgets[0].can.display_name == "G99HRF2"
    assert nf_budgets[0].can.funding_details.fiscal_year == 2023
    assert nf_budgets[0].can.active_period == 1

    assert nf_budgets[1].budget == Decimal("10000000.0")
    assert nf_budgets[1].fiscal_year == fy
    assert nf_budgets[1].can.display_name == "G996125"
    assert nf_budgets[1].can.funding_details.fiscal_year == 2023
    assert nf_budgets[1].can.active_period == 1

    assert nf_budgets[2].budget == Decimal("10000000.0")
    assert nf_budgets[2].fiscal_year == fy
    assert nf_budgets[2].can.display_name == "G99XXX4"
    assert (
        nf_budgets[2].can.funding_details.fiscal_year == 2023
    )  # New because budget is in the CAN's appropriation year
    assert nf_budgets[2].can.active_period == 5

    assert nf_budgets[3].budget == Decimal("1140000.0")
    assert nf_budgets[3].fiscal_year == fy
    assert nf_budgets[3].can.display_name == "G99XXX1"
    assert nf_budgets[3].can.funding_details.fiscal_year == 2023
    assert nf_budgets[3].can.active_period == 1

    assert nf_budgets[4].budget == Decimal("1140000.0")
    assert nf_budgets[4].fiscal_year == fy
    assert nf_budgets[4].can.display_name == "G99XXX2"
    assert nf_budgets[4].can.funding_details.fiscal_year == 2023
    assert nf_budgets[4].can.active_period == 1

    assert len(tf_budgets) == 7
    assert len(tf_budgets) == len(cf_budgets) + len(nf_budgets)


# Tests for utils/portfolios.py
def test_get_all_budgets(loaded_db):
    assert len(_get_all_budgets(1, 2023)) == 2
    assert len(_get_all_budgets(1, 2022)) == 0
    assert len(_get_all_budgets(1, 2021)) == 2


def test_get_all_carry_forward_budgets(loaded_db):
    portfolio_one = _get_all_carry_forward_budgets(1, 2023)
    assert len(portfolio_one) == 2
    assert portfolio_one[0].fiscal_year == portfolio_one[1].fiscal_year == 2023
    assert portfolio_one[0].budget == portfolio_one[1].budget == Decimal("10000000.0")

    portfolio_six = _get_all_carry_forward_budgets(6, 2023)
    assert len(portfolio_six) == 2
    assert portfolio_six[0].fiscal_year == portfolio_six[1].fiscal_year == 2023
    assert portfolio_six[0].budget == Decimal("10000000.0")
    assert portfolio_six[1].budget == Decimal("1140000.0")


def test_get_all_new_funding_budgets(loaded_db):
    assert len(_get_all_new_funding_budgets(1, 2023)) == 0

    result = _get_all_new_funding_budgets(1, 2021)
    assert len(result) == 2
    assert result[0].fiscal_year == result[1].fiscal_year == 2021
    assert result[0].budget == Decimal("200000.0")
    assert result[1].budget == Decimal("10000000.0")


def test_get_total_fiscal_year_funding(loaded_db):
    assert _get_total_fiscal_year_funding(1, 2023) == Decimal("20000000.0")


def test_get_carry_forward_total(loaded_db):
    portfolio_one_total = _get_carry_forward_total(1, 2023)
    portfolio_six_total = _get_carry_forward_total(6, 2023)
    assert portfolio_one_total == Decimal("20000000.0")
    assert portfolio_six_total == Decimal("11140000.0")


def test__get_new_funding_total(loaded_db):
    assert _get_new_funding_total(1, 2021) == Decimal("10200000.0")


def test_get_budget_line_item_total_by_status(loaded_db):
    assert _get_budget_line_item_total_by_status(2, 2043, BudgetLineItemStatus.PLANNED) == Decimal("1000000.0")
    assert _get_budget_line_item_total_by_status(2, 2043, BudgetLineItemStatus.DRAFT) == Decimal("3000000.0")
    assert _get_budget_line_item_total_by_status(2, 2043, BudgetLineItemStatus.IN_EXECUTION) == Decimal("2000000.00")


@pytest.fixture
def mock_portfolio():
    return Portfolio(name="Test Portfolio", abbreviation="TP", status="IN_PROCESS", division_id=1)


@patch("ops_api.ops.utils.portfolios._get_total_fiscal_year_funding", return_value=100000)
@patch("ops_api.ops.utils.portfolios._get_carry_forward_total", return_value=5000)
@patch("ops_api.ops.utils.portfolios._get_new_funding_total", return_value=5000)
@patch(
    "ops_api.ops.utils.portfolios._get_budget_line_item_total_by_status",
    side_effect=lambda portfolio_id, fiscal_year, status: {
        BudgetLineItemStatus.DRAFT: 10000,
        BudgetLineItemStatus.PLANNED: 30000,
        BudgetLineItemStatus.OBLIGATED: 20000,
        BudgetLineItemStatus.IN_EXECUTION: 5000,
    }.get(status),
)
def test_get_total_funding_all_values(mock_total_funding, mock_carry_forward, mock_budget_line_items, mock_portfolio):
    result = get_total_funding(mock_portfolio, 2025)

    assert result["total_funding"]["amount"] == 100000
    assert result["carry_forward_funding"]["amount"] == 5000
    assert result["draft_funding"]["amount"] == 10000
    assert result["planned_funding"]["amount"] == 30000
    assert result["obligated_funding"]["amount"] == 20000
    assert result["in_execution_funding"]["amount"] == 5000
    assert result["available_funding"]["amount"] == 45000  # 100000 - (30000 + 20000 + 5000)
    assert result["new_funding"]["amount"] == 5000


@patch("ops_api.ops.utils.portfolios._get_total_fiscal_year_funding", return_value=0)
@patch("ops_api.ops.utils.portfolios._get_carry_forward_total", return_value=0)
@patch("ops_api.ops.utils.portfolios._get_new_funding_total", return_value=0)
@patch(
    "ops_api.ops.utils.portfolios._get_budget_line_item_total_by_status",
    side_effect=lambda portfolio_id, fiscal_year, status: 0,
)
def test_get_total_funding_zero_values(mock_total_funding, mock_carry_forward, mock_budget_line_items, mock_portfolio):
    result = get_total_funding(mock_portfolio, 2025)

    assert result["total_funding"]["amount"] == 0
    assert result["carry_forward_funding"]["amount"] == 0
    assert result["draft_funding"]["amount"] == 0
    assert result["planned_funding"]["amount"] == 0
    assert result["obligated_funding"]["amount"] == 0
    assert result["in_execution_funding"]["amount"] == 0
    assert result["available_funding"]["amount"] == 0
    assert result["new_funding"]["amount"] == 0


@patch("ops_api.ops.utils.portfolios._get_total_fiscal_year_funding", return_value=100000)
@patch("ops_api.ops.utils.portfolios._get_carry_forward_total", return_value=10000)
@patch("ops_api.ops.utils.portfolios._get_new_funding_total", return_value=90000)
@patch(
    "ops_api.ops.utils.portfolios._get_budget_line_item_total_by_status",
    side_effect=lambda portfolio_id, fiscal_year, status: {
        BudgetLineItemStatus.DRAFT: 10000,
        BudgetLineItemStatus.PLANNED: 20000,
        BudgetLineItemStatus.OBLIGATED: 15000,
        BudgetLineItemStatus.IN_EXECUTION: 5000,
    }.get(status),
)
def test_get_total_funding_percentage(mock_total_funding, mock_carry_forward, mock_budget_line_items, mock_portfolio):
    result = get_total_funding(mock_portfolio, 2025)

    assert result["draft_funding"]["percent"] == "10.0"
    assert result["planned_funding"]["percent"] == "20.0"
    assert result["obligated_funding"]["percent"] == "15.0"
    assert result["in_execution_funding"]["percent"] == "5.0"
    assert result["available_funding"]["percent"] == "60.0"
    assert result["new_funding"]["percent"] == "New"
    assert result["carry_forward_funding"]["percent"] == "Carry-Forward"
    assert result["total_funding"]["percent"] == "Total"


def test_get_percentage():
    test_cases = [
        (Decimal("1000.00"), Decimal("250.00"), "25.0"),
        (Decimal("0.00"), Decimal("250.00"), "0"),
        (Decimal("1000.00"), Decimal("1000.00"), "100.0"),
        (Decimal("1000.00"), Decimal("0.00"), "0.0"),
        (Decimal("1000000000.00"), Decimal("500000000.00"), "50.0"),
        (Decimal("0.001"), Decimal("0.0005"), "50.0"),
        (Decimal("1000000000.00"), Decimal("123456789.987654"), "12.0"),
    ]

    for total_funding, specific_funding, expected in test_cases:
        result = get_percentage(total_funding, specific_funding)
        assert result == expected, f"Failed for {total_funding}, {specific_funding}: expected {expected}, got {result}"


def test_cans_for_child_care_fiscal_year_2027(auth_client):
    response = auth_client.get("/api/v1/portfolio-funding-summary/3?fiscal_year=2027")
    assert response.json["carry_forward_funding"]["amount"] == response.json["total_funding"]["amount"] == 500000.0
