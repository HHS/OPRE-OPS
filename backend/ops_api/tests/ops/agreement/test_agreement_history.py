import datetime

import pytest
from flask import url_for

from models import Agreement, BudgetLineItemStatus, ContractBudgetLineItem

test_user_id = 503
test_user_name = "Amelia Popham"


@pytest.mark.usefixtures("app_ctx")
def test_agreement_history(auth_client, loaded_db, test_can):
    # POST: create agreement
    data = {
        "agreement_type": "CONTRACT",
        "agreement_reason": "NEW_REQ",
        "name": "Agreement144",
        "description": "Description",
        "product_service_code_id": 1,
        "vendor": "Vendor A",
        "project_officer_id": 500,
        "team_members": [
            {
                "id": 502,
            },
            {
                "id": 504,
            },
        ],
        "notes": "New Agreement for purpose X",
    }
    resp = auth_client.post("/api/v1/agreements/", json=data)
    assert resp.status_code == 201
    assert "id" in resp.json
    agreement_id = resp.json["id"]

    # PATCH: edit agreement
    data = {
        "agreement_type": "CONTRACT",
        "description": "Test Description Updated",
        "notes": "Test Notes Updated",
    }
    resp = auth_client.patch(f"/api/v1/agreements/{agreement_id}", json=data)
    assert resp.status_code == 200
    resp_json = resp.json
    assert "id" in resp_json
    resp_id = resp_json["id"]
    assert resp_id == agreement_id
    get_resp = auth_client.get(f"/api/v1/agreements/{agreement_id}", json=data)
    get_json = get_resp.json
    assert get_json.get("id", None) == agreement_id
    for k, v in data.items():
        assert get_json.get(k, None) == data[k]

    # POST: create budget line
    data = {
        "line_description": "BLI1",
        "can_id": test_can.id,
        "agreement_id": agreement_id,
        "amount": 1000000,
        "status": "DRAFT",
        "date_needed": "2034-3-3",
        "proc_shop_fee_percentage": None,
    }

    resp = auth_client.post("/api/v1/budget-line-items/", json=data)
    assert resp.status_code == 201

    assert "id" in resp.json
    bli_id = resp.json["id"]

    # PATCH: edit budget line
    data = {
        "amount": 2000000,
        "comments": "Comments Updated",
        "date_needed": "2043-1-1",
    }
    resp = auth_client.patch(f"/api/v1/budget-line-items/{bli_id}", json=data)
    assert resp.status_code == 200

    # DELETE budget line
    # resp = auth_client.delete(f"/api/v1/budget-line-items/{bli_id}")
    # assert resp.status_code == 200
    bli = loaded_db.get(ContractBudgetLineItem, bli_id)
    loaded_db.delete(bli)
    loaded_db.commit()

    resp = auth_client.delete(f"/api/v1/agreements/{agreement_id}")
    assert resp.status_code == 200

    resp = auth_client.get(f"/api/v1/agreement-history/{agreement_id}?offset=0&limit=20")
    assert resp.status_code == 200
    data = resp.json
    assert len(data) == 6
    assert data[0]["class_name"] == "ContractAgreement"
    assert data[0]["event_type"] == "DELETED"
    assert len(data[0]["changes"]) == 0
    assert data[1]["class_name"] == "ContractBudgetLineItem"
    assert data[1]["event_type"] == "DELETED"
    assert len(data[1]["changes"]) == 0
    assert data[2]["class_name"] == "ContractBudgetLineItem"
    assert data[2]["event_type"] == "UPDATED"
    assert len(data[2]["changes"]) == 3
    assert data[3]["class_name"] == "ContractBudgetLineItem"
    assert data[3]["event_type"] == "NEW"
    assert len(data[3]["changes"]) == 9  # TODO: Remove these fragile tests when AgreementHistory is refactored
    assert data[4]["class_name"] == "ContractAgreement"
    assert data[4]["event_type"] == "UPDATED"
    assert len(data[4]["changes"]) == 2
    assert data[5]["class_name"] == "ContractAgreement"
    assert data[5]["event_type"] == "NEW"
    assert len(data[5]["changes"]) == 11


