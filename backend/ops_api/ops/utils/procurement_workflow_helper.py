from datetime import datetime

from flask import current_app
from sqlalchemy import select

# from flask_jwt_extended import verify_jwt_in_request
from models import (
    AcquisitionPlanning,
    Agreement,
    Award,
    Evaluation,
    Package,
    PackageSnapshot,
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

# from sqlalchemy import select

# from ops_api.ops.auth.utils import get_user_from_sub

PROCUREMENT_WORKFLOW_TEMPLATE_NAME = "Procurement Tracker"

workflow_step_to_procurement_class_map = {
    "Acquisition Planning": AcquisitionPlanning,
    "Pre-Solicitation": PreSolicitation,
    "Solicitation": Solicitation,
    # ISSUE: can't have two workflow steps go the same procurement step (ProcurementStep.workflow_step_id)
    # "Evaluation Approval": Evaluation,
    "Evaluation Attestation": Evaluation,
    "Pre-Award": PreAward,
    "Award": Award,
}


def get_procurement_workflow_template() -> WorkflowTemplate:
    procurement_workflow_template = (
        current_app.db_session.query(WorkflowTemplate).filter_by(name=PROCUREMENT_WORKFLOW_TEMPLATE_NAME).first()
    )
    return procurement_workflow_template


def create_procurement_workflow(agreement_id) -> WorkflowInstance:
    session = current_app.db_session
    agreement = session.get(Agreement, agreement_id)
    if not agreement:
        raise ValueError("Invalid Agreement ID")

    # if it already exists, just return it
    if agreement.procurement_tracker_workflow_id:
        return session.get(WorkflowInstance, agreement.procurement_tracker_workflow_id)

    user_id = None
    # TODO: How to get user when there might not be a request (in testing, etc)
    # token = verify_jwt_in_request()
    # user = get_user_from_sub(token[1])

    workflow_template = get_procurement_workflow_template()

    workflow_instance = WorkflowInstance()
    workflow_instance.workflow_template_id = workflow_template.id
    workflow_instance.associated_id = agreement_id
    workflow_instance.associated_type = WorkflowTriggerType.AGREEMENT
    workflow_instance.workflow_action = WorkflowAction.PROCUREMENT_TRACKING
    workflow_instance.created_by = user_id

    session.add(workflow_instance)
    # This fails since no ID before save
    # assert workflow_instance.id is not None
    session.commit()
    assert workflow_instance.id

    # package and snapshot
    package = Package()
    package.submitter_id = user_id
    package.workflow_instance_id = workflow_instance.id
    # package.notes = ""
    session.add(package)
    session.commit()
    assert package.id
    package_snapshot = PackageSnapshot()
    package_snapshot.package_id = package.id
    package_snapshot.object_type = "AGREEMENT"
    package_snapshot.object_id = agreement_id
    session.add(package_snapshot)
    session.commit()
    assert package_snapshot.id

    workflow_step_template: WorkflowStepTemplate
    for workflow_step_template in workflow_template.steps:
        # workflow step
        workflow_step_instance = WorkflowStepInstance()
        workflow_step_instance.workflow_instance_id = workflow_instance.id
        workflow_step_instance.workflow_step_template_id = workflow_step_template.id
        workflow_step_instance.index = workflow_step_template.index
        workflow_step_instance.status = WorkflowStepStatus.REVIEW  # ???
        # workflow_step_instance.notes = ""
        workflow_step_instance.time_started = datetime.now()
        workflow_step_instance.created_by = user_id
        session.add(workflow_step_instance)
        session.commit()
        assert workflow_step_instance.id

        # procurement step
        procurement_step_class = workflow_step_to_procurement_class_map.get(workflow_step_template.name, None)
        if procurement_step_class is not None:
            proc_step: ProcurementStep = procurement_step_class()
            proc_step.agreement_id = agreement_id
            proc_step.workflow_step_id = workflow_step_instance.id
            proc_step.created_by = user_id
            session.add(proc_step)
            session.commit()
            assert proc_step.id

    return workflow_instance


def delete_procurement_workflow(agreement_id):
    session = current_app.db_session
    agreement = session.get(Agreement, agreement_id)

    # remove procurement steps
    stmt = select(ProcurementStep).where(ProcurementStep.agreement_id == agreement_id)
    procurement_step_results = session.execute(stmt).all()
    procurement_steps = [p[0] for p in procurement_step_results]
    procurement_step: ProcurementStep
    for procurement_step in procurement_steps:
        session.delete(procurement_step)

    # remove workflow, it's steps, packages, and package snapshots (Should there be more cascading for this?)
    workflow_id = agreement.procurement_tracker_workflow_id
    if workflow_id is not None:
        workflow_instance = session.get(WorkflowInstance, workflow_id)
        for workflow_step in workflow_instance.steps:
            session.delete(workflow_step)
        stmt = select(Package).where(Package.workflow_instance_id == workflow_instance.id)
        package_results = session.execute(stmt).all()
        packages = [p[0] for p in package_results]
        for package in packages:
            stmt = select(PackageSnapshot).where(PackageSnapshot.package_id == package.id)
            snapshot_results = session.execute(stmt).all()
            package_snapshots = [p[0] for p in snapshot_results]
            for package_snapshot in package_snapshots:
                session.delete(package_snapshot)
            session.delete(package)
        session.delete(workflow_instance)

    session.commit()
