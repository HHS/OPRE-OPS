from datetime import date
from decimal import Decimal
from unittest.mock import patch

import pytest
from flask import url_for
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
def db_loaded_with_data_for_total_fiscal_year_funding(app, loaded_db, app_ctx):
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


def test_get_portfolio_funding_summary(auth_client, db_loaded_with_data_for_total_fiscal_year_funding, app_ctx):
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


def test_get_portfolio_funding_summary_2023(auth_client, db_loaded_with_data_for_total_fiscal_year_funding, app_ctx):
    portfolio = db_loaded_with_data_for_total_fiscal_year_funding.execute(
        select(Portfolio).where(Portfolio.name == "UNIT TEST PORTFOLIO")
    ).scalar()
    response = auth_client.get(url_for("api.portfolio-funding-summary-item", id=portfolio.id, fiscal_year=2023))
    assert response.status_code == 200
    assert response.json == {
        "available_funding": {"amount": 19999994.0, "percent": "100.0"},
        "carry_forward_funding": {"amount": 0.0, "percent": "Carry-Forward"},
        "draft_funding": {"amount": 4.0, "percent": "0.0"},
        "in_execution_funding": {"amount": 2.0, "percent": "0.0"},
        "new_funding": {"amount": 20000000.0, "percent": "New"},
        "obligated_funding": {"amount": 3.0, "percent": "0.0"},
        "planned_funding": {"amount": 1.0, "percent": "0.0"},
        "total_funding": {"amount": 20000000.0, "percent": "Total"},
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
    assert _get_budget_line_item_total_by_status(2, 2043, BudgetLineItemStatus.PLANNED) == Decimal("74350979.00000")
    assert _get_budget_line_item_total_by_status(2, 2043, BudgetLineItemStatus.DRAFT) == Decimal("76425974.00000")
    assert _get_budget_line_item_total_by_status(2, 2043, BudgetLineItemStatus.IN_EXECUTION) == Decimal("30373692.00")


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


# Tests for Portfolio Funding Summary List API (Batch Endpoint)


def test_get_portfolio_funding_summary_list_returns_all_portfolios(auth_client, loaded_db, app_ctx):
    """Test GET /portfolio-funding-summary/ returns all portfolios with funding"""
    response = auth_client.get(url_for("api.portfolio-funding-summary-list"))

    assert response.status_code == 200
    assert "portfolios" in response.json
    assert len(response.json["portfolios"]) > 0

    # Verify structure of first portfolio
    first_portfolio = response.json["portfolios"][0]
    assert "id" in first_portfolio
    assert "name" in first_portfolio
    assert "abbreviation" in first_portfolio
    assert "division_id" in first_portfolio
    assert "division" in first_portfolio
    assert "total_funding" in first_portfolio
    assert "available_funding" in first_portfolio
    assert "planned_funding" in first_portfolio
    assert "obligated_funding" in first_portfolio
    assert "in_execution_funding" in first_portfolio


def test_get_portfolio_funding_summary_list_with_fiscal_year(auth_client, loaded_db, app_ctx):
    """Test fiscal_year parameter filters correctly"""
    response = auth_client.get(url_for("api.portfolio-funding-summary-list", fiscal_year=2023))

    assert response.status_code == 200
    assert "portfolios" in response.json
    # Should return portfolios with 2023 funding data
    assert len(response.json["portfolios"]) > 0


def test_get_portfolio_funding_summary_list_filter_by_portfolio_ids(auth_client, loaded_db, app_ctx):
    """Test portfolio_ids filter returns only specified portfolios"""
    # Request specific portfolio IDs - pass as list for repeated query params
    response = auth_client.get(url_for("api.portfolio-funding-summary-list", portfolio_ids=[1, 3, 6]))

    assert response.status_code == 200
    portfolios = response.json["portfolios"]

    # Should only return requested portfolios
    returned_ids = [p["id"] for p in portfolios]
    assert set(returned_ids).issubset({1, 3, 6})
    assert len(portfolios) <= 3


def test_get_portfolio_funding_summary_list_filter_by_budget_min(auth_client, loaded_db, app_ctx):
    """Test budget_min filter"""
    budget_min = 10000000  # 10M
    response = auth_client.get(url_for("api.portfolio-funding-summary-list", fiscal_year=2023, budget_min=budget_min))

    assert response.status_code == 200
    portfolios = response.json["portfolios"]

    # All returned portfolios should have total_funding >= budget_min
    for portfolio in portfolios:
        total_amount = portfolio["total_funding"]["amount"]
        assert total_amount >= budget_min


def test_get_portfolio_funding_summary_list_filter_by_budget_max(auth_client, loaded_db, app_ctx):
    """Test budget_max filter"""
    budget_max = 50000000  # 50M
    response = auth_client.get(url_for("api.portfolio-funding-summary-list", fiscal_year=2023, budget_max=budget_max))

    assert response.status_code == 200
    portfolios = response.json["portfolios"]

    # All returned portfolios should have total_funding <= budget_max
    for portfolio in portfolios:
        total_amount = portfolio["total_funding"]["amount"]
        assert total_amount <= budget_max


def test_get_portfolio_funding_summary_list_filter_by_budget_range(auth_client, loaded_db, app_ctx):
    """Test budget_min and budget_max together"""
    budget_min = 10000000  # 10M
    budget_max = 50000000  # 50M
    response = auth_client.get(
        url_for(
            "api.portfolio-funding-summary-list",
            fiscal_year=2023,
            budget_min=budget_min,
            budget_max=budget_max,
        )
    )

    assert response.status_code == 200
    portfolios = response.json["portfolios"]

    # All returned portfolios should have total_funding in range
    for portfolio in portfolios:
        total_amount = portfolio["total_funding"]["amount"]
        assert budget_min <= total_amount <= budget_max


def test_get_portfolio_funding_summary_list_filter_by_available_pct_over90(auth_client, loaded_db, app_ctx):
    """Test available_pct filter with 'over90' range"""
    response = auth_client.get(url_for("api.portfolio-funding-summary-list", fiscal_year=2023, available_pct="over90"))

    assert response.status_code == 200
    portfolios = response.json["portfolios"]

    # All returned portfolios should have available % >= 90
    for portfolio in portfolios:
        available = portfolio["available_funding"]["amount"]
        total = portfolio["total_funding"]["amount"]
        if total > 0:
            available_pct = (available / total) * 100
            assert available_pct >= 90


def test_get_portfolio_funding_summary_list_filter_by_available_pct_75_90(auth_client, loaded_db, app_ctx):
    """Test available_pct filter with '75-90' range"""
    response = auth_client.get(url_for("api.portfolio-funding-summary-list", fiscal_year=2023, available_pct="75-90"))

    assert response.status_code == 200
    portfolios = response.json["portfolios"]

    # All returned portfolios should have available % between 75 (inclusive) and 90 (exclusive)
    for portfolio in portfolios:
        available = portfolio["available_funding"]["amount"]
        total = portfolio["total_funding"]["amount"]
        if total > 0:
            available_pct = (available / total) * 100
            assert 75 <= available_pct < 90


def test_get_portfolio_funding_summary_list_filter_by_available_pct_50_75(auth_client, loaded_db, app_ctx):
    """Test available_pct filter with '50-75' range"""
    response = auth_client.get(url_for("api.portfolio-funding-summary-list", fiscal_year=2023, available_pct="50-75"))

    assert response.status_code == 200
    portfolios = response.json["portfolios"]

    # All returned portfolios should have available % between 50-75
    for portfolio in portfolios:
        available = portfolio["available_funding"]["amount"]
        total = portfolio["total_funding"]["amount"]
        if total > 0:
            available_pct = (available / total) * 100
            assert 50 <= available_pct < 75


def test_get_portfolio_funding_summary_list_filter_by_available_pct_25_50(auth_client, loaded_db, app_ctx):
    """Test available_pct filter with '25-50' range"""
    response = auth_client.get(url_for("api.portfolio-funding-summary-list", fiscal_year=2023, available_pct="25-50"))

    assert response.status_code == 200
    portfolios = response.json["portfolios"]

    # All returned portfolios should have available % between 25-50
    for portfolio in portfolios:
        available = portfolio["available_funding"]["amount"]
        total = portfolio["total_funding"]["amount"]
        if total > 0:
            available_pct = (available / total) * 100
            assert 25 <= available_pct < 50


def test_get_portfolio_funding_summary_list_filter_by_available_pct_under25(auth_client, loaded_db, app_ctx):
    """Test available_pct filter with 'under25' range"""
    response = auth_client.get(url_for("api.portfolio-funding-summary-list", fiscal_year=2023, available_pct="under25"))

    assert response.status_code == 200
    portfolios = response.json["portfolios"]

    # All returned portfolios should have available % < 25
    for portfolio in portfolios:
        available = portfolio["available_funding"]["amount"]
        total = portfolio["total_funding"]["amount"]
        if total > 0:
            available_pct = (available / total) * 100
            assert available_pct < 25


def test_get_portfolio_funding_summary_list_filter_by_multiple_available_pct(auth_client, loaded_db, app_ctx):
    """Test available_pct filter with multiple ranges (OR logic)"""
    response = auth_client.get(
        url_for(
            "api.portfolio-funding-summary-list",
            fiscal_year=2023,
            available_pct=["over90", "75-90"],
        )
    )

    assert response.status_code == 200
    portfolios = response.json["portfolios"]

    # All returned portfolios should have available % > 75
    for portfolio in portfolios:
        available = portfolio["available_funding"]["amount"]
        total = portfolio["total_funding"]["amount"]
        if total > 0:
            available_pct = (available / total) * 100
            # Should match either over90 OR 75-90
            assert available_pct >= 75


def test_get_portfolio_funding_summary_list_combined_filters(auth_client, loaded_db, app_ctx):
    """Test combined filters (portfolio IDs + budget range + available %)"""
    response = auth_client.get(
        url_for(
            "api.portfolio-funding-summary-list",
            fiscal_year=2023,
            portfolio_ids=[1, 2, 3, 4, 5, 6],
            budget_min=1000000,
            budget_max=100000000,
            available_pct=["over90"],
        )
    )

    assert response.status_code == 200
    portfolios = response.json["portfolios"]

    # All returned portfolios should match ALL filters (AND logic)
    for portfolio in portfolios:
        # Check portfolio ID
        assert portfolio["id"] in [1, 2, 3, 4, 5, 6]

        # Check budget range
        total_amount = portfolio["total_funding"]["amount"]
        assert 1000000 <= total_amount <= 100000000

        # Check available %
        available = portfolio["available_funding"]["amount"]
        total = portfolio["total_funding"]["amount"]
        if total > 0:
            available_pct = (available / total) * 100
            assert available_pct >= 90


def test_get_portfolio_funding_summary_list_unauthorized(client, loaded_db, app_ctx):
    """Test authorization requirement"""
    response = client.get(url_for("api.portfolio-funding-summary-list"))
    assert response.status_code == 401


def test_get_portfolio_funding_summary_list_empty_result(auth_client, loaded_db, app_ctx):
    """Test returns empty list when no portfolios match filters"""
    # Use impossible budget range
    response = auth_client.get(
        url_for(
            "api.portfolio-funding-summary-list",
            fiscal_year=2023,
            budget_min=999999999999,
            budget_max=9999999999999,
        )
    )

    assert response.status_code == 200
    assert response.json["portfolios"] == []


def test_get_portfolio_funding_summary_list_division_data(auth_client, loaded_db, app_ctx):
    """Test division data is included in response"""
    response = auth_client.get(url_for("api.portfolio-funding-summary-list", fiscal_year=2023))

    assert response.status_code == 200
    portfolios = response.json["portfolios"]

    # Find a portfolio with division
    portfolio_with_division = next((p for p in portfolios if p["division"] is not None), None)

    if portfolio_with_division:
        division = portfolio_with_division["division"]
        assert "id" in division
        assert "name" in division
        assert "abbreviation" in division
        assert "division_director_id" in division
        assert "deputy_division_director_id" in division


def test_get_portfolio_funding_summary_list_invalid_available_pct(auth_client, loaded_db, app_ctx):
    """Test that invalid available_pct range codes are rejected"""
    response = auth_client.get(
        url_for("api.portfolio-funding-summary-list", fiscal_year=2023, available_pct=["invalid", "another-invalid"])
    )

    # Should return 400 Bad Request for validation error
    assert response.status_code == 400
    assert "available_pct" in response.json or "errors" in response.json


def test_get_portfolio_funding_summary_list_valid_available_pct(auth_client, loaded_db, app_ctx):
    """Test that valid available_pct range codes are accepted"""
    response = auth_client.get(
        url_for(
            "api.portfolio-funding-summary-list",
            fiscal_year=2023,
            available_pct=["over90", "75-90", "50-75", "25-50", "under25"],
        )
    )

    # Should succeed with 200
    assert response.status_code == 200
    assert "portfolios" in response.json


def test_get_portfolio_funding_summary_list_budget_min_zero(auth_client, loaded_db, app_ctx):
    """Test that budget_min=0 is handled correctly (not treated as falsy)"""
    response = auth_client.get(
        url_for("api.portfolio-funding-summary-list", fiscal_year=2023, budget_min=0, budget_max=100000000)
    )

    assert response.status_code == 200
    portfolios = response.json["portfolios"]

    # Should return portfolios (budget_min=0 should not be ignored)
    assert isinstance(portfolios, list)
