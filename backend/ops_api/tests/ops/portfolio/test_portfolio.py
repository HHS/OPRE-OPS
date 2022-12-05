from ops.portfolio.models import Portfolio
import pytest

# @pytest.fixture(scope="module")
# def new_portfolio():
#     return Portfolio(
#         name="WRGB (CCE)",
#         description="",
#         status_id=1,
#     )


# @pytest.fixture(scope="session")
# def portfolio_table(db_engine):
#     Portfolio.metadata.create_all(db_engine)
#     yield
#     Portfolio.metadata.drop_all(db_engine)


@pytest.mark.usefixtures("app_ctx")
def test_portfolio_retrieve(loaded_db):
    portfolio = (
        loaded_db.session.query(Portfolio).filter(Portfolio.name == "WRGB (CCE)").one()
    )

    assert portfolio is not None
    assert portfolio.name == "WRGB (CCE)"
    assert portfolio.status_id == 1


@pytest.mark.usefixtures("app_ctx")
def test_portfolio_get_all(client, loaded_db):
    assert loaded_db.session.query(Portfolio).count() == 2

    response = client.get("/ops/portfolios/")
    assert response.status_code == 200
    assert len(response.json) == 2


@pytest.mark.usefixtures("app_ctx")
def test_portfolio_get_by_id(client, loaded_db):
    response = client.get("/ops/portfolios/1/")
    assert response.status_code == 200
    assert response.json["name"] == "WRGB (CCE)"


@pytest.mark.usefixtures("app_ctx")
def test_portfolio_calc_funding_amounts(client, loaded_db):
    response = client.get("/ops/portfolios/1/calcFunding/?fiscal_year=2022")

    assert response.status_code == 200
    assert response.json["total_funding"]["amount"] == 1233123.00
    assert response.json["available_funding"]["amount"] == 382673.00
    assert response.json["in_execution_funding"]["amount"] == 850450.00
    assert response.json["obligated_funding"]["amount"] == 0.00
    assert response.json["planned_funding"]["amount"] == 0.00
    assert response.json["carry_over_funding"]["amount"] == 0.00

    response = client.get("/ops/portfolios/1/calcFunding/?fiscal_year=2023")

    assert response.status_code == 200
    assert response.json["total_funding"]["amount"] == 4333123.0
    assert response.json["available_funding"]["amount"] == 4310901.0
    assert response.json["in_execution_funding"]["amount"] == 0.0
    assert response.json["obligated_funding"]["amount"] == 0.00
    assert response.json["planned_funding"]["amount"] == 22222.0
    assert response.json["carry_over_funding"]["amount"] == 10.0


@pytest.mark.usefixtures("app_ctx")
def test_portfolio_calc_funding_percents(client, loaded_db):
    response = client.get("/ops/portfolios/1/calcFunding/?fiscal_year=2022")
    assert response.status_code == 200
    assert response.json["available_funding"]["percent"] == "31.0"
    assert response.json["in_execution_funding"]["percent"] == "69.0"
    assert response.json["obligated_funding"]["percent"] == "0.0"
    assert response.json["planned_funding"]["percent"] == "0.0"
