from ops.portfolio.models import PortfolioStatus
import pytest


def test_portfolio_status_count(db_session, init_database, db_tables):
    portfolio_status_count = db_session.query(PortfolioStatus).all()
    assert len(portfolio_status_count) == 3


@pytest.mark.parametrize(
    "id,name",
    [
        (1, "In-Process"),
        (2, "Not-Started"),
        (3, "Sandbox"),
    ],
)
def test_portfolio_status_lookup(db_session, init_database, db_tables, id, name):
    portfolio_status = db_session.query(PortfolioStatus).get(id)
    assert portfolio_status.name == name
