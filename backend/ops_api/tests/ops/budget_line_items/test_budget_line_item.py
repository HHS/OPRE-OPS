import datetime
from decimal import Decimal

import pytest
from flask import url_for
from models import (
    CAN,
    AaAgreement,
    AABudgetLineItem,
    Agreement,
    AgreementAgency,
    AgreementReason,
    AgreementType,
    BudgetLineItem,
    BudgetLineItemStatus,
    ChangeRequestType,
    ContractAgreement,
    ContractBudgetLineItem,
    ProcurementShop,
    ProcurementShopFee,
    ProductServiceCode,
    Project,
    ServiceRequirementType,
    ServicesComponent,
    User,
)
from sqlalchemy import func, select
from sqlalchemy_continuum import parent_class, version_class


@pytest.fixture()
def test_bli_new(loaded_db, test_can):
    bli = ContractBudgetLineItem(
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
    bli = ContractBudgetLineItem(
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
    bli = ContractBudgetLineItem(
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
    bli = ContractBudgetLineItem(
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
    bli = ContractBudgetLineItem(
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
    bli = ContractBudgetLineItem(
        line_description="Grant Expenditure GA999",
        agreement_id=1,
        can_id=test_can.id,
        amount=850450.00,
        status=BudgetLineItemStatus.PLANNED,
    )
    assert bli.to_dict()["status"] == "PLANNED"


def test_get_budget_line_items_list(auth_client, loaded_db):
    count = len(loaded_db.execute(select(BudgetLineItem)).all())
    response = auth_client.get("/api/v1/budget-line-items/?enable_obe=True")
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
def test_get_budget_line_items_list_by_can(auth_client, loaded_db):
    response = auth_client.get(
        url_for("api.budget-line-items-group"),
        query_string={"can_id": 500, "enable_obe": True},
    )
    assert response.status_code == 200
    result = loaded_db.scalars(
        select(BudgetLineItem).where(BudgetLineItem.can_id == 500)
    ).all()
    assert len(response.json) == len(result)
    for item in response.json:
        assert item["can_id"] == 500


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_get_budget_line_items_list_by_agreement(auth_client, loaded_db):
    response = auth_client.get(
        url_for("api.budget-line-items-group"),
        query_string={"agreement_id": 1, "enable_obe": True},
    )
    assert response.status_code == 200

    result = loaded_db.scalars(
        select(BudgetLineItem).where(BudgetLineItem.agreement_id == 1)
    ).all()
    assert len(response.json) == len(result)

    for item in response.json:
        assert item["agreement_id"] == 1


def test_get_budget_line_items_auth_required(client):
    response = client.get("/api/v1/budget-line-items/")
    assert response.status_code == 401


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_get_budget_line_items_list_by_status(auth_client, loaded_db):
    response = auth_client.get(
        url_for("api.budget-line-items-group"), query_string={"status": "IN_EXECUTION"}
    )
    assert response.status_code == 200

    result = loaded_db.scalars(
        select(BudgetLineItem).where(BudgetLineItem.status == "IN_EXECUTION")
    ).all()
    assert len(response.json) == len(result)

    for item in response.json:
        assert item["status"] == "IN_EXECUTION"


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
    bli = loaded_db.get(ContractBudgetLineItem, response.json["id"])
    loaded_db.delete(bli)
    loaded_db.commit()


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
def test_post_budget_line_items_missing_optional_comments(
    loaded_db, auth_client, test_can
):
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
    bli = loaded_db.get(ContractBudgetLineItem, response.json["id"])
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
    assert response.status_code == 404


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
    bli = loaded_db.get(ContractBudgetLineItem, response.json["id"])
    loaded_db.delete(bli)
    loaded_db.commit()


@pytest.mark.usefixtures("app_ctx")
def test_put_budget_line_items(auth_client, test_bli_new):
    data = {
        "line_description": "Updated LI 1",
        "comments": "hah hah",
        "agreement_id": 1,
        "can_id": 501,
        "amount": 200.24,
        "date_needed": "2044-01-01",
        "status": "DRAFT",
    }
    response = auth_client.put(
        url_for("api.budget-line-items-item", id=test_bli_new.id), json=data
    )
    assert response.status_code == 200
    assert response.json["line_description"] == "Updated LI 1"
    assert response.json["id"] == test_bli_new.id
    assert response.json["comments"] == "hah hah"
    assert response.json["agreement_id"] == 1
    assert response.json["can_id"] == 501
    assert response.json["amount"] == 200.24
    assert response.json["status"] == "DRAFT"
    assert response.json["date_needed"] == "2044-01-01"
    assert response.json["created_on"] != response.json["updated_on"]


@pytest.mark.usefixtures("app_ctx")
def test_put_budget_line_items_cannot_change_agreement(auth_client, test_bli_new):
    data = {
        "agreement_id": 2,
    }
    response = auth_client.put(
        url_for("api.budget-line-items-item", id=test_bli_new.id), json=data
    )
    assert response.status_code == 400


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_put_budget_line_items_minimum(auth_client, loaded_db, test_can):
    bli = ContractBudgetLineItem(
        id=1000,
        line_description="LI 1",
        comments="blah blah",
        agreement_id=1,
        can_id=test_can.id,
        amount=100.12,
        status=BudgetLineItemStatus.DRAFT,
        date_needed=datetime.date(2043, 1, 1),
        created_by=1,
    )
    loaded_db.add(bli)
    loaded_db.commit()

    data = {"line_description": "Updated LI 1", "agreement_id": 1, "status": "DRAFT"}

    response = auth_client.put(
        url_for("api.budget-line-items-item", id=1000), json=data
    )

    assert response.status_code == 200
    assert response.json["line_description"] == "Updated LI 1"
    assert response.json["id"] == 1000
    assert response.json["agreement_id"] == 1
    assert response.json["status"] == "DRAFT"
    assert response.json["comments"] is None
    assert response.json["can_id"] is None
    assert response.json["amount"] is None
    assert response.json["date_needed"] is None
    assert response.json["created_on"] != response.json["updated_on"]

    # cleanup
    loaded_db.delete(bli)
    loaded_db.commit()


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_put_budget_line_items_bad_status(auth_client, loaded_db, test_can):
    bli = ContractBudgetLineItem(
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
    bli = ContractBudgetLineItem(
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

    loaded_db.add(bli)
    loaded_db.commit()

    data = {"date_needed": "blah blah", "agreement_id": 1, "status": "DRAFT"}
    response = auth_client.put("/api/v1/budget-line-items/1000", json=data)
    assert response.status_code == 400

    # cleanup
    loaded_db.delete(bli)
    loaded_db.commit()


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_put_budget_line_items_bad_can(auth_client, test_bli_new):
    data = {"can_id": 1000000, "agreement_id": 1, "status": "DRAFT"}
    response = auth_client.put(
        f"/api/v1/budget-line-items/{test_bli_new.id}", json=data
    )
    assert response.status_code == 404


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
    assert response.status_code == 404


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_patch_budget_line_items(auth_client, loaded_db, test_can):
    # TODO: setting the services_component_id is not working on create
    bli = ContractBudgetLineItem(
        line_description="LI 1",
        comments="blah blah",
        agreement_id=1,
        can_id=test_can.id,
        amount=100.12,
        status=BudgetLineItemStatus.DRAFT,
        date_needed=datetime.date(2043, 1, 1),
        created_by=1,
    )

    loaded_db.add(bli)
    loaded_db.commit()

    data = {
        "line_description": "Updated LI 1",
        "comments": "hah hah",
        "agreement_id": 1,
        "can_id": 501,
        "amount": 200.24,
        "date_needed": "2044-01-01",
        "services_component_id": 2,
    }

    response = auth_client.patch(
        url_for("api.budget-line-items-item", id=bli.id), json=data
    )

    assert response.status_code == 200
    assert response.json["line_description"] == "Updated LI 1"
    assert response.json["id"] == bli.id
    assert response.json["comments"] == "hah hah"
    assert response.json["agreement_id"] == 1
    assert response.json["can_id"] == 501
    assert response.json["amount"] == 200.24
    assert response.json["status"] == "DRAFT"
    assert response.json["date_needed"] == "2044-01-01"
    assert response.json["created_on"] != response.json["updated_on"]
    assert response.json["services_component_id"] == 2

    # cleanup
    loaded_db.delete(bli)
    loaded_db.commit()


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_patch_budget_line_items_update_two_attributes(
    auth_client, loaded_db, test_can
):
    bli = ContractBudgetLineItem(
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

    loaded_db.add(bli)
    loaded_db.commit()

    data = {
        "line_description": "Updated LI 1",
        "comments": "hah hah",
    }

    response = auth_client.patch(
        url_for("api.budget-line-items-item", id=1000), json=data
    )

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

    # cleanup
    loaded_db.delete(bli)
    loaded_db.commit()


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_patch_budget_line_items_auth_required(client):
    response = client.patch("/api/v1/budget-line-items/1", json={})
    assert response.status_code == 401


@pytest.mark.usefixtures("app_ctx")
def test_patch_budget_line_items_bad_status(
    auth_client, loaded_db, test_can, test_bli_new
):
    data = {
        "line_description": "LI 1",
        "comments": "blah blah",
        "agreement_id": 1,
        "can_id": test_can.id,
        "amount": 100.12,
        "status": "blah blah",
        "date_needed": "2043-01-01",
    }
    response = auth_client.patch(
        f"/api/v1/budget-line-items/{test_bli_new.id}", json=data
    )
    assert response.status_code == 400


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_patch_budget_line_items_empty_data(auth_client, test_bli):
    response = auth_client.patch(f"/api/v1/budget-line-items/{test_bli.id}", json={})
    assert response.status_code == 200


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_patch_budget_line_items_invalid_can(auth_client, test_bli_new):
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
    response = auth_client.patch(
        f"/api/v1/budget-line-items/{test_bli_new.id}", json=data
    )
    assert response.status_code == 404


@pytest.mark.skip(
    "Status change (from DRAFT to PLANNED) is not allowed as direct edit. Replace/rework this test."
)
@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_patch_budget_line_items_update_status(auth_client, loaded_db, test_can):
    bli = ContractBudgetLineItem(
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
    bli = ContractBudgetLineItem(
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
        version_class(ContractBudgetLineItem)
        parent_class(version_class(ContractBudgetLineItem))

        # initial version is 0
        assert bli.versions[0].line_description == "LI 1"

        # update the line description
        bli.line_description = "Updated LI 1"
        loaded_db.commit()

        # new version is 1
        assert bli.versions[1].line_description == "Updated LI 1"

        # SQL pulls back latest version (1 in this case)
        updated_bli = loaded_db.get(ContractBudgetLineItem, bli.id)
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
def test_put_budget_line_item_portfolio_id_ignored(
    auth_client, loaded_db, test_bli_new
):
    data = {
        "line_description": "Updated LI 1",
        "comments": "hah hah",
        "agreement_id": 1,
        "can_id": 501,
        "amount": 200.24,
        "date_needed": "2044-01-01",
        "proc_shop_fee_percentage": 2.34,
        "status": "DRAFT",
    }
    request_data = data | {"portfolio_id": 10000}
    response = auth_client.put(
        f"/api/v1/budget-line-items/{test_bli_new.id}", json=request_data
    )
    assert response.status_code == 200, "portfolio_id should be ignored"


@pytest.mark.usefixtures("app_ctx")
def test_budget_line_item_fiscal_year(
    loaded_db,
    test_bli_new,
    test_bli_new_previous_year,
    test_bli_new_previous_fiscal_year,
):
    assert (
        test_bli_new.fiscal_year == test_bli_new.date_needed.year
    ), "test_bli_new.date_needed == 2043-01-01"
    assert (
        test_bli_new_previous_year.fiscal_year
        == test_bli_new_previous_year.date_needed.year + 1
    ), "test_bli_new_previous_year.date_needed == 2042-10-01"
    assert (
        test_bli_new_previous_fiscal_year.fiscal_year
        == test_bli_new_previous_fiscal_year.date_needed.year
    ), "test_bli_new_previous_fiscal_year.date_needed == 2042-09-01"


@pytest.mark.usefixtures("app_ctx")
def test_budget_line_item_portfolio_id_null(
    auth_client, loaded_db, test_bli_new_no_can
):
    assert test_bli_new_no_can.portfolio_id is None
    response = auth_client.get(f"/api/v1/budget-line-items/{test_bli_new_no_can.id}")
    assert response.status_code == 200
    assert response.json["portfolio_id"] is None


@pytest.mark.usefixtures("app_ctx")
def test_budget_line_item_fiscal_year_null(
    auth_client, loaded_db, test_bli_new_no_need_by_date
):
    assert test_bli_new_no_need_by_date.fiscal_year is None
    response = auth_client.get(
        f"/api/v1/budget-line-items/{test_bli_new_no_need_by_date.id}"
    )
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
    response = auth_client.patch(
        f"/api/v1/budget-line-items/{test_bli_new.id}", json=data
    )
    assert response.status_code == 200


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_patch_budget_line_items_with_null_date_needed(auth_client, test_bli_new):
    response = auth_client.patch(
        f"/api/v1/budget-line-items/{test_bli_new.id}", json={"date_needed": None}
    )
    assert response.status_code == 200
    assert response.json["date_needed"] is None


@pytest.mark.usefixtures("app_ctx")
def test_valid_services_component(auth_client, loaded_db, test_bli_new):
    sc = ServicesComponent(agreement_id=6, number=1, optional=False)
    loaded_db.add(sc)
    loaded_db.commit()

    assert sc.id is not None
    new_sc_id = sc.id
    assert sc.agreement_id == 6

    data = {"services_component_id": new_sc_id}

    response = auth_client.patch(
        f"/api/v1/budget-line-items/{test_bli_new.id}", json=data
    )
    assert response.status_code == 400
    assert response.json["message"] == "Validation failed"

    sc.agreement_id = 1
    loaded_db.add(sc)
    loaded_db.commit()

    response = auth_client.patch(
        f"/api/v1/budget-line-items/{test_bli_new.id}", json=data
    )
    assert response.status_code == 200

    loaded_db.delete(sc)
    loaded_db.commit()


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_delete_budget_line_items(auth_client, loaded_db, test_can):
    bli = ContractBudgetLineItem(
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

    sc: ContractBudgetLineItem = loaded_db.get(ContractBudgetLineItem, new_bli_id)
    assert not sc


def test_budget_line_item_validation_create_invalid(
    auth_client, app, test_can, test_project
):
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

    #  create valid BLI (using API)
    data = data | {
        "agreement_id": agreement_id,
        "can_id": test_can.id,
        "amount": 111.11,
        "date_needed": "2044-01-01",
    }
    resp = auth_client.post("/api/v1/budget-line-items/", json=data)
    assert resp.status_code == 201
    assert "id" in resp.json
    bli_id = resp.json["id"]

    # cleanup
    bli = session.get(ContractBudgetLineItem, bli_id)
    session.delete(bli)
    agreement = session.get(Agreement, agreement_id)
    session.delete(agreement)
    session.commit()


@pytest.mark.usefixtures("app_ctx")
def test_budget_line_item_validation_patch_to_invalid(
    auth_client, app, test_can, test_project
):
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

    #  create BLI
    new_bli = ContractBudgetLineItem(
        line_description="Test Experiments Workflows BLI",
        agreement_id=agreement_id,
        status=BudgetLineItemStatus.PLANNED,
        can_id=test_can.id,
        amount=111.11,
        date_needed=datetime.date(2044, 1, 1),
    )
    session.add(new_bli)
    session.commit()

    # update BLI with invalid data (for PLANNED status)
    data = {
        "amount": None,
        "date_needed": None,
    }
    resp = auth_client.patch(f"/api/v1/budget-line-items/{new_bli.id}", json=data)
    assert resp.status_code == 400
    assert resp.json["message"] == "Validation failed"

    # cleanup
    session.delete(new_bli)
    agreement = session.get(Agreement, agreement_id)
    session.delete(agreement)
    session.commit()


@pytest.mark.usefixtures("app_ctx")
def test_budget_line_item_validation_patch_to_zero_or_negative_amount(
    auth_client, app, test_can, test_project
):
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

    #  create BLI
    new_bli = ContractBudgetLineItem(
        line_description="Test Experiments Workflows BLI",
        agreement_id=agreement_id,
        status=BudgetLineItemStatus.PLANNED,
        can_id=test_can.id,
        amount=111.11,
        date_needed=datetime.date(2044, 1, 1),
    )
    session.add(new_bli)
    session.commit()

    # update BLI with zero amount, expect 400 (rejection)
    data = {
        "amount": 0,
    }
    resp = auth_client.patch(f"/api/v1/budget-line-items/{new_bli.id}", json=data)
    assert resp.status_code == 400
    assert resp.json["message"] == "Validation failed"

    # update BLI with negative amount, expect 400 (rejection)
    data = {
        "amount": -222.22,
    }
    resp = auth_client.patch(f"/api/v1/budget-line-items/{new_bli.id}", json=data)
    assert resp.status_code == 400
    assert resp.json["message"] == "Validation failed"

    # cleanup
    session.delete(new_bli)
    agreement = session.get(Agreement, agreement_id)
    session.delete(agreement)
    session.commit()


@pytest.mark.usefixtures("app_ctx")
def test_budget_line_item_validation_patch_to_invalid_date(
    auth_client, app, test_can, test_project
):
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

    #  create BLI
    new_bli = ContractBudgetLineItem(
        line_description="Test Experiments Workflows BLI",
        agreement_id=agreement_id,
        status=BudgetLineItemStatus.PLANNED,
        can_id=test_can.id,
        amount=111.11,
        date_needed=datetime.date(2044, 1, 1),
    )
    session.add(new_bli)
    session.commit()

    # update BLI with invalid data (in the past), expect 400 (rejection)
    data = {
        "date_needed": "1900-01-01",
    }
    resp = auth_client.patch(f"/api/v1/budget-line-items/{new_bli.id}", json=data)
    assert resp.status_code == 400
    assert resp.json["message"] == "Validation failed"

    # cleanup
    session.delete(new_bli)
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
def test_patch_budget_line_items_invalid_user_change_request(
    basic_user_auth_client, test_bli
):
    data = {
        "status": "PLANNED",
    }
    response = basic_user_auth_client.patch(
        f"/api/v1/budget-line-items/{test_bli.id}", json=data
    )
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


@pytest.mark.usefixtures("app_ctx")
def test_budget_line_items_get_all_by_fiscal_year(auth_client, loaded_db):
    # determine how many blis in the DB are in fiscal year 2044
    stmt = (
        select(BudgetLineItem.id).distinct().where(BudgetLineItem.fiscal_year == 2044)
    )
    blis = loaded_db.scalars(stmt).all()
    assert len(blis) > 0

    response = auth_client.get(
        url_for("api.budget-line-items-group"),
        query_string={"fiscal_year": 2044, "limit": 1, "offset": 0},
    )
    assert response.status_code == 200
    assert response.json[0]["_meta"]["total_count"] == len(blis)

    # determine how many blis in the DB are in fiscal year 2000
    stmt = (
        select(BudgetLineItem.id).distinct().where(BudgetLineItem.fiscal_year == 2000)
    )
    blis = loaded_db.scalars(stmt).all()
    assert len(blis) == 0
    response = auth_client.get(
        url_for("api.budget-line-items-group"), query_string={"fiscal_year": 2000}
    )
    assert response.status_code == 200
    assert len(response.json) == 0

    # determine how many blis in the DB are in fiscal year 2043 or 2044
    blis = []
    stmt = select(BudgetLineItem).distinct().where(BudgetLineItem.fiscal_year == 2043)
    blis.extend(loaded_db.scalars(stmt).all())
    stmt = select(BudgetLineItem).distinct().where(BudgetLineItem.fiscal_year == 2044)
    blis.extend(loaded_db.scalars(stmt).all())
    # remove duplicate bli objects from bli list
    set_of_blis = set(blis)
    assert len(set_of_blis) > 0

    response = auth_client.get(
        url_for("api.budget-line-items-group")
        + "?fiscal_year=2043&fiscal_year=2044&limit=1&offset=0"
    )
    assert response.status_code == 200
    assert response.json[0]["_meta"]["total_count"] == len(set_of_blis)


@pytest.mark.usefixtures("app_ctx")
def test_budget_line_items_get_all_by_budget_line_status(auth_client, loaded_db):
    # determine how many blis in the DB are in budget line status "DRAFT"
    stmt = (
        select(BudgetLineItem)
        .distinct()
        .where(BudgetLineItem.status == BudgetLineItemStatus.DRAFT.name)
    )
    blis = loaded_db.scalars(stmt).all()
    assert len(blis) > 0

    response = auth_client.get(
        url_for("api.budget-line-items-group"),
        query_string={
            "budget_line_status": BudgetLineItemStatus.DRAFT.name,
            "enable_obe": True,
        },
    )
    assert response.status_code == 200
    assert len(response.json) == len(blis)

    # determine how many blis in the DB are in budget line status "OBLIGATED"
    stmt = (
        select(BudgetLineItem)
        .distinct()
        .where(BudgetLineItem.status == BudgetLineItemStatus.OBLIGATED.name)
    )
    blis = loaded_db.scalars(stmt).all()
    assert len(blis) > 0
    response = auth_client.get(
        url_for("api.budget-line-items-group"),
        query_string={
            "budget_line_status": BudgetLineItemStatus.OBLIGATED.name,
            "enable_obe": True,
        },
    )
    assert response.status_code == 200
    assert len(response.json) == len(blis)


@pytest.mark.usefixtures("app_ctx")
def test_budget_line_items_get_all_by_portfolio(auth_client, loaded_db):
    # determine how many blis in the DB are in portfolio 1
    stmt = select(BudgetLineItem).where(BudgetLineItem.portfolio_id == 1)
    blis = loaded_db.scalars(stmt).all()
    assert len(blis) > 0

    response = auth_client.get(
        url_for("api.budget-line-items-group"), query_string={"portfolio": 1}
    )
    assert response.status_code == 200
    assert len(response.json) == len(blis)

    # determine how many agreements in the DB are in portfolio 1000
    stmt = select(BudgetLineItem).where(BudgetLineItem.portfolio_id == 1000)
    blis = loaded_db.scalars(stmt).all()
    assert len(blis) == 0
    response = auth_client.get(
        url_for("api.budget-line-items-group"), query_string={"portfolio": 1000}
    )
    assert response.status_code == 200
    assert len(response.json) == 0


def test_get_budget_line_items_list_with_pagination_without_obe(auth_client, loaded_db):
    response = auth_client.get(
        url_for("api.budget-line-items-group"), query_string={"limit": 5, "offset": 0}
    )
    assert response.status_code == 200
    assert len(response.json) == 5
    assert response.json[0]["_meta"]["limit"] == 5
    assert response.json[0]["_meta"]["offset"] == 0
    assert response.json[0]["_meta"]["number_of_pages"] == 208
    assert response.json[0]["_meta"]["total_count"] == 1037

    response = auth_client.get(
        url_for("api.budget-line-items-group"), query_string={"limit": 5, "offset": 5}
    )
    assert response.status_code == 200
    assert len(response.json) == 5
    assert response.json[0]["_meta"]["limit"] == 5
    assert response.json[0]["_meta"]["offset"] == 5
    assert response.json[0]["_meta"]["number_of_pages"] == 208
    assert response.json[0]["_meta"]["total_count"] == 1037

    response = auth_client.get(
        url_for("api.budget-line-items-group"),
        query_string={"limit": 1, "offset": 0, "portfolio": 1},
    )
    assert response.status_code == 200
    assert len(response.json) == 1
    assert response.json[0]["portfolio_id"] == 1
    assert response.json[0]["_meta"]["limit"] == 1
    assert response.json[0]["_meta"]["offset"] == 0
    assert response.json[0]["_meta"]["number_of_pages"] == 157
    assert response.json[0]["_meta"]["total_count"] == 157
    assert (
        response.json[0]["_meta"]["query_parameters"]
        == "{'portfolio': [1], 'limit': [1], 'offset': [0], 'enable_obe': [False]}"
    )


def test_get_budget_line_items_list_meta(auth_client, loaded_db):
    response = auth_client.get("/api/v1/budget-line-items/?enable_obe=True")
    assert response.status_code == 200

    meta = response.json[0]["_meta"]
    assert meta["limit"] is None
    assert meta["offset"] is None
    assert meta["number_of_pages"] == 1

    stmt = select(func.count(BudgetLineItem.id))
    count = loaded_db.execute(stmt).scalar()
    assert meta["total_count"] == count

    stmt = select(func.sum(BudgetLineItem.amount))
    total_amount = loaded_db.execute(stmt).scalar()
    assert meta["total_amount"] == float(total_amount)

    stmt = select(func.sum(BudgetLineItem.amount)).where(
        BudgetLineItem.status == BudgetLineItemStatus.DRAFT.name
    )
    total_draft_amount = loaded_db.execute(stmt).scalar()
    assert meta["total_draft_amount"] == float(total_draft_amount)

    stmt = select(func.sum(BudgetLineItem.amount)).where(
        BudgetLineItem.status == BudgetLineItemStatus.PLANNED.name
    )
    total_planned_amount = loaded_db.execute(stmt).scalar()
    assert meta["total_planned_amount"] == float(total_planned_amount)

    stmt = select(func.sum(BudgetLineItem.amount)).where(
        BudgetLineItem.status == BudgetLineItemStatus.OBLIGATED.name
    )
    total_obligated_amount = loaded_db.execute(stmt).scalar()
    assert meta["total_obligated_amount"] == float(total_obligated_amount)

    stmt = select(func.sum(BudgetLineItem.amount)).where(
        BudgetLineItem.status == BudgetLineItemStatus.IN_EXECUTION.name
    )
    total_in_execution_amount = loaded_db.execute(stmt).scalar()
    assert meta["total_in_execution_amount"] == float(total_in_execution_amount)

    # also test with query params
    response = auth_client.get(
        url_for("api.budget-line-items-group"),
        query_string={"limit": 5, "offset": 0, "portfolio": 1},
    )

    assert response.status_code == 200
    assert len(response.json) == 5
    assert response.json[0]["portfolio_id"] == 1

    meta = response.json[0]["_meta"]

    assert meta["limit"] == 5
    assert meta["offset"] == 0
    assert meta["number_of_pages"] == 32

    stmt = select(func.count(BudgetLineItem.id)).where(BudgetLineItem.portfolio_id == 1)
    count = loaded_db.execute(stmt).scalar()
    assert meta["total_count"] == count

    stmt = select(func.sum(BudgetLineItem.amount)).where(
        BudgetLineItem.portfolio_id == 1
    )
    total_amount = loaded_db.execute(stmt).scalar()
    assert meta["total_amount"] == float(total_amount)

    stmt = (
        select(func.sum(BudgetLineItem.amount))
        .where(BudgetLineItem.status == BudgetLineItemStatus.DRAFT.name)
        .where(BudgetLineItem.portfolio_id == 1)
    )
    total_draft_amount = loaded_db.execute(stmt).scalar()
    assert meta["total_draft_amount"] == float(total_draft_amount)

    stmt = (
        select(func.sum(BudgetLineItem.amount))
        .where(BudgetLineItem.status == BudgetLineItemStatus.PLANNED.name)
        .where(BudgetLineItem.portfolio_id == 1)
    )
    total_planned_amount = loaded_db.execute(stmt).scalar()
    assert meta["total_planned_amount"] == float(total_planned_amount)

    stmt = (
        select(func.sum(BudgetLineItem.amount))
        .where(BudgetLineItem.status == BudgetLineItemStatus.OBLIGATED.name)
        .where(BudgetLineItem.portfolio_id == 1)
    )
    total_obligated_amount = loaded_db.execute(stmt).scalar()
    assert meta["total_obligated_amount"] == float(total_obligated_amount)

    stmt = (
        select(func.sum(BudgetLineItem.amount))
        .where(BudgetLineItem.status == BudgetLineItemStatus.IN_EXECUTION.name)
        .where(BudgetLineItem.portfolio_id == 1)
    )
    total_in_execution_amount = loaded_db.execute(stmt).scalar()
    assert meta["total_in_execution_amount"] == float(total_in_execution_amount)


@pytest.mark.usefixtures("app_ctx")
def test_budget_line_items_get_all_only_my(
    basic_user_auth_client, budget_team_auth_client, loaded_db
):
    response = basic_user_auth_client.get(
        url_for("api.budget-line-items-group"),
        query_string={"only_my": False, "limit": 10, "offset": 0},
    )
    assert response.status_code == 200
    all_count = len(response.json)

    # basic user should not be able to see any BLIs
    response = basic_user_auth_client.get(
        url_for("api.budget-line-items-group"),
        query_string={
            "only_my": True,
            "limit": 10,
            "offset": 0,
        },
    )
    assert response.status_code == 200
    only_my_count = len(response.json)

    assert only_my_count < all_count

    # budget team user should see all BLIs
    response = budget_team_auth_client.get(
        url_for("api.budget-line-items-group"),
        query_string={
            "only_my": True,
            "limit": 10,
            "offset": 0,
        },
    )
    assert response.status_code == 200
    only_my_count = len(response.json)

    assert only_my_count == all_count

    # test pagination still works
    response = budget_team_auth_client.get(
        url_for("api.budget-line-items-group"),
        query_string={"only_my": True, "limit": 5, "offset": 0},
    )
    assert response.status_code == 200
    assert len(response.json) == 5

    response = budget_team_auth_client.get(
        url_for("api.budget-line-items-group"),
        query_string={"only_my": False, "limit": 5, "offset": 0},
    )
    assert response.status_code == 200
    assert len(response.json) == 5


def test_budget_line_items_fees(auth_client, loaded_db, test_bli_new):
    assert test_bli_new.amount == Decimal("100.12")
    assert test_bli_new.procurement_shop_fee_id is None
    assert test_bli_new.agreement is not None
    assert test_bli_new.agreement.procurement_shop is not None
    fee_rate = test_bli_new.agreement.procurement_shop.current_fee.fee
    assert fee_rate == Decimal("0.0000")
    assert test_bli_new.fees == fee_rate / Decimal("100") * test_bli_new.amount
    assert test_bli_new.fees == Decimal("0.0000")

    # test using a SQL query
    stmt = (
        select(BudgetLineItem)
        .where(BudgetLineItem.id == test_bli_new.id)
        .where(BudgetLineItem.fees == test_bli_new.fees)
    )
    bli = loaded_db.execute(stmt).scalar_one()
    assert bli == test_bli_new


@pytest.fixture()
def test_bli_without_amount(loaded_db, test_can):
    bli = ContractBudgetLineItem(
        line_description="LI 1",
        comments="blah blah",
        agreement_id=1,
        can_id=test_can.id,
        amount=None,
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


def test_budget_line_items_fees_querystring(
    auth_client, loaded_db, test_bli_without_amount
):
    # test using a query string
    response = auth_client.get(
        url_for("api.budget-line-items-group"),
        query_string={"include_fees": False, "limit": 1, "offset": 0},
    )
    assert response.status_code == 200
    assert len(response.json) > 0

    meta_with_no_fees = response.json[0]["_meta"]

    response = auth_client.get(
        url_for("api.budget-line-items-group"),
        query_string={"include_fees": True, "limit": 1, "offset": 0},
    )
    assert response.status_code == 200
    assert len(response.json) > 0

    meta_with_fees = response.json[0]["_meta"]

    assert meta_with_no_fees["total_amount"] < meta_with_fees["total_amount"]
    assert (
        meta_with_no_fees["total_draft_amount"] < meta_with_fees["total_draft_amount"]
    )
    assert (
        meta_with_no_fees["total_planned_amount"]
        < meta_with_fees["total_planned_amount"]
    )
    assert (
        meta_with_no_fees["total_obligated_amount"]
        < meta_with_fees["total_obligated_amount"]
    )
    assert (
        meta_with_no_fees["total_in_execution_amount"]
        < meta_with_fees["total_in_execution_amount"]
    )


def test_budget_line_items_correct_number_of_pages(auth_client, loaded_db):
    stmt = (
        select(BudgetLineItem)
        .distinct()
        .where(BudgetLineItem.fiscal_year == 2044)
        .where(BudgetLineItem.portfolio_id == 8)
    )
    blis = loaded_db.scalars(stmt).all()
    total_count = len(blis)
    assert total_count == 15

    response = auth_client.get(
        url_for("api.budget-line-items-group"),
        query_string={"fiscal_year": 2044, "portfolio": 8, "limit": 10, "offset": 0},
    )

    assert response.status_code == 200
    assert response.json[0]["_meta"]["number_of_pages"] == 2

    response = auth_client.get(
        url_for("api.budget-line-items-group"),
        query_string={"fiscal_year": 2044, "portfolio": 8, "limit": 15, "offset": 0},
    )

    assert response.status_code == 200
    assert response.json[0]["_meta"]["number_of_pages"] == 1

    response = auth_client.get(
        url_for("api.budget-line-items-group"),
        query_string={"fiscal_year": 2044, "portfolio": 8, "limit": 2, "offset": 0},
    )

    assert response.status_code == 200
    assert response.json[0]["_meta"]["number_of_pages"] == 8


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_get_budget_line_items_list_by_id_with_meta(auth_client, test_bli):
    response = auth_client.get(f"/api/v1/budget-line-items/{test_bli.id}")
    assert response.status_code == 200
    assert response.json["_meta"]["isEditable"] is True


def test_get_budget_line_items_list_with_meta(auth_client, loaded_db):
    response = auth_client.get("/api/v1/budget-line-items/")
    assert response.status_code == 200

    # test an agreement
    data = response.json
    for item in data:
        assert "_meta" in item

    assert any(item["_meta"]["isEditable"] for item in data)


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_get_budget_line_items_filter_options(system_owner_auth_client):
    response = system_owner_auth_client.get(
        "/api/v1/budget-line-items-filters/?only_my=True&enable_obe=True"
    )
    assert response.status_code == 200
    assert len(response.json) > 0

    print(response.json)

    # check for the presence of specific filter options
    assert response.json == {
        "fiscal_years": [2045, 2044, 2043, 2022],
        "portfolios": [
            {"id": 3, "name": "Child Care Research"},
            {"id": 1, "name": "Child Welfare Research"},
            {"id": 2, "name": "Head Start Research"},
            {"id": 6, "name": "Healthy Marriage & Responsible Fatherhood Research"},
            {"id": 8, "name": "OCDO Portfolio"},
            {"id": 9, "name": "OD Portfolio"},
            {"id": 4, "name": "Welfare Research"},
        ],
        "statuses": [
            "DRAFT",
            "PLANNED",
            "IN_EXECUTION",
            "OBLIGATED",
            "Overcome by Events",
        ],
    }


def test_get_budget_line_items_filter_options_no_permission(no_perms_auth_client):
    response = no_perms_auth_client.get("/api/v1/budget-line-items-filters/")
    assert response.status_code == 403


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_get_budget_line_items_includes_fee(auth_client, test_bli_new):
    response = auth_client.get("/api/v1/budget-line-items/")
    assert response.status_code == 200
    assert isinstance(response.json, list)
    assert "fees" in response.json[0]
    assert isinstance(response.json[0]["fees"], float)


@pytest.mark.usefixtures("app_ctx")
def test_get_budget_line_item_by_id_includes_fee(auth_client, test_bli_new):
    response = auth_client.get(f"/api/v1/budget-line-items/{test_bli_new.id}")
    assert response.status_code == 200
    assert "fees" in response.json
    assert isinstance(response.json["fees"], float)


@pytest.mark.usefixtures("app_ctx")
def test_budget_line_item_fee_calculation(auth_client, loaded_db, test_bli_new):
    # Create a Procurement Shop
    procurement_shop = ProcurementShop(
        name="test bli fees with set procurement shop",
        abbr="fwpr",
    )
    loaded_db.add(procurement_shop)
    loaded_db.commit()

    # Create a Procurement Shop Fee
    procurement_shop_fee = ProcurementShopFee(
        fee=Decimal("0.736"), procurement_shop_id=procurement_shop.id
    )
    loaded_db.add(procurement_shop_fee)
    loaded_db.commit()

    # Create a new test agreement with a procurement shop fee
    agreement = ContractAgreement(
        name="Test Contract Agreement for Fee Calculation With Set Procurement Shop",
        awarding_entity_id=procurement_shop.id,
    )
    loaded_db.add(agreement)
    loaded_db.commit()

    # Create a new Budget Line Item with the Procurement Shop Fee
    bli = ContractBudgetLineItem(
        line_description="Test BLI for Fee Calculation with set Procurement Shop",
        agreement_id=agreement.id,
        can_id=test_bli_new.can_id,
        amount=250025.50,
        status=BudgetLineItemStatus.DRAFT,
        date_needed=datetime.date(2043, 1, 1),
        procurement_shop_fee_id=procurement_shop_fee.id,
    )
    loaded_db.add(bli)
    loaded_db.commit()

    response = auth_client.get(f"/api/v1/budget-line-items/{bli.id}")

    assert response.status_code == 200
    expected_fee = (procurement_shop_fee.fee / Decimal("100")) * bli.amount

    # Convert API float response to Decimal for comparison
    actual_fee = Decimal(str(response.json["fees"]))
    assert actual_fee == expected_fee

    # Cleanup
    loaded_db.delete(procurement_shop_fee)
    loaded_db.delete(procurement_shop)
    loaded_db.delete(bli)
    loaded_db.delete(agreement)
    loaded_db.commit()

    # Verify cleanup
    assert loaded_db.get(ProcurementShop, procurement_shop.id) is None
    assert loaded_db.get(ProcurementShopFee, procurement_shop_fee.id) is None
    assert loaded_db.get(ContractBudgetLineItem, bli.id) is None
    assert loaded_db.get(ContractAgreement, agreement.id) is None


@pytest.mark.usefixtures("app_ctx")
def test_budget_line_item_fees_is_zero_when_proc_fee_is_null(auth_client, test_bli_new):
    test_bli_new.proc_shop_fee_percentage = None
    test_bli_new.amount = 100.0
    auth_client.application.db_session.commit()

    assert test_bli_new.fees == 0.00

    response = auth_client.get(f"/api/v1/budget-line-items/{test_bli_new.id}")
    assert response.status_code == 200
    assert response.json["fees"] == 0.0


@pytest.mark.usefixtures("app_ctx")
def test_budget_line_items_get_all_obe_budget_lines(auth_client, loaded_db):
    # determine how many blis in the DB are OBE"
    stmt = select(BudgetLineItem).distinct().where(BudgetLineItem.is_obe)
    blis = loaded_db.scalars(stmt).all()
    assert len(blis) > 0

    response = auth_client.get(
        url_for("api.budget-line-items-group"),
        query_string={"budget_line_status": "Overcome by Events", "enable_obe": True},
    )
    assert response.status_code == 200
    assert len(response.json) == len(blis)


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_get_obe_budget_lines(auth_client, loaded_db):
    response = auth_client.get(
        url_for("api.budget-line-items-group"),
        query_string={"status": "Overcome by Events", "enable_obe": True},
    )
    assert response.status_code == 200

    result = loaded_db.scalars(
        select(BudgetLineItem).where(BudgetLineItem.is_obe)
    ).all()
    assert len(response.json) == len(result)

    for item in response.json:
        assert item["is_obe"] is True


@pytest.mark.usefixtures("app_ctx")
def test_post_aa_budget_line_items_min(db_for_aa_agreement, auth_client, test_can):
    """
    Test creating a budget line item for an AA agreement with minimum required fields.

    N.B. Currently the only required field is `agreement_id`.
    """
    aa_agreement = AaAgreement(
        name="Test AA Agreement",
        description="Test AA Agreement Description",
        requesting_agency_id=db_for_aa_agreement.scalar(
            select(AgreementAgency.id).where(
                AgreementAgency.name == "Test Requesting Agency"
            )
        ),
        servicing_agency_id=db_for_aa_agreement.scalar(
            select(AgreementAgency.id).where(
                AgreementAgency.name == "Test Servicing Agency"
            )
        ),
        service_requirement_type=ServiceRequirementType.NON_SEVERABLE,
    )

    db_for_aa_agreement.add(aa_agreement)
    db_for_aa_agreement.commit()

    data = {
        "agreement_id": aa_agreement.id,
    }
    response = auth_client.post(url_for("api.budget-line-items-group"), json=data)
    assert response.status_code == 201
    assert response.json["agreement_id"] == aa_agreement.id
    assert response.json["status"] == "DRAFT"

    # cleanup
    bli = db_for_aa_agreement.get(AABudgetLineItem, response.json["id"])
    db_for_aa_agreement.delete(bli)
    db_for_aa_agreement.delete(aa_agreement)
    db_for_aa_agreement.commit()


@pytest.mark.usefixtures("app_ctx")
def test_post_aa_budget_line_items_max(db_for_aa_agreement, auth_client, test_can):
    """
    Test creating a budget line item for an AA agreement with all fields filled.
    """
    aa_agreement = AaAgreement(
        name="Test AA Agreement",
        description="Test AA Agreement Description",
        requesting_agency_id=db_for_aa_agreement.scalar(
            select(AgreementAgency.id).where(
                AgreementAgency.name == "Test Requesting Agency"
            )
        ),
        servicing_agency_id=db_for_aa_agreement.scalar(
            select(AgreementAgency.id).where(
                AgreementAgency.name == "Test Servicing Agency"
            )
        ),
        service_requirement_type=ServiceRequirementType.NON_SEVERABLE,
    )

    db_for_aa_agreement.add(aa_agreement)
    db_for_aa_agreement.commit()

    data = {
        "line_description": "LI 1",
        "comments": "blah blah",
        "agreement_id": aa_agreement.id,
        "can_id": test_can.id,
        "amount": 100.12,
        "date_needed": "2043-01-01",
    }
    response = auth_client.post(url_for("api.budget-line-items-group"), json=data)
    assert response.status_code == 201
    assert response.json["line_description"] == "LI 1"
    assert response.json["comments"] == "blah blah"
    assert response.json["agreement_id"] == aa_agreement.id
    assert response.json["can_id"] == test_can.id
    assert response.json["date_needed"] == "2043-01-01"
    assert response.json["amount"] == 100.12
    assert response.json["status"] == "DRAFT"

    # cleanup
    bli = db_for_aa_agreement.get(AABudgetLineItem, response.json["id"])
    db_for_aa_agreement.delete(bli)
    db_for_aa_agreement.delete(aa_agreement)
    db_for_aa_agreement.commit()


@pytest.mark.usefixtures("app_ctx")
def test_put_aa_budget_line_items_min(db_for_aa_agreement, auth_client, test_can):
    """
    Test updating a budget line item for an AA agreement with minimum required fields.
    """
    aa_agreement = AaAgreement(
        name="Test AA Agreement",
        description="Test AA Agreement Description",
        requesting_agency_id=db_for_aa_agreement.scalar(
            select(AgreementAgency.id).where(
                AgreementAgency.name == "Test Requesting Agency"
            )
        ),
        servicing_agency_id=db_for_aa_agreement.scalar(
            select(AgreementAgency.id).where(
                AgreementAgency.name == "Test Servicing Agency"
            )
        ),
        service_requirement_type=ServiceRequirementType.NON_SEVERABLE,
    )

    db_for_aa_agreement.add(aa_agreement)
    db_for_aa_agreement.commit()

    # Create a budget line item
    bli = AABudgetLineItem(
        agreement_id=aa_agreement.id,
        can_id=test_can.id,
        status=BudgetLineItemStatus.DRAFT,
    )
    db_for_aa_agreement.add(bli)
    db_for_aa_agreement.commit()

    data = {
        "agreement_id": aa_agreement.id,
        "status": BudgetLineItemStatus.DRAFT.name,
    }
    response = auth_client.put(
        url_for("api.budget-line-items-item", id=bli.id), json=data
    )
    assert response.status_code == 200
    assert response.json["agreement_id"] == aa_agreement.id
    assert response.json["status"] == "DRAFT"

    # cleanup
    db_for_aa_agreement.delete(bli)
    db_for_aa_agreement.delete(aa_agreement)
    db_for_aa_agreement.commit()


@pytest.mark.usefixtures("app_ctx")
def test_put_aa_budget_line_items_update_status(
    db_for_aa_agreement, auth_client, test_can, loaded_db
):
    """
    Test updating a budget line item status for an AA agreement.

    N.B. Currently a budget line item can only be updated to a status of "PLANNED" when it has other fields set and
    these fields cannot be changed/updated at the same time as the status.
    """
    aa_agreement = AaAgreement(
        name="Test AA Agreement",
        description="Test AA Agreement Description",
        requesting_agency_id=db_for_aa_agreement.scalar(
            select(AgreementAgency.id).where(
                AgreementAgency.name == "Test Requesting Agency"
            )
        ),
        servicing_agency_id=db_for_aa_agreement.scalar(
            select(AgreementAgency.id).where(
                AgreementAgency.name == "Test Servicing Agency"
            )
        ),
        service_requirement_type=ServiceRequirementType.NON_SEVERABLE,
        product_service_code_id=1,
        project_id=db_for_aa_agreement.scalar(
            select(Project.id).where(Project.title == "Test Project for AA Agreement")
        ),
        project_officer_id=db_for_aa_agreement.get(User, 520).id,
        agreement_reason=AgreementReason.NEW_REQ,
    )

    db_for_aa_agreement.add(aa_agreement)
    db_for_aa_agreement.commit()

    sc = ServicesComponent(
        agreement=aa_agreement,
        number=99,
        optional=False,
        description="Test SC description",
        period_start=datetime.date(2024, 1, 1),
        period_end=datetime.date(2024, 6, 30),
    )
    loaded_db.add(sc)
    loaded_db.commit()

    # Create a budget line item
    bli = AABudgetLineItem(
        agreement_id=aa_agreement.id,
        can_id=test_can.id,
        amount=100.12,
        date_needed=datetime.date(2043, 1, 1),
        services_component_id=sc.id,
    )
    db_for_aa_agreement.add(bli)
    db_for_aa_agreement.commit()

    data = {
        "agreement_id": aa_agreement.id,
        "can_id": test_can.id,
        "amount": 100.12,
        "date_needed": "2043-01-01",
        "status": BudgetLineItemStatus.PLANNED.name,
        "requestor_notes": "Test requestor notes",
        "services_component_id": sc.id,
    }
    response = auth_client.put(
        url_for("api.budget-line-items-item", id=bli.id), json=data
    )
    assert response.status_code == 202
    assert response.json["agreement_id"] == aa_agreement.id
    assert response.json["can_id"] == test_can.id
    assert response.json["date_needed"] == "2043-01-01"
    assert response.json["amount"] == 100.12
    assert response.json["status"] == "DRAFT"
    assert response.json["in_review"] is True
    assert (
        response.json["change_requests_in_review"][0]["change_request_type"]
        == "BUDGET_LINE_ITEM_CHANGE_REQUEST"
    )
    assert response.json["change_requests_in_review"][0]["requested_change_data"] == {
        "status": "PLANNED"
    }
    assert response.json["change_requests_in_review"][0]["requested_change_diff"] == {
        "status": {"new": "PLANNED", "old": "DRAFT"}
    }
    assert (
        response.json["change_requests_in_review"][0]["requestor_notes"]
        == "Test requestor notes"
    )

    # cleanup
    db_for_aa_agreement.delete(bli)
    db_for_aa_agreement.delete(aa_agreement)
    loaded_db.delete(sc)
    loaded_db.commit()
    db_for_aa_agreement.commit()


@pytest.mark.usefixtures("app_ctx")
def test_patch_aa_budget_line_items_min(db_for_aa_agreement, auth_client, test_can):
    """
    Test updating a budget line item for an AA agreement with minimum required fields.
    """
    aa_agreement = AaAgreement(
        name="Test AA Agreement",
        description="Test AA Agreement Description",
        requesting_agency_id=db_for_aa_agreement.scalar(
            select(AgreementAgency.id).where(
                AgreementAgency.name == "Test Requesting Agency"
            )
        ),
        servicing_agency_id=db_for_aa_agreement.scalar(
            select(AgreementAgency.id).where(
                AgreementAgency.name == "Test Servicing Agency"
            )
        ),
        service_requirement_type=ServiceRequirementType.NON_SEVERABLE,
    )

    db_for_aa_agreement.add(aa_agreement)
    db_for_aa_agreement.commit()

    # Create a budget line item
    bli = AABudgetLineItem(
        agreement_id=aa_agreement.id,
        can_id=test_can.id,
        status=BudgetLineItemStatus.DRAFT,
    )
    db_for_aa_agreement.add(bli)
    db_for_aa_agreement.commit()

    data = {
        "agreement_id": aa_agreement.id,
        "status": BudgetLineItemStatus.DRAFT.name,
    }
    response = auth_client.patch(
        url_for("api.budget-line-items-item", id=bli.id), json=data
    )
    assert response.status_code == 200
    assert response.json["agreement_id"] == aa_agreement.id
    assert response.json["status"] == "DRAFT"

    # cleanup
    db_for_aa_agreement.delete(bli)
    db_for_aa_agreement.delete(aa_agreement)
    db_for_aa_agreement.commit()


@pytest.mark.usefixtures("app_ctx")
def test_patch_aa_budget_line_items_update_status(
    db_for_aa_agreement, auth_client, test_can, loaded_db
):
    """
    Test updating a budget line item status for an AA agreement.

    N.B. Currently a budget line item can only be updated to a status of "PLANNED" when it has other fields set and
    these fields cannot be changed/updated at the same time as the status.
    """
    aa_agreement = AaAgreement(
        name="Test AA Agreement",
        description="Test AA Agreement Description",
        requesting_agency_id=db_for_aa_agreement.scalar(
            select(AgreementAgency.id).where(
                AgreementAgency.name == "Test Requesting Agency"
            )
        ),
        servicing_agency_id=db_for_aa_agreement.scalar(
            select(AgreementAgency.id).where(
                AgreementAgency.name == "Test Servicing Agency"
            )
        ),
        service_requirement_type=ServiceRequirementType.NON_SEVERABLE,
        product_service_code_id=1,
        project_id=db_for_aa_agreement.scalar(
            select(Project.id).where(Project.title == "Test Project for AA Agreement")
        ),
        project_officer_id=db_for_aa_agreement.get(User, 520).id,
        agreement_reason=AgreementReason.NEW_REQ,
    )

    db_for_aa_agreement.add(aa_agreement)
    db_for_aa_agreement.commit()

    sc = ServicesComponent(
        agreement=aa_agreement,
        number=99,
        optional=False,
        description="Test SC description",
        period_start=datetime.date(2024, 1, 1),
        period_end=datetime.date(2024, 6, 30),
    )
    loaded_db.add(sc)
    loaded_db.commit()

    # Create a budget line item
    bli = AABudgetLineItem(
        agreement_id=aa_agreement.id,
        can_id=test_can.id,
        amount=100.12,
        date_needed=datetime.date(2043, 1, 1),
        services_component_id=sc.id,
    )
    db_for_aa_agreement.add(bli)
    db_for_aa_agreement.commit()

    data = {
        "status": BudgetLineItemStatus.PLANNED.name,
        "requestor_notes": "Test requestor notes",
    }
    response = auth_client.patch(
        url_for("api.budget-line-items-item", id=bli.id), json=data
    )
    assert response.status_code == 202
    assert response.json["agreement_id"] == aa_agreement.id
    assert response.json["can_id"] == test_can.id
    assert response.json["date_needed"] == "2043-01-01"
    assert response.json["amount"] == 100.12
    assert response.json["status"] == "DRAFT"
    assert response.json["in_review"] is True
    assert (
        response.json["change_requests_in_review"][0]["change_request_type"]
        == "BUDGET_LINE_ITEM_CHANGE_REQUEST"
    )
    assert response.json["change_requests_in_review"][0]["requested_change_data"] == {
        "status": "PLANNED"
    }
    assert response.json["change_requests_in_review"][0]["requested_change_diff"] == {
        "status": {"new": "PLANNED", "old": "DRAFT"}
    }
    assert (
        response.json["change_requests_in_review"][0]["requestor_notes"]
        == "Test requestor notes"
    )
    # cleanup
    db_for_aa_agreement.delete(bli)
    db_for_aa_agreement.delete(aa_agreement)
    loaded_db.delete(sc)
    loaded_db.commit()
    db_for_aa_agreement.commit()


@pytest.mark.usefixtures("app_ctx")
def test_put_aa_budget_line_items_max(db_for_aa_agreement, auth_client, test_can):
    """
    Test updating a budget line item for an AA agreement with all fields filled.
    """
    aa_agreement = AaAgreement(
        name="Test AA Agreement",
        description="Test AA Agreement Description",
        requesting_agency_id=db_for_aa_agreement.scalar(
            select(AgreementAgency.id).where(
                AgreementAgency.name == "Test Requesting Agency"
            )
        ),
        servicing_agency_id=db_for_aa_agreement.scalar(
            select(AgreementAgency.id).where(
                AgreementAgency.name == "Test Servicing Agency"
            )
        ),
        service_requirement_type=ServiceRequirementType.NON_SEVERABLE,
    )

    db_for_aa_agreement.add(aa_agreement)
    db_for_aa_agreement.commit()

    # Create a budget line item
    bli = AABudgetLineItem(
        line_description="LI 1",
        comments="blah blah",
        agreement_id=aa_agreement.id,
        can_id=test_can.id,
        amount=100.12,
        status=BudgetLineItemStatus.DRAFT,
        date_needed=datetime.date(2043, 1, 1),
        proc_shop_fee_percentage=1.23,
        created_by=1,
    )
    db_for_aa_agreement.add(bli)
    db_for_aa_agreement.commit()

    data = {
        "line_description": "LI 1 updated",
        "comments": "blah blah updated",
        "agreement_id": aa_agreement.id,
        "can_id": test_can.id,
        "amount": 200.24,
        "date_needed": "2043-02-02",
        "proc_shop_fee_percentage": 2.34,
        "status": BudgetLineItemStatus.DRAFT.name,
    }
    response = auth_client.put(
        url_for("api.budget-line-items-item", id=bli.id), json=data
    )
    assert response.status_code == 200
    assert response.json["line_description"] == "LI 1 updated"
    assert response.json["comments"] == "blah blah updated"
    assert response.json["agreement_id"] == aa_agreement.id
    assert response.json["can_id"] == test_can.id
    assert response.json["date_needed"] == "2043-02-02"
    assert response.json["amount"] == 200.24
    assert response.json["proc_shop_fee_percentage"] == 2.34
    assert response.json["status"] == "DRAFT"
    assert response.json["fees"] == 0.0
    assert response.json["is_obe"] is False
    assert response.json["in_review"] is False
    assert response.json["id"] == bli.id
    assert response.json["budget_line_item_type"] == AgreementType.AA.name

    # cleanup
    db_for_aa_agreement.delete(bli)
    db_for_aa_agreement.delete(aa_agreement)
    db_for_aa_agreement.commit()


@pytest.mark.usefixtures("app_ctx")
def test_patch_aa_budget_line_items_max(db_for_aa_agreement, auth_client, test_can):
    """
    Test updating a budget line item for an AA agreement with all fields filled.
    """
    aa_agreement = AaAgreement(
        name="Test AA Agreement",
        description="Test AA Agreement Description",
        requesting_agency_id=db_for_aa_agreement.scalar(
            select(AgreementAgency.id).where(
                AgreementAgency.name == "Test Requesting Agency"
            )
        ),
        servicing_agency_id=db_for_aa_agreement.scalar(
            select(AgreementAgency.id).where(
                AgreementAgency.name == "Test Servicing Agency"
            )
        ),
        service_requirement_type=ServiceRequirementType.NON_SEVERABLE,
    )

    db_for_aa_agreement.add(aa_agreement)
    db_for_aa_agreement.commit()

    # Create a budget line item
    bli = AABudgetLineItem(
        line_description="LI 1",
        comments="blah blah",
        agreement_id=aa_agreement.id,
        can_id=test_can.id,
        amount=100.12,
        status=BudgetLineItemStatus.DRAFT,
        date_needed=datetime.date(2043, 1, 1),
        proc_shop_fee_percentage=1.23,
        created_by=1,
    )
    db_for_aa_agreement.add(bli)
    db_for_aa_agreement.commit()

    data = {
        "line_description": "LI 1 updated",
        "comments": "blah blah updated",
        "agreement_id": aa_agreement.id,
        "can_id": test_can.id,
        "amount": 200.24,
        "date_needed": "2043-02-02",
        "proc_shop_fee_percentage": 2.34,
    }
    response = auth_client.patch(
        url_for("api.budget-line-items-item", id=bli.id), json=data
    )
    assert response.status_code == 200
    assert response.json["line_description"] == "LI 1 updated"
    assert response.json["comments"] == "blah blah updated"
    assert response.json["agreement_id"] == aa_agreement.id
    assert response.json["can_id"] == test_can.id
    assert response.json["date_needed"] == "2043-02-02"
    assert response.json["amount"] == 200.24
    assert response.json["proc_shop_fee_percentage"] == 2.34
    assert response.json["status"] == "DRAFT"
    assert response.json["fees"] == 0.0
    assert response.json["is_obe"] is False
    assert response.json["in_review"] is False
    assert response.json["id"] == bli.id
    assert response.json["budget_line_item_type"] == AgreementType.AA.name

    # cleanup
    db_for_aa_agreement.delete(bli)
    db_for_aa_agreement.delete(aa_agreement)
    db_for_aa_agreement.commit()


@pytest.mark.usefixtures("app_ctx")
def test_put_aa_budget_line_items_non_draft(
    db_for_aa_agreement, auth_client, test_can, loaded_db
):
    """
    Test updating a budget line item for an AA agreement that is not in DRAFT status generates a change request.
    """
    aa_agreement = AaAgreement(
        name="Test AA Agreement",
        description="Test AA Agreement Description",
        requesting_agency_id=db_for_aa_agreement.scalar(
            select(AgreementAgency.id).where(
                AgreementAgency.name == "Test Requesting Agency"
            )
        ),
        servicing_agency_id=db_for_aa_agreement.scalar(
            select(AgreementAgency.id).where(
                AgreementAgency.name == "Test Servicing Agency"
            )
        ),
        service_requirement_type=ServiceRequirementType.NON_SEVERABLE,
        project_id=db_for_aa_agreement.scalar(
            select(Project.id).where(Project.title == "Test Project for AA Agreement")
        ),
        project_officer_id=db_for_aa_agreement.get(User, 520).id,
        agreement_reason=AgreementReason.NEW_REQ,
        product_service_code_id=1,
    )

    db_for_aa_agreement.add(aa_agreement)
    db_for_aa_agreement.commit()

    sc = ServicesComponent(
        agreement=aa_agreement,
        number=99,
        optional=False,
        description="Test SC description",
        period_start=datetime.date(2024, 1, 1),
        period_end=datetime.date(2024, 6, 30),
    )
    loaded_db.add(sc)
    loaded_db.commit()

    # Create a budget line item
    bli = AABudgetLineItem(
        line_description="LI 1",
        comments="blah blah",
        agreement_id=aa_agreement.id,
        can_id=test_can.id,
        amount=100.12,
        status=BudgetLineItemStatus.PLANNED,
        date_needed=datetime.date(2043, 1, 1),
        proc_shop_fee_percentage=1.23,
        created_by=1,
        services_component_id=sc.id,
    )
    db_for_aa_agreement.add(bli)
    db_for_aa_agreement.commit()

    data = {
        "line_description": "LI 1 updated",
        "comments": "blah blah updated",
        "agreement_id": aa_agreement.id,
        "can_id": test_can.id,
        "amount": 200.24,
        "date_needed": "2043-02-02",
        "proc_shop_fee_percentage": 2.34,
        "services_component_id": sc.id,
    }
    response = auth_client.put(
        url_for("api.budget-line-items-item", id=bli.id), json=data
    )
    assert response.status_code == 202
    assert response.json["status"] == "PLANNED"
    assert response.json["in_review"] is True
    assert len(response.json["change_requests_in_review"]) == 2
    assert (
        response.json["change_requests_in_review"][0]["change_request_type"]
        == ChangeRequestType.BUDGET_LINE_ITEM_CHANGE_REQUEST.name
    )
    assert (
        response.json["change_requests_in_review"][1]["change_request_type"]
        == ChangeRequestType.BUDGET_LINE_ITEM_CHANGE_REQUEST.name
    )
    assert any(
        "date_needed" in change_request["requested_change_data"]
        for change_request in response.json["change_requests_in_review"]
    )
    assert any(
        "amount" in change_request["requested_change_data"]
        for change_request in response.json["change_requests_in_review"]
    )

    # cleanup
    db_for_aa_agreement.delete(bli)
    db_for_aa_agreement.delete(aa_agreement)
    loaded_db.delete(sc)
    loaded_db.commit()
    db_for_aa_agreement.commit()


@pytest.mark.usefixtures("app_ctx")
def test_patch_aa_budget_line_items_non_draft(
    db_for_aa_agreement, auth_client, test_can, loaded_db
):
    """
    Test updating a budget line item for an AA agreement that is not in DRAFT status generates a change request.
    """
    aa_agreement = AaAgreement(
        name="Test AA Agreement",
        description="Test AA Agreement Description",
        requesting_agency_id=db_for_aa_agreement.scalar(
            select(AgreementAgency.id).where(
                AgreementAgency.name == "Test Requesting Agency"
            )
        ),
        servicing_agency_id=db_for_aa_agreement.scalar(
            select(AgreementAgency.id).where(
                AgreementAgency.name == "Test Servicing Agency"
            )
        ),
        service_requirement_type=ServiceRequirementType.NON_SEVERABLE,
        project_id=db_for_aa_agreement.scalar(
            select(Project.id).where(Project.title == "Test Project for AA Agreement")
        ),
        project_officer_id=db_for_aa_agreement.get(User, 520).id,
        agreement_reason=AgreementReason.NEW_REQ,
        product_service_code_id=1,
    )

    db_for_aa_agreement.add(aa_agreement)
    db_for_aa_agreement.commit()

    sc = ServicesComponent(
        agreement=aa_agreement,
        number=99,
        optional=False,
        description="Test SC description",
        period_start=datetime.date(2024, 1, 1),
        period_end=datetime.date(2024, 6, 30),
    )
    loaded_db.add(sc)
    loaded_db.commit()

    # Create a budget line item
    bli = AABudgetLineItem(
        line_description="LI 1",
        comments="blah blah",
        agreement_id=aa_agreement.id,
        can_id=test_can.id,
        amount=100.12,
        status=BudgetLineItemStatus.PLANNED,
        services_component_id=sc.id,
        date_needed=datetime.date(2043, 1, 1),
        proc_shop_fee_percentage=1.23,
        created_by=1,
    )
    db_for_aa_agreement.add(bli)
    db_for_aa_agreement.commit()

    data = {
        "amount": 200.24,
        "date_needed": "2043-02-02",
    }
    response = auth_client.patch(
        url_for("api.budget-line-items-item", id=bli.id), json=data
    )
    assert response.status_code == 202
    assert response.json["status"] == "PLANNED"
    assert response.json["in_review"] is True
    assert len(response.json["change_requests_in_review"]) == 2
    assert (
        response.json["change_requests_in_review"][0]["change_request_type"]
        == ChangeRequestType.BUDGET_LINE_ITEM_CHANGE_REQUEST.name
    )
    assert (
        response.json["change_requests_in_review"][1]["change_request_type"]
        == ChangeRequestType.BUDGET_LINE_ITEM_CHANGE_REQUEST.name
    )
    assert any(
        "date_needed" in change_request["requested_change_data"]
        for change_request in response.json["change_requests_in_review"]
    )
    assert any(
        "amount" in change_request["requested_change_data"]
        for change_request in response.json["change_requests_in_review"]
    )

    # cleanup
    db_for_aa_agreement.delete(bli)
    db_for_aa_agreement.delete(aa_agreement)
    loaded_db.delete(sc)
    loaded_db.commit()
    db_for_aa_agreement.commit()


def test_get_aa_budget_line_item_by_id(auth_client, db_for_aa_agreement, test_can):
    """
    Test retrieving a budget line item for an AA agreement by ID.
    """
    aa_agreement = AaAgreement(
        name="Test AA Agreement",
        description="Test AA Agreement Description",
        requesting_agency_id=db_for_aa_agreement.scalar(
            select(AgreementAgency.id).where(
                AgreementAgency.name == "Test Requesting Agency"
            )
        ),
        servicing_agency_id=db_for_aa_agreement.scalar(
            select(AgreementAgency.id).where(
                AgreementAgency.name == "Test Servicing Agency"
            )
        ),
        service_requirement_type=ServiceRequirementType.NON_SEVERABLE,
    )

    db_for_aa_agreement.add(aa_agreement)
    db_for_aa_agreement.commit()

    bli = AABudgetLineItem(
        agreement_id=aa_agreement.id,
        can_id=test_can.id,
        status=BudgetLineItemStatus.DRAFT,
        line_description="Test Line Item",
        comments="Test Comments",
        amount=100.00,
        date_needed=datetime.date(2043, 1, 1),
        proc_shop_fee_percentage=0.0,
    )
    db_for_aa_agreement.add(bli)
    db_for_aa_agreement.commit()

    response = auth_client.get(url_for("api.budget-line-items-item", id=bli.id))
    assert response.status_code == 200
    assert response.json["agreement_id"] == aa_agreement.id
    assert response.json["status"] == BudgetLineItemStatus.DRAFT.name
    assert response.json["can_id"] == test_can.id
    assert response.json["budget_line_item_type"] == AgreementType.AA.name
    assert response.json["line_description"] == "Test Line Item"
    assert response.json["comments"] == "Test Comments"
    assert response.json["amount"] == 100.00
    assert response.json["is_obe"] is False
    assert response.json["date_needed"] == "2043-01-01"
    assert response.json["proc_shop_fee_percentage"] == 0.0
    assert response.json["procurement_shop_fee_id"] is None

    # cleanup
    db_for_aa_agreement.delete(bli)
    db_for_aa_agreement.delete(aa_agreement)
    db_for_aa_agreement.commit()


def test_get_aa_budget_lines(auth_client, db_for_aa_agreement, test_can):
    """
    Test retrieving all budget line items for an AA agreement.
    """
    aa_agreement = AaAgreement(
        name="Test AA Agreement",
        description="Test AA Agreement Description",
        requesting_agency_id=db_for_aa_agreement.scalar(
            select(AgreementAgency.id).where(
                AgreementAgency.name == "Test Requesting Agency"
            )
        ),
        servicing_agency_id=db_for_aa_agreement.scalar(
            select(AgreementAgency.id).where(
                AgreementAgency.name == "Test Servicing Agency"
            )
        ),
        service_requirement_type=ServiceRequirementType.NON_SEVERABLE,
    )

    db_for_aa_agreement.add(aa_agreement)
    db_for_aa_agreement.commit()

    bli1 = AABudgetLineItem(
        agreement_id=aa_agreement.id,
        can_id=test_can.id,
        status=BudgetLineItemStatus.DRAFT,
        line_description="Test Line Item 1",
        comments="Test Comments 1",
        amount=100.00,
        date_needed=datetime.date(2043, 1, 1),
        proc_shop_fee_percentage=0.0,
    )

    bli2 = AABudgetLineItem(
        agreement_id=aa_agreement.id,
        can_id=test_can.id,
        status=BudgetLineItemStatus.DRAFT,
        line_description="Test Line Item 2",
        comments="Test Comments 2",
        amount=200.00,
        date_needed=datetime.date(2043, 2, 1),
        proc_shop_fee_percentage=0.0,
    )

    db_for_aa_agreement.add(bli1)
    db_for_aa_agreement.add(bli2)
    db_for_aa_agreement.commit()

    response = auth_client.get(
        url_for("api.budget-line-items-group"),
        query_string={"agreement_id": aa_agreement.id},
    )
    assert response.status_code == 200
    assert len(response.json) == 2
    assert response.json[0]["agreement_id"] == aa_agreement.id
    assert response.json[0]["status"] == BudgetLineItemStatus.DRAFT.name
    assert response.json[0]["can_id"] == test_can.id
    assert response.json[0]["budget_line_item_type"] == AgreementType.AA.name
    assert response.json[0]["line_description"] == "Test Line Item 1"
    assert response.json[0]["comments"] == "Test Comments 1"
    assert response.json[0]["amount"] == 100.00
    assert response.json[0]["is_obe"] is False
    assert response.json[0]["date_needed"] == "2043-01-01"
    assert response.json[0]["proc_shop_fee_percentage"] == 0.0
    assert response.json[0]["procurement_shop_fee_id"] is None

    # cleanup
    db_for_aa_agreement.delete(bli1)
    db_for_aa_agreement.delete(bli2)
    db_for_aa_agreement.delete(aa_agreement)
    db_for_aa_agreement.commit()


def test_bli_returns_project_title(auth_client):
    response = auth_client.get("/api/v1/budget-line-items/")
    assert response.status_code == 200
    assert isinstance(response.json, list)
    assert len(response.json) > 0

    for bli in response.json:
        agreement = bli.get("agreement")

        if agreement is None:
            # Skip BLIs that don't have an agreement
            continue

        project = agreement.get("project")

        if not project:
            continue  # Skip if agreement has no project

        project = agreement.get("project")
        title = project.get("title")
        assert (
            isinstance(title, str) and title.strip()
        ), "Project title must be a non-empty string"


def test_bli_by_id_returns_correct_project_title(auth_client, loaded_db):
    stmt = (
        select(BudgetLineItem)
        .join(Agreement, BudgetLineItem.agreement_id == Agreement.id)
        .join(Project, Agreement.project_id == Project.id)
        .where(BudgetLineItem.agreement_id.isnot(None))
    )
    bli = loaded_db.scalars(stmt).first()
    assert (
        bli is not None
    ), "No BLI with an agreement and project found in the database."
    response = auth_client.get(f"/api/v1/budget-line-items/{bli.id}")
    assert response.status_code == 200
    assert "agreement" in response.json
    agreement = response.json["agreement"]
    assert agreement is not None
    assert "project" in agreement
    project = agreement["project"]
    assert project is not None
    title = project.get("title")
    assert (
        isinstance(title, str) and title.strip()
    ), "Project title must be a non-empty string"
    assert bli.agreement.project.title == title


@pytest.mark.usefixtures("app_ctx", "loaded_db")
@pytest.mark.parametrize(
    "bli_status",
    [
        BudgetLineItemStatus.DRAFT,
        BudgetLineItemStatus.PLANNED,
        BudgetLineItemStatus.IN_EXECUTION,
        BudgetLineItemStatus.OBLIGATED,
    ],
)
def test_user_unset_can_in_contract_bli(
    loaded_db, bli_status, auth_client, test_cans, test_project, test_admin_user
):
    agreement = ContractAgreement(
        agreement_type=AgreementType.CONTRACT,
        name=f"{bli_status} BLI Agreement",
        nick_name=f"{bli_status}",
        description=f"Agreement with {bli_status} BLI",
        project_id=test_project.id,
        product_service_code_id=loaded_db.get(ProductServiceCode, 1).id,
        awarding_entity_id=loaded_db.get(ProcurementShop, 1).id,
        agreement_reason=AgreementReason.NEW_REQ,
        project_officer_id=test_admin_user.id,
    )
    loaded_db.add(agreement)
    loaded_db.commit()

    test_can = test_cans[0]

    bli = ContractBudgetLineItem(
        line_description=f"{bli_status} BLI",
        agreement_id=agreement.id,
        date_needed=datetime.datetime.now() + datetime.timedelta(days=1),
        can_id=test_can.id,
        status=bli_status,
        amount=5000,
    )
    loaded_db.add(bli)
    loaded_db.commit()

    response = auth_client.patch(
        url_for("api.budget-line-items-item", id=bli.id), json={"can_id": None}
    )

    if bli_status == BudgetLineItemStatus.DRAFT:  # CANs can be unset within draft BLIs
        assert (
            response.status_code == 200
        ), f"User should be able to unset the CAN in {bli_status} bli."
    else:
        assert (
            response.status_code == 400
        ), f"User should not be able to unset the CAN in {bli_status} bli."

    # Delete created test objects
    loaded_db.delete(bli)
    loaded_db.delete(agreement)

    # Test data should be fully removed from DB
    loaded_db.commit()


@pytest.mark.usefixtures("app_ctx", "loaded_db")
@pytest.mark.parametrize(
    "bli_status",
    [
        BudgetLineItemStatus.DRAFT,
        BudgetLineItemStatus.PLANNED,
        BudgetLineItemStatus.IN_EXECUTION,
        BudgetLineItemStatus.OBLIGATED,
    ],
)
def test_user_change_can_in_contract_bli(
    loaded_db, bli_status, auth_client, test_cans, test_project, test_admin_user
):
    agreement = ContractAgreement(
        agreement_type=AgreementType.CONTRACT,
        name=f"{bli_status} BLI Agreement",
        nick_name=f"{bli_status}",
        description=f"Agreement with CR for {bli_status} BLI",
        project_id=test_project.id,
        product_service_code_id=loaded_db.get(ProductServiceCode, 1).id,
        awarding_entity_id=loaded_db.get(ProcurementShop, 1).id,
        agreement_reason=AgreementReason.NEW_REQ,
        project_officer_id=test_admin_user.id,
    )
    loaded_db.add(agreement)
    loaded_db.commit()

    test_can = test_cans[0]

    sc = ServicesComponent(
        agreement=agreement,
        number=99,
        optional=False,
        description="Test SC description",
        period_start=datetime.date(2024, 1, 1),
        period_end=datetime.date(2024, 6, 30),
    )
    loaded_db.add(sc)
    loaded_db.commit()

    bli = ContractBudgetLineItem(
        line_description=f"{bli_status} BLI",
        agreement_id=agreement.id,
        date_needed=datetime.datetime.now() + datetime.timedelta(days=1),
        can_id=test_can.id,
        status=bli_status,
        amount=5000,
        services_component_id=agreement.awarding_entity_id,
    )
    loaded_db.add(bli)
    loaded_db.commit()

    assert bli.in_review is False
    assert (
        bli.change_requests_in_review is None
    ), f"{bli_status} BLI should not have any CR in review initially"

    response = auth_client.patch(
        url_for("api.budget-line-items-item", id=bli.id),
        json={"can_id": test_cans[1].id},
    )

    if bli_status == BudgetLineItemStatus.DRAFT:
        assert (
            response.status_code == 200
        ), f"User should be able to change the CAN in {bli_status} bli."
    elif bli_status == BudgetLineItemStatus.PLANNED:
        assert (
            response.status_code == 202
        ), f"User should be able to change the CAN in {bli_status} bli."
        assert bli.in_review is True
        assert (
            len(bli.change_requests_in_review) == 1
        ), "BLI should have one CR in review"
    else:
        assert (
            response.status_code == 400
        ), f"User should not be able to change the CAN in {bli_status} bli."

    # Delete created test objects
    loaded_db.delete(bli)
    loaded_db.delete(agreement)

    # Test data should be fully removed from DB
    loaded_db.commit()
