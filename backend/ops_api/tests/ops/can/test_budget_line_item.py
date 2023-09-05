import datetime

import pytest
from models import CAN
from models.cans import BudgetLineItem, BudgetLineItemStatus
from ops_api.ops.resources.budget_line_items import PATCHRequestBody, POSTRequestBody
from sqlalchemy_continuum import parent_class, version_class


@pytest.mark.usefixtures("app_ctx")
def test_budget_line_item_lookup(loaded_db):
    bli = loaded_db.get(BudgetLineItem, 1)
    assert bli is not None
    assert bli.id == 1
    assert bli.line_description == "LI 1"
    assert bli.agreement_id == 1
    assert bli.can_id == 5
    assert bli.amount == 1000000.00
    assert bli.status == BudgetLineItemStatus.DRAFT


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
    assert len(response.json) == 22
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
    response = auth_client.post("/api/v1/budget-line-items/", json={})
    assert response.status_code == 400


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_post_budget_line_items(auth_client):
    data = POSTRequestBody(
        line_description="LI 1",
        comments="blah blah",
        agreement_id=1,
        can_id=1,
        amount=100.12,
        status="DRAFT",
        date_needed="2043-01-01",
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
    data = POSTRequestBody(
        line_description="LI 1",
        comments="blah blah",
        agreement_id=1,
        can_id=1,
        amount=100.12,
        status="blah blah",
        date_needed="2043-01-01",
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
        "date_needed": "2043-01-01",
        "psc_fee_amount": 1.23,
    }
    response = auth_client.post("/api/v1/budget-line-items/", json=data)
    assert response.status_code == 400


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_post_budget_line_items_missing_optional_comments(auth_client):
    data = POSTRequestBody(
        line_description="LI 1",
        agreement_id=1,
        can_id=1,
        amount=100.12,
        status="DRAFT",
        date_needed="2043-01-01",
        psc_fee_amount=1.23,
    )
    response = auth_client.post("/api/v1/budget-line-items/", json=data.__dict__)
    assert response.status_code == 201


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_post_budget_line_items_invalid_can(auth_client):
    data = POSTRequestBody(
        line_description="LI 1",
        comments="blah blah",
        agreement_id=1,
        can_id=10000000,
        amount=100.12,
        status="DRAFT",
        date_needed="2043-01-01",
        psc_fee_amount=1.23,
    )
    response = auth_client.post("/api/v1/budget-line-items/", json=data.__dict__)
    assert response.status_code == 400


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_post_budget_line_items_auth_required(client):
    data = POSTRequestBody(
        line_description="LI 1",
        comments="blah blah",
        agreement_id=1,
        can_id=1,
        amount=100.12,
        status="DRAFT",
        date_needed="2043-01-01",
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


@pytest.fixture()
def test_bli(loaded_db):
    bli = BudgetLineItem(
        line_description="LI 1",
        comments="blah blah",
        agreement_id=1,
        can_id=1,
        amount=100.12,
        status=BudgetLineItemStatus.DRAFT,
        date_needed=datetime.date(2043, 1, 1),
        psc_fee_amount=1.23,
        created_by=1,
    )
    loaded_db.add(bli)
    loaded_db.commit()

    yield bli

    loaded_db.rollback()
    loaded_db.delete(bli)
    loaded_db.commit()


@pytest.fixture()
def test_bli_previous_year(loaded_db):
    bli = BudgetLineItem(
        line_description="LI 1",
        comments="blah blah",
        agreement_id=1,
        can_id=1,
        amount=100.12,
        status=BudgetLineItemStatus.DRAFT,
        date_needed=datetime.date(2042, 10, 1),
        psc_fee_amount=1.23,
        created_by=1,
    )
    loaded_db.add(bli)
    loaded_db.commit()

    yield bli

    loaded_db.rollback()
    loaded_db.delete(bli)
    loaded_db.commit()


@pytest.fixture()
def test_bli_previous_fiscal_year(loaded_db):
    bli = BudgetLineItem(
        line_description="LI 1",
        comments="blah blah",
        agreement_id=1,
        can_id=1,
        amount=100.12,
        status=BudgetLineItemStatus.DRAFT,
        date_needed=datetime.date(2042, 9, 1),
        psc_fee_amount=1.23,
        created_by=1,
    )
    loaded_db.add(bli)
    loaded_db.commit()

    yield bli

    loaded_db.rollback()
    loaded_db.delete(bli)
    loaded_db.commit()


@pytest.fixture()
def test_bli_no_can(loaded_db):
    bli = BudgetLineItem(
        line_description="LI 1",
        comments="blah blah",
        agreement_id=1,
        amount=100.12,
        status=BudgetLineItemStatus.DRAFT,
        date_needed=datetime.date(2043, 1, 1),
        psc_fee_amount=1.23,
        created_by=1,
    )
    loaded_db.add(bli)
    loaded_db.commit()

    yield bli

    loaded_db.rollback()
    loaded_db.delete(bli)
    loaded_db.commit()


@pytest.fixture()
def test_bli_no_need_by_date(loaded_db):
    bli = BudgetLineItem(
        line_description="LI 1",
        comments="blah blah",
        agreement_id=1,
        can_id=1,
        amount=100.12,
        status=BudgetLineItemStatus.DRAFT,
        psc_fee_amount=1.23,
        created_by=1,
    )
    loaded_db.add(bli)
    loaded_db.commit()

    yield bli

    loaded_db.rollback()
    loaded_db.delete(bli)
    loaded_db.commit()


@pytest.mark.usefixtures("app_ctx")
def test_put_budget_line_items(auth_client, test_bli):
    data = POSTRequestBody(
        line_description="Updated LI 1",
        comments="hah hah",
        agreement_id=2,
        can_id=2,
        amount=200.24,
        status="PLANNED",
        date_needed="2044-01-01",
        psc_fee_amount=2.34,
    )
    response = auth_client.put(f"/api/v1/budget-line-items/{test_bli.id}", json=data.__dict__)
    assert response.status_code == 200
    assert response.json["line_description"] == "Updated LI 1"
    assert response.json["id"] == test_bli.id
    assert response.json["comments"] == "hah hah"
    assert response.json["agreement_id"] == 2
    assert response.json["can_id"] == 2
    assert response.json["amount"] == 200.24
    assert response.json["status"] == "DRAFT"
    assert response.json["date_needed"] == "2044-01-01"
    assert response.json["psc_fee_amount"] == 2.34
    assert response.json["created_on"] != response.json["updated_on"]


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
        date_needed=datetime.date(2043, 1, 1),
        psc_fee_amount=1.23,
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
        assert response.json["comments"] is None
        assert response.json["agreement_id"] == 1
        assert response.json["can_id"] is None
        assert response.json["amount"] is None
        assert response.json["status"] is None
        assert response.json["date_needed"] is None
        assert response.json["psc_fee_amount"] is None
        assert response.json["created_on"] != response.json["updated_on"]

    finally:
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
        date_needed=datetime.date(2043, 1, 1),
        psc_fee_amount=1.23,
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
def test_put_budget_line_items_bad_date(auth_client, loaded_db):
    bli = BudgetLineItem(
        id=1000,
        line_description="LI 1",
        comments="blah blah",
        agreement_id=1,
        can_id=1,
        amount=100.12,
        status=BudgetLineItemStatus.DRAFT,
        date_needed=datetime.date(2043, 1, 1),
        psc_fee_amount=1.23,
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
def test_put_budget_line_items_bad_can(auth_client, test_bli):
    data = {"can_id": 1000000, "agreement_id": 1}
    response = auth_client.put("/api/v1/budget-line-items/1000", json=data)
    assert response.status_code == 400


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_put_budget_line_items_auth(client, loaded_db):
    response = client.put("/api/v1/budget-line-items/1000", json={})
    assert response.status_code == 401


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_put_budget_line_items_empty_request(auth_client, loaded_db):
    response = auth_client.put("/api/v1/budget-line-items/1000", json={})
    assert response.status_code == 400


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_put_budget_line_items_non_existent_bli(auth_client, loaded_db):
    data = POSTRequestBody(
        line_description="Updated LI 1",
        comments="hah hah",
        agreement_id=2,
        can_id=2,
        amount=200.24,
        status="PLANNED",
        date_needed="2044-01-01",
        psc_fee_amount=2.34,
    )
    response = auth_client.put("/api/v1/budget-line-items/1000", json=data.__dict__)
    assert response.status_code == 400


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_patch_budget_line_items(auth_client, loaded_db):
    bli = BudgetLineItem(
        id=1000,
        line_description="LI 1",
        comments="blah blah",
        agreement_id=1,
        can_id=1,
        amount=100.12,
        status=BudgetLineItemStatus.DRAFT,
        date_needed=datetime.date(2043, 1, 1),
        psc_fee_amount=1.23,
        created_by=1,
    )
    try:
        loaded_db.add(bli)
        loaded_db.commit()

        data = PATCHRequestBody(
            line_description="Updated LI 1",
            comments="hah hah",
            agreement_id=2,
            can_id=2,
            amount=200.24,
            status="PLANNED",
            date_needed="2044-01-01",
            psc_fee_amount=2.34,
        )
        response = auth_client.patch("/api/v1/budget-line-items/1000", json=data.__dict__)
        assert response.status_code == 200
        assert response.json["line_description"] == "Updated LI 1"
        assert response.json["id"] == 1000
        assert response.json["comments"] == "hah hah"
        assert response.json["agreement_id"] == 2
        assert response.json["can_id"] == 2
        assert response.json["amount"] == 200.24
        assert response.json["status"] == "DRAFT"
        assert response.json["date_needed"] == "2044-01-01"
        assert response.json["psc_fee_amount"] == 2.34
        assert response.json["created_on"] != response.json["updated_on"]

    finally:
        # cleanup
        loaded_db.delete(bli)
        loaded_db.commit()


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_patch_budget_line_items_update_two_attributes(auth_client, loaded_db):
    bli = BudgetLineItem(
        id=1000,
        line_description="LI 1",
        comments="blah blah",
        agreement_id=1,
        can_id=1,
        amount=100.12,
        status=BudgetLineItemStatus.DRAFT,
        date_needed=datetime.date(2043, 1, 1),
        psc_fee_amount=1.23,
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
        assert response.json["can_id"] == 1
        assert response.json["amount"] == 100.12
        assert response.json["status"] == "DRAFT"
        assert response.json["date_needed"] == "2043-01-01"
        assert response.json["psc_fee_amount"] == 1.23
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
def test_patch_budget_line_items_bad_status(auth_client, loaded_db):
    data = PATCHRequestBody(
        line_description="LI 1",
        comments="blah blah",
        agreement_id=1,
        can_id=1,
        amount=100.12,
        status="blah blah",
        date_needed="2043-01-01",
        psc_fee_amount=1.23,
    )
    response = auth_client.patch("/api/v1/budget-line-items/1", json=data.__dict__)
    assert response.status_code == 400


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_patch_budget_line_items_empty_data(auth_client):
    response = auth_client.patch("/api/v1/budget-line-items/1", json={})
    assert response.status_code == 200


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_patch_budget_line_items_invalid_can(auth_client):
    data = PATCHRequestBody(
        line_description="LI 1",
        comments="blah blah",
        agreement_id=1,
        can_id=10000000,
        amount=100.12,
        status="DRAFT",
        date_needed="2043-01-01",
        psc_fee_amount=1.23,
    )
    response = auth_client.patch("/api/v1/budget-line-items/1", json=data.__dict__)
    assert response.status_code == 400


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_patch_budget_line_items_update_status(auth_client, loaded_db):
    bli = BudgetLineItem(
        id=1000,
        line_description="LI 1",
        comments="blah blah",
        agreement_id=1,
        can_id=1,
        amount=100.12,
        status=BudgetLineItemStatus.DRAFT,
        date_needed=datetime.date(2043, 1, 1),
        psc_fee_amount=1.23,
        created_by=1,
    )
    try:
        loaded_db.add(bli)
        loaded_db.commit()

        data = {"status": "UNDER_REVIEW"}
        response = auth_client.patch("/api/v1/budget-line-items/1000", json=data)
        assert response.status_code == 200
        assert response.json["status"] == "UNDER_REVIEW"

    finally:
        # cleanup
        loaded_db.delete(bli)
        loaded_db.commit()


@pytest.mark.usefixtures("app_ctx")
def test_patch_budget_line_items_history(loaded_db):
    bli = BudgetLineItem(
        line_description="LI 1",
        comments="blah blah",
        agreement_id=1,
        can_id=1,
        amount=100.12,
        status=BudgetLineItemStatus.DRAFT,
        date_needed=datetime.date(2043, 1, 1),
        psc_fee_amount=1.23,
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

    finally:
        # cleanup
        loaded_db.delete(bli)
        loaded_db.commit()


@pytest.mark.usefixtures("app_ctx")
def test_budget_line_item_portfolio_id(loaded_db, test_bli):
    can = loaded_db.get(CAN, test_bli.can_id)
    assert test_bli.portfolio_id == can.managing_portfolio_id


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_put_budget_line_item_portfolio_id_ignored(auth_client, loaded_db, test_bli):
    data = POSTRequestBody(
        line_description="Updated LI 1",
        comments="hah hah",
        agreement_id=2,
        can_id=2,
        amount=200.24,
        status="PLANNED",
        date_needed="2044-01-01",
        psc_fee_amount=2.34,
    )
    request_data = data.__dict__ | {"portfolio_id": 10000}
    response = auth_client.put(f"/api/v1/budget-line-items/{test_bli.id}", json=request_data)
    assert response.status_code == 200, "portfolio_id should be ignored"


@pytest.mark.usefixtures("app_ctx")
def test_budget_line_item_fiscal_year(loaded_db, test_bli, test_bli_previous_year, test_bli_previous_fiscal_year):
    assert test_bli.fiscal_year == test_bli.date_needed.year, "test_bli.date_needed == 2043-01-01"
    assert (
        test_bli_previous_year.fiscal_year == test_bli_previous_year.date_needed.year + 1
    ), "test_bli_previous_year.date_needed == 2042-10-01"
    assert (
        test_bli_previous_fiscal_year.fiscal_year == test_bli_previous_fiscal_year.date_needed.year
    ), "test_bli_previous_fiscal_year.date_needed == 2042-09-01"


@pytest.mark.usefixtures("app_ctx")
def test_budget_line_item_portfolio_id_null(auth_client, loaded_db, test_bli_no_can):
    assert test_bli_no_can.portfolio_id is None
    response = auth_client.get(f"/api/v1/budget-line-items/{test_bli_no_can.id}")
    assert response.status_code == 200
    assert response.json["portfolio_id"] is None


@pytest.mark.usefixtures("app_ctx")
def test_budget_line_item_fiscal_year_null(auth_client, loaded_db, test_bli_no_need_by_date):
    assert test_bli_no_need_by_date.fiscal_year is None
    response = auth_client.get(f"/api/v1/budget-line-items/{test_bli_no_need_by_date.id}")
    assert response.status_code == 200
    assert response.json["fiscal_year"] is None


@pytest.mark.usefixtures("app_ctx")
def test_budget_line_item_team_members(loaded_db, test_bli):
    team_members = test_bli.agreement.team_members
    assert len(team_members) > 0
    assert test_bli.team_members == team_members


@pytest.mark.usefixtures("app_ctx")
def test_budget_line_item_team_members_response(auth_client, loaded_db, test_bli):
    response = auth_client.get(f"/api/v1/budget-line-items/{test_bli.id}")
    assert response.status_code == 200
    assert len(response.json["team_members"]) > 0
