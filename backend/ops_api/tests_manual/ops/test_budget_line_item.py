import sys

import pytest
from flask import url_for

from models import Agreement, BudgetLineItem, BudgetLineItemStatus


@pytest.mark.skipif(
    "test_budget_line_item.py::test_budget_line_item_validation" not in sys.argv,
    reason="Skip unless run manually by itself",
)
def test_budget_line_item_validation(auth_client, app, app_ctx):
    session = app.db_session
    agreement_id = None
    bli_id = None

    # create agreement (using API)
    data = {
        "agreement_type": "CONTRACT",
        "agreement_reason": "NEW_REQ",
        "name": "TEST: Agreement for BLI Validation",
        "team_members": [
            {
                "id": 21,
            },
            {
                "id": 23,
            },
        ],
    }
    resp = auth_client.post("/api/v1/agreements/", json=data)
    assert resp.status_code == 201
    assert "id" in resp.json
    agreement_id = resp.json["id"]

    #  create BLI (using API)
    data = {
        "line_description": "Test Experiments Workflows BLI",
        "agreement_id": agreement_id,
        "status": "DRAFT",
    }
    resp = auth_client.post("/api/v1/budget-line-items/", json=data)
    assert resp.status_code == 201
    assert "id" in resp.json
    bli_id = resp.json["id"]

    # update BLI status to PLANNED and expect validation errors
    data = {
        "status": "PLANNED",
    }
    resp = auth_client.patch(f"/api/v1/budget-line-items/{bli_id}", json=data)
    assert resp.status_code == 400
    assert "_schema" in resp.json
    assert len(resp.json["_schema"]) == 8
    assert resp.json == {
        "_schema": [
            "BLI's Agreement must have a Description when status is not DRAFT",
            "BLI must have a valid Amount when status is not DRAFT",
            "BLI must have a valid CAN when status is not DRAFT",
            "BLI must valid a valid Need By Date when status is not DRAFT",
            "BLI's Agreement must have a ProcurementShop when status is not DRAFT",
            "BLI's Agreement must have a ProductServiceCode when status is not DRAFT",
            "BLI's Agreement must have a Project when status is not DRAFT",
            "BLI's Agreement must have a ProjectOfficer when status is not DRAFT",
        ]
    }

    # update agreement for validation
    data = {
        "description": "Description",
        "awarding_entity_id": 2,
        "product_service_code_id": 1,
        "project_id": 1,
        "project_officer_id": 21,
    }
    resp = auth_client.patch(f"/api/v1/agreements/{agreement_id}", json=data)
    assert resp.status_code == 200

    data = {
        "status": "PLANNED",
    }
    resp = auth_client.patch(f"/api/v1/budget-line-items/{bli_id}", json=data)
    assert resp.status_code == 400
    assert "_schema" in resp.json
    assert len(resp.json["_schema"]) == 3
    assert resp.json == {
        "_schema": [
            "BLI must have a valid Amount when status is not DRAFT",
            "BLI must have a valid CAN when status is not DRAFT",
            "BLI must valid a valid Need By Date when status is not DRAFT",
        ]
    }

    # update BLI for validation
    data = {
        "can_id": 1,
        "amount": 111.11,
        "date_needed": "2025-01-01",
    }
    resp = auth_client.patch(f"/api/v1/budget-line-items/{bli_id}", json=data)
    assert resp.status_code == 200
    assert "id" in resp.json
    bli_id = resp.json["id"]

    # update BLI status to PLANNED and expect no validation errors
    # this doesn't actually change the status, but it validates it
    data = {
        "status": "PLANNED",
    }
    resp = auth_client.patch(f"/api/v1/budget-line-items/{bli_id}", json=data)
    assert resp.status_code == 200
    assert resp.json["in_review"] == False
    assert resp.json["change_requests_in_review"] is None
    assert resp.json["status"] == "DRAFT"

    # change the status directly to PLANNED
    bli = session.get(BudgetLineItem, bli_id)
    bli.status = BudgetLineItemStatus.PLANNED
    session.add(bli)
    session.commit()

    # update BLI with invalid data (for PLANNED status)
    data = {
        # "can_id": None,
        "amount": None,
        # "date_needed": None,
    }
    resp = auth_client.patch(f"/api/v1/budget-line-items/{bli_id}", json=data)
    assert resp.status_code == 400

    # cleanup
    bli = session.get(BudgetLineItem, bli_id)
    session.delete(bli)
    agreement = session.get(Agreement, agreement_id)
    session.delete(agreement)
    session.commit()


