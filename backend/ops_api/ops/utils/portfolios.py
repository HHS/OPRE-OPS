from typing import Optional, TypedDict

from models.cans import CAN, BudgetLineItem, BudgetLineItemStatus, CANFiscalYear, CANFiscalYearCarryOver
from models.portfolios import Portfolio


class FundingLineItem(TypedDict):
    """Dict type hint for line items in total funding."""

    amount: float
    percent: str


class TotalFunding(TypedDict):
    """Dict type hint for total finding"""

    total_funding: FundingLineItem
    carry_over_funding: FundingLineItem
    planned_funding: FundingLineItem
    obligated_funding: FundingLineItem
    in_execution_funding: FundingLineItem
    available_funding: FundingLineItem


def get_total_funding(portfolio: Portfolio, fiscal_year: Optional[int] = None) -> TotalFunding:
    can_fiscal_year_query = CANFiscalYear.query.filter(CANFiscalYear.can.has(CAN.managing_portfolio == portfolio))

    can_fiscal_year_carry_over_query = CANFiscalYearCarryOver.query.filter(
        CANFiscalYearCarryOver.can.has(CAN.managing_portfolio == portfolio)
    )

    if fiscal_year:
        can_fiscal_year_query = can_fiscal_year_query.filter(CANFiscalYear.fiscal_year == fiscal_year).all()

        can_fiscal_year_carry_over_query = can_fiscal_year_carry_over_query.filter(
            CANFiscalYearCarryOver.to_fiscal_year == fiscal_year
        ).all()

    total_funding = sum([c.total_fiscal_year_funding for c in can_fiscal_year_query]) or 0

    carry_over_funding = (
        sum(
            [
                (c.current_amount if c.current_amount else 0) + (c.expected_amount if c.expected_amount else 0)
                for c in can_fiscal_year_carry_over_query
            ]
        )
        or 0
    )

    # Amount available to a Portfolio budget is the sum of the BLI minus the Portfolio total (above)
    budget_line_items = BudgetLineItem.query.filter(BudgetLineItem.can.has(CAN.managing_portfolio == portfolio))

    if fiscal_year:
        budget_line_items = budget_line_items.filter(BudgetLineItem.fiscal_year == fiscal_year)

    planned_budget_line_items = budget_line_items.filter(BudgetLineItem.status.has(BudgetLineItemStatus.Planned)).all()
    planned_funding = sum([b.funding for b in planned_budget_line_items]) or 0

    obligated_budget_line_items = budget_line_items.filter(
        BudgetLineItem.status.has(BudgetLineItemStatus.Obligated)
    ).all()
    obligated_funding = sum([b.funding for b in obligated_budget_line_items]) or 0

    in_execution_budget_line_items = budget_line_items.filter(
        BudgetLineItem.status.has(BudgetLineItemStatus.In_Execution)
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
        "carry_over_funding": {
            "amount": float(carry_over_funding),
            "percent": "Carry-Forward",
        },
        "planned_funding": {
            "amount": float(planned_funding),
            "percent": get_percentage(total_funding, planned_funding),
        },
        "obligated_funding": {
            "amount": float(obligated_funding),
            "percent": get_percentage(total_funding, obligated_funding),
        },
        "in_execution_funding": {
            "amount": float(in_execution_funding),
            "percent": get_percentage(total_funding, in_execution_funding),
        },
        "available_funding": {
            "amount": float(available_funding),
            "percent": get_percentage(total_funding, available_funding),
        },
    }


def get_percentage(total_funding: float, specific_funding: float) -> str:
    return f"{round(float(specific_funding) / float(total_funding), 2) * 100}" if total_funding else "0"
