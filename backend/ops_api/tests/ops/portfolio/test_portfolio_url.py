from ops.models.portfolios import PortfolioUrl
import pytest


@pytest.mark.usefixtures("app_ctx")
def test_portfolio_url_lookup(loaded_db):
    pUrl = loaded_db.session.query(PortfolioUrl).get(1)
    assert pUrl is not None
    assert pUrl.url == "/ops/portfolio/1"
    assert pUrl.portfolio_id == 1


def test_portfolio_url_creation():
    pUrl = PortfolioUrl(portfolio_id=1, url="/ops/portfolio/1")
    assert pUrl.to_dict()["url"] == "/ops/portfolio/1"
