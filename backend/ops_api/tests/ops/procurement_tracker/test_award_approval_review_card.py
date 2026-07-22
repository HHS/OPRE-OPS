"""Integration tests for pending-award-approvals endpoint (OPS-2280).

These tests require a running Docker stack (pytest-docker).
Run: cd backend/ops_api && pipenv run pytest tests/ops/procurement_tracker/test_award_approval_review_card.py
"""

from datetime import date

import pytest

from models.procurement_tracker import (
    DefaultProcurementTrackerStep,
    ProcurementTracker,
    ProcurementTrackerStepStatus,
    ProcurementTrackerStepType,
)


@pytest.fixture
def test_pending_award_step(app_ctx, loaded_db):
    """Create a step where COR requested award approval but BT hasn't responded yet."""
    tracker = loaded_db.get(ProcurementTracker, 1)

    step = DefaultProcurementTrackerStep(
        procurement_tracker=tracker,
        step_number=996,
        step_type=ProcurementTrackerStepType.AWARD,
        status=ProcurementTrackerStepStatus.ACTIVE,
        award_approval_requested=True,
        award_approval_requested_by=500,
        award_approval_requested_date=date.today(),
        award_approval_status=None,  # Not yet responded
        award_contract_number="GS-123-456",
        award_amount=1500000.00,
        award_date=date(2024, 9, 30),
    )
    loaded_db.add(step)
    loaded_db.commit()

    yield step

    loaded_db.rollback()
    try:
        from models.procurement_tracker import ProcurementTrackerStep

        fresh = loaded_db.get(ProcurementTrackerStep, step.id)
        if fresh:
            loaded_db.delete(fresh)
            loaded_db.commit()
    except Exception:
        loaded_db.rollback()


@pytest.fixture
def test_already_approved_award_step(app_ctx, loaded_db):
    """Create a step where award approval was already approved — should NOT appear in pending."""
    tracker = loaded_db.get(ProcurementTracker, 1)

    step = DefaultProcurementTrackerStep(
        procurement_tracker=tracker,
        step_number=995,
        step_type=ProcurementTrackerStepType.AWARD,
        status=ProcurementTrackerStepStatus.ACTIVE,
        award_approval_requested=True,
        award_approval_requested_by=500,
        award_approval_requested_date=date.today(),
        award_approval_status="APPROVED",  # Already approved
        award_approval_responded_by=521,
    )
    loaded_db.add(step)
    loaded_db.commit()

    yield step

    loaded_db.rollback()
    try:
        from models.procurement_tracker import ProcurementTrackerStep

        fresh = loaded_db.get(ProcurementTrackerStep, step.id)
        if fresh:
            loaded_db.delete(fresh)
            loaded_db.commit()
    except Exception:
        loaded_db.rollback()


def test_pending_award_approvals_budget_team_sees_pending(budget_team_auth_client, test_pending_award_step, loaded_db):
    """Budget team sees AWARD steps where approval is requested but not yet responded."""
    response = budget_team_auth_client.get("/api/v1/procurement-tracker-steps/pending-award-approvals/")
    assert response.status_code == 200

    data = response.json
    step_ids = [s["id"] for s in data]
    assert test_pending_award_step.id in step_ids


def test_pending_award_approvals_excludes_already_approved(
    budget_team_auth_client, test_already_approved_award_step, loaded_db
):
    """Already-approved steps should NOT appear in pending."""
    response = budget_team_auth_client.get("/api/v1/procurement-tracker-steps/pending-award-approvals/")
    assert response.status_code == 200

    data = response.json
    step_ids = [s["id"] for s in data]
    assert test_already_approved_award_step.id not in step_ids


def test_pending_award_approvals_non_budget_team_gets_empty(client, test_pending_award_step, loaded_db):
    """Unauthenticated/non-budget-team user gets 401, not the list."""
    response = client.get("/api/v1/procurement-tracker-steps/pending-award-approvals/")
    assert response.status_code == 401


def test_pending_award_approvals_includes_award_fields(budget_team_auth_client, test_pending_award_step, loaded_db):
    """Response must include contract_number, award_amount, award_date for the card."""
    response = budget_team_auth_client.get("/api/v1/procurement-tracker-steps/pending-award-approvals/")
    assert response.status_code == 200

    matching = [s for s in response.json if s["id"] == test_pending_award_step.id]
    assert len(matching) == 1
    step_data = matching[0]

    assert step_data.get("contract_number") == "GS-123-456"
    assert step_data.get("award_amount") == 1500000.00
    assert step_data.get("award_date") == "2024-09-30"
    assert step_data.get("approval_requested_by") == 500
