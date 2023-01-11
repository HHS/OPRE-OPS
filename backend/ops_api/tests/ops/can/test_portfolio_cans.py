import pytest


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db_with_cans")
def test_portfolio_cans(client):
    response = client.get("/api/v1/portfolios/1/cans/")
    assert response.status_code == 200
    assert len(response.json) == 2
    assert response.json[0]["id"] == 1
    assert response.json[0]["managing_portfolio_id"] == 1
    assert response.json[1]["id"] == 1
    assert response.json[0]["managing_portfolio_id"] == 1


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db_with_cans")
def test_portfolio_cans_with_year_2022(client):
    response = client.get("/api/v1/portfolios/1/cans/?year=2022")
    assert response.status_code == 200
    assert len(response.json) == 1
    assert response.json[0]["id"] == 1
    assert response.json[0]["managing_portfolio_id"] == 1


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db_with_cans")
def test_portfolio_cans_with_year_2023(client):
    response = client.get("/api/v1/portfolios/1/cans/?year=2023")
    assert response.status_code == 200
    assert len(response.json) == 1
    assert response.json[0]["id"] == 1
    assert response.json[0]["managing_portfolio_id"] == 1
