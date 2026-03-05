from decimal import Decimal
from typing import Iterable, List, Optional, TypedDict

from models import CAN, BudgetLineItemStatus


def is_can_active_for_year(can: CAN, fiscal_year: int) -> bool:
    """
    Determine whether a CAN is considered "active" for a given fiscal year.

    This is the **single source of truth** for active-period filtering logic,
    used by both:
      - GET /portfolios/{id}/cans/  (PortfolioCansAPI)
      - GET /cans/                  (CANListAPI via CANService)

    A CAN is active for a fiscal year if ALL of the following are true:
      1. The CAN has ``funding_details`` with a valid ``active_period``.
      2. The fiscal year falls within the CAN's active window:
         - **Perpetual funds** (``active_period == 0``): active for any year >= funding start year.
         - **Time-limited funds** (``active_period >= 1``): active within the half-open interval
           ``[funding_details.fiscal_year, funding_details.fiscal_year + active_period)``.

    Args:
        can: The CAN instance to check.
        fiscal_year: The fiscal year to evaluate against.

    Returns:
        True if the CAN is active for the given fiscal year, False otherwise.

    .. note::
        **Future consolidation (Option B):**
        Currently two endpoints expose CAN data filtered by active period:

        * ``GET /portfolios/{id}/cans/`` — portfolio-scoped, returns a bare JSON array,
          supports ``includeInactive``, BLI-level fiscal year filtering, and sorts by
          appropriation year descending. Used by ``PortfolioSpending`` and ``PortfolioFunding``.

        * ``GET /cans/`` — paginated, supports rich filtering (portfolio, transfer,
          active_period, budget range), configurable sorting, and search. Used by the
          CAN management list page (``CanList``).

        A future consolidation should:
        1. Add ``includeInactive`` and ``budgetFiscalYear`` (BLI filtering) query params to ``GET /cans/``.
        2. Add an appropriation-year sort option to ``GET /cans/``.
        3. Migrate ``PortfolioSpending`` / ``PortfolioFunding`` to ``useGetCansQuery`` with ``portfolio_id``.
        4. Deprecate and remove ``GET /portfolios/{id}/cans/``.

        See also: the endpoint-level docstrings on ``PortfolioCansAPI`` and ``CANListAPI``
        for per-endpoint documentation of their differences.
    """
    if not can.funding_details:
        return False

    active_period = can.active_period
    if active_period is None:
        return False

    start_year = can.funding_details.fiscal_year

    # Perpetual funds (active_period == 0) are active for any year at or after the start year
    if active_period == 0:
        return fiscal_year >= start_year

    # Time-limited funds: half-open interval [start_year, start_year + active_period)
    return start_year <= fiscal_year < (start_year + active_period)


def filter_active_cans(cans: Optional[Iterable[CAN]] = None, fiscal_year: Optional[int] = None) -> set[CAN]:
    """
    Filter a collection of CANs to include only those active for a given fiscal year.

    Uses :func:`is_can_active_for_year` for the per-CAN determination.

    Args:
        cans: An iterable of CAN instances to filter. If ``None`` or empty, returns an empty set.
        fiscal_year: The fiscal year to check. If ``None``, all CANs are returned unfiltered.

    Returns:
        A set of CANs that are active for the given fiscal year.
    """
    if not cans:
        return set()

    if fiscal_year is None:
        return set(cans)

    fiscal_year = int(fiscal_year)

    return {can for can in cans if is_can_active_for_year(can, fiscal_year)}


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
                [
                    bli.amount
                    for bli in can.budget_line_items
                    if bli.amount and bli.status == status and bli.fiscal_year == fiscal_year
                ]
            )
            or 0
        )
    else:
        return sum([bli.amount for bli in can.budget_line_items if bli.amount and bli.status == status]) or 0


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
                    can.funding_details  # funding_details is required
                    and c.fiscal_year == fiscal_year
                    and (
                        can.active_period == 1  # budgets for 1 Year CANS
                        or (
                            fiscal_year == can.funding_details.fiscal_year == c.fiscal_year
                        )  # budgets for CANs that are in their appropriation year
                    )
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
                and can.funding_details
                and can.active_period != 1
                and (fiscal_year > can.funding_details.fiscal_year)
            )
            or 0
        )

    else:
        received_funding = sum([c.funding for c in can.funding_received]) or 0

        new_funding = (
            sum(
                c.budget
                for c in can.funding_budgets
                if (
                    can.funding_details
                    and (can.active_period == 1 or (can.funding_details.fiscal_year == c.fiscal_year))
                )
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
                if can.funding_details and can.active_period != 1 and (can.funding_details.fiscal_year != c.fiscal_year)
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
                "expiration_date": f"9/30/{can.obligate_by}" if can.obligate_by else "",
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
    Also checks if the funds in the CAN are expired.
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
            and can.funding_details
            and can.funding_details.fiscal_year <= budget_fiscal_year <= can.funding_details.obligate_by
        ]

    else:
        return [can for can in cans if any(budgets[0] <= budget.budget <= budgets[1] for budget in can.funding_budgets)]


def get_filtered_cans(
    cans: list[CAN],
    fiscal_year=None,
    active_period=None,
    transfer=None,
    portfolio=None,
    fy_budget=None,
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
