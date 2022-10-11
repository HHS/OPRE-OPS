from ops_api.ops.cans.models import (
    Agreement,
    AgreementType,
    BudgetLineItem,
    BudgetLineItemStatus,
    CAN,
    FundingPartner,
)
from ops_api.ops.portfolios.controller import PortfolioSerializer
from ops_api.ops.portfolios.models import Portfolio


def test_Portfolio_serializer_has_depth_of_one():
    assert PortfolioSerializer.Meta.depth == 1


def test_Portfolio_serializer_returns_all_models_fields():
    assert PortfolioSerializer.Meta.fields == "__all__"


def test_Portfolio_serializer_returns_cans_fields():
    portfolio_serializer_fields = PortfolioSerializer().get_fields()

    assert "cans" in portfolio_serializer_fields
    assert portfolio_serializer_fields["cans"] is not None


def test_get_total_funding():

    portfolio = Portfolio.objects.create(
        name="blah blah",
        description="blah",
        status="In-Process",
        current_fiscal_year_funding=39131673.16,
    )

    fiscal_year = "2022"

    agreement_type = AgreementType.objects.create(agreement_type="Contract")

    agreement = Agreement.objects.create(
        name="Agreement 1",
        agreement_type=agreement_type,
    )

    budget_line_item_status = BudgetLineItemStatus.objects.create(status="Planned")

    can = CAN.objects.create(
        number="123XXX",
        description="",
        purpose="",
        nickname="",
        arrangement_type="OPRE Appropriation",
        authorizer=FundingPartner.objects.create(name="partner 1", nickname=""),
        portfolio=portfolio,
    )

    budget_line_items = BudgetLineItem.objects.create(
        name="line item 1",
        fiscal_year=2022,
        agreement=agreement,
        can=can,
        amount=6757873.75,
        status=budget_line_item_status,
    )
