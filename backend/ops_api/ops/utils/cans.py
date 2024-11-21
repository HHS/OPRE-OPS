from decimal import Decimal
from typing import List, Optional, TypedDict

from models import CAN, BudgetLineItemStatus


class CanObject(TypedDict):
    can: dict
    carry_forward_label: str
    expiration_date: str


class CanFundingSummary(TypedDict):
    """Dict type hint for total funding"""

    available_funding: float  # remaining
    cans: list[CanObject]
    carry_forward_funding: float
    received_funding: float
    expected_funding: float
    in_draft_funding: float
    in_execution_funding: float
    obligated_funding: float
    planned_funding: float
    total_funding: float
    new_funding: float


def get_funding_by_budget_line_item_status(
    can: CAN, status: BudgetLineItemStatus, fiscal_year: Optional[int] = None
) -> float:
    if fiscal_year:
        return (
            sum(
                [bli.amount for bli in can.budget_line_items if bli.status == status and bli.fiscal_year == fiscal_year]
            )
            or 0
        )
    else:
        return sum([bli.amount for bli in can.budget_line_items if bli.status == status]) or 0


def get_new_funding_by_funding_details(can: CAN) -> Optional[float]:
    # Get the fiscal year on the can's FundingDetails object
    fiscal_year = can.funding_details.fiscal_year

    if not fiscal_year:
        return None  # If the fiscal year is missing or empty, return None

    # Filter the funding budgets that match the fiscal year
    matching_budgets = [budget for budget in can.funding_budgets if budget.fiscal_year == fiscal_year]

    # If no matching budgets exist, return None
    if not matching_budgets:
        return None  # If no budget exist for the fiscal year the can was created, return None

    # Sum the budgets for the matching fiscal year, return 0 if there are no budgets
    total_funding = sum(budget.budget for budget in matching_budgets) or 0

    return total_funding or None  # Return the total, or None if it's zero


def get_new_funding_by_fiscal_year(can: CAN, fiscal_year: Optional[int] = None) -> Optional[float]:
    # check to see if the CAN has an active period of 1
    if can.active_period == 1:
        return sum([c.budget for c in can.funding_budgets if c.fiscal_year == fiscal_year]) or 0
    else:
        # Check to see if the CAN is in it first year
        return get_new_funding_by_funding_details(can)


def get_can_funding_summary(can: CAN, fiscal_year: Optional[int] = None) -> CanFundingSummary:
    if fiscal_year:
        received_funding = sum([c.funding for c in can.funding_received if c.fiscal_year == fiscal_year]) or 0

        total_funding = sum([c.budget for c in can.funding_budgets if c.fiscal_year == fiscal_year]) or 0

        carry_forward_funding = sum([c.budget for c in can.funding_budgets[1:] if c.fiscal_year == fiscal_year]) or 0

        new_funding = get_new_funding_by_fiscal_year(can, fiscal_year)

        planned_funding = get_funding_by_budget_line_item_status(can, BudgetLineItemStatus.PLANNED, fiscal_year)
        obligated_funding = get_funding_by_budget_line_item_status(can, BudgetLineItemStatus.OBLIGATED, fiscal_year)
        in_execution_funding = get_funding_by_budget_line_item_status(
            can, BudgetLineItemStatus.IN_EXECUTION, fiscal_year
        )
        in_draft_funding = get_funding_by_budget_line_item_status(can, BudgetLineItemStatus.DRAFT, fiscal_year)
    else:
        received_funding = sum([c.funding for c in can.funding_received]) or 0

        total_funding = sum([c.budget for c in can.funding_budgets]) or 0

        carry_forward_funding = sum([c.budget for c in can.funding_budgets[1:]]) or 0

        new_funding = get_new_funding_by_funding_details(can)

        planned_funding = get_funding_by_budget_line_item_status(can, BudgetLineItemStatus.PLANNED, None)
        obligated_funding = get_funding_by_budget_line_item_status(can, BudgetLineItemStatus.OBLIGATED, None)
        in_execution_funding = get_funding_by_budget_line_item_status(can, BudgetLineItemStatus.IN_EXECUTION, None)
        in_draft_funding = get_funding_by_budget_line_item_status(can, BudgetLineItemStatus.DRAFT, None)

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
        "in_draft_funding": in_draft_funding,
        "in_execution_funding": in_execution_funding,
        "new_funding": new_funding,
        "obligated_funding": obligated_funding,
        "planned_funding": planned_funding,
        "total_funding": total_funding,
    }


def get_nested_attribute(obj, attribute_path):
    """
    Given an object and a string representing a dot-separated attribute path,
    returns the value of the attribute dynamically. If any attribute is None, return None.
    """
    attributes = attribute_path.split(".")
    for attr in attributes:
        obj = getattr(obj, attr, None)
        if obj is None:
            return None
    return obj


def filter_by_attribute(cans: list[CAN], attribute_search: str, attribute_list) -> list[CAN]:
    """
    Filters the list of cans based on a nested attribute search.
    The attribute search is a string that can specify nested attributes, separated by dots.
    For example, "portfolios.abbr" would search for the 'abbr' attribute in the 'portfolios' attribute.
    """
    return [can for can in cans if get_nested_attribute(can, attribute_search) in attribute_list]


def filter_by_fiscal_year_budget(cans: list[CAN], fiscal_year_budget: list[int]) -> list[CAN]:
    return [
        can
        for can in cans
        if any(fiscal_year_budget[0] <= budget.budget <= fiscal_year_budget[1] for budget in can.funding_budgets)
    ]


def get_filtered_cans(cans, fiscal_year=None, active_period=None, transfer=None, portfolio=None, fy_budget=None):
    """
    Filters the given list of 'cans' based on the provided attributes.

    :param cans: List of cans to be filtered
    :param fiscal_year: Value to filter by fiscal year
    :param active_period: Value to filter by 'active_period' attribute
    :param transfer: Value to filter by 'funding_details.method_of_transfer' attribute
    :param portfolio: Value to filter by 'portfolios.abbr' attribute
    :param fy_budget: Value to filter by fiscal year budget
    :return: Filtered list of cans
    """
    if fiscal_year:
        cans = filter_by_attribute(cans, "funding_details.fiscal_year", [fiscal_year])
    if active_period:
        cans = filter_by_attribute(cans, "active_period", active_period)
    if transfer:
        cans = filter_by_attribute(cans, "funding_details.method_of_transfer", transfer)
    if portfolio:
        cans = filter_by_attribute(cans, "portfolios.abbr", portfolio)
    if fy_budget:
        cans = filter_by_fiscal_year_budget(cans, fy_budget)
    return cans


def aggregate_funding_summaries(funding_summaries: List[CanFundingSummary]) -> dict:
    totals = {
        "available_funding": Decimal("0.0"),
        "carry_forward_funding": Decimal("0.0"),
        "cans": [],
        "expected_funding": Decimal("0.0"),
        "in_draft_funding": Decimal("0.0"),
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
