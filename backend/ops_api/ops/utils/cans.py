from typing import Optional, TypedDict

from models.cans import CAN, BudgetLineItem, BudgetLineItemStatus, CANFiscalYear, CANFiscalYearCarryForward


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


def get_can_funding_summary(
    can: CAN, fiscal_year: Optional[int] = None
) -> CanFundingSummary:
    can_fiscal_year_query = CANFiscalYear.query.filter(
        CANFiscalYear.can.has(CAN.id == can.id)
    )

    can_fiscal_year_carry_forward_query = CANFiscalYearCarryForward.query.filter(
        CANFiscalYearCarryForward.can.has(CAN.id == can.id)
    )

    if fiscal_year:
        can_fiscal_year_query = can_fiscal_year_query.filter(
            CANFiscalYear.fiscal_year == fiscal_year
        ).all()

        can_fiscal_year_carry_forward_query = (
            can_fiscal_year_carry_forward_query.filter(
                CANFiscalYearCarryForward.to_fiscal_year == fiscal_year
            ).all()
        )

    received_funding = sum([c.received_funding for c in can_fiscal_year_query]) or 0

    expected_funding = sum([c.expected_funding for c in can_fiscal_year_query]) or 0

    carry_forward_data = [
        {
            "amount": (
                (c.received_amount if c.received_amount else 0)
                + (c.expected_amount if c.expected_amount else 0)
            ),
            "fy": c.from_fiscal_year,
        }
        for c in can_fiscal_year_carry_forward_query
    ]

    if carry_forward_data:
        carry_forward_funding = sum(c["amount"] for c in carry_forward_data)

        carry_forward_years = sorted({c["fy"] for c in carry_forward_data})

        carry_forward_label = (
            ", ".join(f"FY {c}" for c in carry_forward_years) + " Carry-Forward"
        )
    else:
        carry_forward_funding = 0
        carry_forward_label = "Carry-Forward"

    total_funding = received_funding + expected_funding

    # Amount available to a Portfolio budget is the sum of the BLI minus the Portfolio total (above)
    budget_line_items = BudgetLineItem.query.filter(
        BudgetLineItem.can.has(CAN.id == can.id)
    )

    planned_budget_line_items = budget_line_items.where(
        BudgetLineItem.status == BudgetLineItemStatus.PLANNED
    ).all()
    planned_funding = sum([b.amount for b in planned_budget_line_items]) or 0

    obligated_budget_line_items = budget_line_items.filter(
        BudgetLineItem.status == BudgetLineItemStatus.OBLIGATED
    ).all()
    obligated_funding = sum([b.amount for b in obligated_budget_line_items]) or 0

    in_execution_budget_line_items = budget_line_items.filter(
        BudgetLineItem.status == BudgetLineItemStatus.IN_EXECUTION
    ).all()
    in_execution_funding = sum([b.amount for b in in_execution_budget_line_items]) or 0

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
        "received_funding": received_funding,
        "expected_funding": expected_funding,
        "total_funding": total_funding,
        "carry_forward_funding": carry_forward_funding,
        "carry_forward_label": carry_forward_label,
        "planned_funding": planned_funding,
        "obligated_funding": obligated_funding,
        "in_execution_funding": in_execution_funding,
        "available_funding": available_funding,
        "expiration_date": can.expiration_date.strftime("%m/%d/%Y"),
    }
