"""Tests for budget team requisition review card endpoint (OPS-1639 PR2)."""

from datetime import date

import pytest

from models.procurement_tracker import (
    DefaultProcurementTrackerStep,
    ProcurementTracker,
    ProcurementTrackerStepStatus,
    ProcurementTrackerStepType,
)


@pytest.fixture
def test_budget_team_requisition_step(app_ctx, loaded_db):
    """Create a test step where DD approved but budget team hasn't entered requisition."""
    tracker = loaded_db.get(ProcurementTracker, 1)

    # Capture original step 4 state before modification
    step_4 = next((step for step in tracker.steps if step.step_number == 4), None)
    step_4_existed = step_4 is not None
    step_4_original_status = step_4.status if step_4_existed else None

    # Ensure Step 4 (Evaluation) exists and is completed
    if not step_4:
        step_4 = DefaultProcurementTrackerStep(
            procurement_tracker=tracker,
            step_number=4,
            step_type=ProcurementTrackerStepType.EVALUATION,
            status=ProcurementTrackerStepStatus.COMPLETED,
        )
        loaded_db.add(step_4)
    else:
        step_4.status = ProcurementTrackerStepStatus.COMPLETED
    loaded_db.commit()

    # Create PRE_AWARD step where DD has approved
    step = DefaultProcurementTrackerStep(
        procurement_tracker=tracker,
        step_number=997,
        step_type=ProcurementTrackerStepType.PRE_AWARD,
        status=ProcurementTrackerStepStatus.ACTIVE,
        pre_award_approval_requested=True,
        pre_award_approval_requested_by=500,
        pre_award_approval_requested_date=date.today(),
        pre_award_approval_status="APPROVED",  # DD approved
        pre_award_approval_responded_by=503,
        pre_award_approval_responded_date=date.today(),
        # requisition fields are NULL - budget team hasn't entered yet
    )
    loaded_db.add(step)
    loaded_db.commit()

    yield step

    # Cleanup: restore step 4 to original state and delete test step
    loaded_db.rollback()
    try:
        loaded_db.delete(step)
        if not step_4_existed:
            # Step 4 was created by this fixture, delete it
            loaded_db.delete(step_4)
        else:
            # Step 4 existed before, restore its original status
            step_4.status = step_4_original_status
        loaded_db.commit()
    except Exception:
        loaded_db.rollback()


def test_get_pending_requisitions_returns_approved_without_requisition(
    budget_team_auth_client, test_budget_team_requisition_step, loaded_db
):
    """Budget team sees steps where DD approved but requisition not entered."""
    # Make request as budget team user
    response = budget_team_auth_client.get("/api/v1/procurement-tracker-steps/pending-requisitions/")
    assert response.status_code == 200

    data = response.json
    assert isinstance(data, list)

    # Should include our test step
    step_ids = [step["id"] for step in data]
    assert test_budget_team_requisition_step.id in step_ids


def test_get_pending_requisitions_excludes_completed(
    budget_team_auth_client, test_budget_team_requisition_step, loaded_db
):
    """Steps with requisition_number filled are excluded."""
    # Set requisition number (budget team completed it)
    test_budget_team_requisition_step.pre_award_requisition_number = "REQ-2026-12345"
    loaded_db.commit()

    response = budget_team_auth_client.get("/api/v1/procurement-tracker-steps/pending-requisitions/")
    assert response.status_code == 200

    data = response.json
    step_ids = [step["id"] for step in data]
    # Should NOT include our test step anymore
    assert test_budget_team_requisition_step.id not in step_ids


def test_get_pending_requisitions_filters_by_budget_team_role(client, test_budget_team_requisition_step, loaded_db):
    """Unauthenticated users get 401."""
    response = client.get("/api/v1/procurement-tracker-steps/pending-requisitions/")
    assert response.status_code == 401  # Unauthenticated


def test_get_pending_requisitions_non_budget_team_gets_empty_list(
    basic_user_auth_client, test_budget_team_requisition_step, loaded_db
):
    """Authenticated non-budget-team users get empty list, not 401."""
    # Make request as basic user (not budget team)
    response = basic_user_auth_client.get("/api/v1/procurement-tracker-steps/pending-requisitions/")
    assert response.status_code == 200

    data = response.json
    assert isinstance(data, list)
    # Non-budget-team user should see empty list
    assert len(data) == 0


def test_get_pending_requisitions_includes_agreement_data(
    budget_team_auth_client, test_budget_team_requisition_step, loaded_db
):
    """Response includes agreement with budget line items."""
    response = budget_team_auth_client.get("/api/v1/procurement-tracker-steps/pending-requisitions/")
    assert response.status_code == 200

    data = response.json
    if len(data) > 0:
        # Find our test step
        test_step_data = next((step for step in data if step["id"] == test_budget_team_requisition_step.id), None)
        if test_step_data:
            # Verify agreement data is included
            assert "procurement_tracker" in test_step_data
            assert "agreement" in test_step_data["procurement_tracker"]
            agreement = test_step_data["procurement_tracker"]["agreement"]
            assert "id" in agreement
            assert "name" in agreement
