from ops.can.models import BudgetLineItemStatus
import pytest


def test_budget_line_item_status_retrieve_all(db_session, init_database, db_tables):
    bli_status = db_session.query(BudgetLineItemStatus).all()
    assert len(bli_status) == 3


@pytest.mark.parametrize(
    "id,status", [(1, "Planned"), (2, "In Execution"), (3, "Obligated")]
)
def test_budget_line_item_status_lookup(
    db_session, init_database, db_tables, id, status
):
    bli_status = db_session.query(BudgetLineItemStatus).get(id)
    assert bli_status.status == status
