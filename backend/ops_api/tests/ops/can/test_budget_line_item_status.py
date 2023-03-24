import pytest
from models.cans import BudgetLineItemStatus


@pytest.mark.usefixtures("app_ctx")
def test_budget_line_item_status_retrieve_all(loaded_db):
    assert len(BudgetLineItemStatus) == 4
