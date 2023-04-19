import datetime

import pytest
from models.cans import BudgetLineItem, BudgetLineItemStatus
from ops_api.ops.resources.budget_line_items import RequestBody


@pytest.mark.usefixtures("app_ctx")
def test_budget_line_item_lookup(loaded_db):
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
def test_get_budget_line_items_list_by_agreement(auth_client):
    response = auth_client.get("/api/v1/budget-line-items/?agreement_id=1")
    assert response.status_code == 200
    assert len(response.json) == 2
    assert response.json[0]["agreement_id"] == 1
    assert response.json[1]["agreement_id"] == 1


def test_get_budget_line_items_auth_required(client):
    response = client.get("/api/v1/budget-line-items/")
    assert response.status_code == 401


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_get_budget_line_items_list_by_status(auth_client):
    response = auth_client.get("/api/v1/budget-line-items/?status=IN_EXECUTION")
    assert response.status_code == 200
    assert len(response.json) == 8
    assert response.json[0]["status"] == "IN_EXECUTION"


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_get_budget_line_items_list_by_status_invalid(auth_client):
    response = auth_client.get("/api/v1/budget-line-items/?status=BLAH")
    assert response.status_code == 400


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_post_budget_line_items_empty_post(auth_client):
    response = auth_client.post("/api/v1/budget-line-items/", data={})
    assert response.status_code == 400


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_post_budget_line_items(auth_client):
    data = RequestBody(
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
    data = RequestBody(
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
    data = RequestBody(
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
    data = RequestBody(
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
    assert response.status_code == 400


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_post_budget_line_items_auth_required(client):
    data = RequestBody(
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


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_post_budget_line_items_only_agreement_id_required(auth_client):
    data = {"agreement_id": 1}
    response = auth_client.post("/api/v1/budget-line-items/", json=data)
    assert response.status_code == 201
    assert response.json["id"] is not None
    assert response.json["agreement_id"] == 1


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_put_budget_line_items(auth_client, loaded_db):
    bli = BudgetLineItem(
        id=1000,
        line_description="LI 1",
        comments="blah blah",
        agreement_id=1,
        can_id=1,
        amount=100.12,
        status=BudgetLineItemStatus.DRAFT,
        date_needed=datetime.date(2023, 1, 1),
        psc_fee_amount=1.23,
        created_by=1,
    )
    loaded_db.add(bli)
    loaded_db.commit()

    data = RequestBody(
        line_description="Updated LI 1",
        comments="hah hah",
        agreement_id=2,
        can_id=2,
        amount=200.24,
        status="PLANNED",
        date_needed="2024-01-01",
        psc_fee_amount=2.34,
    )
    response = auth_client.put("/api/v1/budget-line-items/1000", json=data.__dict__)
    assert response.status_code == 200
    assert response.json["line_description"] == "Updated LI 1"
    assert response.json["id"] == 1000
    assert response.json["comments"] == "hah hah"
    assert response.json["agreement_id"] == 2
    assert response.json["can_id"] == 2
    assert response.json["amount"] == 200.24
    assert response.json["status"] == "PLANNED"
    assert response.json["date_needed"] == "2024-01-01"
    assert response.json["psc_fee_amount"] == 2.34
    assert response.json["created_on"] != response.json["updated_on"]

    # cleanup
    loaded_db.delete(bli)
    loaded_db.commit()


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_put_budget_line_items_minimum(auth_client, loaded_db):
    bli = BudgetLineItem(
        id=1000,
        line_description="LI 1",
        comments="blah blah",
        agreement_id=1,
        can_id=1,
        amount=100.12,
        status=BudgetLineItemStatus.DRAFT,
        date_needed=datetime.date(2023, 1, 1),
        psc_fee_amount=1.23,
        created_by=1,
    )
    loaded_db.add(bli)
    loaded_db.commit()

    data = {"line_description": "Updated LI 1", "agreement_id": 1}
    response = auth_client.put("/api/v1/budget-line-items/1000", json=data)
    assert response.status_code == 200
    assert response.json["line_description"] == "Updated LI 1"
    assert response.json["id"] == 1000
    assert response.json["comments"] is None
    assert response.json["agreement_id"] == 1
    assert response.json["can_id"] is None
    assert response.json["amount"] is None
    assert response.json["status"] is None
    assert response.json["date_needed"] is None
    assert response.json["psc_fee_amount"] is None
    assert response.json["created_on"] != response.json["updated_on"]

    # cleanup
    loaded_db.delete(bli)
    loaded_db.commit()


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_put_budget_line_items_bad_status(auth_client, loaded_db):
    bli = BudgetLineItem(
        id=1000,
        line_description="LI 1",
        comments="blah blah",
        agreement_id=1,
        can_id=1,
        amount=100.12,
        status=BudgetLineItemStatus.DRAFT,
        date_needed=datetime.date(2023, 1, 1),
        psc_fee_amount=1.23,
        created_by=1,
    )
    loaded_db.add(bli)
    loaded_db.commit()

    data = {"status": "blah blah", "agreement_id": 1}
    response = auth_client.put("/api/v1/budget-line-items/1000", json=data)
    assert response.status_code == 400

    # cleanup
    loaded_db.delete(bli)
    loaded_db.commit()


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_put_budget_line_items_bad_date(auth_client, loaded_db):
    bli = BudgetLineItem(
        id=1000,
        line_description="LI 1",
        comments="blah blah",
        agreement_id=1,
        can_id=1,
        amount=100.12,
        status=BudgetLineItemStatus.DRAFT,
        date_needed=datetime.date(2023, 1, 1),
        psc_fee_amount=1.23,
        created_by=1,
    )
    loaded_db.add(bli)
    loaded_db.commit()

    data = {"date_needed": "blah blah", "agreement_id": 1}
    response = auth_client.put("/api/v1/budget-line-items/1000", json=data)
    assert response.status_code == 400

    # cleanup
    loaded_db.delete(bli)
    loaded_db.commit()


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_put_budget_line_items_bad_can(auth_client, loaded_db):
    bli = BudgetLineItem(
        id=1000,
        line_description="LI 1",
        comments="blah blah",
        agreement_id=1,
        can_id=1,
        amount=100.12,
        status=BudgetLineItemStatus.DRAFT,
        date_needed=datetime.date(2023, 1, 1),
        psc_fee_amount=1.23,
        created_by=1,
    )
    loaded_db.add(bli)
    loaded_db.commit()

    data = {"can": 1000000, "agreement_id": 1}
    response = auth_client.put("/api/v1/budget-line-items/1000", json=data)
    assert response.status_code == 400

    # cleanup
    loaded_db.delete(bli)
    loaded_db.commit()


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_put_budget_line_items_auth(client, loaded_db):
    response = client.put("/api/v1/budget-line-items/1000", json={})
    assert response.status_code == 401
