import pytest
from sqlalchemy import select

from models import Agreement, Package, PackageSnapshot, WorkflowAction, WorkflowInstance, WorkflowTemplate
from models.procurement_tracker import (
    AcquisitionPlanning,
    Award,
    Evaluation,
    PreAward,
    PreSolicitation,
    ProcurementStep,
    Solicitation,
)
from ops_api.ops.utils.procurement_workflow_helper import (
    create_procurement_workflow,
    delete_procurement_workflow,
    get_procurement_workflow_template,
)


@pytest.mark.usefixtures("app_ctx", "loaded_db")
def test_get_procurement_workflow_template(loaded_db):
    template: WorkflowTemplate = get_procurement_workflow_template()
    assert template.name == "Procurement Tracker"


@pytest.mark.usefixtures("app_ctx", "loaded_db")
def test_create_procurement_workflow(loaded_db):
    test_agreement_id = 1
    workflow_instance: WorkflowInstance = create_procurement_workflow(test_agreement_id)
    assert workflow_instance.id is not None
    workflow_instance_id = workflow_instance.id

    assert len(workflow_instance.steps) == 7
    assert workflow_instance.steps[0].workflow_step_template.name == "Acquisition Planning"
    acquisition_planning_workflow_step = workflow_instance.steps[0]
    assert workflow_instance.steps[1].workflow_step_template.name == "Pre-Solicitation"
    pre_solicitation_workflow_step = workflow_instance.steps[1]
    assert workflow_instance.steps[2].workflow_step_template.name == "Solicitation"
    solicitation_workflow_step = workflow_instance.steps[2]
    assert workflow_instance.steps[3].workflow_step_template.name == "Evaluation Approval"
    # evaluation_approval_workflow_step = workflow_instance.steps[3]
    assert workflow_instance.steps[4].workflow_step_template.name == "Evaluation Attestation"
    evaluation_attestation_workflow_step = workflow_instance.steps[4]
    assert workflow_instance.steps[5].workflow_step_template.name == "Pre-Award"
    pre_award_workflow_step = workflow_instance.steps[5]
    assert workflow_instance.steps[6].workflow_step_template.name == "Award"
    award_workflow_step = workflow_instance.steps[6]

    # package
    # Q: package model is 1-to-many with workflow? if it was 1-1 this could be just workflow_instance.package
    stmt = select(Package).where(Package.workflow_instance_id == workflow_instance.id)
    package_results = loaded_db.execute(stmt).all()
    assert len(package_results) == 1
    package: Package = package_results[0][0]
    assert package.id
    assert package.workflow_instance_id == workflow_instance.id

    # snapshot has agreement ID
    stmt = select(PackageSnapshot).where(PackageSnapshot.package_id == package.id)
    snapshot_results = loaded_db.execute(stmt).all()
    assert len(snapshot_results) == 1
    package_snapshot: PackageSnapshot = snapshot_results[0][0]
    assert package_snapshot.object_type == "AGREEMENT"
    assert package_snapshot.object_id == test_agreement_id

    agreement = loaded_db.get(Agreement, test_agreement_id)
    assert agreement.procurement_tracker_workflow_id == workflow_instance.id
    workflow_instance = loaded_db.get(WorkflowInstance, workflow_instance.id)
    assert workflow_instance.workflow_action == WorkflowAction.PROCUREMENT_TRACKING

    # procurement steps tied to this agreement and workflow steps
    stmt = select(ProcurementStep).where(ProcurementStep.agreement_id == test_agreement_id)
    procurement_step_results = loaded_db.execute(stmt).all()
    assert len(procurement_step_results) == 6
    procurement_steps = [p[0] for p in procurement_step_results]
    procurement_step: ProcurementStep
    for procurement_step in procurement_steps:
        if isinstance(procurement_step, AcquisitionPlanning):
            assert procurement_step.workflow_step_id == acquisition_planning_workflow_step.id
        elif isinstance(procurement_step, PreSolicitation):
            assert procurement_step.workflow_step_id == pre_solicitation_workflow_step.id
        elif isinstance(procurement_step, Solicitation):
            assert procurement_step.workflow_step_id == solicitation_workflow_step.id
        elif isinstance(procurement_step, Evaluation):
            assert procurement_step.workflow_step_id == evaluation_attestation_workflow_step.id
        elif isinstance(procurement_step, PreAward):
            assert procurement_step.workflow_step_id == pre_award_workflow_step.id
        elif isinstance(procurement_step, Award):
            assert procurement_step.workflow_step_id == award_workflow_step.id

    # delete workflow
    delete_procurement_workflow(test_agreement_id)

    # verify removal
    agreement = loaded_db.get(Agreement, test_agreement_id)
    assert agreement.procurement_tracker_workflow_id is None
    stmt = select(Package).where(Package.workflow_instance_id == workflow_instance_id)
    package_results = loaded_db.execute(stmt).all()
    assert len(package_results) == 0
    stmt = select(PackageSnapshot).where(PackageSnapshot.package_id == package.id)
    snapshot_results = loaded_db.execute(stmt).all()
    assert len(snapshot_results) == 0
