import pytest
from models.portfolios import PortfolioStatus


@pytest.mark.usefixtures("app_ctx")
def test_portfolio_status_count(loaded_db):
    portfolio_status_count = loaded_db.session.query(PortfolioStatus).all()
    assert len(portfolio_status_count) == 2


@pytest.mark.parametrize(
    "id,name",
    [
        (1, "Active"),
        (2, "Inactive"),
    ],
)
@pytest.mark.usefixtures("app_ctx")
def test_portfolio_status_lookup(loaded_db, id, name):
    portfolio_status = loaded_db.session.get(PortfolioStatus, id)
    assert portfolio_status.name == name


@pytest.mark.usefixtures("app_ctx")
def test_get_portfolio_status_list(auth_client):
    response = auth_client.get("/api/v1/portfolio-status/")
    assert response.status_code == 200
    assert len(response.json) == 2


@pytest.mark.usefixtures("app_ctx")
def test_get_portfolio_status_by_id(auth_client):
    response = auth_client.get("/api/v1/portfolio-status/1")
    assert response.status_code == 200
    assert response.json["id"] == 1
