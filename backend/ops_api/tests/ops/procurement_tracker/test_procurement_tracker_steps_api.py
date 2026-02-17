"""Tests for procurement tracker API endpoints."""

from datetime import date

import pytest
from sqlalchemy import func, select

from models import OpsEvent, OpsEventType, ProcurementTracker, ProcurementTrackerStepStatus
from models.procurement_tracker import DefaultProcurementTrackerStep, ProcurementTrackerStepType


@pytest.fixture
def test_step(app_ctx, loaded_db):
    """Create a test procurement tracker step that can be safely modified."""
    # Get the procurement tracker first to ensure the relationship is valid
    tracker = loaded_db.get(ProcurementTracker, 1)

    # Create a new step for testing using DefaultProcurementTrackerStep
    step = DefaultProcurementTrackerStep(
        procurement_tracker=tracker,  # Use object reference to preload the relationship
        step_number=999,  # Use a high number to avoid conflicts
        step_type=ProcurementTrackerStepType.PRE_SOLICITATION,
        status=ProcurementTrackerStepStatus.PENDING,
    )
    loaded_db.add(step)
    loaded_db.commit()
    loaded_db.refresh(step)

    yield step

    # Cleanup: rollback any changes and delete the test step
    loaded_db.rollback()
    try:
        # Re-fetch the step to ensure we have the latest version
        from models.procurement_tracker import ProcurementTrackerStep

        test_step = loaded_db.get(ProcurementTrackerStep, step.id)
        if test_step:
            loaded_db.delete(test_step)
            loaded_db.commit()
    except Exception:
        loaded_db.rollback()


def test_get_procurement_tracker_step_by_id(auth_client, app_ctx, loaded_db):
    """Test retrieving a single procurement tracker step by ID."""
    response = auth_client.get("/api/v1/procurement-tracker-steps/1")
    assert response.status_code == 200

    data = response.json
    assert data["procurement_tracker_id"] == 1
    assert data["step_number"] == 1
    assert data["status"] == "PENDING"
    assert data["step_type"] == "ACQUISITION_PLANNING"
    assert data["step_class"] == "default_step"
    assert data["task_completed_by"] is None
    assert data["date_completed"] is None
    assert data["notes"] is None


def test_get_procurement_tracker_step_by_id_not_found(auth_client, app_ctx, loaded_db):
    """Test retrieving a non-existent procurement tracker steps returns 404."""
    response = auth_client.get("/api/v1/procurement-tracker-steps/9999")
    assert response.status_code == 404


def test_get_procurement_tracker_steps_list(auth_client, app_ctx, loaded_db):
    """Test retrieving list of procurement tracker steps."""
    response = auth_client.get("/api/v1/procurement-tracker-steps/")
    assert response.status_code == 200

    # Verify response structure
    assert "data" in response.json
    assert "count" in response.json
    assert "limit" in response.json
    assert "offset" in response.json

    # Verify pagination metadata
    # Verify data
    data = response.json["data"]
    assert len(data) == 10
    # Verify pagination metadata (without relying on a global, environment-dependent count)
    assert isinstance(response.json["count"], int)
    assert response.json["count"] >= len(data)
    assert response.json["limit"] == 10
    assert response.json["offset"] == 0

    # Verify data
    data = response.json["data"]
    assert len(data) == 10
    assert data[0]["id"] == 1
    assert data[0]["procurement_tracker_id"] == 1
    assert data[0]["step_number"] == 1
    assert data[1]["id"] == 2
    assert data[1]["procurement_tracker_id"] == 1
    assert data[1]["step_number"] == 2
    assert data[2]["id"] == 3
    assert data[2]["procurement_tracker_id"] == 1
    assert data[2]["step_number"] == 3
    assert data[3]["id"] == 4
    assert data[3]["procurement_tracker_id"] == 1
    assert data[3]["step_number"] == 4
    assert data[4]["id"] == 5
    assert data[4]["procurement_tracker_id"] == 1
    assert data[4]["step_number"] == 5
    assert data[5]["id"] == 6
    assert data[5]["procurement_tracker_id"] == 1
    assert data[5]["step_number"] == 6
    assert data[6]["id"] == 7
    assert data[6]["procurement_tracker_id"] == 2
    assert data[6]["step_number"] == 1
    assert data[7]["id"] == 8
    assert data[7]["procurement_tracker_id"] == 2
    assert data[7]["step_number"] == 2


