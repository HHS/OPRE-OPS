from decimal import Decimal

from django.db.models import Sum
import pytest

from ops_api.ops.cans.models import (
    Agreement,
    BudgetLineItem,
    CAN,
    FundingPartner,
)
from ops_api.ops.portfolios.models import Portfolio


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


@pytest.mark.django_db
def test_total_funding_for_portfolio():
    # Idea here is to express as a test that the requirement for the total funding for a Portfolio is to find the sum
    # of all BudgetLineItems associated with all CANs that are associated with a Portfolio
    # (as discussed at standup 9/30/2022)
    portfolio = Portfolio.objects.create(
        name="Portfolio 1",
        description="",
        status="In-Process",
        current_fiscal_year_funding=0.0,
    )

    funding_partner = FundingPartner.objects.create(name="yeah", nickname="yeah")

    can = CAN.objects.create(
        number="123XXX1",
        description="",
        nickname="",
        arrangement_type="IAA",
        authorizer=funding_partner,
        portfolio=portfolio,
    )

    agreement = Agreement.objects.create(
        name="agreement 1",
        agreement_type="Contract",
    )

    agreement.cans.add(can)

    BudgetLineItem.objects.create(
        name="item 1",
        fiscal_year=2022,
        agreement=agreement,
        can=can,
        funding=3033000.19,
    )

    BudgetLineItem.objects.create(
        name="item 2",
        fiscal_year=2022,
        agreement=agreement,
        can=can,
        funding=1800232.98,
    )

    sum_of_line_items = BudgetLineItem.objects.filter(
        can__portfolio=portfolio
    ).aggregate(Sum("funding"))

    assert sum_of_line_items["funding__sum"] == pytest.approx(
        Decimal(3033000.19 + 1800232.98)
    )
