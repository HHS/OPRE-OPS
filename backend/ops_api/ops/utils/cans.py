from decimal import Decimal
from typing import List, Optional, TypedDict

from models import CAN, BudgetLineItemStatus


class CanObject(TypedDict):
    can: dict
    carry_forward_label: str
    expiration_date: str


class CanFundingSummary(TypedDict):
    """Dict type hint for total funding"""

    available_funding: float
    cans: list[CanObject]
    carry_forward_funding: float
    received_funding: float
    expected_funding: float
    in_execution_funding: float
    obligated_funding: float
    planned_funding: float
    total_funding: float
    new_funding: float


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
        "available_funding": available_funding,
        "cans": [
            {
                "can": can.to_dict(),
                "carry_forward_label": carry_forward_label,
                "expiration_date": f"10/01/{can.obligate_by}" if can.obligate_by else "",
            }
        ],
        "carry_forward_funding": carry_forward_funding,
        "received_funding": received_funding,
        "expected_funding": total_funding - received_funding,
        "in_execution_funding": in_execution_funding,
        "obligated_funding": obligated_funding,
        "planned_funding": planned_funding,
        "total_funding": total_funding,
        "new_funding": available_funding + carry_forward_funding,
    }


def get_nested_attribute(obj, attribute_path):
    """
    Given an object and a string representing a dot-separated attribute path,
    returns the value of the attribute.
    """
    attributes = attribute_path.split(".")
    for attr in attributes:
        obj = getattr(obj, attr, None)  # Get the attribute dynamically
        if obj is None:
            return None  # If any attribute is None, return None
    return obj  # Return the final value


def filter_cans_by_attribute(cans: list[CAN], attribute_search: str, attribute_list) -> list[CAN]:
    """
    Filters the list of cans based on a nested attribute search.
    The attribute search is a string that can specify nested attributes, separated by dots.
    """
    return [can for can in cans if get_nested_attribute(can, attribute_search) in attribute_list]


def filter_cans_by_fiscal_year_budget(cans: list[CAN], fiscal_year_budget: list[int]) -> list[CAN]:
    return [
        can
        for can in cans
        if any(fiscal_year_budget[0] <= budget.budget <= fiscal_year_budget[1] for budget in can.funding_budgets)
    ]


def filter_cans(cans, active_period=None, transfer=None, portfolio=None, fy_budget=None):
    """
    Filters the given list of 'cans' based on the provided attributes.

    :param cans: List of cans to be filtered
    :param active_period: Value to filter by 'active_period' attribute
    :param transfer: Value to filter by 'funding_details.method_of_transfer' attribute
    :param portfolio: Value to filter by 'portfolios.abbr' attribute
    :param fy_budget: Value to filter by fiscal year budget
    :return: Filtered list of cans
    """
    if active_period:
        cans = filter_cans_by_attribute(cans, "active_period", active_period)
    if transfer:
        cans = filter_cans_by_attribute(cans, "funding_details.method_of_transfer", transfer)
    if portfolio:
        cans = filter_cans_by_attribute(cans, "portfolios.abbr", portfolio)
    if fy_budget:
        cans = filter_cans_by_fiscal_year_budget(cans, fy_budget)
    return cans


def aggregate_funding_summaries(funding_summaries: List[CanFundingSummary]) -> dict:
    totals = {
        "available_funding": Decimal("0.0"),
        "carry_forward_funding": Decimal("0.0"),
        "cans": [],
        "expected_funding": Decimal("0.0"),
        "in_execution_funding": Decimal("0.0"),
        "new_funding": Decimal("0.0"),
        "obligated_funding": Decimal("0.0"),
        "planned_funding": Decimal("0.0"),
        "received_funding": Decimal("0.0"),
        "total_funding": Decimal("0.0"),
    }

    for summary in funding_summaries:
        for key in totals:
            if key != "cans":
                totals[key] += (
                    Decimal(summary.get(key, "0.0"))
                    if isinstance(summary.get(key), (int, float, Decimal))
                    else Decimal("0.0")
                )

        for can in summary["cans"]:
            totals["cans"].append(
                {
                    "can": can["can"],
                    "carry_forward_label": can["carry_forward_label"],
                    "expiration_date": can["expiration_date"],
                }
            )

    return totals
