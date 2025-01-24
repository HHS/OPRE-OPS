import datetime

import pytest
from sqlalchemy_continuum import parent_class, version_class

from models import CAN, Agreement, BudgetLineItem, BudgetLineItemStatus, ServicesComponent


@pytest.mark.usefixtures("app_ctx")
def test_budget_line_item_lookup(loaded_db, test_bli):
    bli = loaded_db.get(BudgetLineItem, test_bli.id)
    assert bli is not None
    assert bli.id == test_bli.id
    assert bli.line_description == "LI 1"
    assert bli.display_name == f"BL {test_bli.id}"
    assert bli.agreement_id == 1
    assert bli.can_id == 504
    assert bli.amount == 1000000.00
    assert bli.status == BudgetLineItemStatus.DRAFT


def test_budget_line_item_creation(test_can):
    bli = BudgetLineItem(
        line_description="Grant Expenditure GA999",
        agreement_id=1,
        can_id=test_can.id,
        amount=850450.00,
        status=BudgetLineItemStatus.PLANNED,
    )
    assert bli.to_dict()["status"] == "PLANNED"


def test_get_budget_line_items_list(auth_client, loaded_db):
    count = loaded_db.query(BudgetLineItem).count()
    response = auth_client.get("/api/v1/budget-line-items/")
    assert response.status_code == 200
    assert len(response.json) == count


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_get_budget_line_items_list_by_id(auth_client, test_bli):
    response = auth_client.get(f"/api/v1/budget-line-items/{test_bli.id}")
    assert response.status_code == 200
    assert response.json["id"] == test_bli.id


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_get_budget_line_items_list_by_can(auth_client, test_can):
    response = auth_client.get(f"/api/v1/budget-line-items/?can_id={test_can.id}")
    assert response.status_code == 200
    assert len(response.json) == 1
    assert response.json[0]["can_id"] == test_can.id


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
    response = auth_client.post("/api/v1/budget-line-items/", json={})
    assert response.status_code == 400


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_post_budget_line_items(loaded_db, auth_client, test_can):
    data = {
        "line_description": "LI 1",
        "comments": "blah blah",
        "agreement_id": 1,
        "can_id": test_can.id,
        "amount": 100.12,
        "status": "DRAFT",
        "date_needed": "2043-01-01",
        "proc_shop_fee_percentage": 1.23,
        "services_component_id": 1,
    }
    response = auth_client.post("/api/v1/budget-line-items/", json=data)
    assert response.status_code == 201
    assert response.json["line_description"] == "LI 1"
    assert response.json["amount"] == 100.12
    assert response.json["status"] == "DRAFT"
    assert response.json["services_component_id"] == 1

    # cleanup
    bli = loaded_db.get(BudgetLineItem, response.json["id"])
    loaded_db.delete(bli)
    loaded_db.commit()


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_post_budget_line_items_bad_status(auth_client, test_can):
    data = {
        "line_description": "LI 1",
        "comments": "blah blah",
        "agreement_id": 1,
        "can_id": test_can.id,
        "amount": 100.12,
        "status": "blah blah",
        "date_needed": "2043-01-01",
        "proc_shop_fee_percentage": 1.23,
    }
    response = auth_client.post("/api/v1/budget-line-items/", json=data)
    assert response.status_code == 400


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_post_budget_line_items_missing_agreement(auth_client, test_can):
    data = {
        "line_description": "LI 1",
        "comments": "blah blah",
        "can_id": test_can.id,
        "amount": 100.12,
        "status": "DRAFT",
        "date_needed": "2043-01-01",
        "proc_shop_fee_percentage": 1.23,
    }
    response = auth_client.post("/api/v1/budget-line-items/", json=data)
    assert response.status_code == 400


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_post_budget_line_items_missing_optional_comments(loaded_db, auth_client, test_can):
    data = {
        "line_description": "LI 1",
        "agreement_id": 1,
        "can_id": test_can.id,
        "amount": 100.12,
        "status": "DRAFT",
        "date_needed": "2043-01-01",
        "proc_shop_fee_percentage": 1.23,
    }
    response = auth_client.post("/api/v1/budget-line-items/", json=data)
    assert response.status_code == 201

    # cleanup
    bli = loaded_db.get(BudgetLineItem, response.json["id"])
    loaded_db.delete(bli)
    loaded_db.commit()


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_post_budget_line_items_invalid_can(auth_client):
    data = {
        "line_description": "LI 1",
        "comments": "blah blah",
        "agreement_id": 1,
        "can_id": 10000000,
        "amount": 100.12,
        "status": "DRAFT",
        "date_needed": "2043-01-01",
        "proc_shop_fee_percentage": 1.23,
    }
    response = auth_client.post("/api/v1/budget-line-items/", json=data)
    assert response.status_code == 400


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_post_budget_line_items_auth_required(client, test_can):
    data = {
        "line_description": "LI 1",
        "comments": "blah blah",
        "agreement_id": 1,
        "can_id": test_can.id,
        "amount": 100.12,
        "status": "DRAFT",
        "date_needed": "2043-01-01",
        "proc_shop_fee_percentage": 1.23,
    }
    response = client.post("/api/v1/budget-line-items/", json=data)
    assert response.status_code == 401


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_post_budget_line_items_only_agreement_id_required(auth_client, loaded_db):
    data = {"agreement_id": 1}
    response = auth_client.post("/api/v1/budget-line-items/", json=data)
    assert response.status_code == 201
    assert response.json["id"] is not None
    assert response.json["agreement_id"] == 1

    # cleanup
    bli = loaded_db.get(BudgetLineItem, response.json["id"])
    loaded_db.delete(bli)
    loaded_db.commit()


