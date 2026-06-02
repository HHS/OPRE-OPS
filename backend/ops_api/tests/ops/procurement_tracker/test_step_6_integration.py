"""Integration tests for Step 6 (Award) procurement tracker flow."""

from datetime import date

import pytest
from sqlalchemy import select

from models import OpsEvent, OpsEventType, ProcurementTrackerStepStatus
from models.agreements import Agreement, ContractAgreement
from models.procurement_action import ProcurementAction
from models.procurement_tracker import (
    DefaultProcurementTracker,
    DefaultProcurementTrackerStep,
    ProcurementTrackerStepType,
)
from models.services_components import CLIN


@pytest.fixture
def step_6_test_data(app_ctx, loaded_db):
    """Create a complete test setup for Step 6 testing."""
    # Get existing agreement with vendor and CLINs
    agreement = loaded_db.get(Agreement, 1)

    # Ensure it's a contract agreement with vendor
    if not isinstance(agreement, ContractAgreement):
        agreement = loaded_db.query(ContractAgreement).filter(ContractAgreement.vendor_id.isnot(None)).first()

    # Ensure CLINs exist
    clin_count = loaded_db.query(CLIN).filter(CLIN.agreement_id == agreement.id).count()
    if clin_count == 0:
        # Create a CLIN for testing
        clin = CLIN(
            agreement_id=agreement.id, clin_number="1001", clin_description="Test CLIN for Step 6", amount=100000.00
        )
        loaded_db.add(clin)

    # Create a procurement tracker with Steps 1-6
    from models.procurement_tracker import ProcurementTrackerStatus

    tracker = DefaultProcurementTracker(
        agreement_id=agreement.id, status=ProcurementTrackerStatus.ACTIVE, active_step_number=6
    )
    loaded_db.add(tracker)
    loaded_db.flush()

    # Create steps 1-5 (all completed)
    for step_num in range(1, 6):
        step_types = [
            ProcurementTrackerStepType.ACQUISITION_PLANNING,
            ProcurementTrackerStepType.PRE_SOLICITATION,
            ProcurementTrackerStepType.SOLICITATION,
            ProcurementTrackerStepType.EVALUATION,
            ProcurementTrackerStepType.PRE_AWARD,
        ]
        step = DefaultProcurementTrackerStep(
            procurement_tracker=tracker,
            step_number=step_num,
            step_type=step_types[step_num - 1],
            status=ProcurementTrackerStepStatus.COMPLETED,
        )
        loaded_db.add(step)

    # Create Step 6 (pending, with approval approved for testing)
    step_6 = DefaultProcurementTrackerStep(
        procurement_tracker=tracker,
        step_number=6,
        step_type=ProcurementTrackerStepType.AWARD,
        status=ProcurementTrackerStepStatus.ACTIVE,
        award_approval_status="APPROVED",  # Simulate approval for testing
    )
    loaded_db.add(step_6)
    loaded_db.commit()
    loaded_db.refresh(step_6)

    yield {"agreement": agreement, "tracker": tracker, "step_6": step_6}

    # Cleanup
    loaded_db.rollback()


def test_step_6_request_award_approval(auth_client, app_ctx, loaded_db, step_6_test_data):
    """Test requesting award approval for Step 6."""
    step_6 = step_6_test_data["step_6"]

    # Request award approval
    payload = {
        "approval_requested": True,
        "approval_requested_date": date.today().isoformat(),
        "requestor_notes": "Please review and approve the award.",
    }

    response = auth_client.patch(f"/api/v1/procurement-tracker-steps/{step_6.id}", json=payload)

    assert response.status_code == 200
    data = response.json
    assert data["approval_requested"] is True
    assert data["approval_requested_date"] == date.today().isoformat()
    assert data["requestor_notes"] == "Please review and approve the award."

    # Verify event created
    event = loaded_db.scalars(
        select(OpsEvent)
        .where(OpsEvent.event_type == OpsEventType.UPDATE_PROCUREMENT_TRACKER_STEP)
        .where(OpsEvent.event_details["step_id"].astext == str(step_6.id))
        .order_by(OpsEvent.created_on.desc())
    ).first()

    assert event is not None


def test_step_6_completion_full_flow(auth_client, app_ctx, loaded_db, step_6_test_data):
    """Test complete Step 6 flow: save target date, request approval, complete step."""
    step_6 = step_6_test_data["step_6"]
    agreement = step_6_test_data["agreement"]
    tracker = step_6_test_data["tracker"]

    # Step 1: Save target completion date
    target_date = "2026-06-01"
    response = auth_client.patch(
        f"/api/v1/procurement-tracker-steps/{step_6.id}", json={"target_completion_date": target_date}
    )
    assert response.status_code == 200
    assert response.json["target_completion_date"] == target_date

    # Step 2: Request award approval (already done in fixture, approval_status = APPROVED)

    # Step 3: Complete Step 6
    completion_payload = {
        "status": "COMPLETED",
        "task_completed_by": 503,  # Auth client user ID
        "date_completed": date.today().isoformat(),
        "notes": "Award received and uploaded.",
    }

    response = auth_client.patch(f"/api/v1/procurement-tracker-steps/{step_6.id}", json=completion_payload)

    assert response.status_code == 200
    data = response.json
    assert data["status"] == "COMPLETED"
    assert data["task_completed_by"] == 503
    assert data["date_completed"] == date.today().isoformat()
    assert data["notes"] == "Award received and uploaded."

    # Verify tracker status changed to COMPLETED
    loaded_db.refresh(tracker)
    assert tracker.status == "COMPLETED"

    # Verify agreement ProcurementAction.awarded_date set
    loaded_db.refresh(agreement)
    procurement_action = (
        loaded_db.query(ProcurementAction).filter(ProcurementAction.agreement_id == agreement.id).first()
    )

    assert procurement_action is not None, "ProcurementAction should exist"
    assert procurement_action.award_date is not None


