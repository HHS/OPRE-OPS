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
    """
    Return the funding amount for the given CAN based on the BudgetLineItem status and fiscal year.
    """
    if fiscal_year:
        return (
            sum(
                [bli.amount for bli in can.budget_line_items if bli.status == status and bli.fiscal_year == fiscal_year]
            )
            or 0
        )
    else:
        return sum([bli.amount for bli in can.budget_line_items if bli.status == status]) or 0


def get_can_funding_summary(can: CAN, fiscal_year: Optional[int] = None) -> CanFundingSummary:
    """
    Return a CanFundingSummary dictionary funding summary for the given CAN.
    """
    if fiscal_year:
        received_funding = sum([c.funding for c in can.funding_received if c.fiscal_year == fiscal_year]) or 0

        new_funding = (
            sum(
                c.budget
                for c in can.funding_budgets
                if (
                    c.fiscal_year == fiscal_year
                    and (can.active_period == 1 or fiscal_year == can.funding_details.fiscal_year == c.fiscal_year)
                )
            )
            or 0
        )

        planned_funding = get_funding_by_budget_line_item_status(can, BudgetLineItemStatus.PLANNED, fiscal_year)
        obligated_funding = get_funding_by_budget_line_item_status(can, BudgetLineItemStatus.OBLIGATED, fiscal_year)
        in_execution_funding = get_funding_by_budget_line_item_status(
            can, BudgetLineItemStatus.IN_EXECUTION, fiscal_year
        )
        in_draft_funding = get_funding_by_budget_line_item_status(can, BudgetLineItemStatus.DRAFT, fiscal_year)

        carry_forward_funding = (
            sum(
                c.budget
                for c in can.funding_budgets
                if c.fiscal_year == fiscal_year
                and can.active_period != 1
                and (fiscal_year != can.funding_details.fiscal_year)
            )
            or 0
        )

    else:
        received_funding = sum([c.funding for c in can.funding_received]) or 0

        new_funding = (
            sum(
                c.budget
                for c in can.funding_budgets
                if can.active_period == 1 or can.funding_details.fiscal_year == c.fiscal_year
            )
            or 0
        )

        planned_funding = get_funding_by_budget_line_item_status(can, BudgetLineItemStatus.PLANNED, None)
        obligated_funding = get_funding_by_budget_line_item_status(can, BudgetLineItemStatus.OBLIGATED, None)
        in_execution_funding = get_funding_by_budget_line_item_status(can, BudgetLineItemStatus.IN_EXECUTION, None)
        in_draft_funding = get_funding_by_budget_line_item_status(can, BudgetLineItemStatus.DRAFT, None)

        carry_forward_funding = (
            sum(
                c.budget
                for c in can.funding_budgets
                if can.active_period != 1 and (can.funding_details.fiscal_year != c.fiscal_year)
            )
            or 0
        )

    carry_forward_label = (
        "Carry-Forward"
        if len(can.funding_budgets[1:]) == 1
        else ", ".join(f"FY {c}" for c in [c.fiscal_year for c in can.funding_budgets[1:]]) + " Carry-Forward"
    )

    total_funding = carry_forward_funding + new_funding
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
    :param obj: The object to get the attribute from
    :param attribute_path: The dot-separated attribute path
    :return: The value of the attribute, or None if any attribute is None or the attribute does not exist
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


def filter_by_fiscal_year_budget(cans: list[CAN], budgets: list[Decimal], budget_fiscal_year: int) -> list[CAN]:
    """
    Filters the list of cans based on the fiscal year budget's minimum and maximum values.
    """
    if budget_fiscal_year:
        return [
            can
            for can in cans
            if any(
                budgets[0] <= budget.budget <= budgets[1]
                for budget in can.funding_budgets
                if budget.fiscal_year == budget_fiscal_year
            )
        ]
    else:
        return [can for can in cans if any(budgets[0] <= budget.budget <= budgets[1] for budget in can.funding_budgets)]


def get_filtered_cans(
    cans: list[CAN], fiscal_year=None, active_period=None, transfer=None, portfolio=None, fy_budget=None
):
    """
    Returns a filtered list of CANs for the given list of CANs based on the provided attributes.
    """

    # filter cans by budget fiscal year
    cans_filtered_by_fiscal_year = set()
    if fiscal_year:
        for can in cans:
            for each in can.funding_budgets:
                if each.fiscal_year == fiscal_year:
                    cans_filtered_by_fiscal_year.add(can)

        cans = [can for can in cans_filtered_by_fiscal_year]

    if active_period:
        cans = filter_by_attribute(cans, "active_period", active_period)
    if transfer:
        cans = filter_by_attribute(cans, "funding_details.method_of_transfer", transfer)
    if portfolio:
        cans = filter_by_attribute(cans, "portfolio.abbreviation", portfolio)
    if fy_budget:
        cans = filter_by_fiscal_year_budget(cans, fy_budget, fiscal_year)
    return cans


def aggregate_funding_summaries(funding_summaries: List[dict]) -> CanFundingSummary:
    """
    Aggregates the funding summaries for multiple cans into a single total funding summary.
    :param funding_summaries: List of funding summaries to aggregate
    :return: A single total funding summary
    """
    totals: CanFundingSummary = {
        "available_funding": 0.0,
        "cans": [],
        "carry_forward_funding": 0.0,
        "expected_funding": 0.0,
        "in_draft_funding": 0.0,
        "in_execution_funding": 0.0,
        "new_funding": 0.0,
        "obligated_funding": 0.0,
        "planned_funding": 0.0,
        "received_funding": 0.0,
        "total_funding": 0.0,
    }

    for summary in funding_summaries:
        for key in totals:
            if key != "cans":
                current_value = summary.get(key, None)
                if current_value is None:
                    current_value = 0.0
                if isinstance(current_value, (int, float, Decimal)):
                    current_value = Decimal(current_value)
                totals[key] = Decimal(totals[key]) + Decimal(current_value)

        totals["cans"].append(summary.get("cans", [])[0])

    return totals
