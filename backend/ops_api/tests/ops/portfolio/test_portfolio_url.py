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


@pytest.mark.usefixtures("app_ctx")
def test_portfolio_url_get_by_id(auth_client, loaded_db):
    response = auth_client.get("/api/v1/portfolios-url/1")
    assert response.status_code == 200
    assert response.json["url"] == "https://acf.gov/opre/topic/overview/abuse-neglect-adoption-foster-care"


@pytest.mark.usefixtures("app_ctx")
def test_portfolio_url_get_by_id_404(auth_client, loaded_db):
    response = auth_client.get("/api/v1/portfolios-url/10000000")
    assert response.status_code == 404


@pytest.mark.usefixtures("app_ctx")
def test_portfolio_get_all(auth_client, loaded_db):
    portfolio_urls = loaded_db.query(PortfolioUrl).count()

    response = auth_client.get("/api/v1/portfolios-url/")
    assert response.status_code == 200
    assert len(response.json) == portfolio_urls
