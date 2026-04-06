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


def test_portfolio_get_by_project_id(auth_client, loaded_db, app_ctx):
    all_response = auth_client.get("/api/v1/portfolios/")
    assert all_response.status_code == 200
    all_ids = {p["id"] for p in all_response.json}

    response = auth_client.get("/api/v1/portfolios/?project_id=1000")
    assert response.status_code == 200
    assert len(response.json) > 0
    portfolio_ids = {p["id"] for p in response.json}
    # Verify filtering is applied: result is a proper subset of all portfolios
    assert portfolio_ids < all_ids
    # Verify known seed-data links are present
    assert {2, 3, 6, 8, 9}.issubset(portfolio_ids)


def test_portfolio_get_by_project_id_no_results(auth_client, loaded_db, app_ctx):
    response = auth_client.get("/api/v1/portfolios/?project_id=999999")
    assert response.status_code == 200
    assert len(response.json) == 0
