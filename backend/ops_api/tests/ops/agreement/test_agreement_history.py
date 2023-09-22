import pytest
from models.cans import BudgetLineItem


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
    resp = auth_client.post("/api/v1/agreements/", json=data)
    assert resp.status_code == 201
    assert "id" in resp.json
    agreement_id = resp.json["id"]

    # PATCH: edit agreement
    data = {
        "agreement_type": "CONTRACT",
        "number": "811",
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
        "can_id": 1,
        "agreement_id": agreement_id,
        "amount": 1000000,
        "status": "DRAFT",
        "date_needed": "2022-3-3",
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
        "date_needed": "2021-1-1",
    }
    resp = auth_client.patch(f"/api/v1/budget-line-items/{bli_id}", json=data)
    assert resp.status_code == 200

    # DELETE budget line
    # resp = auth_client.delete(f"/api/v1/budget-line-items/{bli_id}")
    # assert resp.status_code == 200
    bli = loaded_db.get(BudgetLineItem, bli_id)
    loaded_db.delete(bli)
    loaded_db.commit()

    resp = auth_client.delete(f"/api/v1/agreements/{agreement_id}")
    assert resp.status_code == 200

    resp = auth_client.get(
        f"/api/v1/agreements/{agreement_id}/history/?offset=0&limit=20"
    )
    assert resp.status_code == 200
    data = resp.json
    assert len(data) == 6
    assert data[0]["class_name"] == "ContractAgreement"
    assert data[0]["event_type"] == "DELETED"
    assert len(data[0]["changes"]) == 0
    assert data[1]["class_name"] == "BudgetLineItem"
    assert data[1]["event_type"] == "DELETED"
    assert len(data[1]["changes"]) == 0
    assert data[2]["class_name"] == "BudgetLineItem"
    assert data[2]["event_type"] == "UPDATED"
    assert len(data[2]["changes"]) == 3
    assert data[3]["class_name"] == "BudgetLineItem"
    assert data[3]["event_type"] == "NEW"
    assert len(data[3]["changes"]) == 7
    assert data[4]["class_name"] == "ContractAgreement"
    assert data[4]["event_type"] == "UPDATED"
    assert len(data[4]["changes"]) == 2
    assert data[5]["class_name"] == "ContractAgreement"
    assert data[5]["event_type"] == "NEW"
    assert len(data[5]["changes"]) == 11
