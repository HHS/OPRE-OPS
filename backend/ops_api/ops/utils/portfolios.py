from decimal import Decimal
from typing import Any, Optional, TypedDict

from flask import current_app
from sqlalchemy import Select, select, sql
from sqlalchemy.sql.functions import coalesce

from models import CAN, BudgetLineItem, BudgetLineItemStatus, Portfolio


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


def _get_total_fiscal_year_funding(portfolio_id: int, fiscal_year: int) -> Decimal:
    # stmt = (
    #     select(coalesce(sql.functions.sum(CANFiscalYear.total_funding), 0))
    #     .join(CAN)
    #     .where(CAN.managing_portfolio_id == portfolio_id)
    #     .where(CANFiscalYear.fiscal_year == fiscal_year)
    # )

    stmt = ""  # TODO: Implement this query
    return current_app.db_session.scalar(stmt)


def _get_carry_forward_total(portfolio_id: int, fiscal_year: int) -> Decimal:
    # stmt = (
    #     select(coalesce(sql.functions.sum(CANFiscalYearCarryForward.total_amount), 0))
    #     .join(CAN)
    #     .where(CAN.managing_portfolio_id == portfolio_id)
    #     .where(CANFiscalYearCarryForward.to_fiscal_year == fiscal_year)
    # )

    stmt = ""  # TODO: Implement this query

    return current_app.db_session.scalar(stmt)


def _get_budget_line_item_total_by_status(portfolio_id: int, status: BudgetLineItemStatus) -> Decimal:
    stmt = _get_budget_line_item_total(portfolio_id)
    stmt = stmt.where(BudgetLineItem.status == status)

    return current_app.db_session.scalar(stmt)


def _get_budget_line_item_total(portfolio_id: int) -> Select[Any]:
    stmt = (
        select(coalesce(sql.functions.sum(BudgetLineItem.amount), 0))
        .join(CAN)
        .where(CAN.managing_portfolio_id == portfolio_id)
    )

    return stmt


def get_total_funding(
    portfolio: Portfolio,
    fiscal_year: Optional[int] = None,
) -> TotalFunding:
    """Get the portfolio total funding for the given fiscal year."""
    if fiscal_year is None:
        raise ValueError
    total_funding = _get_total_fiscal_year_funding(
        portfolio_id=portfolio.id,
        fiscal_year=fiscal_year,
    )

    carry_forward_funding = _get_carry_forward_total(
        portfolio_id=portfolio.id,
        fiscal_year=fiscal_year,
    )

    planned_funding = _get_budget_line_item_total_by_status(
        portfolio_id=portfolio.id, status=BudgetLineItemStatus.PLANNED
    )

    obligated_funding = _get_budget_line_item_total_by_status(
        portfolio_id=portfolio.id, status=BudgetLineItemStatus.OBLIGATED
    )

    in_execution_funding = _get_budget_line_item_total_by_status(
        portfolio_id=portfolio.id, status=BudgetLineItemStatus.IN_EXECUTION
    )

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
        "carry_forward_funding": {
            "amount": float(carry_forward_funding),
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
    """Convert a float to a rounded percentage as a string."""
    return f"{round(float(specific_funding) / float(total_funding), 2) * 100}" if total_funding else "0"
