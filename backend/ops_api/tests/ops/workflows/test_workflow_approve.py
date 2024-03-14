from unittest.mock import Mock

import pytest

from models import (
    Agreement,
    AgreementType,
    BudgetLineItem,
    BudgetLineItemStatus,
    ContractAgreement,
    ContractType,
    ServiceRequirementType,
    WorkflowAction,
    WorkflowStepInstance,
    WorkflowStepStatus,
)
from ops_api.ops.resources.workflow_approve import update_blis


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


@pytest.mark.skip("WIP: currently failing")
@pytest.mark.usefixtures("app_ctx", "loaded_db")
def test_workflow_planned_to_executing(auth_client, loaded_db):
    agreement = ContractAgreement(
        name="CTXX12399",
        contract_number="XXXX000000002",
        contract_type=ContractType.FIRM_FIXED_PRICE,
        service_requirement_type=ServiceRequirementType.SEVERABLE,
        product_service_code_id=2,
        agreement_type=AgreementType.CONTRACT,
    )
    loaded_db.add(agreement)
    loaded_db.commit()
    assert agreement.id is not None
    agreement_id = agreement.id

    bli = BudgetLineItem(
        agreement_id=agreement_id,
        can_id=1,
        amount=123456.78,
        status=BudgetLineItemStatus.PLANNED,
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

    auth_client.post("/api/v1/workflow-submit/", json=data)

    # agreement: Agreement = loaded_db.get(Agreement, agreement_id)
    # assert agreement.active_workflow_current_step_id
    bli: BudgetLineItem = loaded_db.get(BudgetLineItem, bli_id)
    assert bli.has_active_workflow
    assert bli.active_workflow_current_step_id

    data = {
        "workflow_step_action": "APPROVE",
        "workflow_step_id": agreement.active_workflow_current_step_id,
        "notes": "notes with approval",
    }

    auth_client.post("/api/v1/workflow-approve/", json=data)

    bli: BudgetLineItem = loaded_db.get(BudgetLineItem, bli_id)
    assert not bli.has_active_workflow
    assert not bli.active_workflow_current_step_id

    agreement: Agreement = loaded_db.get(Agreement, agreement_id)
    assert agreement.procurement_tracker_workflow_id

    loaded_db.delete(bli)
    loaded_db.delete(agreement)
    # TODO: more cleanup?
