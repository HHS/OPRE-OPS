import pytest
from models.cans import BudgetLineItemStatus


@pytest.mark.usefixtures("app_ctx")
def test_budget_line_item_status_retrieve_all(loaded_db):
    bli_status = loaded_db.session.query(BudgetLineItemStatus).all()
    assert len(bli_status) == 3


@pytest.mark.parametrize("id,status", [(1, "Planned"), (2, "In Execution"), (3, "Obligated")])
@pytest.mark.usefixtures("app_ctx")
def test_budget_line_item_status_lookup(loaded_db, id, status):
    bli_status = loaded_db.session.get(BudgetLineItemStatus, id)
    assert bli_status.status == status
