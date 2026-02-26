from decimal import Decimal
from unittest.mock import MagicMock

from models.agreements import Agreement
from models.budget_line_items import BudgetLineItemStatus
from ops_api.ops.services.agreements import agreement_total_sort

# --- agreement_subtotal ---


def test_agreement_subtotal_sums_non_draft_amounts():
    bli1 = MagicMock(amount=Decimal("100"), status=BudgetLineItemStatus.PLANNED, is_obe=False)
    bli2 = MagicMock(amount=Decimal("200"), status=BudgetLineItemStatus.OBLIGATED, is_obe=False)
    bli3 = MagicMock(amount=Decimal("50"), status=BudgetLineItemStatus.DRAFT, is_obe=False)

    agreement = MagicMock()
    agreement.budget_line_items = [bli1, bli2, bli3]

    result = Agreement.agreement_subtotal.fget(agreement)

    assert result == Decimal("300")


def test_agreement_subtotal_includes_obe_draft():
    bli1 = MagicMock(amount=Decimal("100"), status=BudgetLineItemStatus.DRAFT, is_obe=True)
    bli2 = MagicMock(amount=Decimal("50"), status=BudgetLineItemStatus.DRAFT, is_obe=False)

    agreement = MagicMock()
    agreement.budget_line_items = [bli1, bli2]

    result = Agreement.agreement_subtotal.fget(agreement)

    assert result == Decimal("100")


def test_agreement_subtotal_returns_zero_for_empty():
    agreement = MagicMock()
    agreement.budget_line_items = []

    result = Agreement.agreement_subtotal.fget(agreement)

    assert result == Decimal("0")


def test_agreement_subtotal_handles_none_amounts():
    bli1 = MagicMock(amount=None, status=BudgetLineItemStatus.PLANNED, is_obe=False)
    bli2 = MagicMock(amount=Decimal("200"), status=BudgetLineItemStatus.PLANNED, is_obe=False)

    agreement = MagicMock()
    agreement.budget_line_items = [bli1, bli2]

    result = Agreement.agreement_subtotal.fget(agreement)

    assert result == Decimal("200")


# --- total_agreement_fees ---


def test_total_agreement_fees_sums_non_draft_fees():
    bli1 = MagicMock(fees=Decimal("10"), status=BudgetLineItemStatus.PLANNED, is_obe=False)
    bli2 = MagicMock(fees=Decimal("20"), status=BudgetLineItemStatus.OBLIGATED, is_obe=False)
    bli3 = MagicMock(fees=Decimal("5"), status=BudgetLineItemStatus.DRAFT, is_obe=False)

    agreement = MagicMock()
    agreement.budget_line_items = [bli1, bli2, bli3]

    result = Agreement.total_agreement_fees.fget(agreement)

    assert result == Decimal("30")


def test_total_agreement_fees_includes_obe_draft():
    bli1 = MagicMock(fees=Decimal("10"), status=BudgetLineItemStatus.DRAFT, is_obe=True)
    bli2 = MagicMock(fees=Decimal("5"), status=BudgetLineItemStatus.DRAFT, is_obe=False)

    agreement = MagicMock()
    agreement.budget_line_items = [bli1, bli2]

    result = Agreement.total_agreement_fees.fget(agreement)

    assert result == Decimal("10")


def test_total_agreement_fees_returns_zero_for_empty():
    agreement = MagicMock()
    agreement.budget_line_items = []

    result = Agreement.total_agreement_fees.fget(agreement)

    assert result == Decimal("0")


def test_total_agreement_fees_handles_none_fees():
    bli1 = MagicMock(fees=None, status=BudgetLineItemStatus.PLANNED, is_obe=False)
    bli2 = MagicMock(fees=Decimal("20"), status=BudgetLineItemStatus.PLANNED, is_obe=False)

    agreement = MagicMock()
    agreement.budget_line_items = [bli1, bli2]

    result = Agreement.total_agreement_fees.fget(agreement)

    assert result == Decimal("20")


# --- agreement_total ---


def test_agreement_total_equals_subtotal_plus_fees():
    bli1 = MagicMock(amount=Decimal("100"), fees=Decimal("10"), status=BudgetLineItemStatus.PLANNED, is_obe=False)
    bli2 = MagicMock(amount=Decimal("200"), fees=Decimal("20"), status=BudgetLineItemStatus.OBLIGATED, is_obe=False)

    agreement = MagicMock()
    agreement.budget_line_items = [bli1, bli2]

    # Need to wire up the dependent properties
    agreement.agreement_subtotal = Agreement.agreement_subtotal.fget(agreement)
    agreement.total_agreement_fees = Agreement.total_agreement_fees.fget(agreement)

    result = Agreement.agreement_total.fget(agreement)

    assert result == Decimal("330")


def test_agreement_total_returns_zero_for_empty():
    agreement = MagicMock()
    agreement.budget_line_items = []

    agreement.agreement_subtotal = Agreement.agreement_subtotal.fget(agreement)
    agreement.total_agreement_fees = Agreement.total_agreement_fees.fget(agreement)

    result = Agreement.agreement_total.fget(agreement)

    assert result == Decimal("0")


# --- lifetime_obligated ---


def test_lifetime_obligated_sums_obligated_only():
    bli1 = MagicMock(amount=Decimal("100"), fees=Decimal("10"), status=BudgetLineItemStatus.OBLIGATED)
    bli2 = MagicMock(amount=Decimal("200"), fees=Decimal("20"), status=BudgetLineItemStatus.PLANNED)
    bli3 = MagicMock(amount=Decimal("300"), fees=Decimal("30"), status=BudgetLineItemStatus.OBLIGATED)

    agreement = MagicMock()
    agreement.budget_line_items = [bli1, bli2, bli3]

    result = Agreement.lifetime_obligated.fget(agreement)

    assert result == Decimal("440")


def test_lifetime_obligated_returns_zero_when_none_obligated():
    bli1 = MagicMock(amount=Decimal("100"), fees=Decimal("10"), status=BudgetLineItemStatus.PLANNED)
    bli2 = MagicMock(amount=Decimal("200"), fees=Decimal("20"), status=BudgetLineItemStatus.DRAFT)

    agreement = MagicMock()
    agreement.budget_line_items = [bli1, bli2]

    result = Agreement.lifetime_obligated.fget(agreement)

    assert result == Decimal("0")


def test_lifetime_obligated_returns_zero_for_empty():
    agreement = MagicMock()
    agreement.budget_line_items = []

    result = Agreement.lifetime_obligated.fget(agreement)

    assert result == Decimal("0")


def test_lifetime_obligated_handles_none_amounts():
    bli1 = MagicMock(amount=None, fees=Decimal("10"), status=BudgetLineItemStatus.OBLIGATED)
    bli2 = MagicMock(amount=Decimal("200"), fees=None, status=BudgetLineItemStatus.OBLIGATED)

    agreement = MagicMock()
    agreement.budget_line_items = [bli1, bli2]

    result = Agreement.lifetime_obligated.fget(agreement)

    assert result == Decimal("210")


# --- agreement_total_sort ---


def test_agreement_total_sort_returns_agreement_total():
    agreement = MagicMock()
    agreement.agreement_total = Decimal("500")

    result = agreement_total_sort(agreement)

    assert result == Decimal("500")
