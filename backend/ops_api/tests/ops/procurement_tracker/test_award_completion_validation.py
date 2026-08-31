"""Tests for AWARD step completion validation."""

from datetime import date, timedelta

import pytest

from models import ProcurementTracker, ProcurementTrackerStepStatus
from models.procurement_tracker import DefaultProcurementTrackerStep, ProcurementTrackerStepType


@pytest.fixture
def test_award_step(app_ctx, loaded_db):
    """Create a test AWARD step that can be safely modified."""
    from models import ContractAgreement
    from models.services_components import CLIN
    from models.vendors import Vendor

    tracker = loaded_db.get(ProcurementTracker, 1)

    # Ensure the agreement has vendor and CLINs to pass validation
    agreement = tracker.agreement
    if isinstance(agreement, ContractAgreement):
        # Create vendor if not set
        if not agreement.vendor_id:
            vendor = Vendor(name="Test Vendor for Award Validation", duns="111222333")
            loaded_db.add(vendor)
            loaded_db.flush()
            agreement.vendor_id = vendor.id
            loaded_db.commit()

        # Ensure at least one CLIN exists
        clin_count = loaded_db.query(CLIN).filter(CLIN.agreement_id == agreement.id).count()
        if clin_count == 0:
            clin = CLIN(
                agreement_id=agreement.id,
                number=1,
                name="Test CLIN for validation",
            )
            loaded_db.add(clin)
            loaded_db.commit()

    step = DefaultProcurementTrackerStep(
        procurement_tracker=tracker,
        step_number=998,  # Use unique number
        step_type=ProcurementTrackerStepType.AWARD,
        status=ProcurementTrackerStepStatus.ACTIVE,
    )
    loaded_db.add(step)
    loaded_db.commit()
    loaded_db.refresh(step)

    yield step

    # Cleanup
    loaded_db.rollback()
    try:
        from models.procurement_tracker import ProcurementTrackerStep

        test_step = loaded_db.get(ProcurementTrackerStep, step.id)
        if test_step:
            loaded_db.delete(test_step)
            loaded_db.commit()
    except Exception:
        loaded_db.rollback()


def test_award_completion_fails_without_task_completed_by(auth_client, app_ctx, loaded_db, test_award_step):
    """Test that AWARD step completion fails without task_completed_by."""
    # Set approval to bypass approval check
    test_award_step.award_approval_status = "APPROVED"
    loaded_db.commit()

    update_data = {
        "status": "COMPLETED",
        "date_completed": date.today().isoformat(),
    }

    response = auth_client.patch(f"/api/v1/procurement-tracker-steps/{test_award_step.id}", json=update_data)
    assert response.status_code == 400
    assert "task_completed_by" in response.json["errors"]


def test_award_completion_fails_without_date_completed(auth_client, app_ctx, loaded_db, test_award_step):
    """Test that AWARD step completion fails without date_completed."""
    # Set approval to bypass approval check
    test_award_step.award_approval_status = "APPROVED"
    loaded_db.commit()

    update_data = {
        "status": "COMPLETED",
        "task_completed_by": 500,  # Admin user from test data
    }

    response = auth_client.patch(f"/api/v1/procurement-tracker-steps/{test_award_step.id}", json=update_data)
    assert response.status_code == 400
    assert "date_completed" in response.json["errors"]


def test_award_completion_fails_with_future_date(auth_client, app_ctx, loaded_db, test_award_step):
    """Test that AWARD step completion fails with future date_completed."""
    # Set approval to bypass approval check
    test_award_step.award_approval_status = "APPROVED"
    loaded_db.commit()

    future_date = date.today() + timedelta(days=1)
    update_data = {
        "status": "COMPLETED",
        "task_completed_by": 500,
        "date_completed": future_date.isoformat(),
    }

    response = auth_client.patch(f"/api/v1/procurement-tracker-steps/{test_award_step.id}", json=update_data)
    assert response.status_code == 400
    assert "date_completed" in response.json["errors"]
    assert "future" in response.json["errors"]["date_completed"].lower()


