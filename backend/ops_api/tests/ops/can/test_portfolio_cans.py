import pytest


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_portfolio_cans(auth_client):
    response = auth_client.get("/api/v1/portfolios/1/cans/")
    assert response.status_code == 200
    assert len(response.json) == 2
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
    assert len(response.json) == 2
    assert response.json[0]["portfolio_id"] == 1
    assert response.json[1]["portfolio_id"] == 1
    # each of these funding details have 2043 budget lines that are normally filtered out by the budgetFiscalYear param
    assert len(response.json[0]["budget_line_items"]) == 3
    assert len(response.json[1]["budget_line_items"]) == 1


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_portfolio_cans_with_budget_bad_query_params(auth_client):
    response = auth_client.get("/api/v1/portfolios/1/cans/?budgetFiscalYear=test")
    assert response.status_code == 400

    response_2 = auth_client.get("/api/v1/portfolios/1/cans/?year=test")
    assert response_2.status_code == 400
