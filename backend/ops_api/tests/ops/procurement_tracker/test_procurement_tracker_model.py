"""Tests for procurement tracker models."""

from datetime import date

from models import (
    DefaultProcurementTracker,
    ProcurementTrackerStatus,
    ProcurementTrackerStep,
    ProcurementTrackerStepStatus,
    ProcurementTrackerStepType,
)


def test_create_default_tracker_with_steps(loaded_db):
    """Test creating a default procurement tracker with 6 steps."""
    tracker = DefaultProcurementTracker.create_with_steps(agreement_id=1)
    loaded_db.add(tracker)
    loaded_db.commit()

    assert tracker.id is not None
    assert len(tracker.steps) == 6
    assert tracker.steps[0].step_type == ProcurementTrackerStepType.ACQUISITION_PLANNING
    assert tracker.steps[5].step_type == ProcurementTrackerStepType.AWARD


def test_tracker_initialization_defaults(loaded_db):
    """Test that tracker is initialized with step 1 active and with start date."""
    tracker = DefaultProcurementTracker.create_with_steps(agreement_id=1)
    loaded_db.add(tracker)
    loaded_db.commit()

    # Verify active_step_number is set to 1
    assert tracker.active_step_number == 1

    # Verify step 1 is ACTIVE
    step_1 = tracker.steps[0]
    assert step_1.status == ProcurementTrackerStepStatus.ACTIVE

    # Verify step 1 has step_start_date set to today
    assert step_1.step_start_date == date.today()

    # Verify other steps are PENDING with no start date
    for step in tracker.steps[1:]:
        assert step.status == ProcurementTrackerStepStatus.PENDING
        assert step.step_start_date is None


def test_steps_have_real_ids(loaded_db):
    """Test that each step has a real database ID."""
    tracker = DefaultProcurementTracker.create_with_steps(agreement_id=1)
    loaded_db.add(tracker)
    loaded_db.commit()

    for step in tracker.steps:
        assert step.id is not None
        assert isinstance(step.id, int)


def test_update_step_independently(loaded_db, test_user):
    """Test updating a single step via its ID."""
    tracker = DefaultProcurementTracker.create_with_steps(agreement_id=1)
    loaded_db.add(tracker)
    loaded_db.commit()

    # Get step 1 (ACQUISITION_PLANNING)
    step_1 = tracker.steps[0]
    step_1_id = step_1.id

    # Update it with prefixed columns
    step_1.status = ProcurementTrackerStepStatus.COMPLETED
    step_1.acquisition_planning_notes = "Planning completed successfully"
    step_1.acquisition_planning_task_completed_by = test_user.id
    loaded_db.commit()

    # Fetch it again by ID
    updated_step = loaded_db.get(ProcurementTrackerStep, step_1_id)
    assert updated_step.status == ProcurementTrackerStepStatus.COMPLETED
    assert updated_step.acquisition_planning_notes == "Planning completed successfully"
    assert updated_step.acquisition_planning_task_completed_by == test_user.id


def test_prefixed_columns_exist(loaded_db, test_user):
    """Test that prefixed columns exist on all steps."""
    tracker = DefaultProcurementTracker.create_with_steps(agreement_id=1)
    loaded_db.add(tracker)
    loaded_db.commit()

    # All steps have the prefixed columns
    for step in tracker.steps:
        assert hasattr(step, "acquisition_planning_task_completed_by")
        assert hasattr(step, "acquisition_planning_date_completed")
        assert hasattr(step, "acquisition_planning_notes")

    # But only step 1 should populate them (business logic)
    step_1 = tracker.steps[0]
    step_1.acquisition_planning_task_completed_by = test_user.id
    step_1.acquisition_planning_notes = "Test note"
    loaded_db.commit()

    assert step_1.acquisition_planning_task_completed_by == test_user.id
    assert step_1.acquisition_planning_notes == "Test note"


def test_step_to_dict_maps_acquisition_planning_fields(loaded_db, test_user):
    """Test that to_dict() maps prefixed columns to API field names for ACQUISITION_PLANNING."""
    tracker = DefaultProcurementTracker.create_with_steps(agreement_id=1)
    loaded_db.add(tracker)
    loaded_db.commit()

    # Update step 1 with acquisition planning data
    step_1 = tracker.steps[0]
    step_1.acquisition_planning_task_completed_by = test_user.id
    step_1.acquisition_planning_date_completed = date(2026, 1, 1)
    step_1.acquisition_planning_notes = "Planning complete"
    loaded_db.commit()

    # Step 1 (ACQUISITION_PLANNING) should map to unprefixed names
    step_1_dict = tracker.steps[0].to_dict()
    assert "task_completed_by" in step_1_dict
    assert "date_completed" in step_1_dict
    assert "notes" in step_1_dict
    assert step_1_dict["notes"] == "Planning complete"

    # Prefixed versions should be removed
    assert "acquisition_planning_task_completed_by" not in step_1_dict
    assert "acquisition_planning_date_completed" not in step_1_dict
    assert "acquisition_planning_notes" not in step_1_dict