def test_get_procurement_tracker_steps_list_with_pagination(auth_client, app_ctx, loaded_db):
    """Test pagination parameters work correctly."""
    # Get first tracker only
    response = auth_client.get("/api/v1/procurement-tracker-steps/?limit=1&offset=0")
    assert response.status_code == 200
    # Verify data
    data = response.json["data"]
    assert len(data) == 1
    # Verify pagination metadata (without relying on a global, environment-dependent count)
    assert isinstance(response.json["count"], int)
    assert response.json["count"] >= len(data)
    assert response.json["limit"] == 1
    assert response.json["offset"] == 0
    assert response.json["data"][0]["id"] == 1
    assert response.json["data"][0]["procurement_tracker_id"] == 1
    assert response.json["data"][0]["step_number"] == 1

    # Get second tracker only
    response = auth_client.get("/api/v1/procurement-tracker-steps/?limit=1&offset=1")
    assert response.status_code == 200
    data = response.json["data"]
    assert len(data) == 1
    assert response.json["count"] >= len(data)
    assert response.json["limit"] == 1
    assert response.json["offset"] == 1
    assert len(response.json["data"]) == 1
    assert response.json["data"][0]["id"] == 2
    assert response.json["data"][0]["procurement_tracker_id"] == 1
    assert response.json["data"][0]["step_number"] == 2


def test_get_procurement_tracker_steps_list_filter_by_procurement_tracker_id(auth_client, app_ctx, loaded_db):
    """Test filtering procurement tracker steps by procurement_tracker_id."""
    # Filter by agreement 13 (should return steps id 1-6)
    response = auth_client.get("/api/v1/procurement-tracker-steps/?agreement_id=13")
    assert response.status_code == 200
    assert response.json["count"] == 6
    assert len(response.json["data"]) == 6
    assert response.json["data"][0]["id"] == 1
    assert response.json["data"][0]["step_number"] == 1
    assert response.json["data"][0]["procurement_tracker_id"] == 1

    # Filter by agreement 14 (should return tracker steps id 7-12)
    response = auth_client.get("/api/v1/procurement-tracker-steps/?agreement_id=14")
    assert response.status_code == 200
    assert response.json["count"] == 6
    assert len(response.json["data"]) == 6
    assert response.json["data"][0]["id"] == 7
    assert response.json["data"][0]["procurement_tracker_id"] == 2
    assert response.json["data"][0]["step_number"] == 1

    # Filter by non-existent agreement (should return empty list)
    response = auth_client.get("/api/v1/procurement-tracker-steps/?agreement_id=9999")
    assert response.status_code == 200
    assert response.json["count"] == 0
    assert len(response.json["data"]) == 0


def test_get_procurement_tracker_steps_list_filter_by_multiple_agreement_ids(auth_client, app_ctx, loaded_db):
    """Test filtering by multiple agreement IDs."""
    response = auth_client.get("/api/v1/procurement-tracker-steps/?agreement_id=13&agreement_id=14")
    assert response.status_code == 200
    assert response.json["count"] == 12
    assert len(response.json["data"]) == 10


def test_get_procurement_tracker_steps_list_pagination_limits(auth_client, app_ctx, loaded_db):
    """Test pagination limit validation."""
    # Valid limit
    response = auth_client.get("/api/v1/procurement-tracker-steps/?limit=50")
    assert response.status_code == 200

    # Limit too high should fail
    response = auth_client.get("/api/v1/procurement-tracker-steps/?limit=51")
    assert response.status_code == 400

    # Limit too low should fail
    response = auth_client.get("/api/v1/procurement-tracker-steps/?limit=0")
    assert response.status_code == 400


def test_get_procurement_tracker_steps_list_offset_validation(auth_client, app_ctx, loaded_db):
    """Test offset validation."""
    # Valid offset
    response = auth_client.get("/api/v1/procurement-tracker-steps/?offset=0")
    assert response.status_code == 200

    # Negative offset should fail
    response = auth_client.get("/api/v1/procurement-tracker-steps/?offset=-1")
    assert response.status_code == 400


