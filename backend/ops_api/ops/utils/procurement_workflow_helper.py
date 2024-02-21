from datetime import datetime

from flask import current_app

# from flask_jwt_extended import verify_jwt_in_request
from models import (
    Package,
    PackageSnapshot,
    WorkflowAction,
    WorkflowInstance,
    WorkflowStepInstance,
    WorkflowStepStatus,
    WorkflowTemplate,
    WorkflowTriggerType,
)

# from ops_api.ops.utils.user import get_user_from_token


def get_procurement_workflow_template() -> WorkflowTemplate:
    # TODO: remove hard code ID=2, find a non-brittle way to get it
    procurement_workflow_template: WorkflowTemplate = current_app.db_session.get(WorkflowTemplate, 2)
    return procurement_workflow_template


def create_procurement_workflow(agreement_id):
    # TODO: How to get user when there might not be a request (in testing, etc)
    # token = verify_jwt_in_request()
    # user = get_user_from_token(token[1])
    procurement_workflow_template = get_procurement_workflow_template()
    session = current_app.db_session

    procurement_workflow_instance = WorkflowInstance()
    procurement_workflow_instance.workflow_template_id = procurement_workflow_template.id
    procurement_workflow_instance.associated_id = agreement_id
    procurement_workflow_instance.associated_type = WorkflowTriggerType.AGREEMENT
    procurement_workflow_instance.workflow_action = WorkflowAction.GENERIC
    # procurement_workflow_instance.created_by = user.id
    session.add(procurement_workflow_instance)

    # TODO: eliminate hard coding of template IDs
    # maybe change model design to have step dependencies on the template
    # Also it seems like there's something missing in regard to know what step
    # instance is a step of
    acquisition_workflow_step_instance = WorkflowStepInstance()
    acquisition_workflow_step_instance.workflow_instance_id = procurement_workflow_instance.id
    acquisition_workflow_step_instance.workflow_step_template_id = 3
    acquisition_workflow_step_instance.status = WorkflowStepStatus.REVIEW
    acquisition_workflow_step_instance.notes = ""
    acquisition_workflow_step_instance.time_started = datetime.now()
    # acquisition_workflow_step_instance.created_by = user.id
    session.add(acquisition_workflow_step_instance)

    # Q: after setting the ID, can we get the instance without a query?
    procurement_workflow_instance.current_workflow_step_instance_id = acquisition_workflow_step_instance.id

    pre_solicitation_workflow_step_instance = WorkflowStepInstance()
    pre_solicitation_workflow_step_instance.workflow_instance_id = procurement_workflow_instance.id
    pre_solicitation_workflow_step_instance.workflow_step_template_id = 4
    pre_solicitation_workflow_step_instance.status = WorkflowStepStatus.REVIEW
    pre_solicitation_workflow_step_instance.notes = ""
    pre_solicitation_workflow_step_instance.time_started = datetime.now()
    # pre_solicitation_workflow_step_instance.created_by = user.id
    session.add(pre_solicitation_workflow_step_instance)

    # create other steps

    package = Package()
    # package.submitter_id = user.id
    package.workflow_instance_id = acquisition_workflow_step_instance.id
    package.notes = ""
    session.add(package)

    package_snapshot = PackageSnapshot()
    package_snapshot.package_id = package.id
    package_snapshot.object_type = "AGREEMENT"
    package_snapshot.object_id = agreement_id
    session.add(package_snapshot)

    session.commit()

    # TODO: maybe just return the workflow instance
    # adding the first step until there's an easier way to get
    # the desired step from just the workflow instance
    return procurement_workflow_instance, acquisition_workflow_step_instance