def test_step_to_dict_maps_pre_solicitation_fields(loaded_db, test_user):
    """Test that to_dict() maps prefixed columns to API field names for PRE_SOLICITATION."""
    tracker = DefaultProcurementTracker.create_with_steps(agreement_id=1)
    loaded_db.add(tracker)
    loaded_db.commit()

    # Update step 2 with pre-solicitation data
    step_2 = tracker.steps[1]
    step_2.pre_solicitation_target_completion_date = date(2026, 2, 15)
    step_2.pre_solicitation_task_completed_by = test_user.id
    step_2.pre_solicitation_date_completed = date(2026, 2, 10)
    step_2.pre_solicitation_notes = "Pre-solicitation complete"
    step_2.pre_solicitation_draft_solicitation_date = date(2026, 2, 8)
    loaded_db.commit()

    # Step 2 (PRE_SOLICITATION) should map to unprefixed names
    step_2_dict = tracker.steps[1].to_dict()
    assert "target_completion_date" in step_2_dict
    assert "task_completed_by" in step_2_dict
    assert "date_completed" in step_2_dict
    assert "notes" in step_2_dict
    assert "draft_solicitation_date" in step_2_dict
    assert step_2_dict["notes"] == "Pre-solicitation complete"

    # Prefixed versions should be removed
    assert "pre_solicitation_target_completion_date" not in step_2_dict
    assert "pre_solicitation_task_completed_by" not in step_2_dict
    assert "pre_solicitation_date_completed" not in step_2_dict
    assert "pre_solicitation_notes" not in step_2_dict
    assert "pre_solicitation_draft_solicitation_date" not in step_2_dict

    # ACQUISITION_PLANNING fields should be excluded from PRE_SOLICITATION steps
    assert "acquisition_planning_task_completed_by" not in step_2_dict
    assert "acquisition_planning_date_completed" not in step_2_dict
    assert "acquisition_planning_notes" not in step_2_dict


def test_step_to_dict_excludes_step_specific_fields_for_other_steps(loaded_db):
    """Test that to_dict() excludes step-specific fields for steps without those fields."""
    tracker = DefaultProcurementTracker.create_with_steps(agreement_id=1)
    loaded_db.add(tracker)
    loaded_db.commit()

    # Step 3 (SOLICITATION) should NOT include acquisition planning or pre-solicitation fields
    step_3_dict = tracker.steps[2].to_dict()

    # Should not have unprefixed step-specific fields
    assert "task_completed_by" not in step_3_dict
    assert "date_completed" not in step_3_dict
    assert "notes" not in step_3_dict
    assert "target_completion_date" not in step_3_dict
    assert "draft_solicitation_date" not in step_3_dict

    # Should not have prefixed fields either
    assert "acquisition_planning_task_completed_by" not in step_3_dict
    assert "acquisition_planning_date_completed" not in step_3_dict
    assert "acquisition_planning_notes" not in step_3_dict
    assert "pre_solicitation_target_completion_date" not in step_3_dict
    assert "pre_solicitation_task_completed_by" not in step_3_dict
    assert "pre_solicitation_date_completed" not in step_3_dict
    assert "pre_solicitation_notes" not in step_3_dict
    assert "pre_solicitation_draft_solicitation_date" not in step_3_dict


def test_cascade_delete_steps(loaded_db):
    """Test that deleting a tracker also deletes its steps."""
    tracker = DefaultProcurementTracker.create_with_steps(agreement_id=1)
    loaded_db.add(tracker)
    loaded_db.commit()

    step_ids = [step.id for step in tracker.steps]

    # Delete tracker
    loaded_db.delete(tracker)
    loaded_db.commit()

    # Steps should be gone
    for step_id in step_ids:
        assert loaded_db.get(ProcurementTrackerStep, step_id) is None


def test_steps_ordered_by_step_number(loaded_db):
    """Test that steps are automatically ordered by step_number."""
    tracker = DefaultProcurementTracker.create_with_steps(agreement_id=1)
    loaded_db.add(tracker)
    loaded_db.commit()

    # Refresh to get the relationship
    loaded_db.refresh(tracker)

    step_numbers = [step.step_number for step in tracker.steps]
    assert step_numbers == [1, 2, 3, 4, 5, 6]


def test_tracker_status_enum(loaded_db):
    """Test ProcurementTrackerStatus enum."""
    tracker = DefaultProcurementTracker.create_with_steps(agreement_id=1, status=ProcurementTrackerStatus.ACTIVE)
    loaded_db.add(tracker)
    loaded_db.commit()

    assert tracker.status == ProcurementTrackerStatus.ACTIVE

    tracker.status = ProcurementTrackerStatus.COMPLETED
    loaded_db.commit()

    assert tracker.status == ProcurementTrackerStatus.COMPLETED


