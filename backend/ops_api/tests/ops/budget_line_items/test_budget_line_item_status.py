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
    assert BudgetLineItemStatus.DRAFT.value == "Draft"
    assert BudgetLineItemStatus.PLANNED.value == "Planned"
    assert BudgetLineItemStatus.IN_EXECUTION.value == "In Execution"
    assert BudgetLineItemStatus.OBLIGATED.value == "Obligated"


def test_budget_line_item_status_str_representation():
    """Verify string conversion returns the human-readable value."""
    assert str(BudgetLineItemStatus.DRAFT) == "Draft"
    assert str(BudgetLineItemStatus.PLANNED) == "Planned"
    assert str(BudgetLineItemStatus.IN_EXECUTION) == "In Execution"
    assert str(BudgetLineItemStatus.OBLIGATED) == "Obligated"


def test_budget_line_item_status_from_string():
    """Verify retrieving enum members by their string values."""
    assert BudgetLineItemStatus("Draft") == BudgetLineItemStatus.DRAFT
    assert BudgetLineItemStatus("Planned") == BudgetLineItemStatus.PLANNED
    assert BudgetLineItemStatus("In Execution") == BudgetLineItemStatus.IN_EXECUTION
    assert BudgetLineItemStatus("Obligated") == BudgetLineItemStatus.OBLIGATED


def test_budget_line_item_status_equality():
    """Verify enum members can be compared for equality."""
    assert BudgetLineItemStatus.DRAFT == BudgetLineItemStatus.DRAFT
    assert BudgetLineItemStatus.DRAFT != BudgetLineItemStatus.PLANNED


def test_budget_line_item_status_invalid_value():
    """Verify invalid values raise the appropriate error."""
    with pytest.raises(ValueError):
        BudgetLineItemStatus("Unknown Status")
