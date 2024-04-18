import datetime
from decimal import Decimal

import pytest
from flask import url_for

from models import (
    AgreementChangeRequest,
    BudgetLineItem,
    BudgetLineItemChangeRequest,
    BudgetLineItemStatus,
    ChangeRequest,
    WorkflowAction,
    WorkflowInstance,
    WorkflowStepInstance,
    WorkflowStepStatus,
    WorkflowStepTemplate,
    WorkflowStepType,
    WorkflowTemplate,
    WorkflowTriggerType,
)


@pytest.mark.usefixtures("app_ctx")
def test_workflow_instance_retrieve(auth_client, loaded_db):
    workflow_instance = loaded_db.get(WorkflowInstance, 1)

    assert workflow_instance is not None
    assert workflow_instance.associated_type == WorkflowTriggerType.CAN
    assert workflow_instance.associated_id == 1
    assert workflow_instance.workflow_template_id == 1
    assert workflow_instance.workflow_action == WorkflowAction.DRAFT_TO_PLANNED
    assert workflow_instance.workflow_status == WorkflowStepStatus.APPROVED


@pytest.mark.usefixtures("app_ctx")
def test_workflow_step_instance_retrieve(auth_client, loaded_db):
    workflow_step_instance = loaded_db.get(WorkflowStepInstance, 1)

    assert workflow_step_instance is not None
    assert workflow_step_instance.workflow_instance_id == 1
    assert workflow_step_instance.workflow_step_template_id == 1
    assert workflow_step_instance.status == WorkflowStepStatus.APPROVED
    assert workflow_step_instance.notes == "Need approved ASAP!"
    assert workflow_step_instance.time_started is not None
    assert workflow_step_instance.time_completed is not None


@pytest.mark.usefixtures("app_ctx")
def test_workflow_template_retrieve(auth_client, loaded_db):
    workflow_template = loaded_db.get(WorkflowTemplate, 1)

    assert workflow_template is not None
    assert workflow_template.name == "Basic Approval"
    assert workflow_template.steps is not None


@pytest.mark.usefixtures("app_ctx")
def test_workflow_step_template_retrieve(auth_client, loaded_db):
    workflow_step_template = loaded_db.get(WorkflowStepTemplate, 1)

    assert workflow_step_template is not None
    assert workflow_step_template.name == "Initial Review"
    assert workflow_step_template.workflow_type == WorkflowStepType.APPROVAL
    assert workflow_step_template.index == 0
    assert workflow_step_template.step_approvers is not None


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_get_workflow_instance_by_id(auth_client):
    response = auth_client.get("/api/v1/workflow-instance/1")
    assert response.status_code == 200
    assert response.json["id"] == 1


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_get_workflow_step_instance_by_id(auth_client):
    response = auth_client.get("/api/v1/workflow-step-instance/1")
    assert response.status_code == 200
    assert response.json["id"] == 1


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_get_workflow_template_by_id(auth_client):
    response = auth_client.get("/api/v1/workflow-template/1")
    assert response.status_code == 200
    assert response.json["id"] == 1


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_get_workflow_step_template_by_id(auth_client):
    response = auth_client.get("/api/v1/workflow-step-template/1")
    assert response.status_code == 200
    assert response.json["id"] == 1


# ---=== CHANGE REQUESTS ===---


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

    session.delete(change_request)
    session.commit()


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

    session.delete(change_request)
    session.commit()


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

    session.delete(change_request)
    session.commit()


@pytest.mark.usefixtures("app_ctx")
def test_budget_line_item_patch_with_budgets_change_requests(auth_client, app):
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

    #  submit PATCH BLI which triggers a budget change requests
    data = {"amount": 222.22, "can_id": 2, "date_needed": "2032-02-02"}
    response = auth_client.patch(url_for("api.budget-line-items-item", id=bli_id), json=data)
    assert response.status_code == 202
    resp_json = response.json
    import json

    print("~~~BLI PATCH response~~~", json.dumps(resp_json, indent=2))

    assert "change_request_ids" in resp_json
    change_request_ids = resp_json["change_request_ids"]

    can_id_change_request_id = None

    # verify each change request was created
    for change_request_id in change_request_ids:
        change_request = session.get(ChangeRequest, change_request_id)
        assert change_request is not None
        print("~~~change_request~~~\n", json.dumps(change_request.to_dict(), indent=2))
        print("~~~requested_changes~~~\n", json.dumps(change_request.requested_changes, indent=2))
        assert change_request.type == "budget_line_item_change_request"
        assert change_request.budget_line_item_id == bli_id
        assert change_request.has_budget_change is True
        assert change_request.has_status_change is False
        if "can_id" in change_request.requested_changes:
            assert can_id_change_request_id is None
            can_id_change_request_id = change_request_id

    assert can_id_change_request_id is not None

    # verify the BLI was not updated yet
    bli = session.get(BudgetLineItem, bli_id)
    assert str(bli.amount) == "111.11"
    assert bli.amount == Decimal("111.11")
    assert bli.can_id == 1
    assert bli.date_needed is None
    print(f"~~~{bli.change_request_ids_in_review=}~~~")
    assert set(bli.change_request_ids_in_review) == set(change_request_ids)
    print("~~~change_requests_in_review~~~", json.dumps(bli.change_request_ids_in_review, indent=2))
    assert len(bli.change_requests_in_review) == len(change_request_ids)

    # verify the change requests exists in the list (IN_REVIEW)
    response = auth_client.get(f"{url_for('api.change-request-list')}?budget_line_item_id={bli_id}&status=IN_REVIEW")
    assert response.status_code == 200
    resp_json = response.json
    print("~~~change-request-list~~~", json.dumps(resp_json, indent=2))
    assert len(resp_json) == len(change_request_ids)

    # verify the change requests are in the BLI
    response = auth_client.get(url_for("api.budget-line-items-item", id=bli_id))
    assert response.status_code == 200
    resp_json = response.json
    print("~~~BLI GET response~~~", json.dumps(resp_json, indent=2))
    assert "change_requests_in_review" in resp_json

    # review the change requests, reject the can_id change request and approve the others
    for change_request_id in change_request_ids:
        action = "REJECT" if change_request_id == can_id_change_request_id else "APPROVE"
        print(f"~~~review_change_request~~~\n{change_request_id=}\n{action=}")
        data = {"change_request_id": change_request_id, "action": action}
        response = auth_client.post(url_for("api.change-request-review-list"), json=data)
        assert response.status_code == 200

    # verify the BLI was updated
    bli = session.get(BudgetLineItem, bli_id)
    assert bli.amount == Decimal("222.22")
    assert bli.can_id == 1  # can_id change request was rejected
    assert bli.date_needed == datetime.date(2032, 2, 2)
    assert bli.change_request_ids_in_review is None

    # verify the change requests no longer are in the list (IN_REVIEW)
    response = auth_client.get(f"{url_for('api.change-request-list')}?budget_line_item_id={bli_id}&status=IN_REVIEW")
    assert response.status_code == 200
    resp_json = response.json
    print("~~~change-request-list~~~", json.dumps(resp_json, indent=2))
    assert len(resp_json) == 0

    # verify delete cascade
    session.delete(bli)
    session.commit()
    for change_request_id in change_request_ids:
        change_request = session.get(BudgetLineItemChangeRequest, change_request_id)
        assert change_request is None
    bli = session.get(BudgetLineItem, bli_id)
    assert bli is None