def test_step_status_enum(loaded_db):
    """Test ProcurementTrackerStepStatus enum."""
    tracker = DefaultProcurementTracker.create_with_steps(agreement_id=1)
    loaded_db.add(tracker)
    loaded_db.commit()

    step_1 = tracker.steps[0]
    assert step_1.status == ProcurementTrackerStepStatus.ACTIVE

    step_1.status = ProcurementTrackerStepStatus.COMPLETED
    loaded_db.commit()
    assert step_1.status == ProcurementTrackerStepStatus.COMPLETED

    step_1.status = ProcurementTrackerStepStatus.SKIPPED
    loaded_db.commit()
    assert step_1.status == ProcurementTrackerStepStatus.SKIPPED


def test_relationship_to_agreement(app, loaded_db):
    """Test the relationship between tracker and agreement."""
    from models import Agreement

    tracker = DefaultProcurementTracker.create_with_steps(agreement_id=1)
    loaded_db.add(tracker)
    loaded_db.commit()

    # Load agreement
    agreement = loaded_db.get(Agreement, 1)

    # Check relationship works both ways
    assert tracker.agreement_id == agreement.id
    assert tracker in agreement.procurement_trackers


def test_display_name_properties(loaded_db):
    """Test display_name properties for tracker and steps."""
    tracker = DefaultProcurementTracker.create_with_steps(agreement_id=1)
    loaded_db.add(tracker)
    loaded_db.commit()

    # Test tracker display name
    assert tracker.display_name == f"DefaultProcurementTracker#{tracker.id}"

    # Test step display names
    assert tracker.steps[0].display_name == "Step 1: ACQUISITION_PLANNING"
    assert tracker.steps[1].display_name == "Step 2: PRE_SOLICITATION"
    assert tracker.steps[5].display_name == "Step 6: AWARD"


def test_step_dates(loaded_db):
    """Test setting step start and completed dates."""
    tracker = DefaultProcurementTracker.create_with_steps(agreement_id=1)
    loaded_db.add(tracker)
    loaded_db.commit()

    step_1 = tracker.steps[0]
    start_date = date(2026, 1, 1)
    completed_date = date(2026, 1, 15)

    step_1.step_start_date = start_date
    step_1.step_completed_date = completed_date
    loaded_db.commit()

    # Fetch again
    refreshed_tracker = loaded_db.get(DefaultProcurementTracker, tracker.id)
    refreshed_step = refreshed_tracker.steps[0]

    assert refreshed_step.step_start_date == start_date
    assert refreshed_step.step_completed_date == completed_date


def test_active_step_number(loaded_db):
    """Test that active_step_number is initialized to 1 and can be updated."""
    tracker = DefaultProcurementTracker.create_with_steps(agreement_id=1)
    loaded_db.add(tracker)
    loaded_db.commit()

    # Should be initialized to 1
    assert tracker.active_step_number == 1

    # Update to next step
    tracker.active_step_number = 2
    loaded_db.commit()

    refreshed_tracker = loaded_db.get(DefaultProcurementTracker, tracker.id)
    assert refreshed_tracker.active_step_number == 2


def test_procurement_action_relationship(loaded_db):
    """Test optional procurement_action foreign key."""
    tracker = DefaultProcurementTracker.create_with_steps(agreement_id=1)

    # Initially null
    assert tracker.procurement_action is None

    loaded_db.add(tracker)
    loaded_db.commit()

    # Can be set later
    tracker.procurement_action = 1
    loaded_db.commit()

    refreshed_tracker = loaded_db.get(DefaultProcurementTracker, tracker.id)
    assert refreshed_tracker.procurement_action == 1


def test_all_step_types_created(loaded_db):
    """Test that all 6 step types are created correctly."""
    tracker = DefaultProcurementTracker.create_with_steps(agreement_id=1)
    loaded_db.add(tracker)
    loaded_db.commit()

    expected_step_types = [
        ProcurementTrackerStepType.ACQUISITION_PLANNING,
        ProcurementTrackerStepType.PRE_SOLICITATION,
        ProcurementTrackerStepType.SOLICITATION,
        ProcurementTrackerStepType.EVALUATION,
        ProcurementTrackerStepType.PRE_AWARD,
        ProcurementTrackerStepType.AWARD,
    ]

    actual_step_types = [step.step_type for step in tracker.steps]
    assert actual_step_types == expected_step_types


def test_step_skipped_status(loaded_db):
    """Test that steps can be marked as SKIPPED."""
    tracker = DefaultProcurementTracker.create_with_steps(agreement_id=1)
    loaded_db.add(tracker)
    loaded_db.commit()

    step_2 = tracker.steps[1]
    step_2.status = ProcurementTrackerStepStatus.SKIPPED
    loaded_db.commit()

    refreshed_tracker = loaded_db.get(DefaultProcurementTracker, tracker.id)
    assert refreshed_tracker.steps[1].status == ProcurementTrackerStepStatus.SKIPPED
