import pytest

from models import BudgetLineItemStatus


def test_budget_line_item_status_count(loaded_db, app_ctx):
    """Verify the enum contains exactly the expected number of statuses."""
    assert len(BudgetLineItemStatus) == 4


def test_budget_line_item_status_names():
    """Verify all expected status names exist in the enum."""
    expected_names = {"DRAFT", "PLANNED", "IN_EXECUTION", "OBLIGATED"}
    actual_names = {status.name for status in BudgetLineItemStatus}
    assert actual_names == expected_names


def test_budget_line_item_status_values():
    """Verify status values match their expected string representations."""
    assert BudgetLineItemStatus.DRAFT.value == "DRAFT"
    assert BudgetLineItemStatus.PLANNED.value == "PLANNED"
    assert BudgetLineItemStatus.IN_EXECUTION.value == "IN_EXECUTION"
    assert BudgetLineItemStatus.OBLIGATED.value == "OBLIGATED"


def test_budget_line_item_status_str_representation():
    """Verify string conversion returns the database value."""
    assert str(BudgetLineItemStatus.DRAFT) == "DRAFT"
    assert str(BudgetLineItemStatus.PLANNED) == "PLANNED"
    assert str(BudgetLineItemStatus.IN_EXECUTION) == "IN_EXECUTION"
    assert str(BudgetLineItemStatus.OBLIGATED) == "OBLIGATED"


def test_budget_line_item_status_from_string():
    """Verify retrieving enum members by their string values."""
    assert BudgetLineItemStatus("DRAFT") == BudgetLineItemStatus.DRAFT
    assert BudgetLineItemStatus("PLANNED") == BudgetLineItemStatus.PLANNED
    assert BudgetLineItemStatus("IN_EXECUTION") == BudgetLineItemStatus.IN_EXECUTION
    assert BudgetLineItemStatus("OBLIGATED") == BudgetLineItemStatus.OBLIGATED


def test_budget_line_item_status_equality():
    """Verify enum members can be compared for equality."""
    assert BudgetLineItemStatus.DRAFT == BudgetLineItemStatus.DRAFT
    assert BudgetLineItemStatus.DRAFT != BudgetLineItemStatus.PLANNED


def test_budget_line_item_status_invalid_value():
    """Verify invalid values raise the appropriate error."""
    with pytest.raises(ValueError):
        BudgetLineItemStatus("Unknown Status")
