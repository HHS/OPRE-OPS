from ops.portfolio.models import PortfolioStatus
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
