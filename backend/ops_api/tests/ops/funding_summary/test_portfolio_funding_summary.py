import pytest


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_get_portfolio_funding_summary(auth_client):
    response = auth_client.get("/api/v1/portfolio-funding-summary/1")
    assert response.status_code == 200
    assert response.json == {
        "available_funding": {"amount": 18000000.0, "percent": "90.0"},
        "carry_forward_funding": {"amount": 20000000.0, "percent": "Carry-Forward"},
        "in_execution_funding": {"amount": 2000000.0, "percent": "10.0"},
        "obligated_funding": {"amount": 0.0, "percent": "0.0"},
        "planned_funding": {"amount": 0.0, "percent": "0.0"},
        "total_funding": {"amount": 20000000.0, "percent": "Total"},
    }
