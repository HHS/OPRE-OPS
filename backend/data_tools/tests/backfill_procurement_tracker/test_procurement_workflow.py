"""
Unit tests for the shared procurement workflow module.

Covers:
- ProcurementAction.get_or_create_for_agreement()
- DefaultProcurementTracker.get_or_create_for_action()
- ProcurementTracker.mark_completed()
- ProcurementTracker.activate_first_step()
- get_or_create_procurement_records_for_new_award()
- get_or_create_procurement_records_for_modification()
"""

from datetime import date

import pytest
from sqlalchemy import select, text

from data_tools.src.common.utils import get_or_create_sys_user
from models import *  # noqa: F403, F401
from models.procurement_action import AwardType, ProcurementAction, ProcurementActionStatus
from models.procurement_tracker import (
    DefaultProcurementTracker,
    ProcurementTracker,
    ProcurementTrackerStatus,
    ProcurementTrackerStepStatus,
)
from models.procurement_workflow import (
    get_or_create_procurement_records_for_modification,
    get_or_create_procurement_records_for_new_award,
)


@pytest.fixture()
def db_workflow(loaded_db):
    """Minimal fixture: one procurement shop, one project, and two agreements."""
    sys_user = get_or_create_sys_user(loaded_db)
    loaded_db.commit()
    uid = sys_user.id

    project = ResearchProject(id=8000, title="Workflow Test Project", short_title="WTP")
    loaded_db.add(project)
    loaded_db.commit()

    proc_shop = ProcurementShop(id=8000, name="Test PSC", abbr="TPSC", created_by=uid)
    loaded_db.add(proc_shop)
    loaded_db.commit()

    # Agreement 8001: no pre-existing action or tracker
    agreement_1 = ContractAgreement(
        id=8001,
        name="Clean Agreement",
        project_id=8000,
        awarding_entity_id=8000,
        created_by=uid,
        updated_by=uid,
    )
    # Agreement 8002: no pre-existing action or tracker, no procurement shop
    agreement_2 = ContractAgreement(
        id=8002,
        name="No Shop Agreement",
        project_id=8000,
        awarding_entity_id=None,
        created_by=uid,
        updated_by=uid,
    )
    loaded_db.add_all([agreement_1, agreement_2])
    loaded_db.commit()

    yield loaded_db

    loaded_db.rollback()
    loaded_db.execute(text("DELETE FROM ops_event"))
    loaded_db.execute(text("DELETE FROM ops_event_version"))
    loaded_db.execute(text("DELETE FROM procurement_tracker_step"))
    loaded_db.execute(text("DELETE FROM procurement_tracker_step_version"))
    loaded_db.execute(text("DELETE FROM default_procurement_tracker"))
    loaded_db.execute(text("DELETE FROM default_procurement_tracker_version"))
    loaded_db.execute(text("DELETE FROM procurement_tracker"))
    loaded_db.execute(text("DELETE FROM procurement_tracker_version"))
    loaded_db.execute(text("DELETE FROM procurement_action"))
    loaded_db.execute(text("DELETE FROM procurement_action_version"))
    loaded_db.execute(text("DELETE FROM contract_agreement"))
    loaded_db.execute(text("DELETE FROM contract_agreement_version"))
    loaded_db.execute(text("DELETE FROM agreement"))
    loaded_db.execute(text("DELETE FROM agreement_version"))
    loaded_db.execute(text("DELETE FROM procurement_shop_fee"))
    loaded_db.execute(text("DELETE FROM procurement_shop_fee_version"))
    loaded_db.execute(text("DELETE FROM procurement_shop"))
    loaded_db.execute(text("DELETE FROM procurement_shop_version"))
    loaded_db.execute(text("DELETE FROM research_project"))
    loaded_db.execute(text("DELETE FROM research_project_version"))
    loaded_db.execute(text("DELETE FROM project"))
    loaded_db.execute(text("DELETE FROM project_version"))
    loaded_db.execute(text("DELETE FROM ops_db_history"))
    loaded_db.execute(text("DELETE FROM ops_db_history_version"))
    loaded_db.commit()


# ============================================================================
# ProcurementAction.get_or_create_for_agreement()
# ============================================================================


