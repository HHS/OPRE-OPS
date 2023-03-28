import pytest
from models.cans import BudgetLineItem, BudgetLineItemStatus


@pytest.mark.usefixtures("app_ctx")
def test_budget_line_item_lookup(loaded_db):
    # bli = loaded_db.query(BudgetLineItem).get(1)
    bli = loaded_db.get(BudgetLineItem, 1)
    assert bli is not None
    assert bli.id == 1
    assert bli.line_description == "LI 1"
    assert bli.agreement_id == 1
    assert bli.can_id == 5
    assert bli.amount == 1000000.00
    assert bli.status == BudgetLineItemStatus.PLANNED


def test_budget_line_item_creation():
    bli = BudgetLineItem(
        line_description="Grant Expendeture GA999",
        agreement_id=1,
        can_id=1,
        amount=850450.00,
        status=BudgetLineItemStatus.PLANNED,
    )
    assert bli.to_dict()["status"] == "PLANNED"


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_get_budget_line_items_list(auth_client):
    response = auth_client.get("/api/v1/budget-line-items/")
    assert response.status_code == 200
    assert len(response.json) == 19
    assert response.json[0]["id"] == 1
    assert response.json[1]["id"] == 2


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_get_budget_line_items_list_by_id(auth_client):
    response = auth_client.get("/api/v1/budget-line-items/1")
    assert response.status_code == 200
    assert response.json["id"] == 1


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_get_budget_line_items_list_by_can(auth_client):
    response = auth_client.get("/api/v1/budget-line-items/?can_id=1")
    assert response.status_code == 200
    assert len(response.json) == 1
    assert response.json[0]["can_id"] == 1
