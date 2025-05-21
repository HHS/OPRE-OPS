from datetime import date, timedelta
from decimal import Decimal
from unittest.mock import MagicMock

import pytest

from models import BudgetLineItemStatus
from ops_api.ops.resources.agreements import agreement_total_sort, next_budget_line_sort


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

    bli2 = MagicMock()
    bli2.status = BudgetLineItemStatus.IN_EXECUTION
    bli2.amount = Decimal("200000.00")

    bli3 = MagicMock()
    bli3.status = BudgetLineItemStatus.DRAFT
    bli3.amount = Decimal("50000.00")

    bli4 = MagicMock()
    bli4.status = BudgetLineItemStatus.OBLIGATED
    bli4.amount = Decimal("150000.00")

    agreement = MagicMock()
    agreement.budget_line_items = [bli1, bli2, bli3, bli4]
    agreement.procurement_shop = None

    # Test
    result = agreement_total_sort(agreement)

    # Assert - total should be sum of non-draft BLIs
    expected = Decimal("100000.00") + Decimal("200000.00") + Decimal("150000.00")
    assert result == expected


def test_agreement_total_with_procurement_shop_fees():
    # Setup budget line items with procurement shop fees
    bli1 = MagicMock()
    bli1.status = BudgetLineItemStatus.PLANNED
    bli1.amount = Decimal("100000.00")

    bli2 = MagicMock()
    bli2.status = BudgetLineItemStatus.IN_EXECUTION
    bli2.amount = Decimal("200000.00")

    # Setup procurement shop with fee
    procurement_shop = MagicMock()
    procurement_shop.fee = "0.05"  # 5% fee

    agreement = MagicMock()
    agreement.budget_line_items = [bli1, bli2]
    agreement.procurement_shop = procurement_shop

    # Test
    result = agreement_total_sort(agreement)

    # Assert - total should include base amounts plus fees
    base_amount = Decimal("100000.00") + Decimal("200000.00")
    fee_amount = base_amount * Decimal("0.05")
    expected = base_amount + fee_amount
    assert result == expected


def test_agreement_total_with_zero_amount_budget_lines():
    # Setup budget line items with zero amounts
    bli1 = MagicMock()
    bli1.status = BudgetLineItemStatus.PLANNED
    bli1.amount = Decimal("0.00")

    bli2 = MagicMock()
    bli2.status = BudgetLineItemStatus.IN_EXECUTION
    bli2.amount = Decimal("0.00")

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

    bli2 = MagicMock()
    bli2.status = BudgetLineItemStatus.IN_EXECUTION
    bli2.amount = Decimal("200000.75")

    agreement = MagicMock()
    agreement.budget_line_items = [bli1, bli2]
    agreement.procurement_shop = None

    # Test
    result = agreement_total_sort(agreement)

    # Assert - total should preserve decimal precision
    expected = Decimal("100000.50") + Decimal("200000.75")
    assert result == expected


def test_agreement_total_with_mixed_statuses_and_fees():
    # Setup a mix of BLI statuses with procurement shop fee
    bli1 = MagicMock()
    bli1.status = BudgetLineItemStatus.PLANNED
    bli1.amount = Decimal("100000.00")

    bli2 = MagicMock()
    bli2.status = BudgetLineItemStatus.DRAFT
    bli2.amount = Decimal("50000.00")

    bli3 = MagicMock()
    bli3.status = BudgetLineItemStatus.IN_EXECUTION
    bli3.amount = Decimal("200000.00")

    # Setup procurement shop with fee
    procurement_shop = MagicMock()
    procurement_shop.fee = "0.035"  # 3.5% fee

    agreement = MagicMock()
    agreement.budget_line_items = [bli1, bli2, bli3]
    agreement.procurement_shop = procurement_shop

    # Test
    result = agreement_total_sort(agreement)

    # Assert - only non-draft BLIs should be counted, with fees applied
    base_amount = Decimal("100000.00") + Decimal("200000.00")
    fee_amount = base_amount * Decimal("0.035")
    expected = base_amount + fee_amount
    assert result == expected


