from decimal import Decimal

import pytest

from ops_api.ops.cans.models import (
    Agreement,
    AgreementType,
    BudgetLineItem,
    BudgetLineItemStatus,
    CAN,
    CANFiscalYear,
    FundingPartner,
)
from ops_api.ops.portfolios.controller import get_total_funding
from ops_api.ops.portfolios.controller import PortfolioSerializer
from ops_api.ops.portfolios.models import Portfolio


@pytest.fixture(autouse=True)
def portfolio(db):
    portfolio = Portfolio.objects.create(
        name="blah blah",
        description="blah",
        status="In-Process",
    )
    return portfolio


@pytest.fixture(autouse=True)
def agreement_type(db):
    agreement_type = AgreementType.objects.create(agreement_type="Contract")
    return agreement_type


@pytest.fixture(autouse=True)
def agreement(db, portfolio, agreement_type):
    agreement = Agreement.objects.create(
        name="Agreement 1", agreement_type=agreement_type, owning_portfolio=portfolio
    )
    return agreement


@pytest.fixture(autouse=True)
def can_fiscal_year(db, can):
    can_fiscal_year = CANFiscalYear.objects.create(
        can=can,
        fiscal_year="2022",
        total_fiscal_year_funding=Decimal(39131673.16),
        potential_additional_funding=Decimal(0),
        notes="",
    )
    return can_fiscal_year


@pytest.fixture(autouse=True)
def budget_line_item_status_planned(db):
    budget_line_item_status = BudgetLineItemStatus.objects.create(status="Planned")
    return budget_line_item_status


@pytest.fixture(autouse=True)
def budget_line_item_status_obligated(db):
    budget_line_item_status = BudgetLineItemStatus.objects.create(status="Obligated")
    return budget_line_item_status


@pytest.fixture(autouse=True)
def budget_line_item_status_in_execution(db):
    budget_line_item_status = BudgetLineItemStatus.objects.create(status="In Execution")
    return budget_line_item_status


@pytest.fixture(autouse=True)
def can(db, portfolio):
    can = CAN.objects.create(
        number="123XXX",
        description="",
        purpose="",
        nickname="",
        arrangement_type="OPRE Appropriation",
        authorizer=FundingPartner.objects.create(name="partner 1", nickname=""),
        managing_portfolio=portfolio,
    )
    return can


@pytest.fixture(autouse=True)
def budget_line_items(
    db,
    can,
    agreement,
    budget_line_item_status_planned,
    budget_line_item_status_obligated,
    budget_line_item_status_in_execution,
):
    budget_line_items = []
    budget_line_items.append(
        BudgetLineItem.objects.create(
            name="line item Planned 2022-1",
            fiscal_year=2022,
            agreement=agreement,
            can=can,
            amount=6757873.75,
            status=budget_line_item_status_planned,
        )
    )
    budget_line_items.append(
        BudgetLineItem.objects.create(
            name="line item Planned 2022-2",
            fiscal_year=2022,
            agreement=agreement,
            can=can,
            amount=2757873.75,
            status=budget_line_item_status_planned,
        )
    )
    budget_line_items.append(
        BudgetLineItem.objects.create(
            name="line item Planned 2022-2",
            fiscal_year=2022,
            agreement=agreement,
            can=can,
            amount=2757873.75,
            status=budget_line_item_status_obligated,
        )
    )
    budget_line_items.append(
        BudgetLineItem.objects.create(
            name="line item Planned 2022-2",
            fiscal_year=2022,
            agreement=agreement,
            can=can,
            amount=2757873.75,
            status=budget_line_item_status_in_execution,
        )
    )
    budget_line_items.append(
        BudgetLineItem.objects.create(
            name="line item 2021-1",
            fiscal_year=2021,
            agreement=agreement,
            can=can,
            amount=857873.75,
            status=budget_line_item_status_planned,
        )
    )
    return budget_line_items


def test_Portfolio_serializer_has_depth_of_one():
    assert PortfolioSerializer.Meta.depth == 1


def test_Portfolio_serializer_returns_all_models_fields():
    assert PortfolioSerializer.Meta.fields == "__all__"


def test_Portfolio_serializer_returns_cans_fields(db):
    portfolio_serializer_fields = PortfolioSerializer().get_fields()

    assert "internal_can" in portfolio_serializer_fields
    assert portfolio_serializer_fields["internal_can"] is not None


def test_get_total_funding_2022_manual_calc(db, budget_line_items):
    total = sum(bli.amount for bli in budget_line_items if bli.fiscal_year == 2022)
    assert 15031495.0 == total


def test_get_total_funding_controller(db, portfolio):
    totals = get_total_funding(portfolio, fiscal_year=2022)
    assert "total_funding" in totals
    assert "planned_funding" in totals
    assert "obligated_funding" in totals
    assert "in_execution_funding" in totals
    assert "available_funding" in totals

    total_funding = totals["total_funding"]["amount"]
    available_funding = totals["available_funding"]["amount"]
    accounted_for = total_funding - available_funding
    assert 15031495.0 == accounted_for
