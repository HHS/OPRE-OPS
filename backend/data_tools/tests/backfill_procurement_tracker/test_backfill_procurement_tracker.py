from datetime import date

import pytest
from sqlalchemy import select, text

from data_tools.src.backfill_procurement_tracker import (
    backfill_procurement_records,
    ensure_action_and_tracker,
    get_agreements_with_in_execution_blis,
    get_earliest_obligated_date_needed,
    get_earliest_obligated_fiscal_year,
    has_obligated_blis,
    link_blis_to_action,
)
from data_tools.src.common.utils import get_or_create_sys_user
from models import *  # noqa: F403, F401
from models.agreements import AgreementType
from models.procurement_action import AwardType, ProcurementAction, ProcurementActionStatus
from models.procurement_tracker import (
    DefaultProcurementTracker,
    ProcurementTracker,
    ProcurementTrackerStatus,
    ProcurementTrackerStepStatus,
)


@pytest.fixture()
def db_with_agreements(loaded_db):
    """Set up agreements with various combinations of BLIs, trackers, and actions."""
    sys_user = get_or_create_sys_user(loaded_db)
    loaded_db.commit()
    uid = sys_user.id

    project = ResearchProject(id=9000, title="Backfill Test Project", short_title="BTP")
    loaded_db.add(project)
    loaded_db.commit()

    # Procurement shop for awarding_entity_id
    proc_shop = ProcurementShop(id=9000, name="Test PSC", abbr="TPSC", created_by=uid)
    loaded_db.add(proc_shop)
    loaded_db.commit()

    # Agreement 9001: IN_EXECUTION BLI, no tracker, no action → should be backfilled
    contract_1 = ContractAgreement(
        id=9001, name="Contract Missing Both", project_id=9000,
        awarding_entity_id=9000, created_by=uid, updated_by=uid
    )
    # Agreement 9002: IN_EXECUTION BLI, has tracker, has action (no shop) → shop should be set
    contract_2 = ContractAgreement(
        id=9002, name="Contract Has Both", project_id=9000,
        awarding_entity_id=9000, created_by=uid, updated_by=uid
    )
    # Agreement 9003: IN_EXECUTION BLI, has tracker (unlinked), no action → should get both
    contract_3 = ContractAgreement(
        id=9003, name="Contract Missing Action", project_id=9000,
        awarding_entity_id=9000, created_by=uid, updated_by=uid
    )
    # Agreement 9004: IN_EXECUTION BLI, no tracker, has action → should get tracker only
    contract_4 = ContractAgreement(
        id=9004, name="Contract Missing Tracker", project_id=9000,
        awarding_entity_id=9000, created_by=uid, updated_by=uid
    )
    # Agreement 9005: PLANNED BLI only, no tracker, no action → should NOT be backfilled
    contract_5 = ContractAgreement(
        id=9005, name="Contract Only Planned", project_id=9000, created_by=uid, updated_by=uid
    )
    # Agreement 9006: DRAFT BLI only → should NOT be backfilled
    contract_6 = ContractAgreement(
        id=9006, name="Contract Only Draft", project_id=9000, created_by=uid, updated_by=uid
    )
    # Agreement 9007: IN_EXECUTION + OBLIGATED BLIs (mod scenario)
    contract_7 = ContractAgreement(
        id=9007, name="Contract Mod Scenario", project_id=9000,
        awarding_entity_id=9000, created_by=uid, updated_by=uid
    )
    # Agreement 9008: Grant with IN_EXECUTION BLI → used to test agreement type filtering
    grant_1 = GrantAgreement(
        id=9008, name="Grant With Execution", project_id=9000,
        awarding_entity_id=9000, created_by=uid, updated_by=uid
    )
    loaded_db.add_all([
        contract_1, contract_2, contract_3, contract_4,
        contract_5, contract_6, contract_7, grant_1,
    ])
    loaded_db.commit()

    # BLIs for agreements 9001-9006 (non-mod scenarios)
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

    # BLIs for agreement 9007 (mod scenario): OBLIGATED across 2 fiscal years + IN_EXECUTION
    # FY 2024 (earliest): date_needed in Jan 2024 → month < 10 → FY = 2024
    bli_7 = ContractBudgetLineItem(
        id=90007, agreement_id=9007, amount=700, status=BudgetLineItemStatus.OBLIGATED,
        date_needed=date(2024, 1, 15), created_by=uid,
    )
    # FY 2025 (later): date_needed in Mar 2025 → month < 10 → FY = 2025
    bli_8 = ContractBudgetLineItem(
        id=90008, agreement_id=9007, amount=800, status=BudgetLineItemStatus.OBLIGATED,
        date_needed=date(2025, 3, 1), created_by=uid,
    )
    # IN_EXECUTION BLIs for agreement 9007
    bli_9 = ContractBudgetLineItem(
        id=90009, agreement_id=9007, amount=900, status=BudgetLineItemStatus.IN_EXECUTION,
        date_needed=date(2025, 6, 1), created_by=uid,
    )
    bli_10 = ContractBudgetLineItem(
        id=90010, agreement_id=9007, amount=1000, status=BudgetLineItemStatus.IN_EXECUTION,
        date_needed=date(2025, 9, 1), created_by=uid,
    )
    # BLI for agreement 9008 (grant)
    bli_11 = GrantBudgetLineItem(
        id=90011, agreement_id=9008, amount=1100, status=BudgetLineItemStatus.IN_EXECUTION, created_by=uid
    )
    loaded_db.add_all([bli_1, bli_2, bli_3, bli_4, bli_5, bli_6, bli_7, bli_8, bli_9, bli_10, bli_11])
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

    # Agreement 9003: has tracker only (no NEW_AWARD action) — tracker is unlinked
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
    loaded_db.execute(text("DELETE FROM grant_budget_line_item"))
    loaded_db.execute(text("DELETE FROM grant_budget_line_item_version"))
    loaded_db.execute(text("DELETE FROM contract_budget_line_item"))
    loaded_db.execute(text("DELETE FROM contract_budget_line_item_version"))
    loaded_db.execute(text("DELETE FROM budget_line_item"))
    loaded_db.execute(text("DELETE FROM budget_line_item_version"))
    loaded_db.execute(text("DELETE FROM procurement_action"))
    loaded_db.execute(text("DELETE FROM procurement_action_version"))
    loaded_db.execute(text("DELETE FROM grant_agreement"))
    loaded_db.execute(text("DELETE FROM grant_agreement_version"))
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


