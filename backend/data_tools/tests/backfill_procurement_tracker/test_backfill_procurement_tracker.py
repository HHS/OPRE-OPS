import pytest
from sqlalchemy import select, text

from data_tools.src.backfill_procurement_tracker import (
    backfill_procurement_records,
    get_agreements_in_execution_missing_tracker_or_action,
)
from data_tools.src.common.utils import get_or_create_sys_user
from models import *  # noqa: F403, F401
from models.procurement_action import AwardType, ProcurementAction, ProcurementActionStatus
from models.procurement_tracker import DefaultProcurementTracker, ProcurementTracker


@pytest.fixture()
def db_with_agreements(loaded_db):
    """Set up agreements with various combinations of BLIs, trackers, and actions."""
    sys_user = get_or_create_sys_user(loaded_db)
    loaded_db.commit()
    uid = sys_user.id

    project = ResearchProject(id=9000, title="Backfill Test Project", short_title="BTP")
    loaded_db.add(project)
    loaded_db.commit()

    # Agreement 9001: IN_EXECUTION BLI, no tracker, no action → should be backfilled
    contract_1 = ContractAgreement(
        id=9001, name="Contract Missing Both", project_id=9000, created_by=uid, updated_by=uid
    )
    # Agreement 9002: IN_EXECUTION BLI, has tracker, has action → should be skipped
    contract_2 = ContractAgreement(
        id=9002, name="Contract Has Both", project_id=9000, created_by=uid, updated_by=uid
    )
    # Agreement 9003: IN_EXECUTION BLI, has tracker, no action → should get action only
    contract_3 = ContractAgreement(
        id=9003, name="Contract Missing Action", project_id=9000, created_by=uid, updated_by=uid
    )
    # Agreement 9004: IN_EXECUTION BLI, no tracker, has action → should get tracker only
    contract_4 = ContractAgreement(
        id=9004, name="Contract Missing Tracker", project_id=9000, created_by=uid, updated_by=uid
    )
    # Agreement 9005: PLANNED BLI only, no tracker, no action → should NOT be backfilled
    contract_5 = ContractAgreement(
        id=9005, name="Contract Only Planned", project_id=9000, created_by=uid, updated_by=uid
    )
    # Agreement 9006: DRAFT BLI only → should NOT be backfilled
    contract_6 = ContractAgreement(
        id=9006, name="Contract Only Draft", project_id=9000, created_by=uid, updated_by=uid
    )
    loaded_db.add_all([contract_1, contract_2, contract_3, contract_4, contract_5, contract_6])
    loaded_db.commit()

    # BLIs
    bli_1 = ContractBudgetLineItem(
        id=90001, agreement_id=9001, amount=100, status=BudgetLineItemStatus.IN_EXECUTION, created_by=uid
    )
    bli_2 = ContractBudgetLineItem(
        id=90002, agreement_id=9002, amount=200, status=BudgetLineItemStatus.IN_EXECUTION, created_by=uid
    )
    bli_3 = ContractBudgetLineItem(
        id=90003, agreement_id=9003, amount=300, status=BudgetLineItemStatus.IN_EXECUTION, created_by=uid
    )
    bli_4 = ContractBudgetLineItem(
        id=90004, agreement_id=9004, amount=400, status=BudgetLineItemStatus.IN_EXECUTION, created_by=uid
    )
    bli_5 = ContractBudgetLineItem(
        id=90005, agreement_id=9005, amount=500, status=BudgetLineItemStatus.PLANNED, created_by=uid
    )
    bli_6 = ContractBudgetLineItem(
        id=90006, agreement_id=9006, amount=600, status=BudgetLineItemStatus.DRAFT, created_by=uid
    )
    loaded_db.add_all([bli_1, bli_2, bli_3, bli_4, bli_5, bli_6])
    loaded_db.commit()

    # Agreement 9002: already has both tracker and action
    pa_2 = ProcurementAction(
        agreement_id=9002, award_type=AwardType.NEW_AWARD,
        status=ProcurementActionStatus.PLANNED, created_by=uid,
    )
    loaded_db.add(pa_2)
    loaded_db.flush()
    tracker_2 = DefaultProcurementTracker.create_with_steps(
        agreement_id=9002, procurement_action=pa_2.id, created_by=uid
    )
    loaded_db.add(tracker_2)
    loaded_db.commit()

    # Agreement 9003: has tracker only (no NEW_AWARD action)
    tracker_3 = DefaultProcurementTracker.create_with_steps(agreement_id=9003, created_by=uid)
    loaded_db.add(tracker_3)
    loaded_db.commit()

    # Agreement 9004: has action only (no tracker)
    pa_4 = ProcurementAction(
        agreement_id=9004, award_type=AwardType.NEW_AWARD,
        status=ProcurementActionStatus.PLANNED, created_by=uid,
    )
    loaded_db.add(pa_4)
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
    loaded_db.execute(text("DELETE FROM contract_budget_line_item"))
    loaded_db.execute(text("DELETE FROM contract_budget_line_item_version"))
    loaded_db.execute(text("DELETE FROM budget_line_item"))
    loaded_db.execute(text("DELETE FROM budget_line_item_version"))
    loaded_db.execute(text("DELETE FROM procurement_action"))
    loaded_db.execute(text("DELETE FROM procurement_action_version"))
    loaded_db.execute(text("DELETE FROM contract_agreement"))
    loaded_db.execute(text("DELETE FROM contract_agreement_version"))
    loaded_db.execute(text("DELETE FROM agreement"))
    loaded_db.execute(text("DELETE FROM agreement_version"))
    loaded_db.execute(text("DELETE FROM research_project"))
    loaded_db.execute(text("DELETE FROM research_project_version"))
    loaded_db.execute(text("DELETE FROM project"))
    loaded_db.execute(text("DELETE FROM project_version"))
    loaded_db.execute(text("DELETE FROM ops_db_history"))
    loaded_db.execute(text("DELETE FROM ops_db_history_version"))
    loaded_db.commit()


