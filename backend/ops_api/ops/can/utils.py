from typing import Optional, TypedDict

from ops.can.models import BudgetLineItem
from ops.can.models import BudgetLineItemStatus
from ops.can.models import CAN
from ops.can.models import CANFiscalYear


class CanFundingSummary(TypedDict):
    """Dict type hint for total finding"""

    can: CAN
    current_funding: float
    expected_funding: float
    total_funding: float
    planned_funding: float
    obligated_funding: float
    in_execution_funding: float
    available_funding: float
    expiration_date: str


def get_can_funding_summary(can: CAN, fiscal_year: Optional[int] = None) -> None:
    can_fiscal_year_query = CANFiscalYear.query.filter(
        CANFiscalYear.can.has(CAN.id == can.id)
    )

    if fiscal_year:
        can_fiscal_year_query = can_fiscal_year_query.filter(
            CANFiscalYear.fiscal_year == fiscal_year
        ).all()

    # total_funding = (
    #     sum([c.total_fiscal_year_funding for c in can_fiscal_year_query]) or 0
    # )
    current_funding = sum([c.current_funding for c in can_fiscal_year_query]) or 0

    expected_funding = sum([c.expected_funding for c in can_fiscal_year_query]) or 0

    carry_over_funding = sum([c.carry_over_funding if c.carry_over_funding else 0 for c in can_fiscal_year_query]) or 0

    total_funding = current_funding + expected_funding

    # Amount available to a Portfolio budget is the sum of the BLI minus the Portfolio total (above)
    budget_line_items = BudgetLineItem.query.filter(
        BudgetLineItem.can.has(CAN.id == can.id)
    )

    if fiscal_year:
        budget_line_items = budget_line_items.filter(
            BudgetLineItem.fiscal_year == fiscal_year
        )

    planned_budget_line_items = budget_line_items.filter(
        BudgetLineItem.status.has(BudgetLineItemStatus.Planned)
    ).all()
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
        "can": can.to_dict(),
        "current_funding": current_funding,
        "expected_funding": expected_funding,
        "total_funding": total_funding,
        "carry_over_funding": carry_over_funding,
        "planned_funding": planned_funding,
        "obligated_funding": obligated_funding,
        "in_execution_funding": in_execution_funding,
        "available_funding": available_funding,
        "expiration_date": can.expiration_date.strftime("%m/%d/%Y"),
    }
