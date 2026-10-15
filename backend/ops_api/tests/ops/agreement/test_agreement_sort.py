from datetime import date, timedelta
from decimal import Decimal
from unittest.mock import MagicMock

from models import BudgetLineItemStatus
from models.agreements import Agreement, AgreementSortCondition
from ops_api.ops.services.agreements import (
    _sort_agreements,
    agreement_total_sort,
    fy_obligated_sort,
    next_budget_line_sort,
    resolve_fiscal_year,
)


def _make_agreement_mock_with_total(budget_line_items):
    """Helper to create a mock agreement with agreement_total computed via the real property."""
    agreement = MagicMock()
    agreement.budget_line_items = budget_line_items
    # Wire up the real property chain
    agreement.agreement_subtotal = Agreement.agreement_subtotal.fget(agreement)
    agreement.total_agreement_fees = Agreement.total_agreement_fees.fget(agreement)
    agreement.agreement_total = Agreement.agreement_total.fget(agreement)
    return agreement


def test_agreement_total_no_budget_lines():
    agreement = _make_agreement_mock_with_total([])

    result = agreement_total_sort(agreement)

    assert result == 0


def test_agreement_total_with_draft_budget_lines_only():
    bli1 = MagicMock(
        status=BudgetLineItemStatus.DRAFT, amount=Decimal("50000.00"), fees=Decimal("2500.00"), is_obe=False
    )
    bli2 = MagicMock(
        status=BudgetLineItemStatus.DRAFT, amount=Decimal("75000.00"), fees=Decimal("3750.00"), is_obe=False
    )

    agreement = _make_agreement_mock_with_total([bli1, bli2])

    result = agreement_total_sort(agreement)

    assert result == 0


def test_agreement_total_with_multiple_budget_lines():
    bli1 = MagicMock(
        status=BudgetLineItemStatus.PLANNED, amount=Decimal("100000.00"), fees=Decimal("5000.00"), is_obe=False
    )
    bli2 = MagicMock(
        status=BudgetLineItemStatus.IN_EXECUTION, amount=Decimal("200000.00"), fees=Decimal("10000.00"), is_obe=False
    )
    bli3 = MagicMock(
        status=BudgetLineItemStatus.DRAFT, amount=Decimal("50000.00"), fees=Decimal("2500.00"), is_obe=False
    )
    bli4 = MagicMock(
        status=BudgetLineItemStatus.OBLIGATED, amount=Decimal("150000.00"), fees=Decimal("7500.00"), is_obe=False
    )

    agreement = _make_agreement_mock_with_total([bli1, bli2, bli3, bli4])

    result = agreement_total_sort(agreement)

    expected = (
        (Decimal("100000.00") + Decimal("5000.00"))
        + (Decimal("200000.00") + Decimal("10000.00"))
        + (Decimal("150000.00") + Decimal("7500.00"))
    )
    assert result == expected


def test_agreement_total_with_procurement_shop_fees():
    bli1 = MagicMock(
        status=BudgetLineItemStatus.PLANNED, amount=Decimal("100000.00"), fees=Decimal("5000.00"), is_obe=False
    )
    bli2 = MagicMock(
        status=BudgetLineItemStatus.IN_EXECUTION, amount=Decimal("200000.00"), fees=Decimal("10000.00"), is_obe=False
    )

    agreement = _make_agreement_mock_with_total([bli1, bli2])

    result = agreement_total_sort(agreement)

    expected = (Decimal("100000.00") + Decimal("5000.00")) + (Decimal("200000.00") + Decimal("10000.00"))
    assert result == expected


def test_agreement_total_with_zero_amount_budget_lines():
    bli1 = MagicMock(status=BudgetLineItemStatus.PLANNED, amount=Decimal("0.00"), fees=Decimal("0.00"), is_obe=False)
    bli2 = MagicMock(
        status=BudgetLineItemStatus.IN_EXECUTION, amount=Decimal("0.00"), fees=Decimal("0.00"), is_obe=False
    )

    agreement = _make_agreement_mock_with_total([bli1, bli2])

    result = agreement_total_sort(agreement)

    assert result == 0


def test_agreement_total_with_decimal_precision():
    bli1 = MagicMock(
        status=BudgetLineItemStatus.PLANNED, amount=Decimal("100000.50"), fees=Decimal("5000.25"), is_obe=False
    )
    bli2 = MagicMock(
        status=BudgetLineItemStatus.IN_EXECUTION, amount=Decimal("200000.75"), fees=Decimal("10000.33"), is_obe=False
    )

    agreement = _make_agreement_mock_with_total([bli1, bli2])

    result = agreement_total_sort(agreement)

    expected = (Decimal("100000.50") + Decimal("5000.25")) + (Decimal("200000.75") + Decimal("10000.33"))
    assert result == expected


