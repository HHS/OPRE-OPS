from datetime import date, timedelta
from decimal import Decimal
from unittest.mock import MagicMock

from models import BudgetLineItemStatus
from ops_api.ops.services.agreements import agreement_total_sort, next_budget_line_sort


def test_agreement_total_no_budget_lines():
    # Setup an agreement with no budget lines
    agreement = MagicMock()
    agreement.budget_line_items = []
    agreement.procurement_shop = None

    # Test
    result = agreement_total_sort(agreement)

    # Assert
    assert result == 0


def test_agreement_total_with_draft_budget_lines_only():
    # Setup budget line items with DRAFT status only
    bli1 = MagicMock()
    bli1.status = BudgetLineItemStatus.DRAFT
    bli1.amount = Decimal("50000.00")

    bli2 = MagicMock()
    bli2.status = BudgetLineItemStatus.DRAFT
    bli2.amount = Decimal("75000.00")

    agreement = MagicMock()
    agreement.budget_line_items = [bli1, bli2]
    agreement.procurement_shop = None

    # Test
    result = agreement_total_sort(agreement)

    # Assert - total should be zero as all BLIs are DRAFT
    assert result == 0


def test_agreement_total_with_multiple_budget_lines():
    # Setup budget line items with mixed statuses
    bli1 = MagicMock()
    bli1.status = BudgetLineItemStatus.PLANNED
    bli1.amount = Decimal("100000.00")
    bli1.fees = Decimal("5000.00")  # Adding fees for this BLI

    bli2 = MagicMock()
    bli2.status = BudgetLineItemStatus.IN_EXECUTION
    bli2.amount = Decimal("200000.00")
    bli2.fees = Decimal("10000.00")  # Adding fees for this BLI

    bli3 = MagicMock()
    bli3.status = BudgetLineItemStatus.DRAFT
    bli3.amount = Decimal("50000.00")
    bli3.fees = Decimal("2500.00")  # Adding fees for DRAFT BLI (should be excluded)

    bli4 = MagicMock()
    bli4.status = BudgetLineItemStatus.OBLIGATED
    bli4.amount = Decimal("150000.00")
    bli4.fees = Decimal("7500.00")  # Adding fees for this BLI

    agreement = MagicMock()
    agreement.budget_line_items = [bli1, bli2, bli3, bli4]
    agreement.procurement_shop = None

    # Test
    result = agreement_total_sort(agreement)

    # Assert - total should be sum of non-draft BLIs (amounts plus fees)
    expected = (
        (Decimal("100000.00") + Decimal("5000.00"))
        + (Decimal("200000.00") + Decimal("10000.00"))
        + (Decimal("150000.00") + Decimal("7500.00"))
    )
    assert result == expected


def test_agreement_total_with_procurement_shop_fees():
    # Setup budget line items with fees
    bli1 = MagicMock()
    bli1.status = BudgetLineItemStatus.PLANNED
    bli1.amount = Decimal("100000.00")
    bli1.fees = Decimal("5000.00")  # Direct fees instead of procurement shop fee

    bli2 = MagicMock()
    bli2.status = BudgetLineItemStatus.IN_EXECUTION
    bli2.amount = Decimal("200000.00")
    bli2.fees = Decimal("10000.00")  # Direct fees instead of procurement shop fee

    agreement = MagicMock()
    agreement.budget_line_items = [bli1, bli2]
    agreement.procurement_shop = None  # No procurement shop needed

    # Test
    result = agreement_total_sort(agreement)

    # Assert - total should include base amounts plus fees
    expected = (Decimal("100000.00") + Decimal("5000.00")) + (Decimal("200000.00") + Decimal("10000.00"))
    assert result == expected


def test_agreement_total_with_zero_amount_budget_lines():
    # Setup budget line items with zero amounts
    bli1 = MagicMock()
    bli1.status = BudgetLineItemStatus.PLANNED
    bli1.amount = Decimal("0.00")
    bli1.fees = Decimal("0.00")  # Direct fees instead of procurement shop

    bli2 = MagicMock()
    bli2.status = BudgetLineItemStatus.IN_EXECUTION
    bli2.amount = Decimal("0.00")
    bli2.fees = Decimal("0.00")  # Direct fees instead of procurement shop

    agreement = MagicMock()
    agreement.budget_line_items = [bli1, bli2]
    agreement.procurement_shop = None

    # Test
    result = agreement_total_sort(agreement)

    # Assert
    assert result == 0


def test_agreement_total_with_decimal_precision():
    # Setup budget line items with precise decimals
    bli1 = MagicMock()
    bli1.status = BudgetLineItemStatus.PLANNED
    bli1.amount = Decimal("100000.50")
    bli1.fees = Decimal("5000.25")  # Direct fees with decimal precision

    bli2 = MagicMock()
    bli2.status = BudgetLineItemStatus.IN_EXECUTION
    bli2.amount = Decimal("200000.75")
    bli2.fees = Decimal("10000.33")  # Direct fees with decimal precision

    agreement = MagicMock()
    agreement.budget_line_items = [bli1, bli2]
    agreement.procurement_shop = None

    # Test
    result = agreement_total_sort(agreement)

    # Assert - total should preserve decimal precision with fees
    expected = (Decimal("100000.50") + Decimal("5000.25")) + (Decimal("200000.75") + Decimal("10000.33"))
    assert result == expected