def test_query_finds_agreements_missing_tracker_or_action(db_with_agreements):
    """Only agreements with IN_EXECUTION BLIs missing a tracker and/or action are returned."""
    results = get_agreements_in_execution_missing_tracker_or_action(db_with_agreements)
    result_ids = {a.id for a in results}

    # Agreement 9001: missing both → included
    assert 9001 in result_ids
    # Agreement 9003: missing action → included
    assert 9003 in result_ids
    # Agreement 9004: missing tracker → included
    assert 9004 in result_ids
    # Agreement 9002: has both → excluded
    assert 9002 not in result_ids
    # Agreement 9005: only PLANNED BLIs → excluded
    assert 9005 not in result_ids
    # Agreement 9006: only DRAFT BLIs → excluded
    assert 9006 not in result_ids


def test_query_returns_empty_when_all_have_records(db_with_agreements):
    """After backfill, the query should return no results."""
    sys_user = get_or_create_sys_user(db_with_agreements)
    backfill_procurement_records(db_with_agreements, sys_user)

    results = get_agreements_in_execution_missing_tracker_or_action(db_with_agreements)
    assert len(results) == 0


def test_backfill_creates_tracker_and_action_when_both_missing(db_with_agreements):
    """Agreement 9001 is missing both — backfill should create both."""
    sys_user = get_or_create_sys_user(db_with_agreements)
    backfill_procurement_records(db_with_agreements, sys_user)

    tracker = db_with_agreements.execute(
        select(ProcurementTracker).where(ProcurementTracker.agreement_id == 9001)
    ).scalar_one()
    assert tracker is not None
    assert len(tracker.steps) == 6

    action = db_with_agreements.execute(
        select(ProcurementAction).where(
            ProcurementAction.agreement_id == 9001,
            ProcurementAction.award_type == AwardType.NEW_AWARD,
        )
    ).scalar_one()
    assert action is not None
    assert action.status == ProcurementActionStatus.PLANNED

    # Tracker should reference the new action
    assert tracker.procurement_action == action.id


def test_backfill_creates_action_only_when_tracker_exists(db_with_agreements):
    """Agreement 9003 has a tracker but no action — backfill should create only the action."""
    sys_user = get_or_create_sys_user(db_with_agreements)

    # Count trackers before
    trackers_before = db_with_agreements.execute(
        select(ProcurementTracker).where(ProcurementTracker.agreement_id == 9003)
    ).scalars().all()
    tracker_count_before = len(trackers_before)

    backfill_procurement_records(db_with_agreements, sys_user)

    # Action should now exist
    action = db_with_agreements.execute(
        select(ProcurementAction).where(
            ProcurementAction.agreement_id == 9003,
            ProcurementAction.award_type == AwardType.NEW_AWARD,
        )
    ).scalar_one()
    assert action is not None
    assert action.status == ProcurementActionStatus.PLANNED

    # Tracker count should not have changed
    trackers_after = db_with_agreements.execute(
        select(ProcurementTracker).where(ProcurementTracker.agreement_id == 9003)
    ).scalars().all()
    assert len(trackers_after) == tracker_count_before


