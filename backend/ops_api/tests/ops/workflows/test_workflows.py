import pytest

from models.workflows import (
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
