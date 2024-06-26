import datetime
from unittest.mock import Mock

import pytest

from models import (
    Agreement,
    AgreementReason,
    AgreementType,
    BudgetLineItem,
    BudgetLineItemStatus,
    ContractAgreement,
    ContractType,
    ServiceRequirementType,
    WorkflowAction,
    WorkflowInstance,
    WorkflowStepInstance,
    WorkflowStepStatus,
)
from ops_api.ops.resources.workflow_approve import update_blis
from ops_api.ops.utils.procurement_workflow_helper import delete_procurement_workflow


@pytest.mark.usefixtures("app_ctx", "loaded_db")
def test_update_blis_draft_to_planned(loaded_db):
    # Create a mock WorkflowStepInstance with the required attributes
    workflow_step_instance = Mock(spec=WorkflowStepInstance)
    workflow_step_instance.workflow_instance.workflow_status = WorkflowStepStatus.APPROVED
    workflow_step_instance.workflow_instance.workflow_action = WorkflowAction.DRAFT_TO_PLANNED
    workflow_step_instance.package_entities = {"budget_line_item_ids": [1, 2, 3]}

    # Use loaded_db to create or mock BudgetLineItems
    bli1 = loaded_db.get(BudgetLineItem, 1)
    bli2 = loaded_db.get(BudgetLineItem, 2)
    bli3 = loaded_db.get(BudgetLineItem, 3)
    blis = [bli1, bli2, bli3]

    # Call the function
    update_blis(workflow_step_instance)

    # Assert that the status of each BudgetLineItem is set to BudgetLineItemStatus.PLANNED
    for bli in blis:
        assert bli.status == BudgetLineItemStatus.PLANNED


@pytest.mark.usefixtures("app_ctx", "loaded_db")
def test_workflow_draft_to_planned(auth_client, loaded_db, test_admin_user, test_project):
    agreement = ContractAgreement(
        name="CTXX12399",
        description="test contract",
        agreement_reason=AgreementReason.NEW_REQ,
        contract_type=ContractType.FIRM_FIXED_PRICE,
        service_requirement_type=ServiceRequirementType.SEVERABLE,
        product_service_code_id=2,
        agreement_type=AgreementType.CONTRACT,
        procurement_shop_id=1,
        project_officer_id=test_admin_user.id,
        project_id=test_project.id,
        created_by=test_admin_user.id,
    )
    loaded_db.add(agreement)
    loaded_db.commit()
    assert agreement.id is not None
    agreement_id = agreement.id
    assert agreement.procurement_tracker_workflow_id is None

    bli = BudgetLineItem(
        agreement_id=agreement_id,
        can_id=1,
        amount=123456.78,
        status=BudgetLineItemStatus.DRAFT,
        date_needed=datetime.date(2043, 1, 1),
    )
    loaded_db.add(bli)
    loaded_db.commit()
    assert bli.id is not None
    bli_id = bli.id

    data = {
        "budget_line_item_ids": [bli_id],
        "notes": "test notes",
        "workflow_action": "DRAFT_TO_PLANNED",
    }

    bli: BudgetLineItem = loaded_db.get(BudgetLineItem, bli_id)
    assert not bli.has_active_workflow
    assert not bli.active_workflow_current_step_id

    response = auth_client.post("/api/v1/workflow-submit/", json=data)
    assert response.status_code == 201

    bli: BudgetLineItem = loaded_db.get(BudgetLineItem, bli_id)
    assert bli.status == BudgetLineItemStatus.DRAFT
    assert bli.has_active_workflow
    assert bli.active_workflow_current_step_id

    workflow_step_instance: WorkflowStepInstance = loaded_db.get(
        WorkflowStepInstance, bli.active_workflow_current_step_id
    )
    package_entities = workflow_step_instance.package_entities
    assert "budget_line_item_ids" in package_entities
    assert package_entities["budget_line_item_ids"] == [bli.id]

    data = {
        "workflow_step_action": "APPROVE",
        "workflow_step_id": bli.active_workflow_current_step_id,
        "notes": "notes with approval",
    }

    response = auth_client.post("/api/v1/workflow-approve/", json=data)
    assert response.status_code == 200

    bli: BudgetLineItem = loaded_db.get(BudgetLineItem, bli_id)
    assert bli.status == BudgetLineItemStatus.PLANNED
    assert not bli.has_active_workflow
    assert not bli.active_workflow_current_step_id

    loaded_db.delete(bli)
    loaded_db.delete(agreement)
    loaded_db.commit()


