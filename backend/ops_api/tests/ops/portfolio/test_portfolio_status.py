import pytest


@pytest.mark.usefixtures("app_ctx")
def test_get_portfolio_status_list(auth_client):
    response = auth_client.get("/api/v1/portfolio-status/")
    assert response.status_code == 200
    assert len(response.json) == 3


@pytest.mark.usefixtures("app_ctx")
def test_get_portfolio_status_by_id(auth_client):
    response = auth_client.get("/api/v1/portfolio-status/1")
    assert response.status_code == 200
    assert response.json == "IN_PROCESS"
