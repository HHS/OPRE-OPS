import pytest
from models.cans import BudgetLineItem, BudgetLineItemStatus
from ops_api.ops.resources.budget_line_items import PostBudgetLineItemRequest


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


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_post_budget_line_items_empty_post(auth_client):
    response = auth_client.post("/api/v1/budget-line-items/", data={})
    assert response.status_code == 400


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_post_budget_line_items(auth_client):
    data = PostBudgetLineItemRequest(
        line_description="LI 1",
        comments="blah blah",
        agreement_id=1,
        can_id=1,
        amount=100.12,
        status="DRAFT",
        date_needed="2023-01-01",
        psc_fee_amount=1.23,
    )
    response = auth_client.post("/api/v1/budget-line-items/", json=data.__dict__)
    assert response.status_code == 201
    assert response.json["line_description"] == "LI 1"
    assert response.json["amount"] == 100.12
    assert response.json["status"] == "DRAFT"


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_post_budget_line_items_bad_status(auth_client):
    data = PostBudgetLineItemRequest(
        line_description="LI 1",
        comments="blah blah",
        agreement_id=1,
        can_id=1,
        amount=100.12,
        status="blah blah",
        date_needed="2023-01-01",
        psc_fee_amount=1.23,
    )
    response = auth_client.post("/api/v1/budget-line-items/", json=data.__dict__)
    assert response.status_code == 400


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_post_budget_line_items_missing_agreement(auth_client):
    data = {
        "line_description": "LI 1",
        "comments": "blah blah",
        # agreement_id=1, # missing agreement number
        "can_id": 1,
        "amount": 100.12,
        "status": "DRAFT",
        "date_needed": "2023-01-01",
        "psc_fee_amount": 1.23,
    }
    response = auth_client.post("/api/v1/budget-line-items/", json=data)
    assert response.status_code == 400


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_post_budget_line_items_missing_optional_comments(auth_client):
    data = PostBudgetLineItemRequest(
        line_description="LI 1",
        agreement_id=1,
        can_id=1,
        amount=100.12,
        status="DRAFT",
        date_needed="2023-01-01",
        psc_fee_amount=1.23,
    )
    response = auth_client.post("/api/v1/budget-line-items/", json=data.__dict__)
    assert response.status_code == 201


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_post_budget_line_items_invalid_can(auth_client):
    data = PostBudgetLineItemRequest(
        line_description="LI 1",
        comments="blah blah",
        agreement_id=1,
        can_id=10000000,
        amount=100.12,
        status="DRAFT",
        date_needed="2023-01-01",
        psc_fee_amount=1.23,
    )
    response = auth_client.post("/api/v1/budget-line-items/", json=data.__dict__)
    assert response.status_code == 500


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_post_budget_line_items_auth_required(client):
    data = PostBudgetLineItemRequest(
        line_description="LI 1",
        comments="blah blah",
        agreement_id=1,
        can_id=1,
        amount=100.12,
        status="DRAFT",
        date_needed="2023-01-01",
        psc_fee_amount=1.23,
    )
    response = client.post("/api/v1/budget-line-items/", json=data.__dict__)
    assert response.status_code == 401