def test_agreement_total_with_mixed_statuses_and_fees():
    bli1 = MagicMock(
        status=BudgetLineItemStatus.PLANNED, amount=Decimal("100000.00"), fees=Decimal("3500.00"), is_obe=False
    )
    bli2 = MagicMock(
        status=BudgetLineItemStatus.DRAFT, amount=Decimal("50000.00"), fees=Decimal("1750.00"), is_obe=False
    )
    bli3 = MagicMock(
        status=BudgetLineItemStatus.IN_EXECUTION, amount=Decimal("200000.00"), fees=Decimal("7000.00"), is_obe=False
    )

    agreement = _make_agreement_mock_with_total([bli1, bli2, bli3])

    result = agreement_total_sort(agreement)

    expected = (Decimal("100000.00") + Decimal("3500.00")) + (Decimal("200000.00") + Decimal("7000.00"))
    assert result == expected


def test_agreement_total_sort_with_none_amount():
    bli_1 = MagicMock(status=BudgetLineItemStatus.PLANNED, amount=Decimal("100.00"), fees=Decimal("5.00"), is_obe=False)
    bli_2 = MagicMock(status=BudgetLineItemStatus.IN_EXECUTION, amount=None, fees=Decimal("0.00"), is_obe=False)
    bli_3 = MagicMock(
        status=BudgetLineItemStatus.OBLIGATED, amount=Decimal("300.00"), fees=Decimal("15.00"), is_obe=False
    )
    bli_4 = MagicMock(status=BudgetLineItemStatus.DRAFT, amount=Decimal("400.00"), fees=Decimal("20.00"), is_obe=False)

    agreement = _make_agreement_mock_with_total([bli_1, bli_2, bli_3, bli_4])

    result = agreement_total_sort(agreement)

    # Expected: 100 + 5 + 0 + 0 + 300 + 15 = 420
    expected = Decimal("420.00")
    assert result == expected


def test_next_budget_line_sort_with_none_amount():
    today = date.today()
    tomorrow = today + timedelta(days=1)
    next_week = today + timedelta(days=7)

    bli_1 = MagicMock(
        status=BudgetLineItemStatus.PLANNED, amount=Decimal("100.00"), date_needed=next_week, fees=Decimal("0.00")
    )
    bli_2 = MagicMock(status=BudgetLineItemStatus.PLANNED, amount=None, date_needed=tomorrow, fees=Decimal("5.00"))

    agreement = MagicMock(budget_line_items=[bli_1, bli_2])

    result = next_budget_line_sort(agreement)

    expected = Decimal("5.00")
    assert result == expected


def test_next_budget_line_sort_with_fee_and_none_amount():
    today = date.today()
    tomorrow = today + timedelta(days=1)

    bli = MagicMock(status=BudgetLineItemStatus.PLANNED, amount=None, date_needed=tomorrow, fees=Decimal("5.00"))

    agreement = MagicMock(budget_line_items=[bli])

    result = next_budget_line_sort(agreement)

    expected = Decimal("5.00")
    assert result == expected


def test_agreement_total_sort_with_multiple_none_amounts():
    bli_1 = MagicMock(status=BudgetLineItemStatus.PLANNED, amount=None, fees=Decimal("0.00"), is_obe=False)
    bli_2 = MagicMock(status=BudgetLineItemStatus.IN_EXECUTION, amount=None, fees=Decimal("0.00"), is_obe=False)
    bli_3 = MagicMock(
        status=BudgetLineItemStatus.OBLIGATED, amount=Decimal("300.00"), fees=Decimal("15.00"), is_obe=False
    )

    agreement = _make_agreement_mock_with_total([bli_1, bli_2, bli_3])

    result = agreement_total_sort(agreement)

    expected = Decimal("315.00")
    assert result == expected


def test_agreement_total_sort_with_all_none_amounts():
    bli_1 = MagicMock(status=BudgetLineItemStatus.PLANNED, amount=None, fees=Decimal("0.00"), is_obe=False)
    bli_2 = MagicMock(status=BudgetLineItemStatus.IN_EXECUTION, amount=None, fees=Decimal("0.00"), is_obe=False)

    agreement = _make_agreement_mock_with_total([bli_1, bli_2])

    result = agreement_total_sort(agreement)

    expected = Decimal("0")
    assert result == expected


