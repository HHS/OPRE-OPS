import json

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
def test_portfolio_get(client, loaded_db):
    assert loaded_db.session.query(Portfolio).count() == 2

    response = client.get("/ops/portfolios/")
    print(json.loads(response.data.decode("utf8")))
    assert response.status_code == 200