# ---- Query tests ----


def test_query_finds_all_agreements_with_in_execution_blis(db_with_agreements):
    """Returns all agreements with IN_EXECUTION BLIs, regardless of tracker/action state."""
    results = get_agreements_with_in_execution_blis(db_with_agreements)
    result_ids = {a.id for a in results}

    # Agreements 9001-9004, 9007, and 9008 all have IN_EXECUTION BLIs → included
    assert 9001 in result_ids
    assert 9002 in result_ids
    assert 9003 in result_ids
    assert 9004 in result_ids
    assert 9007 in result_ids
    assert 9008 in result_ids
    # Agreement 9005: only PLANNED BLIs → excluded
    assert 9005 not in result_ids
    # Agreement 9006: only DRAFT BLIs → excluded
    assert 9006 not in result_ids


def test_query_results_ordered_by_id(db_with_agreements):
    """Results should be ordered by agreement ID."""
    results = get_agreements_with_in_execution_blis(db_with_agreements)
    result_ids = [a.id for a in results]
    assert result_ids == sorted(result_ids)


def test_query_still_returns_agreements_after_backfill(db_with_agreements):
    """The query returns all IN_EXECUTION agreements regardless of backfill state."""
    sys_user = get_or_create_sys_user(db_with_agreements)
    backfill_procurement_records(db_with_agreements, sys_user)

    results = get_agreements_with_in_execution_blis(db_with_agreements)
    result_ids = {a.id for a in results}
    # All 6 agreements with IN_EXECUTION BLIs are still returned
    assert 9001 in result_ids
    assert 9002 in result_ids
    assert 9003 in result_ids
    assert 9004 in result_ids
    assert 9007 in result_ids
    assert 9008 in result_ids


# ---- Helper function tests ----


def test_has_obligated_blis_true(db_with_agreements):
    """Agreement 9007 has OBLIGATED BLIs → True."""
    assert has_obligated_blis(db_with_agreements, 9007) is True


def test_has_obligated_blis_false(db_with_agreements):
    """Agreement 9001 has only IN_EXECUTION BLIs → False."""
    assert has_obligated_blis(db_with_agreements, 9001) is False


