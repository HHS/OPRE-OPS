import pytest

from opre_ops.ops_site.portfolios.models import Portfolio


@pytest.mark.django_db
def test_Portfolio_str():
    portfolio = Portfolio.objects.create(
        name="PortfolioNameHere",
        description="",
        status="Not-Started",
        current_fiscal_year_funding=0.0,
    )
    assert "PortfolioNameHere" == str(portfolio)