def test_get_procurement_tracker_step_unauthorized(client, app_ctx, loaded_db):
    """Test that unauthorized requests are rejected."""
    response = client.get("/api/v1/procurement-tracker-steps/1")
    assert response.status_code == 401


def test_get_procurement_tracker_steps_list_unauthorized(client, app_ctx, loaded_db):
    """Test that unauthorized list requests are rejected."""
    response = client.get("/api/v1/procurement-tracker-steps/")
    assert response.status_code == 401


def test_get_procurement_tracker_step_response_structure(auth_client, app_ctx, loaded_db):
    """Test that the response has all expected top-level fields."""
    response = auth_client.get("/api/v1/procurement-tracker-steps/1")
    assert response.status_code == 200

    data = response.json
    expected_fields = [
        "id",
        "procurement_tracker_id",
        "step_number",
        "step_class",
        "step_type",
        "status",
    ]

    for field in expected_fields:
        assert field in data, f"Expected field '{field}' not found in response"


def test_update_procurement_tracker_step_by_id(auth_client, test_step):
    """Test updating a procurement tracker step by ID."""
    update_data = {"status": "COMPLETED", "date_completed": date.today().isoformat(), "task_completed_by": 503}
    response = auth_client.patch(f"/api/v1/procurement-tracker-steps/{test_step.id}", json=update_data)
    assert response.status_code == 200

    data = response.json
    assert data["id"] == test_step.id
    assert data["procurement_tracker_id"] == test_step.procurement_tracker_id
    assert data["step_number"] == test_step.step_number
    assert data["status"] == "COMPLETED"


def test_update_procurement_tracker_step_creates_event(auth_client, test_step, loaded_db):
    """Test that updating a procurement tracker step creates an UPDATE_PROCUREMENT_TRACKER_STEP event."""
    # Get initial event count
    initial_event_count = loaded_db.scalar(
        select(OpsEvent).where(OpsEvent.event_type == OpsEventType.UPDATE_PROCUREMENT_TRACKER_STEP)
    )
    initial_count = (
        0
        if initial_event_count is None
        else len(
            loaded_db.scalars(
                select(OpsEvent).where(OpsEvent.event_type == OpsEventType.UPDATE_PROCUREMENT_TRACKER_STEP)
            ).all()
        )
    )

    update_data = {
        "status": "ACTIVE",
    }
    response = auth_client.patch(f"/api/v1/procurement-tracker-steps/{test_step.id}", json=update_data)
    assert response.status_code == 200

    # Verify an event was created
    events = loaded_db.scalars(
        select(OpsEvent).where(OpsEvent.event_type == OpsEventType.UPDATE_PROCUREMENT_TRACKER_STEP)
    ).all()
    assert len(events) == initial_count + 1

    # Get the most recent event
    latest_event = events[-1]
    assert latest_event.event_type == OpsEventType.UPDATE_PROCUREMENT_TRACKER_STEP
    assert latest_event.event_status.name == "SUCCESS"


def test_update_procurement_tracker_step_event_metadata(auth_client, test_step, loaded_db):
    """Test that the UPDATE_PROCUREMENT_TRACKER_STEP event contains correct metadata."""
    update_data = {"status": "COMPLETED", "date_completed": date.today().isoformat(), "task_completed_by": 503}
    response = auth_client.patch(f"/api/v1/procurement-tracker-steps/{test_step.id}", json=update_data)
    assert response.status_code == 200

    # Get the most recent UPDATE_PROCUREMENT_TRACKER_STEP event
    event = loaded_db.scalars(
        select(OpsEvent)
        .where(OpsEvent.event_type == OpsEventType.UPDATE_PROCUREMENT_TRACKER_STEP)
        .order_by(OpsEvent.created_on.desc())
    ).first()

    assert event is not None
    assert event.event_details is not None

    # Verify event metadata
    assert "procurement_tracker_step_updates" in event.event_details
    assert "procurement_tracker_step" in event.event_details

    # Verify the step data
    step_data = event.event_details["procurement_tracker_step"]
    assert step_data["id"] == test_step.id
    assert step_data["status"] == "COMPLETED"

    # Verify the updates data
    updates = event.event_details["procurement_tracker_step_updates"]
    assert "changes" in updates
    # Verify that changes occurred
    changes = updates["changes"]
    assert len(changes) > 0