def test_get_or_create_action_creates_when_missing(db_workflow):
    """Creates a new ProcurementAction when none exists for the agreement + award_type."""
    sys_user = get_or_create_sys_user(db_workflow)
    agreement = db_workflow.get(Agreement, 8001)

    action, created = ProcurementAction.get_or_create_for_agreement(
        db_workflow,
        agreement,
        award_type=AwardType.NEW_AWARD,
        created_by=sys_user.id,
    )

    assert created is True
    assert action.id is not None
    assert action.agreement_id == 8001
    assert action.award_type == AwardType.NEW_AWARD
    assert action.status == ProcurementActionStatus.PLANNED
    assert action.procurement_shop_id == 8000


def test_get_or_create_action_returns_existing(db_workflow):
    """Returns the existing action and False when one already exists."""
    sys_user = get_or_create_sys_user(db_workflow)
    agreement = db_workflow.get(Agreement, 8001)

    action_first, _ = ProcurementAction.get_or_create_for_agreement(
        db_workflow, agreement, award_type=AwardType.NEW_AWARD, created_by=sys_user.id
    )
    db_workflow.flush()

    action_second, created = ProcurementAction.get_or_create_for_agreement(
        db_workflow, agreement, award_type=AwardType.NEW_AWARD, created_by=sys_user.id
    )

    assert created is False
    assert action_second.id == action_first.id


def test_get_or_create_action_sets_status_and_date(db_workflow):
    """Passes through custom status and date_awarded_obligated."""
    sys_user = get_or_create_sys_user(db_workflow)
    agreement = db_workflow.get(Agreement, 8001)
    award_date = date(2024, 6, 1)

    action, created = ProcurementAction.get_or_create_for_agreement(
        db_workflow,
        agreement,
        award_type=AwardType.NEW_AWARD,
        status=ProcurementActionStatus.AWARDED,
        date_awarded_obligated=award_date,
        created_by=sys_user.id,
    )

    assert created is True
    assert action.status == ProcurementActionStatus.AWARDED
    assert action.date_awarded_obligated == award_date


def test_get_or_create_action_no_procurement_shop_when_agreement_has_none(db_workflow):
    """procurement_shop_id is None when agreement has no awarding_entity_id."""
    sys_user = get_or_create_sys_user(db_workflow)
    agreement = db_workflow.get(Agreement, 8002)

    action, created = ProcurementAction.get_or_create_for_agreement(
        db_workflow, agreement, award_type=AwardType.NEW_AWARD, created_by=sys_user.id
    )

    assert created is True
    assert action.procurement_shop_id is None


def test_get_or_create_action_different_award_types_are_independent(db_workflow):
    """NEW_AWARD and MODIFICATION are separate records."""
    sys_user = get_or_create_sys_user(db_workflow)
    agreement = db_workflow.get(Agreement, 8001)

    new_award, new_created = ProcurementAction.get_or_create_for_agreement(
        db_workflow, agreement, award_type=AwardType.NEW_AWARD, created_by=sys_user.id
    )
    db_workflow.flush()
    mod, mod_created = ProcurementAction.get_or_create_for_agreement(
        db_workflow, agreement, award_type=AwardType.MODIFICATION, created_by=sys_user.id
    )

    assert new_created is True
    assert mod_created is True
    assert new_award.id != mod.id


# ============================================================================
# DefaultProcurementTracker.get_or_create_for_action()
# ============================================================================


def test_get_or_create_tracker_creates_new(db_workflow):
    """Creates a tracker with 6 steps when none exists."""
    sys_user = get_or_create_sys_user(db_workflow)
    agreement = db_workflow.get(Agreement, 8001)

    action, _ = ProcurementAction.get_or_create_for_agreement(
        db_workflow, agreement, award_type=AwardType.NEW_AWARD, created_by=sys_user.id
    )
    db_workflow.flush()

    tracker, was_created, needs_step_setup = DefaultProcurementTracker.get_or_create_for_action(
        db_workflow,
        agreement_id=8001,
        procurement_action_id=action.id,
        created_by=sys_user.id,
    )

    assert was_created is True
    assert needs_step_setup is True
    assert tracker.agreement_id == 8001
    assert tracker.procurement_action == action.id
    assert len(tracker.steps) == 6


def test_get_or_create_tracker_returns_existing(db_workflow):
    """Returns the existing tracker without creating a duplicate."""
    sys_user = get_or_create_sys_user(db_workflow)
    agreement = db_workflow.get(Agreement, 8001)

    action, _ = ProcurementAction.get_or_create_for_agreement(
        db_workflow, agreement, award_type=AwardType.NEW_AWARD, created_by=sys_user.id
    )
    db_workflow.flush()

    tracker_first, _, _ = DefaultProcurementTracker.get_or_create_for_action(
        db_workflow, agreement_id=8001, procurement_action_id=action.id, created_by=sys_user.id
    )
    db_workflow.flush()

    tracker_second, was_created, needs_step_setup = DefaultProcurementTracker.get_or_create_for_action(
        db_workflow, agreement_id=8001, procurement_action_id=action.id, created_by=sys_user.id
    )

    assert was_created is False
    assert needs_step_setup is False
    assert tracker_second.id == tracker_first.id