@pytest.fixture()
def test_bli_new(loaded_db, test_can):
    bli = BudgetLineItem(
        line_description="LI 1",
        comments="blah blah",
        agreement_id=1,
        can_id=test_can.id,
        amount=100.12,
        status=BudgetLineItemStatus.DRAFT,
        date_needed=datetime.date(2043, 1, 1),
        proc_shop_fee_percentage=1.23,
        created_by=1,
    )
    loaded_db.add(bli)
    loaded_db.commit()

    yield bli

    loaded_db.rollback()
    loaded_db.delete(bli)
    loaded_db.commit()


@pytest.fixture()
def test_bli_new_previous_year(loaded_db, test_can):
    bli = BudgetLineItem(
        line_description="LI 1",
        comments="blah blah",
        agreement_id=1,
        can_id=test_can.id,
        amount=100.12,
        status=BudgetLineItemStatus.DRAFT,
        date_needed=datetime.date(2042, 10, 1),
        proc_shop_fee_percentage=1.23,
        created_by=1,
    )
    loaded_db.add(bli)
    loaded_db.commit()

    yield bli

    loaded_db.rollback()
    loaded_db.delete(bli)
    loaded_db.commit()


@pytest.fixture()
def test_bli_new_previous_fiscal_year(loaded_db, test_can):
    bli = BudgetLineItem(
        line_description="LI 1",
        comments="blah blah",
        agreement_id=1,
        can_id=test_can.id,
        amount=100.12,
        status=BudgetLineItemStatus.DRAFT,
        date_needed=datetime.date(2042, 9, 1),
        proc_shop_fee_percentage=1.23,
        created_by=1,
    )
    loaded_db.add(bli)
    loaded_db.commit()

    yield bli

    loaded_db.rollback()
    loaded_db.delete(bli)
    loaded_db.commit()


@pytest.fixture()
def test_bli_new_no_can(loaded_db):
    bli = BudgetLineItem(
        line_description="LI 1",
        comments="blah blah",
        agreement_id=1,
        amount=100.12,
        status=BudgetLineItemStatus.DRAFT,
        date_needed=datetime.date(2043, 1, 1),
        proc_shop_fee_percentage=1.23,
        created_by=1,
    )
    loaded_db.add(bli)
    loaded_db.commit()

    yield bli

    loaded_db.rollback()
    loaded_db.delete(bli)
    loaded_db.commit()


@pytest.fixture()
def test_bli_new_no_need_by_date(loaded_db, test_can):
    bli = BudgetLineItem(
        line_description="LI 1",
        comments="blah blah",
        agreement_id=1,
        can_id=test_can.id,
        amount=100.12,
        status=BudgetLineItemStatus.DRAFT,
        proc_shop_fee_percentage=1.23,
        created_by=1,
    )
    loaded_db.add(bli)
    loaded_db.commit()

    yield bli

    loaded_db.rollback()
    loaded_db.delete(bli)
    loaded_db.commit()


