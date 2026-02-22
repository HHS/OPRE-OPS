from datetime import date, timedelta
from decimal import Decimal
from unittest.mock import MagicMock

from models import BudgetLineItemStatus
from models.agreements import Agreement
from ops_api.ops.services.agreements import agreement_total_sort, next_budget_line_sort


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