def test_get_earliest_obligated_fiscal_year(db_with_agreements):
    """Should return the earliest fiscal year among OBLIGATED BLIs for agreement 9007."""
    # BLI 90007: date_needed=2024-01-15 → FY 2024
    # BLI 90008: date_needed=2025-03-01 → FY 2025
    result = get_earliest_obligated_fiscal_year(db_with_agreements, 9007)
    assert result == 2024


def test_get_earliest_obligated_fiscal_year_no_obligated(db_with_agreements):
    """Should return None when agreement has no OBLIGATED BLIs."""
    result = get_earliest_obligated_fiscal_year(db_with_agreements, 9001)
    assert result is None


def test_get_earliest_obligated_date_needed(db_with_agreements):
    """Should return the earliest date_needed among OBLIGATED BLIs for agreement 9007."""
    # BLI 90007: date_needed=2024-01-15 (earliest)
    # BLI 90008: date_needed=2025-03-01
    result = get_earliest_obligated_date_needed(db_with_agreements, 9007)
    assert result == date(2024, 1, 15)


def test_get_earliest_obligated_date_needed_no_obligated(db_with_agreements):
    """Should return None when agreement has no OBLIGATED BLIs."""
    result = get_earliest_obligated_date_needed(db_with_agreements, 9001)
    assert result is None


# ---- Non-mod backfill tests ----


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


def test_backfill_activates_step_1_with_start_date(db_with_agreements):
    """Backfilled trackers should have step 1 as ACTIVE with today's start date, matching API behavior."""
    sys_user = get_or_create_sys_user(db_with_agreements)
    backfill_procurement_records(db_with_agreements, sys_user)

    tracker = db_with_agreements.execute(
        select(ProcurementTracker).where(ProcurementTracker.agreement_id == 9001)
    ).scalar_one()

    step_1 = [s for s in tracker.steps if s.step_number == 1][0]
    assert step_1.status == ProcurementTrackerStepStatus.ACTIVE
    assert step_1.step_start_date == date.today()

    # Remaining steps should be PENDING with no start date
    for step in tracker.steps:
        if step.step_number > 1:
            assert step.status == ProcurementTrackerStepStatus.PENDING, (
                f"Step {step.step_number} should be PENDING, got {step.status}"
            )
            assert step.step_start_date is None, (
                f"Step {step.step_number} should have no start date"
            )


def test_backfill_creates_action_and_linked_tracker_when_existing_tracker_unlinked(db_with_agreements):
    """Agreement 9003 has an unlinked tracker but no action — backfill creates both action and
    a new linked tracker (old unlinked tracker is left as-is)."""
    sys_user = get_or_create_sys_user(db_with_agreements)

    # Count trackers before
    trackers_before = db_with_agreements.execute(
        select(ProcurementTracker).where(ProcurementTracker.agreement_id == 9003)
    ).scalars().all()
    assert len(trackers_before) == 1
    assert trackers_before[0].procurement_action is None  # unlinked

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

    # A new tracker linked to the action should also exist
    trackers_after = db_with_agreements.execute(
        select(ProcurementTracker).where(ProcurementTracker.agreement_id == 9003)
    ).scalars().all()
    linked_trackers = [t for t in trackers_after if t.procurement_action == action.id]
    assert len(linked_trackers) == 1
    assert len(linked_trackers[0].steps) == 6


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
        select(ProcurementTracker).where(
            ProcurementTracker.agreement_id == 9004,
            ProcurementTracker.procurement_action == actions_before[0].id,
        )
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

    # Trackers created: 9001, 9003 (new linked), 9004, 9007(NEW_AWARD), 9007(MOD), 9008 = 6
    assert len(tracker_events) == 6
    # Actions created: 9001, 9003, 9007(NEW_AWARD), 9007(MOD), 9008 = 5
    assert len(action_events) == 5


def test_backfill_is_idempotent(db_with_agreements):
    """Running backfill twice should not create duplicate records or duplicate BLI links."""
    sys_user = get_or_create_sys_user(db_with_agreements)
    backfill_procurement_records(db_with_agreements, sys_user)

    trackers_after_first = db_with_agreements.execute(select(ProcurementTracker)).scalars().all()
    actions_after_first = db_with_agreements.execute(select(ProcurementAction)).scalars().all()
    linked_blis_first = db_with_agreements.execute(
        select(BudgetLineItem).where(BudgetLineItem.procurement_action_id.isnot(None))
    ).scalars().all()

    backfill_procurement_records(db_with_agreements, sys_user)

    trackers_after_second = db_with_agreements.execute(select(ProcurementTracker)).scalars().all()
    actions_after_second = db_with_agreements.execute(select(ProcurementAction)).scalars().all()
    linked_blis_second = db_with_agreements.execute(
        select(BudgetLineItem).where(BudgetLineItem.procurement_action_id.isnot(None))
    ).scalars().all()

    assert len(trackers_after_second) == len(trackers_after_first)
    assert len(actions_after_second) == len(actions_after_first)
    assert len(linked_blis_second) == len(linked_blis_first)


