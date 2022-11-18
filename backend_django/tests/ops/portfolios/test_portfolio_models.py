from ops_api.ops.portfolios.models import Portfolio
import pytest


@pytest.mark.django_db
def test_Portfolio_str():
    name = "PortfolioNameHere"
    portfolio = Portfolio.objects.create(
        name=name,
        description="",
        status="Not-Started",
    )
    assert name == str(portfolio)