def test_get_or_create_tracker_adopts_unlinked_tracker(db_workflow):
    """Adopts an existing unlinked tracker instead of creating a new one."""
    sys_user = get_or_create_sys_user(db_workflow)
    agreement = db_workflow.get(Agreement, 8001)

    # Create an unlinked tracker (no procurement_action)
    unlinked = DefaultProcurementTracker.create_with_steps(agreement_id=8001, created_by=sys_user.id)
    db_workflow.add(unlinked)
    db_workflow.flush()
    original_id = unlinked.id

    action, _ = ProcurementAction.get_or_create_for_agreement(
        db_workflow, agreement, award_type=AwardType.NEW_AWARD, created_by=sys_user.id
    )
    db_workflow.flush()

    tracker, was_created, needs_step_setup = DefaultProcurementTracker.get_or_create_for_action(
        db_workflow, agreement_id=8001, procurement_action_id=action.id, created_by=sys_user.id
    )

    # Same object was adopted — no duplicate created
    assert was_created is False
    assert needs_step_setup is True
    assert tracker.id == original_id
    assert tracker.procurement_action == action.id

    # Confirm only one tracker exists for this agreement
    all_trackers = (
        db_workflow.execute(select(ProcurementTracker).where(ProcurementTracker.agreement_id == 8001)).scalars().all()
    )
    assert len(all_trackers) == 1


# ============================================================================
# ProcurementTracker.mark_completed()
# ============================================================================


def test_mark_completed_sets_status_and_steps(db_workflow):
    """mark_completed() sets tracker to COMPLETED and all steps to COMPLETED."""
    sys_user = get_or_create_sys_user(db_workflow)
    tracker = DefaultProcurementTracker.create_with_steps(agreement_id=8001, created_by=sys_user.id)
    db_workflow.add(tracker)
    db_workflow.flush()

    completed_date = date(2024, 3, 15)
    tracker.mark_completed(completed_date=completed_date)

    assert tracker.status == ProcurementTrackerStatus.COMPLETED
    assert tracker.active_step_number == 6
    for step in tracker.steps:
        assert step.status == ProcurementTrackerStepStatus.COMPLETED
        assert step.step_start_date == completed_date
        assert step.step_completed_date == completed_date


def test_mark_completed_defaults_to_today(db_workflow):
    """mark_completed() uses today's date when no date is provided."""
    sys_user = get_or_create_sys_user(db_workflow)
    tracker = DefaultProcurementTracker.create_with_steps(agreement_id=8001, created_by=sys_user.id)
    db_workflow.add(tracker)
    db_workflow.flush()

    today = date.today()
    tracker.mark_completed()

    for step in tracker.steps:
        assert step.step_start_date == today
        assert step.step_completed_date == today


# ============================================================================
# ProcurementTracker.activate_first_step()
# ============================================================================


def test_activate_first_step_sets_step_1_active(db_workflow):
    """activate_first_step() sets step 1 to ACTIVE with today's date."""
    sys_user = get_or_create_sys_user(db_workflow)
    tracker = DefaultProcurementTracker.create_with_steps(agreement_id=8001, created_by=sys_user.id)
    db_workflow.add(tracker)
    db_workflow.flush()

    # Reset step 1 back to PENDING to simulate an adopted unlinked tracker
    step_1 = next(s for s in tracker.steps if s.step_number == 1)
    step_1.status = ProcurementTrackerStepStatus.PENDING
    step_1.step_start_date = None

    tracker.activate_first_step()

    assert step_1.status == ProcurementTrackerStepStatus.ACTIVE
    assert step_1.step_start_date == date.today()


def test_activate_first_step_does_not_touch_other_steps(db_workflow):
    """activate_first_step() leaves steps 2–6 untouched."""
    sys_user = get_or_create_sys_user(db_workflow)
    tracker = DefaultProcurementTracker.create_with_steps(agreement_id=8001, created_by=sys_user.id)
    db_workflow.add(tracker)
    db_workflow.flush()

    # Reset all steps to PENDING
    for step in tracker.steps:
        step.status = ProcurementTrackerStepStatus.PENDING
        step.step_start_date = None

    tracker.activate_first_step()

    for step in tracker.steps:
        if step.step_number > 1:
            assert step.status == ProcurementTrackerStepStatus.PENDING
            assert step.step_start_date is None