@pytest.mark.usefixtures("app_ctx")
def test_put_budget_line_items(auth_client, test_bli_new):
    data = {
        "line_description": "Updated LI 1",
        "comments": "hah hah",
        "agreement_id": 2,
        "can_id": 501,
        "amount": 200.24,
        "date_needed": "2044-01-01",
        "proc_shop_fee_percentage": 2.34,
    }
    response = auth_client.put(f"/api/v1/budget-line-items/{test_bli_new.id}", json=data)
    assert response.status_code == 200
    assert response.json["line_description"] == "Updated LI 1"
    assert response.json["id"] == test_bli_new.id
    assert response.json["comments"] == "hah hah"
    assert response.json["agreement_id"] == 1  # not allowed to change
    assert response.json["can_id"] == 501
    assert response.json["amount"] == 200.24
    assert response.json["status"] == "DRAFT"
    assert response.json["date_needed"] == "2044-01-01"
    assert response.json["proc_shop_fee_percentage"] == 2.34
    assert response.json["created_on"] != response.json["updated_on"]


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_put_budget_line_items_minimum(auth_client, loaded_db, test_can):
    bli = BudgetLineItem(
        id=1000,
        line_description="LI 1",
        comments="blah blah",
        agreement_id=1,
        can_id=test_can.id,
        amount=100.12,
        status=BudgetLineItemStatus.DRAFT,
        date_needed=datetime.date(2043, 1, 1),
        proc_shop_fee_percentage=1.23,
        created_by=1,
    )
    try:
        loaded_db.add(bli)
        loaded_db.commit()

        data = {"line_description": "Updated LI 1", "agreement_id": 1}
        response = auth_client.put("/api/v1/budget-line-items/1000", json=data)
        assert response.status_code == 200
        assert response.json["line_description"] == "Updated LI 1"
        assert response.json["id"] == 1000
        assert response.json["comments"] == "blah blah"
        assert response.json["agreement_id"] == 1
        assert response.json["can_id"] == test_can.id
        assert response.json["amount"] == 100.12
        assert response.json["status"] == "DRAFT"
        assert response.json["date_needed"] == "2043-01-01"
        assert response.json["proc_shop_fee_percentage"] == 1.23
        assert response.json["created_on"] != response.json["updated_on"]

    finally:
        # cleanup
        loaded_db.delete(bli)
        loaded_db.commit()


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_put_budget_line_items_bad_status(auth_client, loaded_db, test_can):
    bli = BudgetLineItem(
        id=1000,
        line_description="LI 1",
        comments="blah blah",
        agreement_id=1,
        can_id=test_can.id,
        amount=100.12,
        status=BudgetLineItemStatus.DRAFT,
        date_needed=datetime.date(2043, 1, 1),
        proc_shop_fee_percentage=1.23,
        created_by=1,
    )
    try:
        loaded_db.add(bli)
        loaded_db.commit()

        data = {"status": "blah blah", "agreement_id": 1}
        response = auth_client.put("/api/v1/budget-line-items/1000", json=data)
        assert response.status_code == 400

    finally:
        # cleanup
        loaded_db.delete(bli)
        loaded_db.commit()


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_put_budget_line_items_bad_date(auth_client, loaded_db, test_can):
    bli = BudgetLineItem(
        id=1000,
        line_description="LI 1",
        comments="blah blah",
        agreement_id=1,
        can_id=test_can.id,
        amount=100.12,
        status=BudgetLineItemStatus.DRAFT,
        date_needed=datetime.date(2043, 1, 1),
        proc_shop_fee_percentage=1.23,
        created_by=1,
    )
    try:
        loaded_db.add(bli)
        loaded_db.commit()

        data = {"date_needed": "blah blah", "agreement_id": 1}
        response = auth_client.put("/api/v1/budget-line-items/1000", json=data)
        assert response.status_code == 400

    finally:
        # cleanup
        loaded_db.delete(bli)
        loaded_db.commit()


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_put_budget_line_items_bad_can(auth_client, test_bli_new):
    data = {"can_id": 1000000, "agreement_id": 1}
    response = auth_client.put(f"/api/v1/budget-line-items/{test_bli_new.id}", json=data)
    assert response.status_code == 400


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_put_budget_line_items_auth(client, loaded_db):
    response = client.put("/api/v1/budget-line-items/1000", json={})
    assert response.status_code == 401


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_put_budget_line_items_empty_request(auth_client, loaded_db, test_bli_new):
    response = auth_client.put(f"/api/v1/budget-line-items/{test_bli_new.id}", json={})
    assert response.status_code == 400


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_put_budget_line_items_non_existent_bli(auth_client, loaded_db):
    data = {
        "line_description": "Updated LI 1",
        "comments": "hah hah",
        "agreement_id": 2,
        "can_id": 501,
        "amount": 200.24,
        "status": "PLANNED",
        "date_needed": "2044-01-01",
        "proc_shop_fee_percentage": 2.34,
    }
    response = auth_client.put("/api/v1/budget-line-items/1000", json=data)
    assert response.status_code == 400


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_patch_budget_line_items(auth_client, loaded_db, test_can):
    # TODO: setting the services_component_id is not working on create
    bli = BudgetLineItem(
        id=1000,
        line_description="LI 1",
        comments="blah blah",
        agreement_id=1,
        can_id=test_can.id,
        amount=100.12,
        status=BudgetLineItemStatus.DRAFT,
        date_needed=datetime.date(2043, 1, 1),
        proc_shop_fee_percentage=1.23,
        created_by=1,
    )
    try:
        loaded_db.add(bli)
        loaded_db.commit()

        data = {
            "line_description": "Updated LI 1",
            "comments": "hah hah",
            "agreement_id": 2,
            "can_id": 501,
            "amount": 200.24,
            "date_needed": "2044-01-01",
            "proc_shop_fee_percentage": 2.34,
            "services_component_id": 2,
        }

        response = auth_client.patch("/api/v1/budget-line-items/1000", json=data)
        assert response.status_code == 200
        assert response.json["line_description"] == "Updated LI 1"
        assert response.json["id"] == 1000
        assert response.json["comments"] == "hah hah"
        assert response.json["agreement_id"] == 1  # not allowed to change
        assert response.json["can_id"] == 501
        assert response.json["amount"] == 200.24
        assert response.json["status"] == "DRAFT"
        assert response.json["date_needed"] == "2044-01-01"
        assert response.json["proc_shop_fee_percentage"] == 2.34
        assert response.json["created_on"] != response.json["updated_on"]
        assert response.json["services_component_id"] == 2

    finally:
        # cleanup
        loaded_db.delete(bli)
        loaded_db.commit()


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_patch_budget_line_items_update_two_attributes(auth_client, loaded_db, test_can):
    bli = BudgetLineItem(
        id=1000,
        line_description="LI 1",
        comments="blah blah",
        agreement_id=1,
        can_id=test_can.id,
        amount=100.12,
        status=BudgetLineItemStatus.DRAFT,
        date_needed=datetime.date(2043, 1, 1),
        proc_shop_fee_percentage=1.23,
        created_by=1,
    )
    try:
        loaded_db.add(bli)
        loaded_db.commit()

        data = {
            "line_description": "Updated LI 1",
            "comments": "hah hah",
        }
        response = auth_client.patch("/api/v1/budget-line-items/1000", json=data)
        assert response.status_code == 200
        assert response.json["line_description"] == "Updated LI 1"
        assert response.json["id"] == 1000
        assert response.json["comments"] == "hah hah"
        assert response.json["agreement_id"] == 1
        assert response.json["can_id"] == test_can.id
        assert response.json["amount"] == 100.12
        assert response.json["status"] == "DRAFT"
        assert response.json["date_needed"] == "2043-01-01"
        assert response.json["proc_shop_fee_percentage"] == 1.23
        assert response.json["created_on"] != response.json["updated_on"]

    finally:
        # cleanup
        loaded_db.delete(bli)
        loaded_db.commit()


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_patch_budget_line_items_auth_required(client):
    response = client.patch("/api/v1/budget-line-items/1", json={})
    assert response.status_code == 401


