from unittest.mock import Mock

import pytest
from models import BudgetLineItem, BudgetLineItemStatus, WorkflowAction, WorkflowStatus, WorkflowStepInstance
from ops_api.ops.resources.workflow_approve import UpdateBlis


@pytest.mark.usefixtures("app_ctx", "loaded_db")
def test_workflow_approval_success(loaded_db, auth_client):
    # Setup mock data in loaded_db
    # ...

    # Perform a POST request with valid data
    response = auth_client.post(
        "/workflow-approve",
        json={"workflow_step_id": 2, "workflow_step_action": "APPROVE", "workflow_notes": "Approved"},
    )

    workflow_step_instance = loaded_db.get(WorkflowStepInstance, 2)

    # Assertions
    assert response.status_code == 201
    # Assert WorkflowStepInstance status is updated
    assert workflow_step_instance.status == WorkflowStatus.APPROVED
    # Assert Notification is created

    # Assert BLIs status is updated if necessary
    # ...


@pytest.mark.usefixtures("app_ctx", "loaded_db")
def test_workflow_approval_unauthorized_user(loaded_db, unauthz_client):
    # Setup mock data in loaded_db
    # ...

    # Perform a POST request with a user who is not an approver
    response = unauthz_client.post(
        "/workflow-approve",
        json={"workflow_step_id": 2, "workflow_step_action": "APPROVE", "workflow_notes": "Approved"},
    )

    # Assertions
    assert response.status_code == 401
    # ...


@pytest.mark.usefixtures("app_ctx", "loaded_db")
def test_workflow_approval_invalid_action(loaded_db, auth_client):
    # Setup mock data in loaded_db
    # ...

    # Perform a POST request with an invalid action
    response = auth_client.post(
        "/workflow-approve",
        json={"workflow_step_id": 2, "workflow_step_action": "INVALID_ACTION", "workflow_notes": "Invalid"},
    )

    # Assertions
    assert response.status_code == 400
    # ...


@pytest.mark.usefixtures("app_ctx", "loaded_db")
def test_workflow_approval_exception_handling(loaded_db, auth_client):
    # Setup mock data in loaded_db
    # ...

    # Perform a POST request that triggers an exception (e.g., ValidationError, SQLAlchemyError)
    # You may need to mock certain aspects to simulate the exception
    response = auth_client.post(
        "/workflow-approve",
        json={
            # Provide data that triggers an exception
        },
    )

    # Assertions
    assert response.status_code == 400 or 500  # Depending on the exception
    # ...


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
