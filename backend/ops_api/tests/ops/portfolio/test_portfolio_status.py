from ops.models.portfolios import PortfolioStatus
import pytest


@pytest.mark.usefixtures("app_ctx")
def test_portfolio_status_count(loaded_db):
    portfolio_status_count = loaded_db.session.query(PortfolioStatus).all()
    assert len(portfolio_status_count) == 3


@pytest.mark.parametrize(
    "id,name",
    [
        (1, "In-Process"),
        (2, "Not-Started"),
        (3, "Sandbox"),
    ],
)
@pytest.mark.usefixtures("app_ctx")
def test_portfolio_status_lookup(loaded_db, id, name):
    portfolio_status = loaded_db.session.query(PortfolioStatus).get(id)
    assert portfolio_status.name == name


@pytest.mark.usefixtures("app_ctx")
def test_get_portfolio_status_list(client):
    response = client.get("/api/v1/portfolio-status/")
    assert response.status_code == 200
    assert len(response.json) == 3


@pytest.mark.usefixtures("app_ctx")
def test_get_portfolio_status_by_id(client):
    response = client.get("/api/v1/portfolio-status/1")
    assert response.status_code == 200
    assert response.json["id"] == 1