def test_update_procurement_tracker_step_event_tracks_changes(auth_client, test_step, loaded_db):
    """Test that the event tracks specific field changes."""
    update_data = {
        "status": "SKIPPED",
    }
    response = auth_client.patch(f"/api/v1/procurement-tracker-steps/{test_step.id}", json=update_data)
    assert response.status_code == 200

    # Get the most recent event
    event = loaded_db.scalars(
        select(OpsEvent)
        .where(OpsEvent.event_type == OpsEventType.UPDATE_PROCUREMENT_TRACKER_STEP)
        .order_by(OpsEvent.created_on.desc())
    ).first()

    assert event is not None
    updates = event.event_details["procurement_tracker_step_updates"]

    # Verify changes are tracked
    changes = updates["changes"]

    # Check that status change is tracked (changes is a dict)
    assert "status" in changes


def test_update_procurement_tracker_step_partial_update(auth_client, test_step, loaded_db):
    """Test that partial updates (updating only some fields) work correctly."""
    # Update only the status field
    update_data = {"status": "ACTIVE"}
    response = auth_client.patch(f"/api/v1/procurement-tracker-steps/{test_step.id}", json=update_data)
    assert response.status_code == 200

    data = response.json
    assert data["status"] == "ACTIVE"
    # Other fields should remain unchanged
    assert data["step_type"] == "PRE_SOLICITATION"
    assert data["step_number"] == 999

    # Verify event was created
    event = loaded_db.scalars(
        select(OpsEvent)
        .where(OpsEvent.event_type == OpsEventType.UPDATE_PROCUREMENT_TRACKER_STEP)
        .order_by(OpsEvent.created_on.desc())
    ).first()

    assert event is not None
    assert event.event_type == OpsEventType.UPDATE_PROCUREMENT_TRACKER_STEP


def test_update_procurement_tracker_step_not_found_creates_failed_event(auth_client, app_ctx, loaded_db):
    """Test that updating a non-existent step creates a FAILED event."""
    update_data = {"status": "COMPLETED"}
    response = auth_client.patch("/api/v1/procurement-tracker-steps/9999", json=update_data)
    assert response.status_code == 404

    # Verify a FAILED event was created
    event = loaded_db.scalars(
        select(OpsEvent)
        .where(OpsEvent.event_type == OpsEventType.UPDATE_PROCUREMENT_TRACKER_STEP)
        .order_by(OpsEvent.created_on.desc())
    ).first()

    # Should have a FAILED event
    assert event is not None
    assert event.event_status.name == "FAILED"


def test_update_procurement_tracker_step_invalid_data_creates_failed_event(auth_client, app_ctx, loaded_db):
    """Test that updating with invalid data creates a FAILED event."""
    # Send invalid status value
    update_data = {"status": "INVALID_STATUS"}
    response = auth_client.patch("/api/v1/procurement-tracker-steps/1", json=update_data)
    assert response.status_code == 400

    # Verify a FAILED event was created
    event = loaded_db.scalars(
        select(OpsEvent)
        .where(OpsEvent.event_type == OpsEventType.UPDATE_PROCUREMENT_TRACKER_STEP)
        .order_by(OpsEvent.created_on.desc())
    ).first()

    # Should have a FAILED event
    assert event is not None
    assert event.event_status.name == "FAILED"


def test_update_procurement_tracker_step_unauthorized_does_not_create_event(client, app_ctx, loaded_db):
    """Test that unauthorized update attempts do not create events."""
    # Get initial event count
    initial_events = loaded_db.scalars(
        select(OpsEvent).where(OpsEvent.event_type == OpsEventType.UPDATE_PROCUREMENT_TRACKER_STEP)
    ).all()
    initial_count = len(initial_events)

    update_data = {"status": "COMPLETED"}
    response = client.patch("/api/v1/procurement-tracker-steps/1", json=update_data)
    assert response.status_code == 401

    # Verify no new event was created
    events = loaded_db.scalars(
        select(OpsEvent).where(OpsEvent.event_type == OpsEventType.UPDATE_PROCUREMENT_TRACKER_STEP)
    ).all()
    assert len(events) == initial_count


