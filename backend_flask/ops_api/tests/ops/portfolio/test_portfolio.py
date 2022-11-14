from ops.portfolio.utils import get_total_funding
from ops.portfolio.models import Portfolio


def test_portfolio_create(db_session):

    db_session.add(
        Portfolio(
            name="WRGB (CCE)",
            description="",
            status_id=1,
        )
    )
    db_session.commit()

    portfolio = Portfolio.query.first()

    assert portfolio.count == 1
    assert portfolio.name == "WRGB (CCE)"
    assert portfolio.status_id == 1