@pytest.mark.usefixtures("app_ctx")
def test_patch_budget_line_items_bad_status(auth_client, loaded_db, test_can):
    data = {
        "line_description": "LI 1",
        "comments": "blah blah",
        "agreement_id": 1,
        "can_id": test_can.id,
        "amount": 100.12,
        "status": "blah blah",
        "date_needed": "2043-01-01",
        "proc_shop_fee_percentage": 1.23,
    }
    response = auth_client.patch("/api/v1/budget-line-items/1", json=data)
    assert response.status_code == 400


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_patch_budget_line_items_empty_data(auth_client, test_bli):
    response = auth_client.patch(f"/api/v1/budget-line-items/{test_bli.id}", json={})
    assert response.status_code == 200


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_patch_budget_line_items_invalid_can(auth_client):
    data = {
        "line_description": "LI 1",
        "comments": "blah blah",
        "agreement_id": 1,
        "can_id": 10000000,
        "amount": 100.12,
        "status": "DRAFT",
        "date_needed": "2043-01-01",
        "proc_shop_fee_percentage": 1.23,
    }
    response = auth_client.patch("/api/v1/budget-line-items/1", json=data)
    assert response.status_code == 400


@pytest.mark.skip("Status change (from DRAFT to PLANNED) is not allowed as direct edit. Replace/rework this test.")
@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_patch_budget_line_items_update_status(auth_client, loaded_db, test_can):
    bli = BudgetLineItem(
        id=1000,
        line_description="LI 1",
        comments="blah blah",
        agreement_id=1,
        can_id=test_can.id,
        amount=100.12,
        status=BudgetLineItemStatus.DRAFT,
        date_needed=datetime.date(2043, 1, 1),
        proc_shop_fee_percentage=1.23,
        created_by=1,
    )
    try:
        loaded_db.add(bli)
        loaded_db.commit()

        data = {"status": "PLANNED"}
        response = auth_client.patch("/api/v1/budget-line-items/1000", json=data)
        assert response.status_code == 200
        assert response.json["status"] == "PLANNED"

    finally:
        # cleanup
        loaded_db.delete(bli)
        loaded_db.commit()