def test_update_procurement_tracker_step_multiple_fields(auth_client, test_step, loaded_db):
    """Test updating multiple fields at once creates proper event."""
    update_data = {"status": "COMPLETED", "date_completed": date.today().isoformat(), "task_completed_by": 503}
    response = auth_client.patch(f"/api/v1/procurement-tracker-steps/{test_step.id}", json=update_data)
    assert response.status_code == 200

    # Get the event
    event = loaded_db.scalars(
        select(OpsEvent)
        .where(OpsEvent.event_type == OpsEventType.UPDATE_PROCUREMENT_TRACKER_STEP)
        .order_by(OpsEvent.created_on.desc())
    ).first()

    assert event is not None
    assert event.event_status.name == "SUCCESS"

    # Verify the step data
    step_data = event.event_details["procurement_tracker_step"]
    assert step_data["id"] == test_step.id
    assert step_data["status"] == "COMPLETED"


def test_update_procurement_tracker_step_creates_update_tracker_event(auth_client, loaded_db):
    """Test that completing a step creates both UPDATE_PROCUREMENT_TRACKER_STEP and UPDATE_PROCUREMENT_TRACKER events."""
    # Get a tracker with its first step
    tracker = loaded_db.get(ProcurementTracker, 1)
    first_step = next((s for s in tracker.steps if s.step_number == 1), None)
    assert first_step is not None, "Tracker must have a first step"

    # Set tracker to active step 1
    tracker.active_step_number = 1
    first_step.status = ProcurementTrackerStepStatus.PENDING
    loaded_db.commit()

    # Count initial events
    initial_step_events = loaded_db.scalar(
        select(func.count())
        .select_from(OpsEvent)
        .where(OpsEvent.event_type == OpsEventType.UPDATE_PROCUREMENT_TRACKER_STEP)
    )
    initial_tracker_events = loaded_db.scalar(
        select(func.count()).select_from(OpsEvent).where(OpsEvent.event_type == OpsEventType.UPDATE_PROCUREMENT_TRACKER)
    )

    # Complete the first step
    update_data = {"status": "COMPLETED"}
    response = auth_client.patch(f"/api/v1/procurement-tracker-steps/{first_step.id}", json=update_data)
    assert response.status_code == 200

    # Verify UPDATE_PROCUREMENT_TRACKER_STEP event was created
    step_events = loaded_db.scalar(
        select(func.count())
        .select_from(OpsEvent)
        .where(OpsEvent.event_type == OpsEventType.UPDATE_PROCUREMENT_TRACKER_STEP)
    )
    assert step_events == initial_step_events + 1

    # Verify UPDATE_PROCUREMENT_TRACKER event was created
    tracker_events = loaded_db.scalar(
        select(func.count()).select_from(OpsEvent).where(OpsEvent.event_type == OpsEventType.UPDATE_PROCUREMENT_TRACKER)
    )
    assert tracker_events == initial_tracker_events + 1

    # Get the UPDATE_PROCUREMENT_TRACKER event
    tracker_event = loaded_db.scalars(
        select(OpsEvent)
        .where(OpsEvent.event_type == OpsEventType.UPDATE_PROCUREMENT_TRACKER)
        .order_by(OpsEvent.created_on.desc())
    ).first()

    assert tracker_event is not None
    assert tracker_event.event_status.name == "SUCCESS"
    assert "procurement_tracker_updates" in tracker_event.event_details
    assert "procurement_tracker" in tracker_event.event_details

    # Verify the tracker was advanced to step 2
    tracker_data = tracker_event.event_details["procurement_tracker"]
    assert tracker_data["active_step_number"] == 2


# Serialization Tests for Pre-Solicitation Fields