def test_award_completion_succeeds_with_valid_data(auth_client, app_ctx, loaded_db, test_award_step):
    """Test that AWARD step completion succeeds with valid data."""
    # Set approval to bypass approval check
    test_award_step.award_approval_status = "APPROVED"
    loaded_db.commit()

    update_data = {
        "status": "COMPLETED",
        "task_completed_by": 500,
        "date_completed": date.today().isoformat(),
        "notes": "Award completed successfully",
    }

    response = auth_client.patch(f"/api/v1/procurement-tracker-steps/{test_award_step.id}", json=update_data)
    assert response.status_code == 200

    # Verify database update
    loaded_db.refresh(test_award_step)
    assert test_award_step.status == ProcurementTrackerStepStatus.COMPLETED
    assert test_award_step.award_task_completed_by == 500
    assert test_award_step.award_date_completed == date.today()
    assert test_award_step.award_notes == "Award completed successfully"


def test_award_target_completion_date_saves_separately(auth_client, app_ctx, loaded_db, test_award_step):
    """Test that AWARD step target_completion_date can be saved separately."""
    future_date = date.today() + timedelta(days=30)
    update_data = {
        "target_completion_date": future_date.isoformat(),
    }

    response = auth_client.patch(f"/api/v1/procurement-tracker-steps/{test_award_step.id}", json=update_data)
    assert response.status_code == 200

    # Verify database update
    loaded_db.refresh(test_award_step)
    assert test_award_step.award_target_completion_date == future_date
    assert test_award_step.status == ProcurementTrackerStepStatus.ACTIVE  # Status unchanged


def test_award_completion_succeeds_without_approval(auth_client, app_ctx, loaded_db, test_award_step):
    """Test that AWARD step completion succeeds without approval status set.

    Per business rules, COR can complete Step 6 before Budget Team approval.
    """
    update_data = {
        "status": "COMPLETED",
        "task_completed_by": 500,
        "date_completed": date.today().isoformat(),
    }

    response = auth_client.patch(f"/api/v1/procurement-tracker-steps/{test_award_step.id}", json=update_data)
    assert response.status_code == 200

    # Verify completion
    loaded_db.refresh(test_award_step)
    assert test_award_step.status == ProcurementTrackerStepStatus.COMPLETED


def test_award_completion_succeeds_with_approval_approved(auth_client, app_ctx, loaded_db, test_award_step):
    """Test that AWARD step completion succeeds when approval_status is APPROVED."""
    # First set approval_status to APPROVED
    test_award_step.award_approval_status = "APPROVED"
    loaded_db.commit()
    loaded_db.refresh(test_award_step)

    update_data = {
        "status": "COMPLETED",
        "task_completed_by": 500,
        "date_completed": date.today().isoformat(),
    }

    response = auth_client.patch(f"/api/v1/procurement-tracker-steps/{test_award_step.id}", json=update_data)
    assert response.status_code == 200

    # Verify completion
    loaded_db.refresh(test_award_step)
    assert test_award_step.status == ProcurementTrackerStepStatus.COMPLETED


def test_award_completion_succeeds_with_declined_approval(auth_client, app_ctx, loaded_db, test_award_step):
    """Test that AWARD step completion succeeds even when approval_status is DECLINED.

    Per business rules, COR can complete Step 6 regardless of approval status.
    Step completion and approval workflow are independent.
    """
    test_award_step.award_approval_status = "DECLINED"
    loaded_db.commit()
    loaded_db.refresh(test_award_step)

    update_data = {
        "status": "COMPLETED",
        "task_completed_by": 500,
        "date_completed": date.today().isoformat(),
    }

    response = auth_client.patch(f"/api/v1/procurement-tracker-steps/{test_award_step.id}", json=update_data)
    assert response.status_code == 200

    # Verify completion
    loaded_db.refresh(test_award_step)
    assert test_award_step.status == ProcurementTrackerStepStatus.COMPLETED


def test_award_completion_succeeds_with_pending_approval(auth_client, app_ctx, loaded_db, test_award_step):
    """Test that AWARD step completion succeeds when approval_status is PENDING.

    Per business rules, COR can complete Step 6 while approval is still pending.
    """
    test_award_step.award_approval_status = "PENDING"
    loaded_db.commit()
    loaded_db.refresh(test_award_step)

    update_data = {
        "status": "COMPLETED",
        "task_completed_by": 500,
        "date_completed": date.today().isoformat(),
    }

    response = auth_client.patch(f"/api/v1/procurement-tracker-steps/{test_award_step.id}", json=update_data)
    assert response.status_code == 200

    # Verify completion
    loaded_db.refresh(test_award_step)
    assert test_award_step.status == ProcurementTrackerStepStatus.COMPLETED