@pytest.mark.usefixtures("app_ctx")
def test_patch_budget_line_items_history(loaded_db, test_can):
    bli = BudgetLineItem(
        line_description="LI 1",
        comments="blah blah",
        agreement_id=1,
        can_id=test_can.id,
        amount=100.12,
        status=BudgetLineItemStatus.DRAFT,
        date_needed=datetime.date(2043, 1, 1),
        proc_shop_fee_percentage=1.23,
        created_by=1,
    )
    try:
        loaded_db.add(bli)
        loaded_db.commit()

        # these will throw if the history tables don't exist
        version_class(BudgetLineItem)
        parent_class(version_class(BudgetLineItem))

        # initial version is 0
        assert bli.versions[0].line_description == "LI 1"

        # update the line description
        bli.line_description = "Updated LI 1"
        loaded_db.commit()

        # new version is 1
        assert bli.versions[1].line_description == "Updated LI 1"

        # SQL pulls back latest version (1 in this case)
        updated_bli = loaded_db.get(BudgetLineItem, bli.id)
        assert updated_bli.line_description == "Updated LI 1"
        assert updated_bli.display_name == f"BL {bli.id}"

    finally:
        # cleanup
        loaded_db.delete(bli)
        loaded_db.commit()


@pytest.mark.usefixtures("app_ctx")
def test_budget_line_item_portfolio_id(loaded_db, test_bli_new):
    can = loaded_db.get(CAN, test_bli_new.can_id)
    assert test_bli_new.portfolio_id == can.portfolio_id


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_put_budget_line_item_portfolio_id_ignored(auth_client, loaded_db, test_bli_new):
    data = {
        "line_description": "Updated LI 1",
        "comments": "hah hah",
        "agreement_id": 2,
        "can_id": 501,
        "amount": 200.24,
        "date_needed": "2044-01-01",
        "proc_shop_fee_percentage": 2.34,
    }
    request_data = data | {"portfolio_id": 10000}
    response = auth_client.put(f"/api/v1/budget-line-items/{test_bli_new.id}", json=request_data)
    assert response.status_code == 200, "portfolio_id should be ignored"


