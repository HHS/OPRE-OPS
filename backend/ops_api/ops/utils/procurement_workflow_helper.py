from flask import current_app
from models import WorkflowAction, WorkflowInstance, WorkflowTemplate, WorkflowTriggerType


def get_procurement_workflow_template() -> WorkflowTemplate:
    # TODO: remove hard code ID=2, find a non-brittle way to get it
    procurement_workflow_template: WorkflowTemplate = current_app.db_session.get(WorkflowTemplate, 2)
    return procurement_workflow_template


def create_procurement_workflow(agreement_id):
    procurement_workflow_template = get_procurement_workflow_template()
    procurement_workflow = WorkflowInstance()
    procurement_workflow.workflow_template_id = procurement_workflow_template.id
    procurement_workflow.associated_id = agreement_id
    procurement_workflow.associated_type = WorkflowTriggerType.AGREEMENT
    procurement_workflow.workflow_action = WorkflowAction.GENERIC