def test_pre_solicitation_step_serialization_includes_all_fields(auth_client, app_ctx, loaded_db):
    """Test that pre-solicitation steps include all pre-solicitation specific fields in the response."""
    # Step 2 in tracker 1 should be a PRE_SOLICITATION step
    response = auth_client.get("/api/v1/procurement-tracker-steps/2")
    assert response.status_code == 200

    data = response.json
    assert data["step_type"] == "PRE_SOLICITATION"

    # Verify all pre-solicitation specific fields are present
    assert "target_completion_date" in data
    assert "draft_solicitation_date" in data

    # Verify shared fields are present
    assert "task_completed_by" in data
    assert "date_completed" in data
    assert "notes" in data


def test_pre_solicitation_step_serialization_with_none_values(auth_client, app_ctx, loaded_db):
    """Test that pre-solicitation steps preserve None values for step-specific fields."""
    # Step 2 in tracker 1 should be a PRE_SOLICITATION step with None values
    response = auth_client.get("/api/v1/procurement-tracker-steps/2")
    assert response.status_code == 200

    data = response.json
    assert data["step_type"] == "PRE_SOLICITATION"

    # Verify None values are preserved for pre-solicitation specific fields
    assert data["target_completion_date"] is None
    assert data["draft_solicitation_date"] is None
    assert data["task_completed_by"] is None
    assert data["date_completed"] is None
    assert data["notes"] is None


def test_acquisition_planning_step_excludes_pre_solicitation_fields(auth_client, app_ctx, loaded_db):
    """Test that acquisition planning steps do NOT include pre-solicitation specific fields."""
    # Step 1 in tracker 1 should be an ACQUISITION_PLANNING step
    response = auth_client.get("/api/v1/procurement-tracker-steps/1")
    assert response.status_code == 200

    data = response.json
    assert data["step_type"] == "ACQUISITION_PLANNING"

    # Verify pre-solicitation specific fields are NOT present
    assert "target_completion_date" not in data
    assert "draft_solicitation_date" not in data

    # Verify shared fields ARE present
    assert "task_completed_by" in data
    assert "date_completed" in data
    assert "notes" in data


def test_update_pre_solicitation_step_with_target_completion_date(auth_client, test_step, loaded_db):
    """Test updating a pre-solicitation step with target_completion_date."""
    from datetime import date, timedelta

    # Ensure test_step is PRE_SOLICITATION type
    assert test_step.step_type == ProcurementTrackerStepType.PRE_SOLICITATION

    future_date = date.today() + timedelta(days=30)
    update_data = {
        "status": "ACTIVE",
        "date_completed": date.today().isoformat(),
        "task_completed_by": 503,
        "target_completion_date": future_date.isoformat(),
    }

    response = auth_client.patch(f"/api/v1/procurement-tracker-steps/{test_step.id}", json=update_data)
    assert response.status_code == 200

    data = response.json
    assert data["target_completion_date"] == future_date.isoformat()
    assert data["status"] == "ACTIVE"


def test_update_pre_solicitation_step_with_draft_solicitation_date(auth_client, test_step, loaded_db):
    """Test updating a pre-solicitation step with draft_solicitation_date."""
    from datetime import date, timedelta

    # Ensure test_step is PRE_SOLICITATION type
    assert test_step.step_type == ProcurementTrackerStepType.PRE_SOLICITATION

    future_date = date.today() + timedelta(days=60)
    update_data = {
        "status": "ACTIVE",
        "date_completed": date.today().isoformat(),
        "task_completed_by": 503,
        "draft_solicitation_date": future_date.isoformat(),
    }

    response = auth_client.patch(f"/api/v1/procurement-tracker-steps/{test_step.id}", json=update_data)
    assert response.status_code == 200

    data = response.json
    assert data["draft_solicitation_date"] == future_date.isoformat()
    assert data["status"] == "ACTIVE"


def test_update_pre_solicitation_step_with_notes(auth_client, test_step, loaded_db):
    """Test updating a pre-solicitation step with notes."""
    # Ensure test_step is PRE_SOLICITATION type
    assert test_step.step_type == ProcurementTrackerStepType.PRE_SOLICITATION

    test_notes = "These are test notes for pre-solicitation step"
    update_data = {
        "status": "ACTIVE",
        "notes": test_notes,
    }

    response = auth_client.patch(f"/api/v1/procurement-tracker-steps/{test_step.id}", json=update_data)
    assert response.status_code == 200

    data = response.json
    assert data["notes"] == test_notes
    assert data["status"] == "ACTIVE"