@pytest.mark.usefixtures("app_ctx")
def test_budget_line_item_fiscal_year(
    loaded_db, test_bli_new, test_bli_new_previous_year, test_bli_new_previous_fiscal_year
):
    assert test_bli_new.fiscal_year == test_bli_new.date_needed.year, "test_bli_new.date_needed == 2043-01-01"
    assert (
        test_bli_new_previous_year.fiscal_year == test_bli_new_previous_year.date_needed.year + 1
    ), "test_bli_new_previous_year.date_needed == 2042-10-01"
    assert (
        test_bli_new_previous_fiscal_year.fiscal_year == test_bli_new_previous_fiscal_year.date_needed.year
    ), "test_bli_new_previous_fiscal_year.date_needed == 2042-09-01"


@pytest.mark.usefixtures("app_ctx")
def test_budget_line_item_portfolio_id_null(auth_client, loaded_db, test_bli_new_no_can):
    assert test_bli_new_no_can.portfolio_id is None
    response = auth_client.get(f"/api/v1/budget-line-items/{test_bli_new_no_can.id}")
    assert response.status_code == 200
    assert response.json["portfolio_id"] is None


@pytest.mark.usefixtures("app_ctx")
def test_budget_line_item_fiscal_year_null(auth_client, loaded_db, test_bli_new_no_need_by_date):
    assert test_bli_new_no_need_by_date.fiscal_year is None
    response = auth_client.get(f"/api/v1/budget-line-items/{test_bli_new_no_need_by_date.id}")
    assert response.status_code == 200
    assert response.json["fiscal_year"] is None


@pytest.mark.usefixtures("app_ctx")
def test_budget_line_item_team_members(loaded_db, test_bli_new):
    team_members = test_bli_new.agreement.team_members
    assert len(team_members) > 0
    assert test_bli_new.team_members == team_members


@pytest.mark.usefixtures("app_ctx")
def test_budget_line_item_team_members_response(auth_client, loaded_db, test_bli_new):
    response = auth_client.get(f"/api/v1/budget-line-items/{test_bli_new.id}")
    assert response.status_code == 200
    assert len(response.json["team_members"]) > 0


@pytest.mark.usefixtures("app_ctx")
def test_patch_budget_line_items_using_e2e_test(auth_client, test_bli_new, test_can):
    data = {
        "amount": 111111,
        "can_id": test_can.id,
        "status": "DRAFT",
        "comments": "note one",
        "versions": [{"id": 29, "transaction_id": 397}],
        "agreement": 1,
        "date_needed": "2044-12-01",
        "agreement_id": 1,
        "created_by_user": 21,
        "line_description": "SC1",
        "proc_shop_fee_percentage": None,
    }
    response = auth_client.patch(f"/api/v1/budget-line-items/{test_bli_new.id}", json=data)
    assert response.status_code == 200


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_patch_budget_line_items_with_null_date_needed(auth_client, test_bli_new):
    response = auth_client.patch(f"/api/v1/budget-line-items/{test_bli_new.id}", json={"date_needed": None})
    assert response.status_code == 200
    assert response.json["date_needed"] is None


@pytest.mark.usefixtures("app_ctx")
def test_valid_services_component(auth_client, app, test_bli_new):
    session = app.db_session
    sc = ServicesComponent(contract_agreement_id=6, number=1, optional=False)
    session.add(sc)
    session.commit()

    assert sc.id is not None
    new_sc_id = sc.id
    assert sc.contract_agreement_id == 6

    data = {"services_component_id": new_sc_id}

    response = auth_client.patch(f"/api/v1/budget-line-items/{test_bli_new.id}", json=data)
    assert response.status_code == 400
    assert response.json
    assert response.json == {"_schema": ["The Services Component must belong to the same Agreement as the BLI"]}

    sc.contract_agreement_id = 1
    session.add(sc)
    session.commit()

    response = auth_client.patch(f"/api/v1/budget-line-items/{test_bli_new.id}", json=data)
    assert response.status_code == 200

    session.delete(sc)
    session.commit()


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_delete_budget_line_items(auth_client, loaded_db, test_can):
    bli = BudgetLineItem(
        line_description="LI 1",
        agreement_id=1,
        can_id=test_can.id,
        amount=100.12,
        status=BudgetLineItemStatus.DRAFT,
        created_by=1,
    )
    loaded_db.add(bli)
    loaded_db.commit()
    assert bli.id is not None
    new_bli_id = bli.id

    response = auth_client.delete(f"/api/v1/budget-line-items/{new_bli_id}")
    assert response.status_code == 200

    sc: BudgetLineItem = loaded_db.get(BudgetLineItem, new_bli_id)
    assert not sc


