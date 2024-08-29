from typing import Optional, TypedDict

from models import CAN, BudgetLineItemStatus


class CanFundingSummary(TypedDict):
    """Dict type hint for total funding"""

    can: CAN
    received_funding: float
    expected_funding: float
    total_funding: float
    carry_forward_funding: float
    carry_forward_label: str
    planned_funding: float
    obligated_funding: float
    in_execution_funding: float
    available_funding: float
    expiration_date: str


def get_can_funding_summary(can: CAN, fiscal_year: Optional[int] = None) -> CanFundingSummary:
    if fiscal_year:
        received_funding = sum([c.funding for c in can.funding_received if c.fiscal_year == fiscal_year]) or 0

        total_funding = sum([c.budget for c in can.funding_budgets if c.fiscal_year == fiscal_year]) or 0

        carry_forward_funding = sum([c.budget for c in can.funding_budgets[1:] if c.fiscal_year == fiscal_year]) or 0

        planned_funding = (
            sum(
                [
                    bli.amount
                    for bli in can.budget_line_items
                    if bli.status == BudgetLineItemStatus.PLANNED and bli.fiscal_year == fiscal_year
                ]
            )
            or 0
        )

        obligated_funding = (
            sum(
                [
                    bli.amount
                    for bli in can.budget_line_items
                    if bli.status == BudgetLineItemStatus.OBLIGATED and bli.fiscal_year == fiscal_year
                ]
            )
            or 0
        )

        in_execution_funding = (
            sum(
                [
                    bli.amount
                    for bli in can.budget_line_items
                    if bli.status == BudgetLineItemStatus.IN_EXECUTION and bli.fiscal_year == fiscal_year
                ]
            )
            or 0
        )
    else:
        received_funding = sum([c.funding for c in can.funding_received]) or 0

        total_funding = sum([c.budget for c in can.funding_budgets]) or 0

        carry_forward_funding = sum([c.budget for c in can.funding_budgets[1:]]) or 0

        planned_funding = (
            sum([bli.amount for bli in can.budget_line_items if bli.status == BudgetLineItemStatus.PLANNED]) or 0
        )

        obligated_funding = (
            sum([bli.amount for bli in can.budget_line_items if bli.status == BudgetLineItemStatus.OBLIGATED]) or 0
        )

        in_execution_funding = (
            sum([bli.amount for bli in can.budget_line_items if bli.status == BudgetLineItemStatus.IN_EXECUTION]) or 0
        )

    carry_forward_label = (
        "Carry-Forward"
        if len(can.funding_budgets[1:]) == 1
        else ", ".join(f"FY {c}" for c in [c.fiscal_year for c in can.funding_budgets[1:]]) + " Carry-Forward"
    )

    available_funding = total_funding - sum([planned_funding, obligated_funding, in_execution_funding]) or 0

    return {
        "can": can.to_dict(),
        "received_funding": received_funding,
        "expected_funding": total_funding - received_funding,
        "total_funding": total_funding,
        "carry_forward_funding": carry_forward_funding,
        "carry_forward_label": carry_forward_label,
        "planned_funding": planned_funding,
        "obligated_funding": obligated_funding,
        "in_execution_funding": in_execution_funding,
        "available_funding": available_funding,
        "expiration_date": f"10/01/{can.obligate_by}" if can.obligate_by else "",
    }
