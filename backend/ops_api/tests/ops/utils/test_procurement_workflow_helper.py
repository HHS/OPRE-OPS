import pytest
from models import WorkflowInstance, WorkflowTemplate
from ops_api.ops.utils.procurement_workflow_helper import create_procurement_workflow, get_procurement_workflow_template


@pytest.mark.usefixtures("app_ctx", "loaded_db")
def test_get_procurement_workflow_template(loaded_db):
    template: WorkflowTemplate = get_procurement_workflow_template()
    assert template.name == "Procurement Tracker"


@pytest.mark.usefixtures("app_ctx", "loaded_db")
def test_create_procurement_workflow(loaded_db):
    test_agreement_id = 1
    workflow_instance: WorkflowInstance = create_procurement_workflow(test_agreement_id)
    # print(json.dumps(workflow_instance.to_dict(), indent=2, default=str))
    # step: WorkflowStepInstance
    # print("~~~ workflow steps ~~~~")
    # for step in workflow_instance.steps:
    #     print(step.index, step.workflow_step_template.name)
    # for step in workflow_instance.steps:
    #     print("~~~ workflow step ~~~~")
    #     print(step.index, step.workflow_step_template.name)
    #     print("~~~ workflow ~~~~")
    #     print(json.dumps(step.to_dict(), indent=2, default=str))

    assert len(workflow_instance.steps) == 7
    assert workflow_instance.steps[0].workflow_step_template.name == "Acquisition Planning"
    assert workflow_instance.steps[1].workflow_step_template.name == "Pre-Solicitation"
    assert workflow_instance.steps[2].workflow_step_template.name == "Solicitation"
    assert workflow_instance.steps[3].workflow_step_template.name == "Evaluation Approval"
    assert workflow_instance.steps[4].workflow_step_template.name == "Evaluation Attestation"
    assert workflow_instance.steps[5].workflow_step_template.name == "Pre-Award"
    assert workflow_instance.steps[6].workflow_step_template.name == "Award"

    # TODO: Q: package model is 1-to-many with workflow?
    # TODO: check package
    # TODO: find this workflow by agreement_id
    # TODO: verify procurement steps related to this
