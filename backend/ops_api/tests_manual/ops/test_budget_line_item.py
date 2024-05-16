import json
import sys

import pytest

from models import Agreement, BudgetLineItem


@pytest.mark.skipif(
    "test_budget_line_item.py::test_budget_line_item_validation" not in sys.argv,
    reason="Skip unless run manually by itself",
)
@pytest.mark.usefixtures("app_ctx")
def test_budget_line_item_validation(auth_client, app):
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
    print(f"~~~ Agreement POST:\n {json.dumps(resp.json, indent=2)} \n ~~~")
    assert resp.status_code == 201
    assert "id" in resp.json
    agreement_id = resp.json["id"]

    #  create BLI (using API)
    data = {
        "line_description": "Test Experiments Workflows BLI",
        "agreement_id": agreement_id,
        # "can_id": 1,
        # "amount": 111.11,
        "status": "DRAFT",
        # "date_needed": "2025-01-01",
    }
    resp = auth_client.post("/api/v1/budget-line-items/", json=data)
    print(f"~~~ BLI POST:\n {json.dumps(resp.json, indent=2)} \n ~~~")
    assert resp.status_code == 201
    assert "id" in resp.json
    bli_id = resp.json["id"]

    # update BLI status to PLANNED and expect validation errors
    data = {
        "status": "PLANNED",
    }
    resp = auth_client.patch(f"/api/v1/budget-line-items/{bli_id}", json=data)
    print(f"~~~ BLI PATCH 1: {resp.status_code}\n {json.dumps(resp.json, indent=2)} \n ~~~")
    assert resp.status_code == 400
    print(json.dumps(resp.json, indent=2))
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
        "procurement_shop_id": 2,
        "product_service_code_id": 1,
        "project_id": 1,
        "project_officer_id": 21,
    }
    resp = auth_client.patch(f"/api/v1/agreements/{agreement_id}", json=data)
    print(f"~~~ Agreement PATCH to valid: {resp.status_code}\n {json.dumps(resp.json, indent=2)} \n ~~~")
    assert resp.status_code == 200

    # update BLI status to PLANNED and expect only BLI validation errors
    data = {
        "status": "PLANNED",
    }
    resp = auth_client.patch(f"/api/v1/budget-line-items/{bli_id}", json=data)
    print(f"~~~ BLI PATCH 2: {resp.status_code}\n {json.dumps(resp.json, indent=2)} \n ~~~")
    assert resp.status_code == 400
    print(json.dumps(resp.json, indent=2))
    assert "_schema" in resp.json
    assert len(resp.json["_schema"]) == 3
    assert resp.json == {
        "_schema": [
            "BLI must have a valid Amount when status is not DRAFT",
            "BLI must have a valid CAN when status is not DRAFT",
            "BLI must valid a valid Need By Date when status is not DRAFT",
        ]
    }

    # cleanup
    bli = session.get(BudgetLineItem, bli_id)
    session.delete(bli)
    agreement = session.get(Agreement, agreement_id)
    session.delete(agreement)
    session.commit()