def test_backfill_creates_tracker_only_when_action_exists(db_with_agreements):
    """Agreement 9004 has an action but no tracker — backfill should create only the tracker."""
    sys_user = get_or_create_sys_user(db_with_agreements)

    # Count actions before
    actions_before = db_with_agreements.execute(
        select(ProcurementAction).where(
            ProcurementAction.agreement_id == 9004,
            ProcurementAction.award_type == AwardType.NEW_AWARD,
        )
    ).scalars().all()
    action_count_before = len(actions_before)

    backfill_procurement_records(db_with_agreements, sys_user)

    # Tracker should now exist
    tracker = db_with_agreements.execute(
        select(ProcurementTracker).where(ProcurementTracker.agreement_id == 9004)
    ).scalar_one()
    assert tracker is not None
    assert len(tracker.steps) == 6

    # Action count should not have changed
    actions_after = db_with_agreements.execute(
        select(ProcurementAction).where(
            ProcurementAction.agreement_id == 9004,
            ProcurementAction.award_type == AwardType.NEW_AWARD,
        )
    ).scalars().all()
    assert len(actions_after) == action_count_before


def test_backfill_skips_agreement_with_both(db_with_agreements):
    """Agreement 9002 already has both — nothing should be created."""
    sys_user = get_or_create_sys_user(db_with_agreements)

    trackers_before = db_with_agreements.execute(
        select(ProcurementTracker).where(ProcurementTracker.agreement_id == 9002)
    ).scalars().all()
    actions_before = db_with_agreements.execute(
        select(ProcurementAction).where(ProcurementAction.agreement_id == 9002)
    ).scalars().all()

    backfill_procurement_records(db_with_agreements, sys_user)

    trackers_after = db_with_agreements.execute(
        select(ProcurementTracker).where(ProcurementTracker.agreement_id == 9002)
    ).scalars().all()
    actions_after = db_with_agreements.execute(
        select(ProcurementAction).where(ProcurementAction.agreement_id == 9002)
    ).scalars().all()

    assert len(trackers_after) == len(trackers_before)
    assert len(actions_after) == len(actions_before)


def test_backfill_does_not_touch_non_executing_agreements(db_with_agreements):
    """Agreements 5 (PLANNED) and 6 (DRAFT) should never get tracker or action."""
    sys_user = get_or_create_sys_user(db_with_agreements)
    backfill_procurement_records(db_with_agreements, sys_user)

    for agreement_id in [9005, 9006]:
        tracker = db_with_agreements.execute(
            select(ProcurementTracker).where(ProcurementTracker.agreement_id == agreement_id)
        ).scalar_one_or_none()
        assert tracker is None, f"Agreement {agreement_id} should not have a tracker"

        action = db_with_agreements.execute(
            select(ProcurementAction).where(ProcurementAction.agreement_id == agreement_id)
        ).scalar_one_or_none()
        assert action is None, f"Agreement {agreement_id} should not have an action"


def test_backfill_creates_ops_events(db_with_agreements):
    """Backfill should create OpsEvents for each new tracker and action."""
    sys_user = get_or_create_sys_user(db_with_agreements)
    backfill_procurement_records(db_with_agreements, sys_user)

    tracker_events = db_with_agreements.execute(
        select(OpsEvent).where(OpsEvent.event_type == OpsEventType.CREATE_PROCUREMENT_TRACKER)
    ).scalars().all()

    action_events = db_with_agreements.execute(
        select(OpsEvent).where(OpsEvent.event_type == OpsEventType.CREATE_PROCUREMENT_ACTION)
    ).scalars().all()

    # Agreements 1, 4 need trackers; agreements 1, 3 need actions
    assert len(tracker_events) >= 2
    assert len(action_events) >= 2


def test_backfill_is_idempotent(db_with_agreements):
    """Running backfill twice should not create duplicate records."""
    sys_user = get_or_create_sys_user(db_with_agreements)
    backfill_procurement_records(db_with_agreements, sys_user)

    trackers_after_first = db_with_agreements.execute(select(ProcurementTracker)).scalars().all()
    actions_after_first = db_with_agreements.execute(
        select(ProcurementAction).where(ProcurementAction.award_type == AwardType.NEW_AWARD)
    ).scalars().all()

    backfill_procurement_records(db_with_agreements, sys_user)

    trackers_after_second = db_with_agreements.execute(select(ProcurementTracker)).scalars().all()
    actions_after_second = db_with_agreements.execute(
        select(ProcurementAction).where(ProcurementAction.award_type == AwardType.NEW_AWARD)
    ).scalars().all()

    assert len(trackers_after_second) == len(trackers_after_first)
    assert len(actions_after_second) == len(actions_after_first)
