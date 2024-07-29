# from datetime import datetime
# from unittest.mock import Mock
#
# import pytest
#
# from models import Package, PackageSnapshot, WorkflowAction, WorkflowInstance, WorkflowStepInstance, WorkflowStepStatus
# from models.workflows import WorkflowTriggerType


# TODO: Replace with test for create_procurement_tracker
# @pytest.mark.usefixtures("app_ctx", "loaded_db")
# def test_creating_procurement_tracker_workflow(loaded_db):
#     # Create a mock WorkflowStepInstance with the required attributes
#
#     # Where and how should we create a Procurement workflow?
#     # Do we want to rework the dependencies
#
#     procurement_workflow = Mock(spec=WorkflowInstance)
#     procurement_workflow.workflow_template_id = 2
#     procurement_workflow.associated_id = 1
#     procurement_workflow.associated_type = WorkflowTriggerType.AGREEMENT
#     procurement_workflow.workflow_action = WorkflowAction.GENERIC
#
#     # workflow_template = Mock(spec=WorkflowTemplate)
#     # workflow_template =
#     # for step in workflow_template.steps:
#     #     step_instance = Mock(spec=WorkflowStepInstance)
#     #     step_instance.workflow_instance_id = procurement_workflow.id
#     #     step_instance.workflow_step_template_id = step.id
#     #     step_instance.status = WorkflowStepStatus.REVIEW
#     #     step_instance.notes = ""
#     #     step_instance.time_started = datetime.now()
#
#     workflow_step_instance_acquisition = Mock(spec=WorkflowStepInstance)
#     workflow_step_instance_acquisition.workflow_instance_id = procurement_workflow.id
#     workflow_step_instance_acquisition.workflow_step_template_id = 3
#     workflow_step_instance_acquisition.status = WorkflowStepStatus.REVIEW
#     workflow_step_instance_acquisition.notes = ""
#     workflow_step_instance_acquisition.time_started = datetime.now()
#
#     workflow_step_instance_pre_solicitation = Mock(spec=WorkflowStepInstance)
#     workflow_step_instance_pre_solicitation.workflow_instance_id = procurement_workflow.id
#     workflow_step_instance_pre_solicitation.workflow_step_template_id = 3
#     workflow_step_instance_pre_solicitation.status = WorkflowStepStatus.REVIEW
#     workflow_step_instance_pre_solicitation.notes = ""
#     workflow_step_instance_pre_solicitation.time_started = datetime.now()
#
#     # workflow_step_dependency = Mock(spec=WorkflowStepInstance)
#     # TODO: Refactor the step dependencies to be on the Step Template
#
#     package = Mock(Package)
#     package.submitter_id = 21
#     package.workflow_instance_id = workflow_step_instance_acquisition.id
#     package.notes = ""
#
#     package_snapshot = Mock(PackageSnapshot)
#     package_snapshot.package_id = package.id
#     package_snapshot.object_type = "AGREEMENT"
#     package_snapshot.object_id = 1
#
#     #
#     # # workflow_step_instance.workflow_instance.workflow_action = WorkflowAction.GENERIC
#     # # workflow_step_instance.package_entities = {"budget_line_item_ids": [1, 2, 3]}
#     #
#     # # Use loaded_db to create or mock BudgetLineItems
#     # bli1 = loaded_db.get(BudgetLineItem, 1)
#     # bli2 = loaded_db.get(BudgetLineItem, 2)
#     # bli3 = loaded_db.get(BudgetLineItem, 3)
#     # blis = [bli1, bli2, bli3]
#     #
#     # # Call the function
#     # update_blis(workflow_step_instance)
#     #
#     # # Assert that the status of each BudgetLineItem is set to BudgetLineItemStatus.PLANNED
#     # for bli in blis:
#     #     assert bli.status == BudgetLineItemStatus.PLANNED
