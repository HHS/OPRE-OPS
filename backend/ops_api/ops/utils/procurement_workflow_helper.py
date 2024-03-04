from datetime import datetime

from flask import current_app

# from flask_jwt_extended import verify_jwt_in_request
from models import (  # Package,; PackageSnapshot,
    AcquisitionPlanning,
    Award,
    Evaluation,
    PreAward,
    PreSolicitation,
    ProcurementStep,
    Solicitation,
    WorkflowAction,
    WorkflowInstance,
    WorkflowStepInstance,
    WorkflowStepStatus,
    WorkflowStepTemplate,
    WorkflowTemplate,
    WorkflowTriggerType,
)

# from ops_api.ops.utils.user import get_user_from_token

PROCUREMENT_WORKFLOW_TEMPLATE_NAME = "Procurement Tracker"

workflow_step_to_procurement_class_map = {
    "Acquisition Planning": AcquisitionPlanning,
    "Pre-Solicitation": PreSolicitation,
    "Solicitation": Solicitation,
    # ISSUE: can't have two workflow steps go the same procurement step (ProcurementStep.workflow_step_id)
    "Evaluation Approval": Evaluation,
    "Evaluation Attestation": Evaluation,
    "Pre-Award": PreAward,
    "Award": Award,
}


def get_procurement_workflow_template() -> WorkflowTemplate:
    procurement_workflow_template = (
        current_app.db_session.query(WorkflowTemplate).filter_by(name=PROCUREMENT_WORKFLOW_TEMPLATE_NAME).first()
    )
    return procurement_workflow_template


def create_procurement_workflow(agreement_id):
    user_id = None
    # TODO: How to get user when there might not be a request (in testing, etc)
    # token = verify_jwt_in_request()
    # user = get_user_from_token(token[1])
    template = get_procurement_workflow_template()
    session = current_app.db_session

    workflow_instance = WorkflowInstance()
    workflow_instance.workflow_template_id = template.id
    workflow_instance.associated_id = agreement_id
    workflow_instance.associated_type = WorkflowTriggerType.AGREEMENT
    workflow_instance.workflow_action = WorkflowAction.GENERIC
    workflow_instance.created_by = user_id

    session.add(workflow_instance)
    # This fails since no ID before save
    # assert workflow_instance.id is not None
    session.commit()

    data = {}
    workflow_step_template: WorkflowStepTemplate
    for workflow_step_template in template.steps:
        # workflow step
        workflow_step_instance = WorkflowStepInstance()
        workflow_step_instance.workflow_instance_id = workflow_instance.id
        workflow_step_instance.workflow_step_template_id = workflow_step_template.id
        workflow_step_instance.status = WorkflowStepStatus.REVIEW  # ???
        # workflow_step_instance.notes = ""
        workflow_step_instance.time_started = datetime.now()
        workflow_step_instance.created_by = user_id

        # TODO package

        session.add(workflow_step_instance)
        session.commit()
        assert workflow_step_instance.id

        # procurement step
        proc_step: ProcurementStep = workflow_step_to_procurement_class_map[workflow_step_template.name]()
        proc_step.agreement_id = agreement_id
        proc_step.workflow_step_id = workflow_step_instance.id
        proc_step.created_by = user_id
        session.add(proc_step)
        session.commit()

        # putting all into map for now for testing
        data[workflow_step_template.name] = {
            "workflow_step": {
                "class_name": workflow_step_instance.__class__.__name__,
                "data": workflow_step_instance.to_dict(),
            },
            "procurement_step": {"class_name": proc_step.__class__.__name__, "data": workflow_step_instance.to_dict()},
        }

    return data
