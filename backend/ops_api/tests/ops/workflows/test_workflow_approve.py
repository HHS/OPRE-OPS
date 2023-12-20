from unittest.mock import Mock

import pytest
from models import BudgetLineItem, BudgetLineItemStatus, WorkflowAction, WorkflowStatus, WorkflowStepInstance
from ops_api.ops.resources.workflow_approve import UpdateBlis


@pytest.mark.usefixtures("app_ctx", "loaded_db")
def test_update_blis_draft_to_planned(loaded_db):
    # Create a mock WorkflowStepInstance with the required attributes
    workflow_step_instance = Mock(spec=WorkflowStepInstance)
    workflow_step_instance.workflow_instance.workflow_status = WorkflowStatus.APPROVED
    workflow_step_instance.workflow_instance.workflow_action = WorkflowAction.DRAFT_TO_PLANNED
    workflow_step_instance.package_entities = {"budget_line_item_ids": [1, 2, 3]}

    # Use loaded_db to create or mock BudgetLineItems
    bli1 = loaded_db.get(BudgetLineItem, 1)
    bli2 = loaded_db.get(BudgetLineItem, 2)
    bli3 = loaded_db.get(BudgetLineItem, 3)
    blis = [bli1, bli2, bli3]

    # Call the function
    UpdateBlis(workflow_step_instance)

    # Assert that the status of each BudgetLineItem is set to BudgetLineItemStatus.PLANNED
    for bli in blis:
        assert bli.status == BudgetLineItemStatus.PLANNED
