import pytest
from flask import url_for
from models.cans import BudgetLineItem
from models.workflows import BliPackage, WorkflowStepInstance, WorkflowInstance, WorkflowAction, WorkflowStatus, WorkflowTriggerType

@pytest.mark.usefixtures("app_ctx")
def test_workflow_instance_retrieve(auth_client, loaded_db):
    #workflow_instance = loaded_db.get(WorkflowInstance, 1)
    workflow_instance = loaded_db.query(WorkflowInstance).filter(WorkflowInstance.id == 1).one()
    
    assert workflow_instance is not None
    assert workflow_instance.associated_type == WorkflowTriggerType.CAN
    assert workflow_instance.associated_id == 1
    assert workflow_instance.workflow_template_id == 1
    assert workflow_instance.workflow_action == WorkflowAction.DRAFT_TO_PLANNED
    assert workflow_instance.workflow_status == WorkflowStatus.APPROVED


@pytest.mark.usefixtures("app_ctx")
def test_workflow_step_instance_retrieve(auth_client, loaded_db):
    workflow_step_instance = loaded_db.query(WorkflowStepInstance).filter(WorkflowStepInstance.id == 1).one() # loaded_db.get(WorkflowStepInstance, 1)

    assert workflow_step_instance is not None
    assert workflow_step_instance.workflow_instance_id == 1
    assert workflow_step_instance.workflow_step_template_id == 1
    assert workflow_step_instance.status == WorkflowStatus.APPROVED
    assert workflow_step_instance.notes == "Need approved ASAP!"
    assert workflow_step_instance.time_started is not None
    assert workflow_step_instance.time_completed is not None
