from typing import Optional, TypedDict

from sqlalchemy import and_, select
from sqlalchemy.orm import object_session

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


def get_can_funding_summary(can: CAN, fiscal_year: Optional[int] = None) -> CanFundingSummary:
    can_fiscal_year_list = []
    can_fiscal_year_carry_forward_list = []
    session = object_session(can)

    if fiscal_year:
        can_fiscal_year_list = (
            session.execute(
                select(CANFiscalYear).where(
                    and_(CANFiscalYear.can_id == can.id, CANFiscalYear.fiscal_year == fiscal_year)
                )
            )
            .scalars()
            .all()
        )

        can_fiscal_year_carry_forward_list = (
            object_session(can)
            .execute(
                select(CANFiscalYearCarryForward).where(
                    and_(
                        CANFiscalYearCarryForward.can_id == can.id,
                        CANFiscalYearCarryForward.to_fiscal_year == fiscal_year,
                    )
                )
            )
            .scalars()
            .all()
        )
    else:
        can_fiscal_year_list = (
            object_session(can).execute(select(CANFiscalYear).where(CANFiscalYear.can_id == can.id)).scalars().all()
        )

        can_fiscal_year_carry_forward_list = (
            object_session(can)
            .execute(select(CANFiscalYearCarryForward).where(CANFiscalYearCarryForward.can_id == can.id))
            .scalars()
            .all()
        )

    received_funding = sum([c.received_funding for c in can_fiscal_year_list]) or 0

    expected_funding = sum([c.expected_funding for c in can_fiscal_year_list]) or 0

    carry_forward_data = [
        {
            "amount": c.total_amount or 0,
            "fy": c.from_fiscal_year,
        }
        for c in can_fiscal_year_carry_forward_list
    ]

    if carry_forward_data:
        carry_forward_funding = sum(c["amount"] for c in carry_forward_data)

        carry_forward_years = sorted({c["fy"] for c in carry_forward_data})

        carry_forward_label = ", ".join(f"FY {c}" for c in carry_forward_years) + " Carry-Forward"
    else:
        carry_forward_funding = 0
        carry_forward_label = "Carry-Forward"

    total_funding = received_funding + expected_funding

    # Amount available to a Portfolio budget is the sum of the BLI minus the Portfolio total (above)
    budget_line_items = (
        object_session(can).execute(select(BudgetLineItem).where(BudgetLineItem.can_id == can.id)).scalars().all()
    )
    planned_budget_line_items = [bli for bli in budget_line_items if bli.status == BudgetLineItemStatus.PLANNED]
    planned_funding = sum([b.amount for b in planned_budget_line_items]) or 0

    obligated_budget_line_items = [bli for bli in budget_line_items if bli.status == BudgetLineItemStatus.OBLIGATED]
    obligated_funding = sum([b.amount for b in obligated_budget_line_items]) or 0

    in_execution_budget_line_items = [
        bli for bli in budget_line_items if bli.status == BudgetLineItemStatus.IN_EXECUTION
    ]
    in_execution_funding = sum([b.amount for b in in_execution_budget_line_items]) or 0
    total_accounted_for = sum((planned_funding, obligated_funding, in_execution_funding)) or 0

    available_funding = total_funding - total_accounted_for

    can_dict = can.to_dict()
    can_dict.update(
        {
            "display_name": can.display_name,
        }
    )

    return {
        "can": can_dict,
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
