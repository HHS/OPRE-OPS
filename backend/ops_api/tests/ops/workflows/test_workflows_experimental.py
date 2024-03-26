import pytest
from flask import url_for

from models import (
    AgreementChangeRequest,
    BudgetLineItem,
    BudgetLineItemChangeRequest,
    BudgetLineItemStatus,
    ChangeRequest,
)


@pytest.mark.usefixtures("app_ctx")
def test_change_request(auth_client, app):
    session = app.db_session
    change_request = ChangeRequest()
    change_request.created_by = 1
    change_request.requested_changes = {"foo": "bar"}
    session.add(change_request)
    session.commit()

    assert change_request.id is not None
    new_change_request_id = change_request.id
    change_request = session.get(ChangeRequest, new_change_request_id)
    assert change_request.type == "change_request"


@pytest.mark.usefixtures("app_ctx")
def test_agreement_change_request(auth_client, app):
    session = app.db_session
    change_request = AgreementChangeRequest()
    change_request.agreement_id = 1
    change_request.created_by = 1
    change_request.requested_changes = {"foo": "bar"}
    session.add(change_request)
    session.commit()

    assert change_request.id is not None
    new_change_request_id = change_request.id
    change_request = session.get(ChangeRequest, new_change_request_id)
    assert change_request.type == "agreement_change_request"


@pytest.mark.usefixtures("app_ctx")
def test_budget_line_item_change_request(auth_client, app):
    session = app.db_session
    change_request = BudgetLineItemChangeRequest()
    change_request.budget_line_item_id = 1
    change_request.created_by = 1
    change_request.requested_changes = {"foo": "bar"}
    session.add(change_request)
    session.commit()

    assert change_request.id is not None
    new_change_request_id = change_request.id
    change_request = session.get(ChangeRequest, new_change_request_id)
    assert change_request.type == "budget_line_item_change_request"


@pytest.mark.usefixtures("app_ctx")
def test_budget_line_item_patch_to_change_request(auth_client, app):
    session = app.db_session
    bli = BudgetLineItem(
        line_description="Grant Expenditure GA999",
        agreement_id=1,
        can_id=1,
        amount=111.11,
        status=BudgetLineItemStatus.PLANNED,
    )
    session.add(bli)
    session.commit()
    assert bli.id is not None

    data = {"amount": 222.22}
    response = auth_client.patch(url_for("api.budget-line-items-item", id=bli.id), json=data)
    assert response.status_code == 202
    resp_json = response.json
    import json

    print(json.dumps(resp_json))

    assert "id" in resp_json
    change_request_id = resp_json["id"]
    change_request = session.get(BudgetLineItemChangeRequest, change_request_id)
    assert change_request is not None
    print(json.dumps(change_request.to_dict()))
    print(json.dumps(change_request.requested_changes))
    assert change_request.type == "budget_line_item_change_request"
    assert change_request.budget_line_item_id == bli.id