# ---- BLI linking tests (non-mod) ----


def test_backfill_links_in_execution_blis_to_action(db_with_agreements):
    """Non-mod agreements: IN_EXECUTION BLIs should be linked to the NEW_AWARD ProcurementAction."""
    sys_user = get_or_create_sys_user(db_with_agreements)
    backfill_procurement_records(db_with_agreements, sys_user)

    for agreement_id in [9001, 9002, 9003, 9004]:
        action = db_with_agreements.execute(
            select(ProcurementAction).where(
                ProcurementAction.agreement_id == agreement_id,
                ProcurementAction.award_type == AwardType.NEW_AWARD,
            )
        ).scalar_one()

        in_exec_blis = db_with_agreements.execute(
            select(BudgetLineItem).where(
                BudgetLineItem.agreement_id == agreement_id,
                BudgetLineItem.status == BudgetLineItemStatus.IN_EXECUTION,
            )
        ).scalars().all()

        for bli in in_exec_blis:
            assert bli.procurement_action_id == action.id, (
                f"BLI {bli.id} on Agreement {agreement_id} should be linked to "
                f"ProcurementAction {action.id}"
            )


def test_backfill_does_not_link_non_executing_blis(db_with_agreements):
    """PLANNED and DRAFT BLIs should not be linked to any ProcurementAction."""
    sys_user = get_or_create_sys_user(db_with_agreements)
    backfill_procurement_records(db_with_agreements, sys_user)

    for bli_id in [90005, 90006]:
        bli = db_with_agreements.get(BudgetLineItem, bli_id)
        assert bli.procurement_action_id is None, (
            f"BLI {bli_id} (status={bli.status}) should not be linked to a ProcurementAction"
        )


def test_link_blis_does_not_create_duplicates(db_with_agreements):
    """Calling link_blis_to_action twice should not double-link BLIs."""
    sys_user = get_or_create_sys_user(db_with_agreements)

    # Create action for agreement 9001
    action = ProcurementAction(
        agreement_id=9001, award_type=AwardType.NEW_AWARD,
        status=ProcurementActionStatus.PLANNED, created_by=sys_user.id,
    )
    db_with_agreements.add(action)
    db_with_agreements.flush()

    agreement = db_with_agreements.get(Agreement, 9001)

    first_count = link_blis_to_action(
        db_with_agreements, agreement, action, BudgetLineItemStatus.IN_EXECUTION,
    )
    db_with_agreements.flush()
    second_count = link_blis_to_action(
        db_with_agreements, agreement, action, BudgetLineItemStatus.IN_EXECUTION,
    )

    assert first_count == 1  # one IN_EXECUTION BLI on agreement 9001
    assert second_count == 0  # already linked, no new links


def test_backfill_links_blis_when_tracker_and_action_already_exist(db_with_agreements):
    """Agreement 9002 already has both tracker and action — BLIs should still get linked."""
    sys_user = get_or_create_sys_user(db_with_agreements)

    # Verify BLI is not linked before backfill
    bli = db_with_agreements.get(BudgetLineItem, 90002)
    assert bli.procurement_action_id is None

    backfill_procurement_records(db_with_agreements, sys_user)

    # Now it should be linked
    db_with_agreements.refresh(bli)
    action = db_with_agreements.execute(
        select(ProcurementAction).where(
            ProcurementAction.agreement_id == 9002,
            ProcurementAction.award_type == AwardType.NEW_AWARD,
        )
    ).scalar_one()
    assert bli.procurement_action_id == action.id


# ---- Procurement shop tests ----


def test_backfill_sets_procurement_shop_on_new_action(db_with_agreements):
    """New ProcurementActions should get procurement_shop_id from agreement.awarding_entity_id."""
    sys_user = get_or_create_sys_user(db_with_agreements)
    backfill_procurement_records(db_with_agreements, sys_user)

    # Agreement 9001 had no action — new one should have shop set
    action = db_with_agreements.execute(
        select(ProcurementAction).where(
            ProcurementAction.agreement_id == 9001,
            ProcurementAction.award_type == AwardType.NEW_AWARD,
        )
    ).scalar_one()
    assert action.procurement_shop_id == 9000