@pytest.mark.usefixtures("app_ctx", "loaded_db")
def test_workflow_planned_to_executing(auth_client, loaded_db, test_admin_user, test_project):
    agreement = ContractAgreement(
        name="CTXX12399",
        description="test contract",
        agreement_reason=AgreementReason.NEW_REQ,
        contract_type=ContractType.FIRM_FIXED_PRICE,
        service_requirement_type=ServiceRequirementType.SEVERABLE,
        product_service_code_id=2,
        agreement_type=AgreementType.CONTRACT,
        procurement_shop_id=1,
        project_officer_id=test_admin_user.id,
        project_id=test_project.id,
        created_by=test_admin_user.id,
    )
    loaded_db.add(agreement)
    loaded_db.commit()
    assert agreement.id is not None
    agreement_id = agreement.id
    assert agreement.procurement_tracker_workflow_id is None

    bli = BudgetLineItem(
        agreement_id=agreement_id,
        can_id=1,
        amount=123456.78,
        status=BudgetLineItemStatus.PLANNED,
        date_needed=datetime.date(2043, 1, 1),
    )
    loaded_db.add(bli)
    loaded_db.commit()
    assert bli.id is not None
    bli_id = bli.id

    data = {
        "budget_line_item_ids": [bli_id],
        "notes": "test notes",
        "workflow_action": "PLANNED_TO_EXECUTING",
    }

    bli: BudgetLineItem = loaded_db.get(BudgetLineItem, bli_id)
    assert not bli.has_active_workflow
    assert not bli.active_workflow_current_step_id

    response = auth_client.post("/api/v1/workflow-submit/", json=data)
    assert response.status_code == 201

    bli: BudgetLineItem = loaded_db.get(BudgetLineItem, bli_id)
    assert bli.status == BudgetLineItemStatus.PLANNED
    assert bli.has_active_workflow
    assert bli.active_workflow_current_step_id

    workflow_step_instance: WorkflowStepInstance = loaded_db.get(
        WorkflowStepInstance, bli.active_workflow_current_step_id
    )
    package_entities = workflow_step_instance.package_entities
    assert "budget_line_item_ids" in package_entities
    assert package_entities["budget_line_item_ids"] == [bli.id]

    data = {
        "workflow_step_action": "APPROVE",
        "workflow_step_id": bli.active_workflow_current_step_id,
        "notes": "notes with approval",
    }

    response = auth_client.post("/api/v1/workflow-approve/", json=data)
    assert response.status_code == 200

    bli: BudgetLineItem = loaded_db.get(BudgetLineItem, bli_id)
    assert bli.status == BudgetLineItemStatus.IN_EXECUTION
    assert not bli.has_active_workflow
    assert not bli.active_workflow_current_step_id

    agreement: Agreement = loaded_db.get(Agreement, agreement_id)
    assert agreement.procurement_tracker_workflow_id

    workflow_instance = loaded_db.get(WorkflowInstance, agreement.procurement_tracker_workflow_id)
    assert workflow_instance.workflow_action == WorkflowAction.PROCUREMENT_TRACKING

    response = auth_client.get(f"/api/v1/agreements/{agreement_id}")
    assert response.status_code == 200
    resp_json = response.json
    assert resp_json["procurement_tracker_workflow_id"] is not None

    delete_procurement_workflow(agreement_id)
    loaded_db.delete(bli)
    loaded_db.delete(agreement)
    loaded_db.commit()
    # more cleanup? delete approval workflows, etc?
