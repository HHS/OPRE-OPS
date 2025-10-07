from decimal import Decimal
from typing import TypedDict

from flask import current_app
from sqlalchemy import and_, select

from models import CAN, BudgetLineItem, BudgetLineItemStatus, CANFundingBudget, CANFundingDetails, Portfolio


class FundingLineItem(TypedDict):
    """Dict type hint for line items in total funding."""

    amount: float
    percent: str


class TotalFunding(TypedDict):
    """Dict type hint for total finding"""

    total_funding: FundingLineItem
    carry_forward_funding: FundingLineItem
    planned_funding: FundingLineItem
    obligated_funding: FundingLineItem
    in_execution_funding: FundingLineItem
    available_funding: FundingLineItem
    draft_funding: FundingLineItem
    new_funding: FundingLineItem


def _get_all_budgets(portfolio_id: int, fiscal_year: int) -> list[CANFundingBudget]:
    stmt = (
        select(CANFundingBudget)
        .distinct(CANFundingBudget.id)
        .join(CAN)
        .join(CANFundingDetails)
        .where(CAN.portfolio_id == portfolio_id)
        .where(CANFundingBudget.fiscal_year == fiscal_year)
        .where(fiscal_year >= CANFundingDetails.fiscal_year)
        .where(fiscal_year <= CANFundingDetails.obligate_by)
    )

    return current_app.db_session.execute(stmt).scalars().all()


def _get_all_carry_forward_budgets(portfolio_id: int, fiscal_year: int) -> list[CANFundingBudget]:
    results = _get_all_budgets(portfolio_id, fiscal_year)

    # the carry forward budgets are all budgets except for the new funding budgets and 1 year CAN budgets
    filtered_budgets = [
        budget
        for budget in results
        if budget.can.active_period != 1
        and budget.can
        and budget.can.funding_details
        and budget.fiscal_year != budget.can.funding_details.fiscal_year
    ]

    return filtered_budgets


def _get_all_new_funding_budgets(portfolio_id: int, fiscal_year: int) -> list[CANFundingBudget]:
    results = _get_all_budgets(portfolio_id, fiscal_year)

    filtered_budgets = [
        budget
        for budget in results
        if budget.can
        and budget.can.funding_details
        and (
            budget.can.active_period == 1  # 1 Year CANS are CANS that have an active_period of 1
            or (
                # CANs that are in their appropriation year
                fiscal_year
                == budget.can.funding_details.fiscal_year
                == budget.fiscal_year
            )
        )
    ]

    return filtered_budgets


def _get_total_fiscal_year_funding(portfolio_id: int, fiscal_year: int) -> Decimal:
    return sum([b.budget for b in _get_all_budgets(portfolio_id, fiscal_year)]) or Decimal(0)


def _get_carry_forward_total(portfolio_id: int, fiscal_year: int) -> Decimal:
    return sum([b.budget for b in _get_all_carry_forward_budgets(portfolio_id, fiscal_year)]) or Decimal(0)


def _get_new_funding_total(portfolio_id: int, fiscal_year: int) -> Decimal:
    return sum([b.budget for b in _get_all_new_funding_budgets(portfolio_id, fiscal_year)]) or Decimal(0)


def _get_budget_line_item_total_by_status(portfolio_id: int, fiscal_year: int, status: BudgetLineItemStatus) -> Decimal:
    stmt = (
        select(BudgetLineItem).join(CAN).where(and_(CAN.portfolio_id == portfolio_id, BudgetLineItem.status == status))
    )

    blis = current_app.db_session.execute(stmt).scalars().all()

    return sum([bli.amount for bli in blis if bli.amount and bli.fiscal_year == fiscal_year]) or Decimal(0)


def get_total_funding(
    portfolio: Portfolio,
    fiscal_year: int,
) -> TotalFunding:
    """Get the portfolio total funding for the given fiscal year."""
    total_funding = _get_total_fiscal_year_funding(
        portfolio_id=portfolio.id,
        fiscal_year=fiscal_year,
    )

    carry_forward_funding = _get_carry_forward_total(
        portfolio_id=portfolio.id,
        fiscal_year=fiscal_year,
    )

    new_funding = _get_new_funding_total(
        portfolio_id=portfolio.id,
        fiscal_year=fiscal_year,
    )

    draft_funding = _get_budget_line_item_total_by_status(
        portfolio_id=portfolio.id, fiscal_year=fiscal_year, status=BudgetLineItemStatus.DRAFT
    )

    planned_funding = _get_budget_line_item_total_by_status(
        portfolio_id=portfolio.id, fiscal_year=fiscal_year, status=BudgetLineItemStatus.PLANNED
    )

    obligated_funding = _get_budget_line_item_total_by_status(
        portfolio_id=portfolio.id, fiscal_year=fiscal_year, status=BudgetLineItemStatus.OBLIGATED
    )

    in_execution_funding = _get_budget_line_item_total_by_status(
        portfolio_id=portfolio.id, fiscal_year=fiscal_year, status=BudgetLineItemStatus.IN_EXECUTION
    )

    total_accounted_for = (
        sum(
            (
                planned_funding,
                obligated_funding,
                in_execution_funding,
            )
        )
        or 0
    )

    available_funding = total_funding - total_accounted_for

    return {
        "total_funding": {
            "amount": float(total_funding),
            "percent": "Total",
        },
        "carry_forward_funding": {
            "amount": float(carry_forward_funding),
            "percent": "Carry-Forward",
        },
        "draft_funding": {
            "amount": float(draft_funding),
            "percent": get_percentage(total_funding, draft_funding),
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
        "new_funding": {
            "amount": float(new_funding),
            "percent": "New",
        },
    }


def get_percentage(total_funding: Decimal, specific_funding: Decimal) -> str:
    """Convert a float to a rounded percentage as a string."""
    return f"{round(float(specific_funding) / float(total_funding), 2) * 100}" if total_funding else "0"