def test_backfill_sets_procurement_shop_on_existing_action(db_with_agreements):
    """Existing ProcurementActions missing procurement_shop_id should get it from the agreement."""
    sys_user = get_or_create_sys_user(db_with_agreements)

    # Agreement 9002 already has an action but without procurement_shop_id
    existing_action = db_with_agreements.execute(
        select(ProcurementAction).where(
            ProcurementAction.agreement_id == 9002,
            ProcurementAction.award_type == AwardType.NEW_AWARD,
        )
    ).scalar_one()
    assert existing_action.procurement_shop_id is None

    backfill_procurement_records(db_with_agreements, sys_user)

    db_with_agreements.refresh(existing_action)
    assert existing_action.procurement_shop_id == 9000


def test_backfill_does_not_overwrite_procurement_shop_with_none(db_with_agreements):
    """If agreement has no awarding_entity_id, don't clear an existing procurement_shop_id."""
    sys_user = get_or_create_sys_user(db_with_agreements)

    # Set agreement 9004's awarding_entity_id to None
    agreement = db_with_agreements.get(Agreement, 9004)
    agreement.awarding_entity_id = None
    db_with_agreements.flush()

    # Agreement 9004's existing action already has no shop — set one manually
    existing_action = db_with_agreements.execute(
        select(ProcurementAction).where(
            ProcurementAction.agreement_id == 9004,
            ProcurementAction.award_type == AwardType.NEW_AWARD,
        )
    ).scalar_one()
    existing_action.procurement_shop_id = 9000
    db_with_agreements.flush()

    backfill_procurement_records(db_with_agreements, sys_user)

    db_with_agreements.refresh(existing_action)
    # Should NOT be overwritten to None
    assert existing_action.procurement_shop_id == 9000


# ---- Mod scenario tests ----


def test_mod_scenario_creates_two_actions_and_trackers(db_with_agreements):
    """Agreement 9007 has OBLIGATED + IN_EXECUTION BLIs — should get 2 actions and 2 trackers."""
    sys_user = get_or_create_sys_user(db_with_agreements)
    backfill_procurement_records(db_with_agreements, sys_user)

    actions = db_with_agreements.execute(
        select(ProcurementAction).where(ProcurementAction.agreement_id == 9007)
    ).scalars().all()
    assert len(actions) == 2

    award_types = {a.award_type for a in actions}
    assert AwardType.NEW_AWARD in award_types
    assert AwardType.MODIFICATION in award_types

    # NEW_AWARD action should be AWARDED, MODIFICATION should be PLANNED
    actions_by_type = {a.award_type: a for a in actions}
    assert actions_by_type[AwardType.NEW_AWARD].status == ProcurementActionStatus.AWARDED
    assert actions_by_type[AwardType.MODIFICATION].status == ProcurementActionStatus.PLANNED

    trackers = db_with_agreements.execute(
        select(ProcurementTracker).where(ProcurementTracker.agreement_id == 9007)
    ).scalars().all()
    assert len(trackers) == 2

    # Each tracker should be linked to one of the actions
    tracker_action_ids = {t.procurement_action for t in trackers}
    action_ids = {a.id for a in actions}
    assert tracker_action_ids == action_ids

    # NEW_AWARD tracker should be COMPLETED, MODIFICATION tracker should be ACTIVE
    trackers_by_action = {t.procurement_action: t for t in trackers}
    new_award_action_id = actions_by_type[AwardType.NEW_AWARD].id
    mod_action_id = actions_by_type[AwardType.MODIFICATION].id
    assert trackers_by_action[new_award_action_id].status == ProcurementTrackerStatus.COMPLETED
    assert trackers_by_action[mod_action_id].status == ProcurementTrackerStatus.ACTIVE