# ============================================================================
# get_or_create_procurement_records_for_new_award()
# ============================================================================


def test_new_award_workflow_creates_action_and_tracker(db_workflow):
    """Creates both action and tracker for a new award, returns correct flags."""
    sys_user = get_or_create_sys_user(db_workflow)
    agreement = db_workflow.get(Agreement, 8001)

    action, tracker, action_created, tracker_created = get_or_create_procurement_records_for_new_award(
        db_workflow, agreement, created_by=sys_user.id
    )

    assert action_created is True
    assert tracker_created is True
    assert action.award_type == AwardType.NEW_AWARD
    assert action.status == ProcurementActionStatus.PLANNED
    assert tracker.status == ProcurementTrackerStatus.ACTIVE
    assert tracker.procurement_action == action.id
    assert len(tracker.steps) == 6


def test_new_award_workflow_activates_step_1(db_workflow):
    """Step 1 is ACTIVE with today's date after a new-award workflow call."""
    sys_user = get_or_create_sys_user(db_workflow)
    agreement = db_workflow.get(Agreement, 8001)

    _, tracker, _, _ = get_or_create_procurement_records_for_new_award(db_workflow, agreement, created_by=sys_user.id)

    step_1 = next(s for s in tracker.steps if s.step_number == 1)
    assert step_1.status == ProcurementTrackerStepStatus.ACTIVE
    assert step_1.step_start_date == date.today()


def test_new_award_workflow_completed_status_marks_all_steps(db_workflow):
    """COMPLETED tracker_status marks all steps completed with the award date."""
    sys_user = get_or_create_sys_user(db_workflow)
    agreement = db_workflow.get(Agreement, 8001)
    award_date = date(2024, 1, 15)

    _, tracker, _, _ = get_or_create_procurement_records_for_new_award(
        db_workflow,
        agreement,
        created_by=sys_user.id,
        action_status=ProcurementActionStatus.AWARDED,
        tracker_status=ProcurementTrackerStatus.COMPLETED,
        date_awarded_obligated=award_date,
    )

    assert tracker.status == ProcurementTrackerStatus.COMPLETED
    assert tracker.active_step_number == 6
    for step in tracker.steps:
        assert step.status == ProcurementTrackerStepStatus.COMPLETED
        assert step.step_start_date == award_date
        assert step.step_completed_date == award_date


def test_new_award_workflow_idempotent(db_workflow):
    """Calling new_award workflow twice returns existing records with created=False."""
    sys_user = get_or_create_sys_user(db_workflow)
    agreement = db_workflow.get(Agreement, 8001)

    action_1, tracker_1, _, _ = get_or_create_procurement_records_for_new_award(
        db_workflow, agreement, created_by=sys_user.id
    )
    db_workflow.flush()

    action_2, tracker_2, action_created, tracker_created = get_or_create_procurement_records_for_new_award(
        db_workflow, agreement, created_by=sys_user.id
    )

    assert action_created is False
    assert tracker_created is False
    assert action_2.id == action_1.id
    assert tracker_2.id == tracker_1.id


def test_new_award_workflow_creates_ops_events(db_workflow):
    """OpsEvents are emitted for a newly created action and tracker."""
    sys_user = get_or_create_sys_user(db_workflow)
    agreement = db_workflow.get(Agreement, 8001)

    get_or_create_procurement_records_for_new_award(db_workflow, agreement, created_by=sys_user.id, source="TestSource")
    db_workflow.flush()

    action_events = (
        db_workflow.execute(select(OpsEvent).where(OpsEvent.event_type == OpsEventType.CREATE_PROCUREMENT_ACTION))
        .scalars()
        .all()
    )
    tracker_events = (
        db_workflow.execute(select(OpsEvent).where(OpsEvent.event_type == OpsEventType.CREATE_PROCUREMENT_TRACKER))
        .scalars()
        .all()
    )

    assert len(action_events) == 1
    assert len(tracker_events) == 1
    assert "TestSource" in action_events[0].event_details["message"]
    assert "TestSource" in tracker_events[0].event_details["message"]