def test_agreement_history_log_items(auth_client, app, test_can, utc_today):
    session = app.db_session

    # create agreement (using API)
    data = {
        "agreement_type": "CONTRACT",
        "agreement_reason": "NEW_REQ",
        "name": "TEST: Agreement history with change requests",
        "description": "Description",
        "product_service_code_id": 1,
        "vendor": "Vendor A",
        "project_officer_id": 520,
        "team_members": [
            {
                "id": 503,
            },
            {
                "id": 522,
            },
        ],
        "notes": "New Agreement for purpose X",
    }
    resp = auth_client.post("/api/v1/agreements/", json=data)
    assert resp.status_code == 201
    assert "id" in resp.json
    agreement_id = resp.json["id"]

    # verify agreement history (+1 agreement created)
    prev_hist_count = 0
    resp = auth_client.get(f"/api/v1/agreement-history/{agreement_id}?limit=100")
    assert resp.status_code == 200
    resp_json = resp.json
    hist_count = len(resp_json)
    assert hist_count == prev_hist_count + 1
    prev_hist_count = hist_count
    log_items = resp_json[0]["log_items"]
    assert len(log_items) == 1
    log_item = log_items[0]
    assert log_item["event_class_name"] == "ContractAgreement"
    assert log_item["target_class_name"] == "ContractAgreement"
    assert log_item["created_by_user_full_name"] == "Amelia Popham"
    assert log_item["event_type"] == "NEW"
    assert log_item["scope"] == "OBJECT"
    assert log_item["created_on"] is not None
    assert log_item["created_on"].startswith(utc_today)

    # update Agreement
    data = {
        "name": "TEST: Agreement history with change requests EDITED",
        "description": "Description EDITED",
    }
    resp = auth_client.patch(f"/api/v1/agreements/{agreement_id}", json=data)
    assert resp.status_code == 200

    # verify agreement history (+1 agreement updated)
    resp = auth_client.get(f"/api/v1/agreement-history/{agreement_id}?limit=100")
    assert resp.status_code == 200
    resp_json = resp.json
    hist_count = len(resp_json)
    assert hist_count == prev_hist_count + 1
    prev_hist_count = hist_count
    log_items = resp_json[0]["log_items"]
    assert len(log_items) == 2
    log_item = log_items[0]
    assert log_item["event_class_name"] == "ContractAgreement"
    assert log_item["target_class_name"] == "ContractAgreement"
    assert log_item["created_by_user_full_name"] == "Amelia Popham"
    assert log_item["event_type"] == "UPDATED"
    assert log_item["scope"] == "PROPERTY"
    assert log_item["property_key"] == "name"
    assert log_item["change"] == {
        "new": "TEST: Agreement history with change requests EDITED",
        "old": "TEST: Agreement history with change requests",
    }
    assert log_item["created_on"] is not None
    assert log_item["created_on"].startswith(utc_today)

    #  create BLI
    bli = ContractBudgetLineItem(
        line_description="Test Experiments Workflows BLI",
        agreement_id=agreement_id,
        can_id=test_can.id,
        amount=111.11,
        status=BudgetLineItemStatus.DRAFT,
        created_by=test_user_id,
        date_needed=datetime.date(2025, 1, 1),
    )
    session.add(bli)
    session.commit()
    assert bli.id is not None

    # verify agreement history added (+1 BLI created)
    resp = auth_client.get(f"/api/v1/agreement-history/{agreement_id}?limit=100")
    assert resp.status_code == 200
    resp_json = resp.json
    hist_count = len(resp_json)
    assert hist_count == prev_hist_count + 1
    prev_hist_count = hist_count
    log_items = resp_json[0]["log_items"]
    assert len(log_items) == 1
    log_item = log_items[0]
    assert log_item["event_class_name"] == "ContractBudgetLineItem"
    assert log_item["created_by_user_full_name"] == "Amelia Popham"
    assert log_item["event_type"] == "NEW"
    assert log_item["scope"] == "OBJECT"
    assert log_item["created_on"] is not None
    assert log_item["created_on"].startswith(utc_today)

    # update BLI
    bli.can_id = 501
    bli.amount = 222.22
    bli.date_needed = datetime.date(2025, 2, 2)
    session.add(bli)
    session.commit()

    # verify agreement history added (+1 BLI update with 3 log_item)
    resp = auth_client.get(f"/api/v1/agreement-history/{agreement_id}?limit=100")
    assert resp.status_code == 200
    resp_json = resp.json
    hist_count = len(resp_json)
    assert hist_count == prev_hist_count + 1
    prev_hist_count = hist_count
    log_items = resp_json[0]["log_items"]
    assert len(log_items) == 3
    for i in range(2):
        log_item = log_items[i]
        assert log_item["event_class_name"] == "ContractBudgetLineItem"
        assert log_item["created_by_user_full_name"] == "Amelia Popham"
        assert log_item["event_type"] == "UPDATED"
        assert log_item["scope"] == "PROPERTY"
        assert log_item["created_on"] is not None
        assert log_item["created_on"].startswith(utc_today)
        assert log_item["property_key"] in ["amount", "can_id", "date_needed"]
        if log_item["property_key"] == "amount":
            assert log_item["change"] == {"new": 222.22, "old": 111.11}
        elif log_item["property_key"] == "can_id":
            assert log_item["change"] == {"new": 501, "old": 500}
        elif log_item["property_key"] == "date_needed":
            assert log_item["change"] == {"new": "2025-02-02", "old": "2025-01-01"}

    #  update BLI to PLANNED
    bli.status = BudgetLineItemStatus.PLANNED
    session.add(bli)
    session.commit()

    # verify agreement history added (+1 BLI created)
    resp = auth_client.get(f"/api/v1/agreement-history/{agreement_id}?limit=100")
    assert resp.status_code == 200
    resp_json = resp.json
    hist_count = len(resp_json)
    assert hist_count == prev_hist_count + 1
    log_items = resp_json[0]["log_items"]
    assert len(log_items) == 1
    log_item = log_items[0]
    assert log_item["scope"] == "PROPERTY"
    assert log_item["event_class_name"] == "ContractBudgetLineItem"
    assert log_item["target_class_name"] == "ContractBudgetLineItem"
    assert log_item["property_key"] == "status"
    assert log_item["event_type"] == "UPDATED"
    assert log_item["created_on"] is not None
    assert log_item["created_on"].startswith(utc_today)
    assert log_item["change"] == {"new": "PLANNED", "old": "DRAFT"}

    session.delete(bli)
    agreement = session.get(Agreement, agreement_id)
    session.delete(agreement)
    session.commit()