def test_mod_scenario_links_earliest_fy_obligated_blis_to_new_award(db_with_agreements):
    """Only OBLIGATED BLIs from the earliest fiscal year should be linked to the NEW_AWARD action."""
    sys_user = get_or_create_sys_user(db_with_agreements)
    backfill_procurement_records(db_with_agreements, sys_user)

    new_award_action = db_with_agreements.execute(
        select(ProcurementAction).where(
            ProcurementAction.agreement_id == 9007,
            ProcurementAction.award_type == AwardType.NEW_AWARD,
        )
    ).scalar_one()

    # BLI 90007 (FY 2024, OBLIGATED) should be linked to NEW_AWARD
    bli_fy2024 = db_with_agreements.get(BudgetLineItem, 90007)
    assert bli_fy2024.procurement_action_id == new_award_action.id


def test_mod_scenario_does_not_link_later_fy_obligated_blis(db_with_agreements):
    """OBLIGATED BLIs from later fiscal years should NOT be linked to any action."""
    sys_user = get_or_create_sys_user(db_with_agreements)
    backfill_procurement_records(db_with_agreements, sys_user)

    # BLI 90008 (FY 2025, OBLIGATED) should remain unlinked
    bli_fy2025 = db_with_agreements.get(BudgetLineItem, 90008)
    assert bli_fy2025.procurement_action_id is None


def test_mod_scenario_links_in_execution_blis_to_modification(db_with_agreements):
    """IN_EXECUTION BLIs should be linked to the MODIFICATION action in a mod scenario."""
    sys_user = get_or_create_sys_user(db_with_agreements)
    backfill_procurement_records(db_with_agreements, sys_user)

    mod_action = db_with_agreements.execute(
        select(ProcurementAction).where(
            ProcurementAction.agreement_id == 9007,
            ProcurementAction.award_type == AwardType.MODIFICATION,
        )
    ).scalar_one()

    for bli_id in [90009, 90010]:
        bli = db_with_agreements.get(BudgetLineItem, bli_id)
        assert bli.procurement_action_id == mod_action.id, (
            f"BLI {bli_id} (IN_EXECUTION) should be linked to MODIFICATION action {mod_action.id}"
        )


def test_mod_scenario_sets_award_date_on_new_award_action(db_with_agreements):
    """NEW_AWARD action should have date_awarded_obligated set to the earliest OBLIGATED date_needed."""
    sys_user = get_or_create_sys_user(db_with_agreements)
    backfill_procurement_records(db_with_agreements, sys_user)

    new_award_action = db_with_agreements.execute(
        select(ProcurementAction).where(
            ProcurementAction.agreement_id == 9007,
            ProcurementAction.award_type == AwardType.NEW_AWARD,
        )
    ).scalar_one()
    # Earliest OBLIGATED BLI is 90007 with date_needed=2024-01-15
    assert new_award_action.date_awarded_obligated == date(2024, 1, 15)

    # MODIFICATION action should NOT have date_awarded_obligated set
    mod_action = db_with_agreements.execute(
        select(ProcurementAction).where(
            ProcurementAction.agreement_id == 9007,
            ProcurementAction.award_type == AwardType.MODIFICATION,
        )
    ).scalar_one()
    assert mod_action.date_awarded_obligated is None


def test_mod_scenario_sets_procurement_shop_on_both_actions(db_with_agreements):
    """Both NEW_AWARD and MODIFICATION actions should get procurement_shop_id from the agreement."""
    sys_user = get_or_create_sys_user(db_with_agreements)
    backfill_procurement_records(db_with_agreements, sys_user)

    actions = db_with_agreements.execute(
        select(ProcurementAction).where(ProcurementAction.agreement_id == 9007)
    ).scalars().all()

    for action in actions:
        assert action.procurement_shop_id == 9000, (
            f"ProcurementAction {action.id} ({action.award_type.name}) should have "
            f"procurement_shop_id=9000"
        )


def test_mod_scenario_idempotent(db_with_agreements):
    """Running backfill twice should not create duplicate mod records."""
    sys_user = get_or_create_sys_user(db_with_agreements)
    backfill_procurement_records(db_with_agreements, sys_user)

    actions_first = db_with_agreements.execute(
        select(ProcurementAction).where(ProcurementAction.agreement_id == 9007)
    ).scalars().all()
    trackers_first = db_with_agreements.execute(
        select(ProcurementTracker).where(ProcurementTracker.agreement_id == 9007)
    ).scalars().all()
    linked_blis_first = db_with_agreements.execute(
        select(BudgetLineItem).where(
            BudgetLineItem.agreement_id == 9007,
            BudgetLineItem.procurement_action_id.isnot(None),
        )
    ).scalars().all()

    backfill_procurement_records(db_with_agreements, sys_user)

    actions_second = db_with_agreements.execute(
        select(ProcurementAction).where(ProcurementAction.agreement_id == 9007)
    ).scalars().all()
    trackers_second = db_with_agreements.execute(
        select(ProcurementTracker).where(ProcurementTracker.agreement_id == 9007)
    ).scalars().all()
    linked_blis_second = db_with_agreements.execute(
        select(BudgetLineItem).where(
            BudgetLineItem.agreement_id == 9007,
            BudgetLineItem.procurement_action_id.isnot(None),
        )
    ).scalars().all()

    assert len(actions_second) == len(actions_first)
    assert len(trackers_second) == len(trackers_first)
    assert len(linked_blis_second) == len(linked_blis_first)


