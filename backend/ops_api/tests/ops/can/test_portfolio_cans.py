import pytest


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
    resp_for_fy44 = auth_client.get("/api/v1/portfolios/1/cans/?budgetFiscalYear=2044")
    assert resp_for_fy44.status_code == 200
    assert len(resp_for_fy44.json) == 0
    assert resp_for_fy44.json[0]["portfolio_id"] == 1

    resp_for_fy43 = auth_client.get("/api/v1/portfolios/1/cans/?budgetFiscalYear=2043")
    assert resp_for_fy43.status_code == 200
    assert len(resp_for_fy43.json) == 4
    assert resp_for_fy43.json[0]["portfolio_id"] == 1