@pytest.mark.usefixtures("app_ctx")
def test_agreement_history_log_items_with_change_requests(
    budget_team_auth_client, division_director_auth_client, loaded_db, test_can, test_project, utc_today
):
    # create agreement (using API)
    data = {
        "agreement_type": "CONTRACT",
        "agreement_reason": "NEW_REQ",
        "name": "TEST: Agreement history with change requests",
        "description": "Description",
        "product_service_code_id": 1,
        "awarding_entity_id": 2,
        "project_officer_id": 520,
        "project_id": test_project.id,
        "team_members": [
            {
                "id": 503,
            },
            {
                "id": 522,
            },
        ],
        "notes": "New Agreement for purpose X",
    }
    resp = budget_team_auth_client.post("/api/v1/agreements/", json=data)
    assert resp.status_code == 201
    assert "id" in resp.json
    agreement_id = resp.json["id"]

    #  create BLI
    bli = ContractBudgetLineItem(
        line_description="Test Experiments Workflows BLI",
        agreement_id=agreement_id,
        can_id=test_can.id,
        amount=111.11,
        status=BudgetLineItemStatus.PLANNED,
        created_by=test_user_id,
        date_needed=datetime.date(2025, 1, 1),
    )
    loaded_db.add(bli)
    loaded_db.commit()

    prev_hist_count = 2

    #  submit PATCH BLI which triggers a budget change requests
    data = {"amount": 333.33, "can_id": 502, "date_needed": "2032-03-03"}
    response = budget_team_auth_client.patch(url_for("api.budget-line-items-item", id=bli.id), json=data)
    assert response.status_code == 202
    resp_json = response.json
    assert "change_requests_in_review" in resp_json
    change_requests_in_review = resp_json["change_requests_in_review"]
    assert len(change_requests_in_review) == 3

    # verify agreement history added (+3 change requests created)
    resp = budget_team_auth_client.get(f"/api/v1/agreement-history/{agreement_id}?limit=100")
    assert resp.status_code == 200
    hist_json = resp.json
    hist_count = len(hist_json)
    assert hist_count == prev_hist_count + 3
    prev_hist_count = hist_count

    # check history and log item for the change requests which each have one property change
    for i in range(2):
        assert hist_json[i]["class_name"] == "BudgetLineItemChangeRequest"
        assert hist_json[i]["event_type"] == "IN_REVIEW"
        assert len(hist_json[i]["log_items"]) == 1
        log_item = hist_json[i]["log_items"][0]
        assert log_item["event_class_name"] == "BudgetLineItemChangeRequest"
        assert log_item["target_class_name"] == "BudgetLineItem"
        assert log_item["created_by_user_full_name"] == "Budget Team"
        assert log_item["event_type"] == "IN_REVIEW"
        assert log_item["scope"] == "PROPERTY"
        assert log_item["created_on"] is not None
        assert log_item["created_on"].startswith(utc_today)
        assert log_item["property_key"] in ["amount", "can_id", "date_needed"]
        if log_item["property_key"] == "amount":
            assert log_item["change"] == {"new": 333.33, "old": 111.11}
        elif log_item["property_key"] == "can_id":
            assert log_item["change"] == {"new": 502, "old": 500}
        elif log_item["property_key"] == "date_needed":
            assert log_item["change"] == {"new": "2032-03-03", "old": "2025-01-01"}

    # review the change requests, reject the can_id change request and approve the others
    for change_request in change_requests_in_review:
        change_request_id = change_request["id"]
        data = {"change_request_id": change_request_id, "action": "APPROVE"}
        response = division_director_auth_client.post(url_for("api.change-request-review-list"), json=data)
        assert response.status_code == 200

    # verify agreement history added for 3 reviews and 3 approved updates
    resp = budget_team_auth_client.get(f"/api/v1/agreement-history/{agreement_id}?limit=100")
    assert resp.status_code == 200
    hist_json = resp.json
    hist_count = len(hist_json)
    assert hist_count == prev_hist_count + 6

    # verify log item details
    # there will be 2 log items at the same time, one for the CR approval and one for the BLI update
    for i in range(2):
        log_items = hist_json[i]["log_items"]
        assert len(log_items) == 1
        log_item = log_items[0]
        # log item for the CR approval
        if log_item["event_class_name"] == "BudgetLineItemChangeRequest":
            assert log_item["event_type"] == "APPROVED"
            assert log_item["target_class_name"] == "BudgetLineItem"
            assert log_item["updated_by_change_request"] is False
            assert log_item["changes_requested_by_user_full_name"] == "Budget Team"
        # log item for the BLI update
        elif log_item["event_class_name"] == "ContractBudgetLineItem":
            assert log_item["event_type"] == "UPDATED"
            assert log_item["target_class_name"] == "ContractBudgetLineItem"
            assert log_item["updated_by_change_request"] is True
            assert log_item["changes_requested_by_user_full_name"] is None

    # cleanup
    loaded_db.delete(bli)
    agreement = loaded_db.get(Agreement, agreement_id)
    loaded_db.delete(agreement)
    loaded_db.commit()