def test_step_6_cannot_complete_without_approval(auth_client, app_ctx, loaded_db, step_6_test_data):
    """Test Step 6 cannot be completed without approval_status = APPROVED."""
    step_6 = step_6_test_data["step_6"]

    # Set approval status to PENDING
    step_6.award_approval_status = "PENDING"
    loaded_db.commit()
    loaded_db.refresh(step_6)

    completion_payload = {
        "status": "COMPLETED",
        "task_completed_by": 503,  # Auth client user ID
        "date_completed": date.today().isoformat(),
    }

    response = auth_client.patch(f"/api/v1/procurement-tracker-steps/{step_6.id}", json=completion_payload)

    assert response.status_code == 400
    # Check if error message contains "approval" in either message or errors field
    response_text = str(response.json).lower()
    assert "approval" in response_text


def test_step_6_cannot_complete_without_vendor(auth_client, app_ctx, loaded_db, step_6_test_data):
    """Test Step 6 cannot be completed without Vendor for contract agreements."""
    step_6 = step_6_test_data["step_6"]
    agreement = step_6_test_data["agreement"]

    # Remove vendor
    if isinstance(agreement, ContractAgreement):
        agreement.vendor_id = None
        loaded_db.commit()

    completion_payload = {
        "status": "COMPLETED",
        "task_completed_by": 503,  # Auth client user ID
        "date_completed": date.today().isoformat(),
    }

    response = auth_client.patch(f"/api/v1/procurement-tracker-steps/{step_6.id}", json=completion_payload)

    assert response.status_code == 400
    # Check if error message contains "vendor" in either message or errors field
    response_text = str(response.json).lower()
    assert "vendor" in response_text


def test_step_6_cannot_complete_without_clins(auth_client, app_ctx, loaded_db):
    """Test Step 6 cannot be completed without CLINs for contract agreements."""
    from models import AgreementType, Vendor
    from models.procurement_tracker import ProcurementTrackerStatus

    # Create a new contract agreement without CLINs
    vendor = Vendor(name="Test Vendor for CLIN Test", duns="555666777")
    loaded_db.add(vendor)
    loaded_db.flush()

    agreement = ContractAgreement(
        name="Test Contract without CLINs",
        agreement_type=AgreementType.CONTRACT,
        project_id=1000,
        vendor_id=vendor.id,
    )
    loaded_db.add(agreement)
    loaded_db.flush()

    # Create tracker and Step 6
    tracker = DefaultProcurementTracker(
        agreement_id=agreement.id,
        status=ProcurementTrackerStatus.ACTIVE,
        active_step_number=6
    )
    loaded_db.add(tracker)
    loaded_db.flush()

    step_6 = DefaultProcurementTrackerStep(
        procurement_tracker=tracker,
        step_number=6,
        step_type=ProcurementTrackerStepType.AWARD,
        status=ProcurementTrackerStepStatus.ACTIVE,
        award_approval_status="APPROVED",
    )
    loaded_db.add(step_6)
    loaded_db.commit()
    loaded_db.refresh(step_6)

    completion_payload = {
        "status": "COMPLETED",
        "task_completed_by": 503,  # Auth client user ID
        "date_completed": date.today().isoformat(),
    }

    response = auth_client.patch(f"/api/v1/procurement-tracker-steps/{step_6.id}", json=completion_payload)

    assert response.status_code == 400
    # Check if error message contains "clin" in either message or errors field
    response_text = str(response.json).lower()
    assert "clin" in response_text


def test_step_6_field_mapping(auth_client, app_ctx, loaded_db, step_6_test_data):
    """Test Step 6 field mapping works correctly between API and database."""
    step_6 = step_6_test_data["step_6"]

    # Update all Step 6 fields
    payload = {
        "target_completion_date": "2026-06-15",
        "task_completed_by": 503,  # Auth client user ID
        "date_completed": date.today().isoformat(),
        "notes": "Test notes for Step 6",
        "approval_requested": True,
        "approval_requested_date": date.today().isoformat(),
        "requestor_notes": "Requester notes",
    }

    response = auth_client.patch(f"/api/v1/procurement-tracker-steps/{step_6.id}", json=payload)

    assert response.status_code == 200
    data = response.json

    # Verify all fields returned correctly (no prefixes in API response)
    assert data["target_completion_date"] == "2026-06-15"
    assert data["task_completed_by"] == 503
    assert data["date_completed"] == date.today().isoformat()
    assert data["notes"] == "Test notes for Step 6"
    assert data["approval_requested"] is True
    assert data["approval_requested_date"] == date.today().isoformat()
    assert data["requestor_notes"] == "Requester notes"

    # Verify database has prefixes
    loaded_db.refresh(step_6)
    assert step_6.award_target_completion_date is not None
    assert step_6.award_task_completed_by == 503
    assert step_6.award_date_completed == date.today()
    assert step_6.award_notes == "Test notes for Step 6"
    assert step_6.award_approval_requested is True
    assert step_6.award_requestor_notes == "Requester notes"
