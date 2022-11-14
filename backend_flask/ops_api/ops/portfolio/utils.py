from decimal import Decimal
from typing import Optional, TypedDict

from ops.can.models import BudgetLineItem
from ops.can.models import BudgetLineItemStatus
from ops.can.models import CAN
from ops.can.models import CANFiscalYear
from ops.portfolio.models import Portfolio
from ops.portfolio.models import PortfolioDescriptionText
from sqlalchemy import func


class PortfolioDict(TypedDict):
    id: int
    name: str
    description: Optional[str]
    status: Optional[str]
    current_fiscal_year_funding: Decimal


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


class PortfolioDescriptionTextDict(TypedDict):
    """Dict type hint for total finding"""

    id: int
    portfolio_id: int
    paragraph_number: int
    text: str


def portfolio_dumper(portfolio: Portfolio) -> PortfolioDict:
    return {
        "id": portfolio.id,
        "name": portfolio.name,
        "description": [portfolio_descriptio_text_dumper(pd) for pd in portfolio.description],
        "status": portfolio.status.name,
    }


def portfolio_descriptio_text_dumper(portfolio_description_text: PortfolioDescriptionText) -> PortfolioDescriptionTextDict:
    return {
        "id": portfolio_description_text.id,
        "portfolio_id": portfolio_description_text.portfolio_id,
        "description": portfolio_description_text.paragraph_number,
        "text": portfolio_description_text.text,
    }


def get_total_funding(
    portfolio: Portfolio, fiscal_year: Optional[int] = None
) -> TotalFunding:

    can_fiscal_year_query = (
        CANFiscalYear.query()
        .join(CAN)
        .filter(CAN.managing_portfolio == portfolio)
        .all()
    )

    if fiscal_year:
        can_fiscal_year_query = can_fiscal_year_query.filter(
            CANFiscalYear.fiscal_year == fiscal_year
        )

    total_funding = (
        can_fiscal_year_query.select(
            [func.sum(CANFiscalYear.total_fiscal_year_funding)]
        )
        or 0
    )

    # Amount available to a Portfolio budget is the sum of the BLI minus the Portfolio total (above)
    budget_line_items = (
        BudgetLineItem.query.join(CAN).filter(CAN.managing_portfolio == portfolio).all()
    )

    if fiscal_year:
        budget_line_items = budget_line_items.query.filter(
            BudgetLineItem.fiscal_year == fiscal_year
        )

    planned_funding = (
        budget_line_items.filter(
            BudgetLineItem.status
            == BudgetLineItemStatus.query.filter(
                BudgetLineItem.status == "Planned"
            ).one()
        ).select([func.sum("amount")])
        or 0
    )

    obligated_funding = (
        budget_line_items.filter(
            status=BudgetLineItemStatus.objects.get(status="Obligated")
        ).select([func.sum("amount")])
        or 0
    )

    in_execution_funding = (
        budget_line_items.filter(
            status=BudgetLineItemStatus.objects.get(status="In Execution")
        ).select([func.sum("amount")])
        or 0
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
