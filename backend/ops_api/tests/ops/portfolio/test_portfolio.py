from models import Portfolio, PortfolioStatus


def test_portfolio_retrieve(loaded_db, app_ctx):
    portfolio = loaded_db.query(Portfolio).filter(Portfolio.name == "Child Care Research").one()

    assert portfolio is not None
    assert portfolio.name == "Child Care Research"
    assert portfolio.status == PortfolioStatus.IN_PROCESS
    assert portfolio.display_name == portfolio.name


def test_portfolio_get_all(auth_client, loaded_db, app_ctx):
    num_portfolios = loaded_db.query(Portfolio).count()

    response = auth_client.get("/api/v1/portfolios/")
    assert response.status_code == 200
    assert len(response.json) == num_portfolios


def test_portfolio_get_by_id(auth_client, loaded_db, app_ctx):
    response = auth_client.get("/api/v1/portfolios/1")
    assert response.status_code == 200
    assert response.json["name"] == "Child Welfare Research"


def test_portfolio_get_by_id_404(auth_client, loaded_db, app_ctx):
    response = auth_client.get("/api/v1/portfolios/10000000")
    assert response.status_code == 404