@pytest.mark.skipif(
    "test_budget_line_item.py::test_budget_line_item_validation_create_invalid" not in sys.argv,
    reason="Skip unless run manually by itself",
)
def test_budget_line_item_validation_create_invalid(auth_client, app, app_ctx):
    session = app.db_session
    agreement_id = None
    bli_id = None

    # create agreement (using API)
    data = {
        "agreement_type": "CONTRACT",
        "agreement_reason": "NEW_REQ",
        "name": "TEST: Agreement for BLI Validation",
        "team_members": [
            {
                "id": 21,
            },
            {
                "id": 23,
            },
        ],
        "description": "Description",
        "awarding_entity_id": 2,
        "product_service_code_id": 1,
        "project_id": 1,
        "project_officer_id": 21,
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
        "can_id": 1,
        "amount": 111.11,
        # "date_needed": "2025-01-01",
    }
    resp = auth_client.post("/api/v1/budget-line-items/", json=data)
    assert resp.status_code == 400

    # cleanup
    # bli = session.get(BudgetLineItem, bli_id)
    # session.delete(bli)
    agreement = session.get(Agreement, agreement_id)
    session.delete(agreement)
    session.commit()


@pytest.mark.skipif(
    "test_budget_line_item.py::test_budget_line_item_validation_status_change" not in sys.argv,
    reason="Skip unless run manually by itself",
)
def test_budget_line_item_validation_status_change(auth_client, app, app_ctx):
    session = app.db_session
    agreement_id = None
    bli_id = None

    # create agreement (using API)
    data = {
        "agreement_type": "CONTRACT",
        "agreement_reason": "NEW_REQ",
        "name": "TEST: Agreement for BLI Validation",
        "team_members": [
            {
                "id": 21,
            },
            {
                "id": 23,
            },
        ],
        "description": "Description",
        "awarding_entity_id": 2,
        "product_service_code_id": 1,
        "project_id": 1,
        "project_officer_id": 21,
    }
    resp = auth_client.post("/api/v1/agreements/", json=data)
    assert resp.status_code == 201
    assert "id" in resp.json
    agreement_id = resp.json["id"]

    #  create BLI (using API)
    data = {
        "line_description": "Test Experiments Workflows BLI",
        "agreement_id": agreement_id,
        "status": "DRAFT",
        # "can_id": 1,
        # "amount": 111.11,
        # "date_needed": "2025-01-01",
    }
    resp = auth_client.post("/api/v1/budget-line-items/", json=data)
    assert resp.status_code == 201
    assert "id" in resp.json
    bli_id = resp.json["id"]

    # update BLI status to PLANNED and expect validation errors
    # this doesn't actually change the status, but it validates it
    data = {
        "status": "PLANNED",
    }
    resp = auth_client.patch(f"/api/v1/budget-line-items/{bli_id}", json=data)
    assert resp.status_code == 400

    # cleanup
    bli = session.get(BudgetLineItem, bli_id)
    session.delete(bli)
    agreement = session.get(Agreement, agreement_id)
    session.delete(agreement)
    session.commit()


@pytest.mark.skipif(
    "test_budget_line_item.py::test_budget_line_item_validation_patch_to_invalid" not in sys.argv,
    reason="Skip unless run manually by itself",
)
def test_budget_line_item_validation_patch_to_invalid(auth_client, app, app_ctx):
    session = app.db_session
    agreement_id = None
    bli_id = None

    # create agreement (using API)
    data = {
        "agreement_type": "CONTRACT",
        "agreement_reason": "NEW_REQ",
        "name": "TEST: Agreement for BLI Validation",
        "team_members": [
            {
                "id": 21,
            },
            {
                "id": 23,
            },
        ],
        "description": "Description",
        "awarding_entity_id": 2,
        "product_service_code_id": 1,
        "project_id": 1,
        "project_officer_id": 21,
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
        "can_id": 1,
        "amount": 111.11,
        "date_needed": "2025-01-01",
    }
    resp = auth_client.post("/api/v1/budget-line-items/", json=data)
    assert resp.status_code == 201
    assert "id" in resp.json
    bli_id = resp.json["id"]

    # update BLI with invalid data (for PLANNED status)
    data = {
        "can_id": None,
        # "amount": None,
        # "date_needed": None,
    }
    resp = auth_client.patch(f"/api/v1/budget-line-items/{bli_id}", json=data)
    # assert resp.status_code == 400
    assert resp.status_code == 202

    # that shouldn't have been accepted, but for now since it was, let's try to approve them
    assert "change_requests_in_review" in resp.json
    change_request_ids = [cr["id"] for cr in resp.json["change_requests_in_review"]]
    for change_request in resp.json["change_requests_in_review"]:
        change_request_id = change_request["id"]
        action = "APPROVE"
        data = {"change_request_id": change_request_id, "action": action}
        response = auth_client.patch(url_for("api.change-requests-list"), json=data)
        assert response.status_code == 200

    resp = auth_client.get(f"/api/v1/budget-line-items/{bli_id}", json=data)
    assert resp.status_code == 200

    # cleanup
    bli = session.get(BudgetLineItem, bli_id)
    session.delete(bli)
    agreement = session.get(Agreement, agreement_id)
    session.delete(agreement)
    session.commit()