def test_budget_line_item_validation_create_invalid(auth_client, app, test_can, test_project):
    session = app.db_session

    # create agreement (using API)
    data = {
        "agreement_type": "CONTRACT",
        "agreement_reason": "NEW_REQ",
        "name": "TEST: Agreement for BLI Validation",
        "team_members": [
            {
                "id": 520,
            },
            {
                "id": 522,
            },
        ],
        "description": "Description",
        "awarding_entity_id": 2,
        "product_service_code_id": 1,
        "project_id": test_project.id,
        "project_officer_id": 520,
    }
    resp = auth_client.post("/api/v1/agreements/", json=data)
    assert resp.status_code == 201
    assert "id" in resp.json
    agreement_id = resp.json["id"]

    #  create invalid BLI (using API) and expect 400
    data = {
        "line_description": "Test Experiments Workflows BLI",
        "agreement_id": agreement_id,
        "status": "PLANNED",
    }
    resp = auth_client.post("/api/v1/budget-line-items/", json=data)
    assert resp.status_code == 400
    assert "_schema" in resp.json
    assert len(resp.json["_schema"]) == 3

    #  create valid BLI (using API)
    data = data | {
        "can_id": test_can.id,
        "amount": 111.11,
        "date_needed": "2044-01-01",
    }
    resp = auth_client.post("/api/v1/budget-line-items/", json=data)
    assert resp.status_code == 201
    assert "id" in resp.json
    bli_id = resp.json["id"]

    # cleanup
    bli = session.get(BudgetLineItem, bli_id)
    session.delete(bli)
    agreement = session.get(Agreement, agreement_id)
    session.delete(agreement)
    session.commit()


@pytest.mark.usefixtures("app_ctx")
def test_budget_line_item_validation_patch_to_invalid(auth_client, app, test_can, test_project):
    session = app.db_session

    # create agreement (using API)
    data = {
        "agreement_type": "CONTRACT",
        "agreement_reason": "NEW_REQ",
        "name": "TEST: Agreement for BLI Validation",
        "team_members": [
            {
                "id": 520,
            },
            {
                "id": 522,
            },
        ],
        "description": "Description",
        "awarding_entity_id": 2,
        "product_service_code_id": 1,
        "project_id": test_project.id,
        "project_officer_id": 520,
    }
    resp = auth_client.post("/api/v1/agreements/", json=data)
    assert resp.status_code == 201
    assert "id" in resp.json
    agreement_id = resp.json["id"]

    #  create BLI (using API)
    data = {
        "line_description": "Test Experiments Workflows BLI",
        "agreement_id": agreement_id,
        "status": "PLANNED",
        "can_id": test_can.id,
        "amount": 111.11,
        "date_needed": "2044-01-01",
    }
    resp = auth_client.post("/api/v1/budget-line-items/", json=data)
    assert resp.status_code == 201
    assert "id" in resp.json
    bli_id = resp.json["id"]

    # update BLI with invalid data (for PLANNED status)
    data = {
        # "can_id": None,
        "amount": None,
        "date_needed": None,
    }
    resp = auth_client.patch(f"/api/v1/budget-line-items/{bli_id}", json=data)
    assert resp.status_code == 400
    assert "_schema" in resp.json
    assert len(resp.json["_schema"]) == len(data)

    # cleanup
    bli = session.get(BudgetLineItem, bli_id)
    session.delete(bli)
    agreement = session.get(Agreement, agreement_id)
    session.delete(agreement)
    session.commit()


