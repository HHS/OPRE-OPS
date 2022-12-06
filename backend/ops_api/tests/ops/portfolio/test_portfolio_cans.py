import pytest


@pytest.mark.usefixtures("app_ctx")
def test_portfolio_cans(client, loaded_db):
    response = client.get("/api/v1/portfolios/1/cans/")
    assert response.status_code == 200
    assert response.json[0]["managing_portfolio_id"] == 1
