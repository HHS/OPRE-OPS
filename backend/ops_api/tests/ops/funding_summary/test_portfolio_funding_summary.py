import pytest


@pytest.mark.usefixtures("app_ctx")
def test_get_portfolio_funding_summary(client):
    response = client.get("/api/v1/portfolio-funding-summary/1")
    assert response.status_code == 200
    assert response.json["available_funding"]["amount"] == 4693574.0