@pytest.mark.usefixtures("app_ctx")
def test_agreement_total_sort_with_none_amount():
    # Create mock BLIs with one having None amount
    bli_1 = MagicMock(status=BudgetLineItemStatus.PLANNED, amount=Decimal("100.00"))
    bli_2 = MagicMock(status=BudgetLineItemStatus.IN_EXECUTION, amount=None)  # None amount
    bli_3 = MagicMock(status=BudgetLineItemStatus.OBLIGATED, amount=Decimal("300.00"))
    bli_4 = MagicMock(status=BudgetLineItemStatus.DRAFT, amount=Decimal("400.00"))  # Should be excluded

    # Create mock agreement with procurement shop fee
    agreement = MagicMock(
        budget_line_items=[bli_1, bli_2, bli_3, bli_4], procurement_shop=MagicMock(fee=Decimal("0.05"))
    )

    # Test the sort function - should skip the None amount
    result = agreement_total_sort(agreement)

    # Expected: 100 + 300 + (100 * 0.05) + (300 * 0.05) = 400 + 20 = 420
    expected = Decimal("420.00")

    assert result == expected


@pytest.mark.usefixtures("app_ctx")
def test_next_budget_line_sort_with_none_amount():
    # Create mock BLIs with the 'next' one having None amount
    today = date.today()
    tomorrow = today + timedelta(days=1)
    next_week = today + timedelta(days=7)

    # Create BLIs with different dates and statuses
    bli_1 = MagicMock(
        status=BudgetLineItemStatus.PLANNED,
        amount=Decimal("100.00"),
        date_needed=next_week,
        proc_shop_fee_percentage=None,
    )

    bli_2 = MagicMock(
        status=BudgetLineItemStatus.PLANNED,
        amount=None,  # None amount
        date_needed=tomorrow,  # This is the next one chronologically
        proc_shop_fee_percentage=Decimal("0.05"),
    )

    # Create mock agreement
    agreement = MagicMock(budget_line_items=[bli_1, bli_2])

    # Test the sort function - should handle None amount
    result = next_budget_line_sort(agreement)

    # Expected: 0 (since the amount is None)
    expected = Decimal("0")

    assert result == expected


@pytest.mark.usefixtures("app_ctx")
def test_next_budget_line_sort_with_fee_and_none_amount():
    # Create mock BLIs with the 'next' one having None amount but has fee
    today = date.today()
    tomorrow = today + timedelta(days=1)

    # Create BLI with None amount
    bli = MagicMock(
        status=BudgetLineItemStatus.PLANNED,
        amount=None,  # None amount
        date_needed=tomorrow,
        proc_shop_fee_percentage=Decimal("0.05"),  # Has fee
    )

    # Create mock agreement
    agreement = MagicMock(budget_line_items=[bli])

    # Test the sort function
    result = next_budget_line_sort(agreement)

    # Expected: 0 (since multiplication with None should be handled gracefully)
    expected = Decimal("0")

    assert result == expected


@pytest.mark.usefixtures("app_ctx")
def test_agreement_total_sort_with_multiple_none_amounts():
    # Create mock BLIs with multiple None amounts
    bli_1 = MagicMock(status=BudgetLineItemStatus.PLANNED, amount=None)
    bli_2 = MagicMock(status=BudgetLineItemStatus.IN_EXECUTION, amount=None)
    bli_3 = MagicMock(status=BudgetLineItemStatus.OBLIGATED, amount=Decimal("300.00"))

    # Create mock agreement with procurement shop fee
    agreement = MagicMock(budget_line_items=[bli_1, bli_2, bli_3], procurement_shop=MagicMock(fee=Decimal("0.05")))

    # Test the sort function - should skip the None amounts
    result = agreement_total_sort(agreement)

    # Expected: 300 + (300 * 0.05) = 300 + 15 = 315
    expected = Decimal("315.00")

    assert result == expected


@pytest.mark.usefixtures("app_ctx")
def test_agreement_total_sort_with_all_none_amounts():
    # Create mock BLIs with all None amounts
    bli_1 = MagicMock(status=BudgetLineItemStatus.PLANNED, amount=None)
    bli_2 = MagicMock(status=BudgetLineItemStatus.IN_EXECUTION, amount=None)

    # Create mock agreement with procurement shop fee
    agreement = MagicMock(budget_line_items=[bli_1, bli_2], procurement_shop=MagicMock(fee=Decimal("0.05")))

    # Test the sort function - all amounts are None
    result = agreement_total_sort(agreement)

    # Expected: 0 (since all amounts are None)
    expected = Decimal("0")

    assert result == expected
