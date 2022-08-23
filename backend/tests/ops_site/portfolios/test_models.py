import pytest

from opre_ops.ops_site.portfolios.models import Portfolio


@pytest.mark.django_db
def test_Portfolio_str():
    name = "PortfolioNameHere"
    portfolio = Portfolio.objects.create(
        name=name,
        description="",
        status="Not-Started",
        current_fiscal_year_funding=0.0,
    )
    assert name == str(portfolio)
