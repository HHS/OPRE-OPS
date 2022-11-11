from typing import Optional, TypedDict

from ops.can.models import BudgetLineItem
from ops.can.models import BudgetLineItemStatus
from ops.can.models import CAN
from ops.can.models import CANFiscalYear
from ops.portfolio.models import Portfolio


class PortfolioDict(TypedDict):
    id: int
    name: str
    description: Optional[str]
    status: Optional[str]
    cans: list[CAN]


class FundingLineItem(TypedDict):
    """Dict type hint for line items in total funding."""

    amount: float
    label: str


class TotalFunding(TypedDict):
    """Dict type hint for total finding"""

    total_funding: FundingLineItem
    planned_funding: FundingLineItem
    obligated_funding: FundingLineItem
    in_execution_funding: FundingLineItem
    available_funding: FundingLineItem


def portfolio_dumper(portfolio: Portfolio) -> PortfolioDict:
    return {
        "id": portfolio.id,
        "name": portfolio.name,
        "description": portfolio.description,
        "status": portfolio.status.name,
        "cans": portfolio.cans,
    }


def get_total_funding(
    portfolio: Portfolio, fiscal_year: Optional[int] = None
) -> TotalFunding:

    # can_fiscal_year_query = (
    #     CANFiscalYear.query
    #     .join(CAN)
    #     .filter(CAN.managing_portfolio == portfolio)
    #     .all()
    # )

    can_fiscal_year_query = CANFiscalYear.query.filter(
        CANFiscalYear.can.has(CAN.managing_portfolio == portfolio)
    )

    if fiscal_year:
        can_fiscal_year_query = can_fiscal_year_query.filter(
            CANFiscalYear.fiscal_year == fiscal_year
        ).all()

    total_funding = (
        sum([c.total_fiscal_year_funding for c in can_fiscal_year_query]) or 0
    )

    # Amount available to a Portfolio budget is the sum of the BLI minus the Portfolio total (above)
    budget_line_items = BudgetLineItem.query.filter(
        BudgetLineItem.can.has(CAN.managing_portfolio == portfolio)
    )

    if fiscal_year:
        budget_line_items = budget_line_items.filter(
            BudgetLineItem.fiscal_year == fiscal_year
        )

    planned_budget_line_items = budget_line_items.filter(
        BudgetLineItem.status
        == BudgetLineItemStatus.query.filter(
            BudgetLineItemStatus.status == "Planned"
        ).one()
    ).all()

    planned_funding = sum([b.funding for b in planned_budget_line_items]) or 0

    obligated_budget_line_items = budget_line_items.filter(
        BudgetLineItem.status
        == BudgetLineItemStatus.query.filter(
            BudgetLineItemStatus.status == "Obligated"
        ).one()
    ).all()
    obligated_funding = sum([b.funding for b in obligated_budget_line_items]) or 0

    in_execution_budget_line_items = budget_line_items.filter(
        BudgetLineItem.status
        == BudgetLineItemStatus.query.filter(
            BudgetLineItemStatus.status == "In Execution"
        ).one()
    ).all()
    in_execution_funding = sum([b.funding for b in in_execution_budget_line_items]) or 0

    total_accounted_for = sum(
        (
            planned_funding,
            obligated_funding,
            in_execution_funding,
        )
    )

    available_funding = float(total_funding) - float(total_accounted_for)

    return {
        "total_funding": {
            "amount": float(total_funding),
            "percent": "Total",
        },
        "planned_funding": {
            "amount": planned_funding,
            "percent": f"{round(float(planned_funding) / float(total_funding), 2) * 100}",
        },
        "obligated_funding": {
            "amount": obligated_funding,
            "percent": f"{round(float(obligated_funding) / float(total_funding), 2) * 100}",
        },
        "in_execution_funding": {
            "amount": in_execution_funding,
            "percent": f"{round(float(in_execution_funding) / float(total_funding), 2) * 100}",
        },
        "available_funding": {
            "amount": available_funding,
            "percent": f"{round(float(available_funding) / float(total_funding), 2) * 100}",
        },
    }