# ---- Agreement type filtering tests ----


def test_query_filters_by_single_agreement_type(db_with_agreements):
    """Filtering by CONTRACT should exclude the GRANT agreement."""
    results = get_agreements_with_in_execution_blis(
        db_with_agreements, agreement_types=[AgreementType.CONTRACT]
    )
    result_ids = {a.id for a in results}

    # All contracts with IN_EXECUTION BLIs
    assert 9001 in result_ids
    assert 9002 in result_ids
    assert 9003 in result_ids
    assert 9004 in result_ids
    assert 9007 in result_ids
    # Grant agreement excluded
    assert 9008 not in result_ids


def test_query_filters_by_multiple_agreement_types(db_with_agreements):
    """Filtering by CONTRACT and GRANT should include both."""
    results = get_agreements_with_in_execution_blis(
        db_with_agreements, agreement_types=[AgreementType.CONTRACT, AgreementType.GRANT]
    )
    result_ids = {a.id for a in results}

    assert 9001 in result_ids
    assert 9008 in result_ids


def test_query_filter_with_no_matches(db_with_agreements):
    """Filtering by a type with no IN_EXECUTION BLIs should return empty."""
    results = get_agreements_with_in_execution_blis(
        db_with_agreements, agreement_types=[AgreementType.IAA]
    )
    assert len(results) == 0


def test_query_no_filter_returns_all(db_with_agreements):
    """Passing None (default) returns all types."""
    results = get_agreements_with_in_execution_blis(db_with_agreements, agreement_types=None)
    result_ids = {a.id for a in results}

    assert 9001 in result_ids
    assert 9008 in result_ids


def test_backfill_with_type_filter_only_processes_matching(db_with_agreements):
    """Backfilling with agreement_types=[GRANT] should only create records for the grant."""
    sys_user = get_or_create_sys_user(db_with_agreements)
    backfill_procurement_records(db_with_agreements, sys_user, agreement_types=[AgreementType.GRANT])

    # Grant agreement 9008 should have been backfilled
    action_9008 = db_with_agreements.execute(
        select(ProcurementAction).where(ProcurementAction.agreement_id == 9008)
    ).scalar_one_or_none()
    assert action_9008 is not None

    tracker_9008 = db_with_agreements.execute(
        select(ProcurementTracker).where(ProcurementTracker.agreement_id == 9008)
    ).scalar_one_or_none()
    assert tracker_9008 is not None

    # Contract agreement 9001 should NOT have been backfilled
    action_9001 = db_with_agreements.execute(
        select(ProcurementAction).where(ProcurementAction.agreement_id == 9001)
    ).scalar_one_or_none()
    assert action_9001 is None

    tracker_9001 = db_with_agreements.execute(
        select(ProcurementTracker).where(ProcurementTracker.agreement_id == 9001)
    ).scalar_one_or_none()
    assert tracker_9001 is None


def test_backfill_without_type_filter_processes_all(db_with_agreements):
    """Backfilling without a type filter should process both contracts and grants."""
    sys_user = get_or_create_sys_user(db_with_agreements)
    backfill_procurement_records(db_with_agreements, sys_user)

    # Both contract 9001 and grant 9008 should have been backfilled
    for agreement_id in [9001, 9008]:
        action = db_with_agreements.execute(
            select(ProcurementAction).where(ProcurementAction.agreement_id == agreement_id)
        ).scalar_one_or_none()
        assert action is not None, f"Agreement {agreement_id} should have an action"

        tracker = db_with_agreements.execute(
            select(ProcurementTracker).where(ProcurementTracker.agreement_id == agreement_id)
        ).scalar_one_or_none()
        assert tracker is not None, f"Agreement {agreement_id} should have a tracker"
