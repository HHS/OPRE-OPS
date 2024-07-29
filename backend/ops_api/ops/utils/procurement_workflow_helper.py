from flask import current_app
from flask_jwt_extended import current_user
from sqlalchemy import select

# from flask_jwt_extended import verify_jwt_in_request
from models import Agreement, Package, PackageSnapshot, WorkflowInstance, WorkflowTemplate
from models.procurement_tracker import (
    AcquisitionPlanning,
    Award,
    Evaluation,
    PreAward,
    PreSolicitation,
    ProcurementStep,
    ProcurementTracker,
    Solicitation,
)

# from sqlalchemy import select

# from ops_api.ops.auth.utils import get_user_from_sub

procurement_step_classes = [
    AcquisitionPlanning,
    PreSolicitation,
    Solicitation,
    Evaluation,
    PreAward,
    Award,
]


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


def create_procurement_workflow(agreement_id) -> ProcurementTracker:
    session = current_app.db_session
    agreement = session.get(Agreement, agreement_id)
    if not agreement:
        raise ValueError("Invalid Agreement ID")

    # if it already exists, just return it
    if agreement.procurement_tracker_id:
        return session.get(ProcurementTracker, agreement.procurement_tracker_id)

    user_id = current_user.id

    procurement_tracker = ProcurementTracker(agreement_id=agreement_id)
    session.add(procurement_tracker)
    session.commit()

    for procurement_step_class in procurement_step_classes:
        proc_step = procurement_step_class()
        proc_step.agreement_id = agreement_id
        proc_step.procurement_tracker = procurement_tracker
        proc_step.created_by = user_id
        session.add(proc_step)
        session.commit()
        assert proc_step.id

    return procurement_tracker


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