# --- FY Obligated sort tests ---


def test_fy_obligated_sort_no_budget_lines():
    agreement = MagicMock()
    agreement.fy_obligated.return_value = Decimal("0")
    result = fy_obligated_sort(agreement, 2026)
    assert result == Decimal("0")


def test_fy_obligated_sort_matching_fiscal_year():
    agreement = MagicMock()
    agreement.fy_obligated.return_value = Decimal("315000.00")

    result = fy_obligated_sort(agreement, 2026)

    expected = Decimal("315000.00")
    assert result == expected


def test_fy_obligated_sort_non_matching_fiscal_year():
    agreement = MagicMock()
    agreement.fy_obligated.return_value = Decimal("0")

    result = fy_obligated_sort(agreement, 2026)

    assert result == Decimal("0")


def test_fy_obligated_sort_only_obligated_status():
    agreement = MagicMock()
    agreement.fy_obligated.return_value = Decimal("105000.00")

    result = fy_obligated_sort(agreement, 2026)

    expected = Decimal("105000.00")
    assert result == expected


def test_fy_obligated_sort_with_none_amount():
    agreement = MagicMock()
    agreement.fy_obligated.return_value = Decimal("5000.00")

    result = fy_obligated_sort(agreement, 2026)

    assert result == Decimal("5000.00")


# --- resolve_fiscal_year tests ---


def test_resolve_fiscal_year_single_value():
    assert resolve_fiscal_year(["2025"]) == 2025


def test_resolve_fiscal_year_none_returns_none():
    assert resolve_fiscal_year(None) is None


def test_resolve_fiscal_year_empty_returns_none():
    assert resolve_fiscal_year([]) is None


def test_resolve_fiscal_year_multiple_returns_none():
    assert resolve_fiscal_year(["2025", "2026"]) is None


# --- _sort_agreements FY_OBLIGATED with All FYs ---


def _make_agreement_mock_with_lifetime_obligated(budget_line_items):
    """Helper to create a mock agreement with lifetime_obligated computed via the real property."""
    agreement = MagicMock()
    agreement.budget_line_items = budget_line_items
    agreement.lifetime_obligated = Agreement.lifetime_obligated.fget(agreement)
    return agreement


def test_sort_agreements_fy_obligated_all_fys_sorts_by_lifetime_obligated():
    """When fiscal_years=[] (All FYs), FY_OBLIGATED sort uses lifetime_obligated, not current FY."""
    mid_obligated = MagicMock(status=BudgetLineItemStatus.OBLIGATED, amount=Decimal("300000.00"), fees=Decimal("0"))
    low_obligated = MagicMock(status=BudgetLineItemStatus.OBLIGATED, amount=Decimal("50000.00"), fees=Decimal("0"))
    high_obligated = MagicMock(status=BudgetLineItemStatus.OBLIGATED, amount=Decimal("800000.00"), fees=Decimal("0"))

    a1 = _make_agreement_mock_with_lifetime_obligated([mid_obligated])  # lifetime = 300,000
    a2 = _make_agreement_mock_with_lifetime_obligated([low_obligated])  # lifetime = 50,000
    a3 = _make_agreement_mock_with_lifetime_obligated([high_obligated])  # lifetime = 800,000

    # Ascending
    result = _sort_agreements([a1, a2, a3], AgreementSortCondition.FY_OBLIGATED, False, fiscal_years=[])
    assert result == [a2, a1, a3]

    # Descending
    result = _sort_agreements([a1, a2, a3], AgreementSortCondition.FY_OBLIGATED, True, fiscal_years=[])
    assert result == [a3, a1, a2]


def test_sort_agreements_fy_obligated_specific_fy_uses_fy_obligated():
    """When a specific FY is provided, FY_OBLIGATED sort uses fy_obligated(), not lifetime."""
    a1 = MagicMock()
    a1.fy_obligated.return_value = Decimal("100000.00")
    a2 = MagicMock()
    a2.fy_obligated.return_value = Decimal("500000.00")
    a3 = MagicMock()
    a3.fy_obligated.return_value = Decimal("200000.00")

    result = _sort_agreements([a1, a2, a3], AgreementSortCondition.FY_OBLIGATED, False, fiscal_years=["2025"])
    assert result == [a1, a3, a2]
