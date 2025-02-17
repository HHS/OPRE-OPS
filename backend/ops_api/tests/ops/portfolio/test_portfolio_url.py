import pytest

from models.portfolios import PortfolioUrl


@pytest.mark.usefixtures("app_ctx")
def test_portfolio_url_lookup(loaded_db):
    pUrl = loaded_db.get(PortfolioUrl, 1)
    assert pUrl is not None
    assert pUrl.url == "https://acf.gov/opre/topic/overview/abuse-neglect-adoption-foster-care"
    assert pUrl.portfolio_id == 1


def test_portfolio_url_creation():
    pUrl = PortfolioUrl(portfolio_id=2, url="https://acf.gov/opre/topic/head-start")
    assert pUrl.to_dict()["url"] == "https://acf.gov/opre/topic/head-start"