@pytest.mark.usefixtures("app_ctx")
def test_budget_line_item_validation_patch_to_zero_or_negative_amount(auth_client, app, test_can, test_project):
    session = app.db_session

    # create agreement (using API)
    data = {
        "agreement_type": "CONTRACT",
        "agreement_reason": "NEW_REQ",
        "name": "TEST: Agreement for BLI Validation",
        "description": "Description",
        "awarding_entity_id": 2,
        "product_service_code_id": 1,
        "project_id": test_project.id,
        "project_officer_id": 520,
    }
    resp = auth_client.post("/api/v1/agreements/", json=data)
    assert resp.status_code == 201
    assert "id" in resp.json
    agreement_id = resp.json["id"]

    #  create BLI (using API)
    data = {
        "line_description": "Test Experiments Workflows BLI",
        "agreement_id": agreement_id,
        "status": "PLANNED",
        "can_id": test_can.id,
        "amount": 111.11,
        "date_needed": "2044-01-01",
    }
    resp = auth_client.post("/api/v1/budget-line-items/", json=data)
    assert resp.status_code == 201
    assert "id" in resp.json
    bli_id = resp.json["id"]

    # update BLI with zero amount, expect 400 (rejection)
    data = {
        "amount": 0,
    }
    resp = auth_client.patch(f"/api/v1/budget-line-items/{bli_id}", json=data)
    assert resp.status_code == 400
    assert "_schema" in resp.json
    assert len(resp.json["_schema"]) == 1

    # update BLI with negative amount, expect 400 (rejection)
    data = {
        "amount": -222.22,
    }
    resp = auth_client.patch(f"/api/v1/budget-line-items/{bli_id}", json=data)
    assert resp.status_code == 400
    assert "_schema" in resp.json
    assert len(resp.json["_schema"]) == 1

    # cleanup
    bli = session.get(BudgetLineItem, bli_id)
    session.delete(bli)
    agreement = session.get(Agreement, agreement_id)
    session.delete(agreement)
    session.commit()


@pytest.mark.usefixtures("app_ctx")
def test_budget_line_item_validation_patch_to_invalid_date(auth_client, app, test_can, test_project):
    session = app.db_session

    # create agreement (using API)
    data = {
        "agreement_type": "CONTRACT",
        "agreement_reason": "NEW_REQ",
        "name": "TEST: Agreement for BLI Validation",
        "description": "Description",
        "awarding_entity_id": 2,
        "product_service_code_id": 1,
        "project_id": test_project.id,
        "project_officer_id": 520,
    }
    resp = auth_client.post("/api/v1/agreements/", json=data)
    assert resp.status_code == 201
    assert "id" in resp.json
    agreement_id = resp.json["id"]

    #  create BLI (using API)
    data = {
        "line_description": "Test Experiments Workflows BLI",
        "agreement_id": agreement_id,
        "status": "PLANNED",
        "can_id": test_can.id,
        "amount": 111.11,
        "date_needed": "2044-01-01",
    }
    resp = auth_client.post("/api/v1/budget-line-items/", json=data)
    assert resp.status_code == 201
    assert "id" in resp.json
    bli_id = resp.json["id"]

    # update BLI with invalid data (in the past), expect 400 (rejection)
    data = {
        "date_needed": "1900-01-01",
    }
    resp = auth_client.patch(f"/api/v1/budget-line-items/{bli_id}", json=data)
    assert resp.status_code == 400
    assert "_schema" in resp.json
    assert len(resp.json["_schema"]) == 1

    # cleanup
    bli = session.get(BudgetLineItem, bli_id)
    session.delete(bli)
    agreement = session.get(Agreement, agreement_id)
    session.delete(agreement)
    session.commit()


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_patch_budget_line_items_valid_user_change_request(auth_client, test_bli):
    data = {
        "status": "DRAFT",
    }
    response = auth_client.patch(f"/api/v1/budget-line-items/{test_bli.id}", json=data)
    assert response.status_code == 200


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_patch_budget_line_items_invalid_user_change_request(basic_user_auth_client, test_bli):
    data = {
        "status": "PLANNED",
    }
    response = basic_user_auth_client.patch(f"/api/v1/budget-line-items/{test_bli.id}", json=data)
    assert response.status_code == 403


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_invalid_post_budget_line_items(loaded_db, basic_user_auth_client, test_can):
    data = {
        "line_description": "LI 1",
        "comments": "blah blah",
        "agreement_id": 1,
        "can_id": test_can.id,
        "amount": 100.12,
        "status": "DRAFT",
        "date_needed": "2043-01-01",
        "proc_shop_fee_percentage": 1.23,
        "services_component_id": 1,
    }
    response = basic_user_auth_client.post("/api/v1/budget-line-items/", json=data)
    assert response.status_code == 403
