import datetime
from decimal import Decimal

import pytest
from flask import url_for

from models import (
    AgreementChangeRequest,
    BudgetLineItem,
    BudgetLineItemChangeRequest,
    BudgetLineItemFinancialChangeRequest,
    BudgetLineItemStatus,
    ChangeRequest,
)
from ops_api.ops.resources.change_requests import approve_change_request


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
def test_budget_line_item_patch_to_financial_change_request(auth_client, app):
    session = app.db_session
    #  create PLANNED BLI
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
    bli_id = bli.id

    #  submit PATCH BLI which triggers a financial change request
    data = {"amount": 222.22, "date_needed": "2032-02-02"}
    response = auth_client.patch(url_for("api.budget-line-items-item", id=bli_id), json=data)
    assert response.status_code == 202
    resp_json = response.json
    import json

    print(json.dumps(resp_json, indent=2))

    assert "id" in resp_json
    change_request_id = resp_json["id"]

    # verify the change request was created
    change_request = session.get(BudgetLineItemFinancialChangeRequest, change_request_id)
    assert change_request is not None
    print("~~~change_request~~~\n", json.dumps(change_request.to_dict(), indent=2))
    print("~~~requested_changes~~~\n", json.dumps(change_request.requested_changes, indent=2))
    assert change_request.type == "budget_line_item_financial_change_request"
    assert change_request.budget_line_item_id == bli_id

    # verify the BLI was not updated yet
    bli = session.get(BudgetLineItem, bli_id)
    assert str(bli.amount) == "111.11"
    assert bli.amount == Decimal("111.11")
    assert bli.date_needed is None

    # approve the change request
    approve_change_request(change_request_id, 1)

    # verify the BLI was updated
    bli = session.get(BudgetLineItem, bli_id)
    assert bli.amount == Decimal("222.22")
    assert bli.date_needed == datetime.date(2032, 2, 2)
