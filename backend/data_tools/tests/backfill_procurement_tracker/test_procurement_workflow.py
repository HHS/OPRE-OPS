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
from sqlalchemy import func, select, text

from data_tools.src.common.utils import get_or_create_sys_user
from models import *  # noqa: F403, F401
from models.procurement_action import AwardType, ProcurementAction, ProcurementActionStatus
from models.procurement_tracker import (
    DefaultProcurementTracker,
    ProcurementTracker,
    ProcurementTrackerStatus,
    ProcurementTrackerStepStatus,
    ProcurementTrackerStepType,
)
from models.procurement_workflow import (
    AWARD_APPROVED_STATUS,
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
    loaded_db.execute(text("DELETE FROM iaa_agreement"))
    loaded_db.execute(text("DELETE FROM iaa_agreement_version"))
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


def test_new_award_workflow_completed_status_approves_award_step(db_workflow):
    """COMPLETED tracker_status also approves the AWARD step — mark_completed() alone
    only flips step statuses/dates, but the Awards and Modifications tab gates on
    award_approval_status == "APPROVED", not tracker/step status."""
    sys_user = get_or_create_sys_user(db_workflow)
    agreement = db_workflow.get(Agreement, 8001)
    vendor = Vendor(name="Test Vendor", created_by=sys_user.id)
    db_workflow.add(vendor)
    db_workflow.flush()
    agreement.vendor_id = vendor.id
    award_date = date(2024, 1, 15)

    _, tracker, _, _ = get_or_create_procurement_records_for_new_award(
        db_workflow,
        agreement,
        created_by=sys_user.id,
        action_status=ProcurementActionStatus.AWARDED,
        tracker_status=ProcurementTrackerStatus.COMPLETED,
        date_awarded_obligated=award_date,
    )

    award_step = tracker.get_step(ProcurementTrackerStepType.AWARD)
    assert award_step is not None
    assert award_step.award_approval_status == "APPROVED"
    assert award_step.award_date == award_date
    assert award_step.award_vendor_id == vendor.id


def test_new_award_workflow_completed_rerun_does_not_clobber_manual_change(db_workflow):
    """A second get_or_create call for an already-linked COMPLETED tracker must reuse
    the existing action/tracker (not create a duplicate) AND must NOT re-stamp the
    AWARD step — needs_step_setup is False once the tracker is linked to this action,
    so a real Budget Team decision made in between (e.g. a manual DECLINED override)
    survives a re-run of the importing/backfill script."""
    sys_user = get_or_create_sys_user(db_workflow)
    agreement = db_workflow.get(Agreement, 8001)
    award_date = date(2024, 1, 15)

    action_1, tracker_1, _, _ = get_or_create_procurement_records_for_new_award(
        db_workflow,
        agreement,
        created_by=sys_user.id,
        action_status=ProcurementActionStatus.AWARDED,
        tracker_status=ProcurementTrackerStatus.COMPLETED,
        date_awarded_obligated=award_date,
        include_terminal=True,
    )
    db_workflow.flush()

    # A Budget Team member reviews the step through the real app and declines it.
    award_step = tracker_1.get_step(ProcurementTrackerStepType.AWARD)
    award_step.award_approval_status = "DECLINED"
    award_step.award_amount = 999
    db_workflow.flush()

    # Re-running the workflow (e.g. reimporting the same spreadsheet row, or rerunning
    # the backfill script) must reuse the same action/tracker, not duplicate them...
    action_2, tracker_2, action_created, tracker_created = get_or_create_procurement_records_for_new_award(
        db_workflow,
        agreement,
        created_by=sys_user.id,
        action_status=ProcurementActionStatus.AWARDED,
        tracker_status=ProcurementTrackerStatus.COMPLETED,
        date_awarded_obligated=award_date,
        include_terminal=True,
    )

    assert action_created is False
    assert tracker_created is False
    assert action_2.id == action_1.id
    assert tracker_2.id == tracker_1.id

    # ...and must not overwrite that human decision on the (necessarily same) step.
    assert award_step.award_approval_status == "DECLINED"
    assert award_step.award_amount == pytest.approx(999)


def test_new_award_workflow_completed_rerun_does_not_approve_pending_real_decision(db_workflow):
    """A NEW_AWARD tracker that reached COMPLETED through the real app workflow (final
    step completion) while award_approval_status is still None — awaiting a genuine
    Budget Team decision — must not be silently auto-approved by a later re-import.
    Auto-approval only applies when this call itself drives the tracker to COMPLETED
    (new, adopted, or promoting an in-progress tracker); it must not fire for a tracker
    that was already linked to this action and already COMPLETED beforehand."""
    sys_user = get_or_create_sys_user(db_workflow)
    agreement = db_workflow.get(Agreement, 8001)

    action, _ = ProcurementAction.get_or_create_for_agreement(
        db_workflow,
        agreement,
        award_type=AwardType.NEW_AWARD,
        status=ProcurementActionStatus.AWARDED,
        created_by=sys_user.id,
    )
    db_workflow.flush()

    tracker = DefaultProcurementTracker.create_with_steps(
        agreement_id=agreement.id, procurement_action=action.id, created_by=sys_user.id
    )
    db_workflow.add(tracker)
    db_workflow.flush()

    # Simulate the real app completing the final step on its own (ProcurementTrackerStepService):
    # the tracker reaches COMPLETED, but the AWARD step's approval is still pending.
    tracker.mark_completed(completed_date=date(2024, 1, 15))
    award_step = tracker.get_step(ProcurementTrackerStepType.AWARD)
    assert award_step.award_approval_status is None
    db_workflow.flush()

    _, tracker_2, action_created, tracker_created = get_or_create_procurement_records_for_new_award(
        db_workflow,
        agreement,
        created_by=sys_user.id,
        action_status=ProcurementActionStatus.AWARDED,
        tracker_status=ProcurementTrackerStatus.COMPLETED,
        date_awarded_obligated=date(2024, 1, 15),
        include_terminal=True,
    )

    assert action_created is False
    assert tracker_created is False
    assert tracker_2.id == tracker.id
    assert tracker_2.get_step(ProcurementTrackerStepType.AWARD).award_approval_status is None


def test_new_award_workflow_completed_rerun_does_not_clobber_in_progress_steps(db_workflow):
    """An already-linked tracker that is genuinely mid-workflow (real step dates entered
    by a COR, an active step short of AWARD) must not be force-completed by a later
    OBLIGATED re-import. mark_completed() unconditionally overwrites every step's
    status/dates and jumps active_step_number to the end — needs_step_setup is False
    once the tracker is linked to this action, so that real history must survive."""
    sys_user = get_or_create_sys_user(db_workflow)
    agreement = db_workflow.get(Agreement, 8001)

    action, _ = ProcurementAction.get_or_create_for_agreement(
        db_workflow,
        agreement,
        award_type=AwardType.NEW_AWARD,
        status=ProcurementActionStatus.PLANNED,
        created_by=sys_user.id,
    )
    db_workflow.flush()

    tracker = DefaultProcurementTracker.create_with_steps(
        agreement_id=agreement.id, procurement_action=action.id, created_by=sys_user.id
    )
    db_workflow.add(tracker)
    db_workflow.flush()

    # Simulate real progress made through the app: steps 1-2 completed with real dates,
    # step 3 active, steps 4+ (including AWARD) still pending.
    all_steps = sorted(tracker.steps, key=lambda s: s.step_number)
    for step in all_steps[:2]:
        step.status = ProcurementTrackerStepStatus.COMPLETED
        step.step_start_date = date(2024, 1, 1)
        step.step_completed_date = date(2024, 1, 5)
    all_steps[2].status = ProcurementTrackerStepStatus.ACTIVE
    all_steps[2].step_start_date = date(2024, 1, 6)
    tracker.active_step_number = 3
    db_workflow.flush()

    get_or_create_procurement_records_for_new_award(
        db_workflow,
        agreement,
        created_by=sys_user.id,
        action_status=ProcurementActionStatus.AWARDED,
        tracker_status=ProcurementTrackerStatus.COMPLETED,
        date_awarded_obligated=date(2024, 1, 15),
        include_terminal=True,
    )

    assert tracker.status == ProcurementTrackerStatus.ACTIVE
    assert tracker.active_step_number == 3
    assert all_steps[0].status == ProcurementTrackerStepStatus.COMPLETED
    assert all_steps[0].step_completed_date == date(2024, 1, 5)
    assert all_steps[2].status == ProcurementTrackerStepStatus.ACTIVE
    assert all_steps[2].step_start_date == date(2024, 1, 6)
    assert all_steps[-1].status == ProcurementTrackerStepStatus.PENDING
    assert tracker.get_step(ProcurementTrackerStepType.AWARD).award_approval_status is None


def test_new_award_workflow_completed_rerun_does_not_clobber_step_1_in_progress_data(db_workflow):
    """A tracker where a user has started filling in real step-1 (ACQUISITION_PLANNING)
    data — notes, completed-by, or a completed date — must not be force-completed by a
    later OBLIGATED re-import, even though active_step_number is still 1.
    active_step_number only advances on step *completion*, so relying on it alone can't
    tell a genuinely untouched tracker apart from one with real in-progress step-1 data."""
    sys_user = get_or_create_sys_user(db_workflow)
    agreement = db_workflow.get(Agreement, 8001)

    action, _ = ProcurementAction.get_or_create_for_agreement(
        db_workflow,
        agreement,
        award_type=AwardType.NEW_AWARD,
        status=ProcurementActionStatus.PLANNED,
        created_by=sys_user.id,
    )
    db_workflow.flush()

    tracker = DefaultProcurementTracker.create_with_steps(
        agreement_id=agreement.id, procurement_action=action.id, created_by=sys_user.id
    )
    db_workflow.add(tracker)
    db_workflow.flush()

    # Simulate a user who has started filling in step 1 but hasn't completed/advanced
    # past it yet — active_step_number stays at its default of 1.
    step_1 = tracker.get_step(ProcurementTrackerStepType.ACQUISITION_PLANNING)
    step_1.acquisition_planning_notes = "Started drafting the acquisition plan."
    db_workflow.flush()

    get_or_create_procurement_records_for_new_award(
        db_workflow,
        agreement,
        created_by=sys_user.id,
        action_status=ProcurementActionStatus.AWARDED,
        tracker_status=ProcurementTrackerStatus.COMPLETED,
        date_awarded_obligated=date(2024, 1, 15),
        include_terminal=True,
    )

    assert tracker.status == ProcurementTrackerStatus.ACTIVE
    assert tracker.active_step_number == 1
    assert step_1.acquisition_planning_notes == "Started drafting the acquisition plan."
    assert step_1.status != ProcurementTrackerStepStatus.COMPLETED
    assert tracker.get_step(ProcurementTrackerStepType.AWARD).award_approval_status is None


def test_new_award_workflow_promotion_splits_unobligated_bli_to_modification(db_workflow):
    """Order-independence: an IN_EXECUTION BLI that landed on a NEW_AWARD action before
    any OBLIGATED BLI existed (so has_obligated_blis() correctly said "not a mod" at the
    time) must move to its own MODIFICATION action when a later OBLIGATED BLI promotes
    that NEW_AWARD action to AWARDED — producing the same (AWARDED NEW_AWARD + in-process
    MODIFICATION) structure as if the OBLIGATED BLI had been processed first."""
    sys_user = get_or_create_sys_user(db_workflow)
    agreement = db_workflow.get(Agreement, 8001)

    new_award_action, tracker, _, _ = get_or_create_procurement_records_for_new_award(
        db_workflow, agreement, created_by=sys_user.id
    )
    db_workflow.flush()

    execution_bli = ContractBudgetLineItem(
        agreement_id=agreement.id,
        amount=10000,
        status=BudgetLineItemStatus.IN_EXECUTION,
        procurement_action_id=new_award_action.id,
        created_by=sys_user.id,
    )
    db_workflow.add(execution_bli)
    db_workflow.flush()

    get_or_create_procurement_records_for_new_award(
        db_workflow,
        agreement,
        created_by=sys_user.id,
        action_status=ProcurementActionStatus.AWARDED,
        tracker_status=ProcurementTrackerStatus.COMPLETED,
        date_awarded_obligated=date(2024, 1, 15),
        include_terminal=True,
    )

    assert new_award_action.status == ProcurementActionStatus.AWARDED

    mod_action = db_workflow.execute(
        select(ProcurementAction).where(
            ProcurementAction.agreement_id == agreement.id,
            ProcurementAction.award_type == AwardType.MODIFICATION,
        )
    ).scalar_one()
    assert mod_action.status == ProcurementActionStatus.PLANNED

    mod_tracker = db_workflow.execute(
        select(DefaultProcurementTracker).where(DefaultProcurementTracker.procurement_action == mod_action.id)
    ).scalar_one()
    assert mod_tracker.status == ProcurementTrackerStatus.ACTIVE

    assert execution_bli.procurement_action_id == mod_action.id
    assert tracker.get_step(ProcurementTrackerStepType.AWARD).award_approval_status == AWARD_APPROVED_STATUS


def test_new_award_workflow_promote_on_order_flip_false_disables_promotion(db_workflow):
    """promote_on_order_flip=False must opt the caller out of the order-flip promotion
    (and the BLI split that comes with it) entirely, even when action_status=AWARDED is
    passed against an existing non-terminal action — for callers that want AWARDED for
    some other reason and don't want the implicit promotion behavior triggered."""
    sys_user = get_or_create_sys_user(db_workflow)
    agreement = db_workflow.get(Agreement, 8001)

    new_award_action, tracker, _, _ = get_or_create_procurement_records_for_new_award(
        db_workflow, agreement, created_by=sys_user.id
    )
    db_workflow.flush()

    execution_bli = ContractBudgetLineItem(
        agreement_id=agreement.id,
        amount=10000,
        status=BudgetLineItemStatus.IN_EXECUTION,
        procurement_action_id=new_award_action.id,
        created_by=sys_user.id,
    )
    db_workflow.add(execution_bli)
    db_workflow.flush()

    get_or_create_procurement_records_for_new_award(
        db_workflow,
        agreement,
        created_by=sys_user.id,
        action_status=ProcurementActionStatus.AWARDED,
        tracker_status=ProcurementTrackerStatus.COMPLETED,
        date_awarded_obligated=date(2024, 1, 15),
        include_terminal=True,
        promote_on_order_flip=False,
    )

    assert new_award_action.status == ProcurementActionStatus.PLANNED

    mod_action_count = db_workflow.execute(
        select(func.count())
        .select_from(ProcurementAction)
        .where(
            ProcurementAction.agreement_id == agreement.id,
            ProcurementAction.award_type == AwardType.MODIFICATION,
        )
    ).scalar_one()
    assert mod_action_count == 0
    assert execution_bli.procurement_action_id == new_award_action.id


def test_new_award_workflow_adopting_unlinked_tracker_does_not_clobber_existing_approval(db_workflow):
    """Adopting a pre-existing unlinked tracker also must not clobber an AWARD step
    that already carries a real decision — needs_step_setup is True for the adopt
    path too (not just brand-new trackers), so the stamp must guard on the step's
    current value, not just on needs_step_setup."""
    sys_user = get_or_create_sys_user(db_workflow)
    agreement = db_workflow.get(Agreement, 8001)

    unlinked = DefaultProcurementTracker.create_with_steps(agreement_id=8001, created_by=sys_user.id)
    db_workflow.add(unlinked)
    db_workflow.flush()
    original_id = unlinked.id

    award_step = unlinked.get_step(ProcurementTrackerStepType.AWARD)
    award_step.award_approval_status = "DECLINED"
    db_workflow.flush()

    _, tracker, _, _ = get_or_create_procurement_records_for_new_award(
        db_workflow,
        agreement,
        created_by=sys_user.id,
        action_status=ProcurementActionStatus.AWARDED,
        tracker_status=ProcurementTrackerStatus.COMPLETED,
        date_awarded_obligated=date(2024, 1, 15),
        include_terminal=True,
    )

    assert tracker.id == original_id
    assert tracker.get_step(ProcurementTrackerStepType.AWARD).award_approval_status == "DECLINED"


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


def test_new_award_workflow_completed_status_handles_agreement_without_vendor_id(db_workflow):
    """IaaAgreement has no vendor_id column at all (unlike ContractAgreement/AaAgreement)
    — the AWARD-step approval stamping must not raise AttributeError for it, and should
    leave award_vendor_id None."""
    sys_user = get_or_create_sys_user(db_workflow)
    iaa_agreement = IaaAgreement(
        name="IAA No Vendor Field",
        direction=IAADirectionType.INCOMING,
        project_id=8000,
        created_by=sys_user.id,
        updated_by=sys_user.id,
    )
    db_workflow.add(iaa_agreement)
    db_workflow.commit()

    _, tracker, _, _ = get_or_create_procurement_records_for_new_award(
        db_workflow,
        iaa_agreement,
        created_by=sys_user.id,
        action_status=ProcurementActionStatus.AWARDED,
        tracker_status=ProcurementTrackerStatus.COMPLETED,
        date_awarded_obligated=date(2024, 1, 15),
    )

    award_step = tracker.get_step(ProcurementTrackerStepType.AWARD)
    assert award_step.award_approval_status == "APPROVED"
    assert award_step.award_vendor_id is None


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


# ============================================================================
# _sync_procurement_shop (via workflow functions)
# ============================================================================


def test_new_award_workflow_syncs_procurement_shop_on_existing_action(db_workflow):
    """When an action exists and the agreement's awarding_entity_id changed, the shop is synced."""
    sys_user = get_or_create_sys_user(db_workflow)
    agreement = db_workflow.get(Agreement, 8001)

    # First call creates the action with procurement_shop_id=8000
    action, _, _, _ = get_or_create_procurement_records_for_new_award(db_workflow, agreement, created_by=sys_user.id)
    db_workflow.flush()
    assert action.procurement_shop_id == 8000

    # Simulate the agreement's awarding_entity_id changing to None — no sync
    agreement.awarding_entity_id = None
    get_or_create_procurement_records_for_new_award(db_workflow, agreement, created_by=sys_user.id)
    db_workflow.flush()
    assert action.procurement_shop_id == 8000  # unchanged

    # Now set a different non-None value — should sync
    new_shop = ProcurementShop(id=9000, name="New PSC", abbr="NPSC", created_by=sys_user.id)
    db_workflow.add(new_shop)
    db_workflow.flush()

    agreement.awarding_entity_id = 9000
    get_or_create_procurement_records_for_new_award(db_workflow, agreement, created_by=sys_user.id)
    db_workflow.flush()
    assert action.procurement_shop_id == 9000


def test_modification_workflow_syncs_procurement_shop_on_existing_action(db_workflow):
    """When a modification action exists and the agreement's awarding_entity_id changed, the shop is synced."""
    sys_user = get_or_create_sys_user(db_workflow)
    agreement = db_workflow.get(Agreement, 8001)

    action, _, _, _ = get_or_create_procurement_records_for_modification(db_workflow, agreement, created_by=sys_user.id)
    db_workflow.flush()
    assert action.procurement_shop_id == 8000

    new_shop = ProcurementShop(id=9001, name="Another PSC", abbr="APSC", created_by=sys_user.id)
    db_workflow.add(new_shop)
    db_workflow.flush()

    agreement.awarding_entity_id = 9001
    get_or_create_procurement_records_for_modification(db_workflow, agreement, created_by=sys_user.id)
    db_workflow.flush()
    assert action.procurement_shop_id == 9001


def test_sync_skips_terminal_action_statuses(db_workflow):
    """Completed (AWARDED/CERTIFIED/CANCELLED) actions should not have their shop synced."""
    sys_user = get_or_create_sys_user(db_workflow)
    agreement = db_workflow.get(Agreement, 8001)

    # Create an AWARDED new-award action via the workflow (backfill context)
    action, _, _, _ = get_or_create_procurement_records_for_new_award(
        db_workflow,
        agreement,
        created_by=sys_user.id,
        action_status=ProcurementActionStatus.AWARDED,
        tracker_status=ProcurementTrackerStatus.COMPLETED,
        include_terminal=True,
    )
    db_workflow.flush()
    assert action.procurement_shop_id == 8000

    # Change the agreement's awarding_entity_id
    new_shop = ProcurementShop(id=9002, name="Frozen PSC", abbr="FPSC", created_by=sys_user.id)
    db_workflow.add(new_shop)
    db_workflow.flush()

    agreement.awarding_entity_id = 9002
    # Re-run with include_terminal so it finds the existing AWARDED action
    get_or_create_procurement_records_for_new_award(
        db_workflow,
        agreement,
        created_by=sys_user.id,
        action_status=ProcurementActionStatus.AWARDED,
        tracker_status=ProcurementTrackerStatus.COMPLETED,
        include_terminal=True,
    )
    db_workflow.flush()

    # Shop should NOT have changed — the action is in a terminal status
    assert action.procurement_shop_id == 8000


def test_default_skips_terminal_actions(db_workflow):
    """By default, terminal-status actions are not matched; a new action is created."""
    sys_user = get_or_create_sys_user(db_workflow)
    agreement = db_workflow.get(Agreement, 8001)

    # Create an AWARDED action directly (simulating a finalized procurement cycle)
    finished_action = ProcurementAction(
        agreement_id=8001,
        award_type=AwardType.NEW_AWARD,
        status=ProcurementActionStatus.AWARDED,
        procurement_shop_id=8000,
        created_by=sys_user.id,
    )
    db_workflow.add(finished_action)
    db_workflow.flush()

    # Default workflow call should NOT reuse the terminal action
    action, _, action_created, _ = get_or_create_procurement_records_for_new_award(
        db_workflow, agreement, created_by=sys_user.id
    )

    assert action_created is True
    assert action.id != finished_action.id
    assert action.status == ProcurementActionStatus.PLANNED


def test_default_skips_inactive_trackers(db_workflow):
    """By default, COMPLETED trackers are not matched; a new tracker is created."""
    sys_user = get_or_create_sys_user(db_workflow)
    agreement = db_workflow.get(Agreement, 8001)

    # Create a completed tracker + action directly
    action = ProcurementAction(
        agreement_id=8001,
        award_type=AwardType.NEW_AWARD,
        status=ProcurementActionStatus.PLANNED,
        procurement_shop_id=8000,
        created_by=sys_user.id,
    )
    db_workflow.add(action)
    db_workflow.flush()

    completed_tracker = DefaultProcurementTracker.create_with_steps(
        agreement_id=8001,
        procurement_action=action.id,
        status=ProcurementTrackerStatus.COMPLETED,
        created_by=sys_user.id,
    )
    db_workflow.add(completed_tracker)
    db_workflow.flush()

    # Default call should NOT reuse the completed tracker
    tracker, _, needs_setup = DefaultProcurementTracker.get_or_create_for_action(
        db_workflow,
        agreement_id=8001,
        procurement_action_id=action.id,
        created_by=sys_user.id,
    )

    assert tracker.id != completed_tracker.id
    assert needs_setup is True
