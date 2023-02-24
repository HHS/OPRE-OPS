from typing import Optional, TypedDict

from models.cans import CAN, BudgetLineItem, BudgetLineItemStatus, CANFiscalYear, CANFiscalYearCarryOver


class CanFundingSummary(TypedDict):
    """Dict type hint for total finding"""

    can: CAN
    current_funding: float
    expected_funding: float
    total_funding: float
    carry_over_funding: float
    carry_over_label: str
    planned_funding: float
    obligated_funding: float
    in_execution_funding: float
    available_funding: str
    expiration_date: str


def get_can_funding_summary(can: CAN, fiscal_year: Optional[int] = None) -> CanFundingSummary:
    can_fiscal_year_query = CANFiscalYear.query.filter(CANFiscalYear.can.has(CAN.id == can.id))

    can_fiscal_year_carry_over_query = CANFiscalYearCarryOver.query.filter(
        CANFiscalYearCarryOver.can.has(CAN.id == can.id)
    )

    if fiscal_year:
        can_fiscal_year_query = can_fiscal_year_query.filter(CANFiscalYear.fiscal_year == fiscal_year).all()

        can_fiscal_year_carry_over_query = can_fiscal_year_carry_over_query.filter(
            CANFiscalYearCarryOver.to_fiscal_year == fiscal_year
        ).all()

    current_funding = sum([c.current_funding for c in can_fiscal_year_query]) or 0

    expected_funding = sum([c.expected_funding for c in can_fiscal_year_query]) or 0

    carry_over_data = [
        {
            "amount": ((c.current_amount if c.current_amount else 0) + (c.expected_amount if c.expected_amount else 0)),
            "fy": c.from_fiscal_year,
        }
        for c in can_fiscal_year_carry_over_query
    ]

    if carry_over_data:
        carry_over_funding = sum(c["amount"] for c in carry_over_data)

        carry_over_years = sorted({c["fy"] for c in carry_over_data})

        carry_over_label = ", ".join(f"FY {c}" for c in carry_over_years) + " Carry-Forward"
    else:
        carry_over_funding = 0
        carry_over_label = "Carry-Forward"

    total_funding = current_funding + expected_funding

    # Amount available to a Portfolio budget is the sum of the BLI minus the Portfolio total (above)
    budget_line_items = BudgetLineItem.query.filter(BudgetLineItem.can.has(CAN.id == can.id))

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
        "can": can.to_dict(),
        "current_funding": current_funding,
        "expected_funding": expected_funding,
        "total_funding": total_funding,
        "carry_over_funding": carry_over_funding,
        "carry_over_label": carry_over_label,
        "planned_funding": planned_funding,
        "obligated_funding": obligated_funding,
        "in_execution_funding": in_execution_funding,
        "available_funding": f"{available_funding:.2f}",
        "expiration_date": can.expiration_date.strftime("%m/%d/%Y"),
    }