def test_new_award_workflow_no_duplicate_events_on_existing(db_workflow):
    """No OpsEvents emitted on second call when records already exist."""
    sys_user = get_or_create_sys_user(db_workflow)
    agreement = db_workflow.get(Agreement, 8001)

    get_or_create_procurement_records_for_new_award(db_workflow, agreement, created_by=sys_user.id, source="First")
    db_workflow.flush()

    get_or_create_procurement_records_for_new_award(db_workflow, agreement, created_by=sys_user.id, source="Second")
    db_workflow.flush()

    action_events = (
        db_workflow.execute(select(OpsEvent).where(OpsEvent.event_type == OpsEventType.CREATE_PROCUREMENT_ACTION))
        .scalars()
        .all()
    )
    # Still only 1 event from the first call
    assert len(action_events) == 1


# ============================================================================
# get_or_create_procurement_records_for_modification()
# ============================================================================


def test_modification_workflow_creates_action_and_tracker(db_workflow):
    """Creates a MODIFICATION action and ACTIVE tracker."""
    sys_user = get_or_create_sys_user(db_workflow)
    agreement = db_workflow.get(Agreement, 8001)

    action, tracker, action_created, tracker_created = get_or_create_procurement_records_for_modification(
        db_workflow, agreement, created_by=sys_user.id
    )

    assert action_created is True
    assert tracker_created is True
    assert action.award_type == AwardType.MODIFICATION
    assert action.status == ProcurementActionStatus.PLANNED
    assert tracker.status == ProcurementTrackerStatus.ACTIVE
    assert tracker.procurement_action == action.id


def test_modification_workflow_activates_step_1(db_workflow):
    """Step 1 is ACTIVE after a modification workflow call."""
    sys_user = get_or_create_sys_user(db_workflow)
    agreement = db_workflow.get(Agreement, 8001)

    _, tracker, _, _ = get_or_create_procurement_records_for_modification(
        db_workflow, agreement, created_by=sys_user.id
    )

    step_1 = next(s for s in tracker.steps if s.step_number == 1)
    assert step_1.status == ProcurementTrackerStepStatus.ACTIVE
    assert step_1.step_start_date == date.today()


def test_modification_workflow_idempotent(db_workflow):
    """Calling modification workflow twice returns existing records with created=False."""
    sys_user = get_or_create_sys_user(db_workflow)
    agreement = db_workflow.get(Agreement, 8001)

    action_1, tracker_1, _, _ = get_or_create_procurement_records_for_modification(
        db_workflow, agreement, created_by=sys_user.id
    )
    db_workflow.flush()

    action_2, tracker_2, action_created, tracker_created = get_or_create_procurement_records_for_modification(
        db_workflow, agreement, created_by=sys_user.id
    )

    assert action_created is False
    assert tracker_created is False
    assert action_2.id == action_1.id
    assert tracker_2.id == tracker_1.id


def test_modification_workflow_creates_ops_events(db_workflow):
    """OpsEvents are emitted for a newly created modification action and tracker."""
    sys_user = get_or_create_sys_user(db_workflow)
    agreement = db_workflow.get(Agreement, 8001)

    get_or_create_procurement_records_for_modification(
        db_workflow, agreement, created_by=sys_user.id, source="ModSource"
    )
    db_workflow.flush()

    action_events = (
        db_workflow.execute(select(OpsEvent).where(OpsEvent.event_type == OpsEventType.CREATE_PROCUREMENT_ACTION))
        .scalars()
        .all()
    )
    tracker_events = (
        db_workflow.execute(select(OpsEvent).where(OpsEvent.event_type == OpsEventType.CREATE_PROCUREMENT_TRACKER))
        .scalars()
        .all()
    )

    assert len(action_events) == 1
    assert len(tracker_events) == 1


def test_modification_workflow_adopts_unlinked_tracker(db_workflow):
    """An unlinked tracker is adopted by the modification workflow, not duplicated."""
    sys_user = get_or_create_sys_user(db_workflow)
    agreement = db_workflow.get(Agreement, 8001)

    unlinked = DefaultProcurementTracker.create_with_steps(agreement_id=8001, created_by=sys_user.id)
    db_workflow.add(unlinked)
    db_workflow.flush()
    original_id = unlinked.id

    _, tracker, _, tracker_created = get_or_create_procurement_records_for_modification(
        db_workflow, agreement, created_by=sys_user.id
    )

    assert tracker_created is False
    assert tracker.id == original_id

    all_trackers = (
        db_workflow.execute(select(ProcurementTracker).where(ProcurementTracker.agreement_id == 8001)).scalars().all()
    )
    assert len(all_trackers) == 1