def test_agreement_total_with_mixed_statuses_and_fees():
    # Setup a mix of BLI statuses with direct fees
    bli1 = MagicMock()
    bli1.status = BudgetLineItemStatus.PLANNED
    bli1.amount = Decimal("100000.00")
    bli1.fees = Decimal("3500.00")  # Direct fees instead of procurement shop calculation

    bli2 = MagicMock()
    bli2.status = BudgetLineItemStatus.DRAFT
    bli2.amount = Decimal("50000.00")
    bli2.fees = Decimal("1750.00")  # Fees for DRAFT BLI (should be excluded)

    bli3 = MagicMock()
    bli3.status = BudgetLineItemStatus.IN_EXECUTION
    bli3.amount = Decimal("200000.00")
    bli3.fees = Decimal("7000.00")  # Direct fees instead of procurement shop calculation

    agreement = MagicMock()
    agreement.budget_line_items = [bli1, bli2, bli3]
    agreement.procurement_shop = None  # No procurement shop needed

    # Test
    result = agreement_total_sort(agreement)

    # Assert - only non-draft BLIs should be counted, with their fees
    expected = (Decimal("100000.00") + Decimal("3500.00")) + (Decimal("200000.00") + Decimal("7000.00"))
    assert result == expected


def test_agreement_total_sort_with_none_amount(app_ctx):
    # Create mock BLIs with one having None amount
    bli_1 = MagicMock(
        status=BudgetLineItemStatus.PLANNED,
        amount=Decimal("100.00"),
        fees=Decimal("5.00"),
    )
    bli_2 = MagicMock(status=BudgetLineItemStatus.IN_EXECUTION, amount=None, fees=Decimal("0.00"))  # None amount
    bli_3 = MagicMock(
        status=BudgetLineItemStatus.OBLIGATED,
        amount=Decimal("300.00"),
        fees=Decimal("15.00"),
    )
    bli_4 = MagicMock(
        status=BudgetLineItemStatus.DRAFT,
        amount=Decimal("400.00"),
        fees=Decimal("20.00"),
    )  # Should be excluded

    # Create mock agreement without procurement shop
    agreement = MagicMock(budget_line_items=[bli_1, bli_2, bli_3, bli_4], procurement_shop=None)

    # Test the sort function - should skip the None amount
    result = agreement_total_sort(agreement)

    # Expected: 100 + 300 + 5 + 15 = 420
    expected = Decimal("420.00")

    assert result == expected


def test_next_budget_line_sort_with_none_amount(app_ctx):
    # Create mock BLIs with the 'next' one having None amount
    today = date.today()
    tomorrow = today + timedelta(days=1)
    next_week = today + timedelta(days=7)

    # Create BLIs with different dates and statuses
    bli_1 = MagicMock(
        status=BudgetLineItemStatus.PLANNED,
        amount=Decimal("100.00"),
        date_needed=next_week,
        fees=Decimal("0.00"),  # Direct fees instead of proc_shop_fee_percentage
    )

    bli_2 = MagicMock(
        status=BudgetLineItemStatus.PLANNED,
        amount=None,  # None amount
        date_needed=tomorrow,  # This is the next one chronologically
        fees=Decimal("5.00"),  # Direct fees instead of proc_shop_fee_percentage
    )

    # Create mock agreement
    agreement = MagicMock(budget_line_items=[bli_1, bli_2])

    # Test the sort function - should handle None amount
    result = next_budget_line_sort(agreement)

    # Expected: 5.00 (since the next one has None amount but has fees)
    expected = Decimal("5.00")

    assert result == expected


def test_next_budget_line_sort_with_fee_and_none_amount(app_ctx):
    # Create mock BLIs with the 'next' one having None amount but has fee
    today = date.today()
    tomorrow = today + timedelta(days=1)

    # Create BLI with None amount
    bli = MagicMock(
        status=BudgetLineItemStatus.PLANNED,
        amount=None,  # None amount
        date_needed=tomorrow,
        fees=Decimal("5.00"),  # Direct fees instead of proc_shop_fee_percentage
    )

    # Create mock agreement
    agreement = MagicMock(budget_line_items=[bli])

    # Test the sort function
    result = next_budget_line_sort(agreement)

    # Expected: 5.00 (since we're now using direct fees)
    expected = Decimal("5.00")

    assert result == expected


def test_agreement_total_sort_with_multiple_none_amounts(app_ctx):
    # Create mock BLIs with multiple None amounts
    bli_1 = MagicMock(status=BudgetLineItemStatus.PLANNED, amount=None, fees=Decimal("0.00"))
    bli_2 = MagicMock(status=BudgetLineItemStatus.IN_EXECUTION, amount=None, fees=Decimal("0.00"))
    bli_3 = MagicMock(
        status=BudgetLineItemStatus.OBLIGATED,
        amount=Decimal("300.00"),
        fees=Decimal("15.00"),
    )

    # Create mock agreement without procurement shop
    agreement = MagicMock(budget_line_items=[bli_1, bli_2, bli_3], procurement_shop=None)

    # Test the sort function - should skip the None amounts
    result = agreement_total_sort(agreement)

    # Expected: 300 + 15 = 315
    expected = Decimal("315.00")

    assert result == expected


def test_agreement_total_sort_with_all_none_amounts(app_ctx):
    # Create mock BLIs with all None amounts
    bli_1 = MagicMock(status=BudgetLineItemStatus.PLANNED, amount=None)
    bli_2 = MagicMock(status=BudgetLineItemStatus.IN_EXECUTION, amount=None)

    # Create mock agreement with procurement shop fee
    agreement = MagicMock(
        budget_line_items=[bli_1, bli_2],
        procurement_shop=MagicMock(fee=Decimal("0.05")),
    )

    # Test the sort function - all amounts are None
    result = agreement_total_sort(agreement)

    # Expected: 0 (since all amounts are None)
    expected = Decimal("0")

    assert result == expected
