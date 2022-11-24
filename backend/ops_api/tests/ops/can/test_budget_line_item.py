from ops.can.models import BudgetLineItem
import pytest


@pytest.mark.usefixtures("app_ctx")
def test_budget_line_item_lookup(loaded_db):
    bli = loaded_db.session.query(BudgetLineItem).get(1)
    assert bli is not None
    assert bli.id == 1
    assert bli.name == "Grant Expendeture GA112"
    assert bli.fiscal_year == 2022
    assert bli.agreement_id == 1
    assert bli.can_id == 1
    assert bli.funding == 850450.00
    assert bli.status_id == 2


def test_budget_line_item_creation():
    bli = BudgetLineItem(
        name="Grant Expendeture GA999",
        fiscal_year=2023,
        agreement_id=1,
        can_id=1,
        funding=850450.00,
        status_id=2,
    )
    assert bli.to_dict()["fiscal_year"] == 2023