def test_update_pre_solicitation_step_with_all_fields(auth_client, test_step, loaded_db):
    """Test updating a pre-solicitation step with all pre-solicitation specific fields."""
    from datetime import date, timedelta

    # Ensure test_step is PRE_SOLICITATION type
    assert test_step.step_type == ProcurementTrackerStepType.PRE_SOLICITATION

    future_date_1 = date.today() + timedelta(days=30)
    future_date_2 = date.today() + timedelta(days=60)
    test_notes = "Complete pre-solicitation package notes"

    update_data = {
        "status": "ACTIVE",
        "target_completion_date": future_date_1.isoformat(),
        "draft_solicitation_date": future_date_2.isoformat(),
        "notes": test_notes,
    }

    response = auth_client.patch(f"/api/v1/procurement-tracker-steps/{test_step.id}", json=update_data)
    assert response.status_code == 200

    data = response.json
    assert data["target_completion_date"] == future_date_1.isoformat()
    assert data["draft_solicitation_date"] == future_date_2.isoformat()
    assert data["notes"] == test_notes
    assert data["status"] == "ACTIVE"


def test_pre_solicitation_step_list_includes_specific_fields(auth_client, app_ctx, loaded_db):
    """Test that pre-solicitation steps in list responses include pre-solicitation specific fields."""
    response = auth_client.get("/api/v1/procurement-tracker-steps/?agreement_id=13")
    assert response.status_code == 200

    data = response.json["data"]

    # Find a pre-solicitation step (should be step 2)
    pre_solicitation_step = next((s for s in data if s["step_type"] == "PRE_SOLICITATION"), None)
    assert pre_solicitation_step is not None, "Should have at least one PRE_SOLICITATION step"

    # Verify pre-solicitation specific fields are present
    assert "target_completion_date" in pre_solicitation_step
    assert "draft_solicitation_date" in pre_solicitation_step
    assert "task_completed_by" in pre_solicitation_step
    assert "date_completed" in pre_solicitation_step
    assert "notes" in pre_solicitation_step


def test_acquisition_planning_step_list_excludes_pre_solicitation_fields(auth_client, app_ctx, loaded_db):
    """Test that acquisition planning steps in list responses do NOT include pre-solicitation specific fields."""
    response = auth_client.get("/api/v1/procurement-tracker-steps/?agreement_id=13")
    assert response.status_code == 200

    data = response.json["data"]

    # Find an acquisition planning step (should be step 1)
    acquisition_step = next((s for s in data if s["step_type"] == "ACQUISITION_PLANNING"), None)
    assert acquisition_step is not None, "Should have at least one ACQUISITION_PLANNING step"

    # Verify pre-solicitation specific fields are NOT present
    assert "target_completion_date" not in acquisition_step
    assert "draft_solicitation_date" not in acquisition_step

    # Verify shared fields ARE present
    assert "task_completed_by" in acquisition_step
    assert "date_completed" in acquisition_step
    assert "notes" in acquisition_step


def test_pre_solicitation_step_field_mapping_to_model(auth_client, test_step, loaded_db):
    """Test that pre-solicitation API fields correctly map to model fields."""
    from datetime import date, timedelta

    # Ensure test_step is PRE_SOLICITATION type
    assert test_step.step_type == ProcurementTrackerStepType.PRE_SOLICITATION

    future_date = date.today() + timedelta(days=30)
    test_notes = "Testing field mapping"

    update_data = {
        "status": "ACTIVE",
        "target_completion_date": future_date.isoformat(),
        "notes": test_notes,
    }

    response = auth_client.patch(f"/api/v1/procurement-tracker-steps/{test_step.id}", json=update_data)
    assert response.status_code == 200

    # Refresh from database to verify model fields were updated
    loaded_db.refresh(test_step)

    # Verify that the API fields mapped to the correct model fields
    assert test_step.pre_solicitation_target_completion_date == future_date
    assert test_step.pre_solicitation_notes == test_notes
