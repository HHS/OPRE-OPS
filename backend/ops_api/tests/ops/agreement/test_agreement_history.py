import json

import pytest
from models import ContractAgreement, GrantAgreement
from models.cans import Agreement, AgreementType, ContractType, BudgetLineItem
from sqlalchemy import func, select, update


@pytest.mark.usefixtures("app_ctx")
def test_agreement_history(auth_client, loaded_db):
    # POST: create agreement
    data = {
        "agreement_type": "CONTRACT",
        "agreement_reason": "NEW_REQ",
        "name": "Agreement144",
        "number": "811",
        "description": "Description",
        "product_service_code_id": 1,
        "incumbent": "Vendor A",
        "project_officer": 1,
        "team_members": [
            {
                "id": 3,
            },
            {
                "id": 5,
            },
        ],
        "notes": "New Agreement for purpose X",
    }
    resp = auth_client.post(f"/api/v1/agreements/", json=data)
    assert resp.status_code == 201
    assert "id" in resp.json
    agreement_id = resp.json["id"]

    # PATCH: edit agreement
    oid = agreement_id
    data = {
        "agreement_type": "CONTRACT",
        "number": "811",
        "description": f"Test Description Updated",
        "notes": f"Test Notes Updated",
    }
    resp = auth_client.patch(f"/api/v1/agreements/{oid}", json=data)
    assert resp.status_code == 200
    resp_json = resp.json
    assert "id" in resp_json
    resp_id = resp_json["id"]
    assert resp_id == oid
    get_resp = auth_client.get(f"/api/v1/agreements/{oid}", json=data)
    get_json = get_resp.json
    assert get_json.get("id", None) == oid
    for k, v in data.items():
        assert get_json.get(k, None) == data[k]

    # POST: create budget line
    data = {
        "line_description": "BLI1",
        "can_id": 1,
        "agreement_id": agreement_id,
        "amount": 1000000,
        "status": "DRAFT",
        "date_needed": "2022-3-3",
        "psc_fee_amount": None,
    }

    resp = auth_client.post(f"/api/v1/budget-line-items/", json=data)
    assert resp.status_code == 201

    assert "id" in resp.json
    bli_id = resp.json["id"]

    # PATCH: edit budget line
    oid = bli_id
    data = {
        "amount": 2000000,
        "comments": f"Comments Updated",
        "date_needed": "2021-1-1",
    }
    resp = auth_client.patch(f"/api/v1/budget-line-items/{bli_id}", json=data)
    assert resp.status_code == 200

    # DELETE budget line
    # resp = auth_client.delete(f"/api/v1/budget-line-items/{bli_id}")
    # assert resp.status_code == 200
    bli = loaded_db.get(BudgetLineItem, bli_id)
    print(bli)
    loaded_db.delete(bli)
    loaded_db.commit()

    resp = auth_client.delete(f"/api/v1/agreements/{agreement_id}")
    assert resp.status_code == 200

    resp = auth_client.get(f"/api/v1/agreements/{agreement_id}/history/?offset=0&limit=20")
    assert resp.status_code == 200
    data = resp.json
    assert len(data) == 6
    assert data[0]["change_summary"] == "ContractAgreement DELETED by Amelia Popham"
    assert data[1]["change_summary"] == "BudgetLineItem DELETED by Unknown"
    assert data[2]["change_summary"] == "BudgetLineItem UPDATED by Amelia Popham"
    assert data[3]["change_summary"] == "BudgetLineItem NEW by Amelia Popham"
    assert data[4]["change_summary"] == "ContractAgreement UPDATED by Amelia Popham"
    assert data[5]["change_summary"] == "ContractAgreement NEW by Amelia Popham"
