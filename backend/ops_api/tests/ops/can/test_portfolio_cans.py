import pytest


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_portfolio_cans(auth_client):
    response = auth_client.get("/api/v1/portfolios/1/cans/")
    assert response.status_code == 200
    assert len(response.json) == 2
    assert response.json[0]["id"] == 2
    assert response.json[0]["managing_portfolio_id"] == 1
    assert response.json[1]["id"] == 4
    assert response.json[0]["managing_portfolio_id"] == 1


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_portfolio_cans_with_year_2022(auth_client):
    response = auth_client.get("/api/v1/portfolios/1/cans/?year=2022")
    assert response.status_code == 200
    assert len(response.json) == 0


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_portfolio_cans_with_year_2023(auth_client):
    response = auth_client.get("/api/v1/portfolios/1/cans/?year=2023")
    assert response.status_code == 200
    assert len(response.json) == 2
    assert response.json[0]["id"] == 4
    assert response.json[0]["managing_portfolio_id"] == 1
