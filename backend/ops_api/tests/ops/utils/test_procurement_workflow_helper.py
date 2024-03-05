import pytest
from models import (
    AcquisitionPlanning,
    Award,
    Evaluation,
    Package,
    PackageSnapshot,
    PreAward,
    PreSolicitation,
    ProcurementStep,
    Solicitation,
    WorkflowInstance,
    WorkflowTemplate,
)
from ops_api.ops.utils.procurement_workflow_helper import create_procurement_workflow, get_procurement_workflow_template
from sqlalchemy import select


@pytest.mark.usefixtures("app_ctx", "loaded_db")
def test_get_procurement_workflow_template(loaded_db):
    template: WorkflowTemplate = get_procurement_workflow_template()
    assert template.name == "Procurement Tracker"


@pytest.mark.usefixtures("app_ctx", "loaded_db")
def test_create_procurement_workflow(loaded_db):
    test_agreement_id = 1
    workflow_instance: WorkflowInstance = create_procurement_workflow(test_agreement_id)

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

    # TODO: find this workflow by agreement_id

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

    # cleanup  (is there, or should there be, cascading for more of this)
    for procurement_step in procurement_steps:
        loaded_db.delete(procurement_step)
    loaded_db.delete(package_snapshot)
    loaded_db.delete(package)
    for workflow_step in workflow_instance.steps:
        loaded_db.delete(workflow_step)
    loaded_db.delete(workflow_instance)
    loaded_db.commit()
