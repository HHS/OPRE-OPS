import pytest


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_get_portfolio_funding_summary(auth_client):
    response = auth_client.get("/api/v1/portfolio-funding-summary/1")
    assert response.status_code == 200
    assert response.json["available_funding"]["amount"] == 12000000.0
