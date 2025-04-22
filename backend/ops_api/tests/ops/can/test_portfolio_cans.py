from decimal import Decimal

import pytest

from models import BudgetLineItem, BudgetLineItemStatus


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_portfolio_cans(auth_client):
    response = auth_client.get("/api/v1/portfolios/1/cans/")
    assert response.status_code == 200
    assert len(response.json) == 3
    assert response.json[0]["portfolio_id"] == 1
    assert response.json[1]["portfolio_id"] == 1


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_portfolio_cans_with_year_2022(auth_client):
    response = auth_client.get("/api/v1/portfolios/1/cans/?year=2022")
    assert response.status_code == 200
    assert len(response.json) == 0


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_portfolio_cans_with_year_2021(auth_client):
    response = auth_client.get("/api/v1/portfolios/1/cans/?year=2021&budgetFiscalYear=2021")
    assert response.status_code == 200
    assert len(response.json) == 2
    assert response.json[0]["portfolio_id"] == 1
    assert response.json[1]["portfolio_id"] == 1
    assert len(response.json[0]["budget_line_items"]) == 0
    assert len(response.json[1]["budget_line_items"]) == 0


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_portfolio_cans_with_budget_fiscal_year_2021(auth_client):
    response = auth_client.get("/api/v1/portfolios/1/cans/?budgetFiscalYear=2043")
    assert response.status_code == 200
    assert len(response.json) == 3
    assert response.json[0]["portfolio_id"] == 1
    assert response.json[1]["portfolio_id"] == 1


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_portfolio_cans_with_budget_bad_query_params(auth_client):
    response = auth_client.get("/api/v1/portfolios/1/cans/?budgetFiscalYear=test")
    assert response.status_code == 400

    response_2 = auth_client.get("/api/v1/portfolios/1/cans/?year=test")
    assert response_2.status_code == 400


def test_portfolio_cans_fiscal_year_2027_child_care(auth_client):
    child_care_portfolio_id = 3
    response = auth_client.get(f"/api/v1/portfolios/{child_care_portfolio_id}/cans/?year=2027")
    funding_budgets_2027 = [budget for budget in response.json[0]["funding_budgets"] if budget["fiscal_year"] == 2027]
    assert len(response.json) == 1
    assert response.json[0]["portfolio_id"] == child_care_portfolio_id
    assert len(funding_budgets_2027) == 1
    assert funding_budgets_2027[0]["budget"] == "500000.0"


def test_blis_on_child_wellfare_research(auth_client):
    response = auth_client.get("/api/v1/portfolios/1/cans/?budgetFiscalYear=2044")
    assert response.status_code == 200
    assert len(response.json) == 3
    assert all(can["portfolio_id"] == 1 for can in response.json)

    response_fy43 = auth_client.get("/api/v1/portfolios/1/cans/?budgetFiscalYear=2043")
    assert response_fy43.status_code == 200
    assert len(response_fy43.json) == 3


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_bli_with_null_date_needed(app, auth_client):
    response = auth_client.get("/api/v1/portfolios/4/cans/?budgetFiscalYear=2022")
    assert response.status_code == 200

    budget_line_item_ids = response.json[0]["budget_line_items"]

    budget_line_items = [app.db_session.get(BudgetLineItem, bli_id) for bli_id in budget_line_item_ids]

    assert len(budget_line_items) == 5
    items_with_date = [bli for bli in budget_line_items if bli.date_needed is not None]
    items_without_date = [bli for bli in budget_line_items if bli.date_needed is None]

    assert len(items_without_date) == 3
    assert all(bli.date_needed is None for bli in items_without_date)
    assert sum(bli.amount for bli in items_without_date) == Decimal("12486075.60")
    assert all(bli.status == BudgetLineItemStatus.DRAFT for bli in items_without_date)

    assert len(items_with_date) == 2
    assert all(bli.date_needed is not None for bli in items_with_date)
    assert sum(bli.amount for bli in items_with_date) == Decimal("4162025.0") + Decimal("4172025")
    assert all(bli.status in [BudgetLineItemStatus.PLANNED, BudgetLineItemStatus.DRAFT] for bli in items_with_date)


def test_portfolio_cans_no_budgets_newest_first(auth_client):
    response = auth_client.get("/api/v1/portfolios/5/cans/?budgetFiscalYear=2025")
    assert response.status_code == 200
    assert len(response.json) == 6

    # list cans in descending order of fiscal year
    assert response.json[0]["number"] == response.json[0]["display_name"] == "G991234"
    assert response.json[0]["funding_details"]["fiscal_year"] == 2025

    assert response.json[1]["number"] == response.json[0]["display_name"] == "G995678"
    assert response.json[0]["funding_details"]["fiscal_year"] == 2025

    assert response.json[2]["number"] == response.json[0]["display_name"] == "GE7RM25"
    assert response.json[0]["funding_details"]["fiscal_year"] == 2025

    assert response.json[3]["number"] == response.json[0]["display_name"] == "GE7RM24"
    assert response.json[0]["funding_details"]["fiscal_year"] == 2024

    assert response.json[4]["number"] == response.json[0]["display_name"] == "GE7RM23"
    assert response.json[0]["funding_details"]["fiscal_year"] == 2023

    assert response.json[5]["number"] == response.json[0]["display_name"] == "GE7RM22"
    assert response.json[0]["funding_details"]["fiscal_year"] == 2022
