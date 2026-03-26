from decimal import Decimal
from unittest.mock import MagicMock

from models.cans import CAN


def _make_can(active_period, appropriation_fy, budgets):
    """Create a mock CAN with the given funding details and budgets.

    Args:
        active_period: Number of active years (1 = one-year CAN, >1 = multi-year).
        appropriation_fy: The fiscal year the CAN was appropriated.
        budgets: List of (fiscal_year, budget_amount) tuples.
    """
    funding_details = MagicMock(fiscal_year=appropriation_fy, active_period=active_period)
    funding_budgets = [MagicMock(fiscal_year=fy, budget=Decimal(str(amt))) for fy, amt in budgets]

    can = MagicMock(
        funding_details=funding_details,
        funding_budgets=funding_budgets,
        active_period=active_period,
    )
    can.classify_funding = lambda fy: CAN.classify_funding(can, fy)
    return can


class TestClassifyFundingOneYearCAN:
    """1-year CANs: all budget in the matching fiscal year is new funding."""

    def test_all_new_in_appropriation_year(self):
        can = _make_can(active_period=1, appropriation_fy=2025, budgets=[(2025, 500_000)])
        new, cf = can.classify_funding(2025)
        assert new == Decimal("500000")
        assert cf == Decimal("0")

    def test_no_budget_for_queried_year(self):
        can = _make_can(active_period=1, appropriation_fy=2025, budgets=[(2025, 500_000)])
        new, cf = can.classify_funding(2024)
        assert new == Decimal("0")
        assert cf == Decimal("0")

    def test_multiple_budgets_same_year(self):
        can = _make_can(
            active_period=1,
            appropriation_fy=2025,
            budgets=[(2025, 300_000), (2025, 200_000)],
        )
        new, cf = can.classify_funding(2025)
        assert new == Decimal("500000")
        assert cf == Decimal("0")


class TestClassifyFundingMultiYearCAN:
    """Multi-year CANs: appropriation year = new, later years = carry-forward."""

    def test_new_in_appropriation_year(self):
        can = _make_can(active_period=5, appropriation_fy=2021, budgets=[(2021, 1_000_000)])
        new, cf = can.classify_funding(2021)
        assert new == Decimal("1000000")
        assert cf == Decimal("0")

    def test_carry_forward_after_appropriation_year(self):
        can = _make_can(active_period=5, appropriation_fy=2021, budgets=[(2023, 600_000)])
        new, cf = can.classify_funding(2023)
        assert new == Decimal("0")
        assert cf == Decimal("600000")

    def test_excluded_before_appropriation_year(self):
        can = _make_can(active_period=5, appropriation_fy=2021, budgets=[(2020, 100_000)])
        new, cf = can.classify_funding(2020)
        assert new == Decimal("0")
        assert cf == Decimal("0")

    def test_mixed_years(self):
        can = _make_can(
            active_period=5,
            appropriation_fy=2021,
            budgets=[
                (2021, 50_000_000),
                (2023, 594_500),
                (2024, 614_000),
            ],
        )
        new_2021, cf_2021 = can.classify_funding(2021)
        assert new_2021 == Decimal("50000000")
        assert cf_2021 == Decimal("0")

        new_2023, cf_2023 = can.classify_funding(2023)
        assert new_2023 == Decimal("0")
        assert cf_2023 == Decimal("594500")

        new_2024, cf_2024 = can.classify_funding(2024)
        assert new_2024 == Decimal("0")
        assert cf_2024 == Decimal("614000")

        # Year with no budget
        new_2022, cf_2022 = can.classify_funding(2022)
        assert new_2022 == Decimal("0")
        assert cf_2022 == Decimal("0")


class TestClassifyFundingNoFundingDetails:
    """CANs without funding_details always return zeros."""

    def test_returns_zeros(self):
        can = MagicMock(funding_details=None, funding_budgets=[])
        can.classify_funding = lambda fy: CAN.classify_funding(can, fy)

        new, cf = can.classify_funding(2025)
        assert new == Decimal("0")
        assert cf == Decimal("0")

    def test_returns_zeros_even_with_budgets(self):
        can = MagicMock(
            funding_details=None,
            funding_budgets=[MagicMock(fiscal_year=2025, budget=Decimal("100000"))],
        )
        can.classify_funding = lambda fy: CAN.classify_funding(can, fy)

        new, cf = can.classify_funding(2025)
        assert new == Decimal("0")
        assert cf == Decimal("0")


class TestClassifyFundingNullBudget:
    """Budget entries with None budget are treated as zero."""

    def test_null_budget_treated_as_zero(self):
        can = _make_can(active_period=1, appropriation_fy=2025, budgets=[(2025, 0)])
        # Override the budget to None (not Decimal("0"))
        can.funding_budgets[0].budget = None

        new, cf = can.classify_funding(2025)
        assert new == Decimal("0")
        assert cf == Decimal("0")
