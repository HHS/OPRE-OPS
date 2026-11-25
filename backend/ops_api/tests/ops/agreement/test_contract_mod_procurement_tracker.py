"""Integration tests for a contract mod's Procurement Tracker (OPS-6513).

When the Division Director approves a contract modification, the agreement's contract mod starts
its procurement cycle: a MODIFICATION ProcurementAction linked to the new AgreementMod and the
budget lines it executes, plus a new tracker. An As-Is mod (budget lines moved from Planned to
Executing, nothing else) needs only steps 1, 5 and 6, so steps 2-4 are SKIPPED. Every other mod
needs all six.

An agreement has one contract mod in procurement at a time. A request approved while it is active
joins it (same mod, action and tracker), until the mod's Pre-Award approval is requested.
"""

import datetime

import pytest
from sqlalchemy import select

from models import (
    AgreementMod,
    BudgetLineItemStatus,
    ContractBudgetLineItem,
    ContractModificationEdit,
    ModificationEditType,
    ModType,
    OpsEvent,
    OpsEventType,
    ProcurementAction,
    ProcurementTrackerStepStatus,
    User,
)
from models.procurement_action import AwardType, ProcurementActionStatus
from models.procurement_tracker import (
    DefaultProcurementTracker,
    ProcurementTrackerStatus,
    ProcurementTrackerStepType,
)
from models.utils.fiscal_year import get_current_fiscal_year
from ops_api.ops.services.agreement_award_history import AgreementAwardHistoryService
from ops_api.ops.services.procurement_tracker_steps import ProcurementTrackerStepService
from ops_api.ops.utils.budget_line_items_helpers import PreAwardLock, compute_bli_editable, get_pre_award_lock
from ops_api.ops.validation.context import ValidationContext
from ops_api.ops.validation.rules.procurement_tracker_step import Step4CompletionRequiredForApprovalRequestRule
from tests.ops.agreement.test_contract_modification_edits import (  # noqa: F401 (fixtures)
    BASIC_USER_ID,
    make_agreement,
    modified_loe_disabled,
    modified_loe_enabled,
)
from tests.ops.agreement.test_contract_modification_requests import (  # noqa: F401 (fixtures)
    _add_bli,
    _review_mod,
    _submit,
    awarded_with_edit,
)

SKIPPED_FOR_AS_IS = {
    ProcurementTrackerStepType.PRE_SOLICITATION,
    ProcurementTrackerStepType.SOLICITATION,
    ProcurementTrackerStepType.EVALUATION,
}


def _mod_action(loaded_db, agreement_id):
    return loaded_db.scalars(
        select(ProcurementAction).where(
            ProcurementAction.agreement_id == agreement_id,
            ProcurementAction.award_type == AwardType.MODIFICATION,
        )
    ).one_or_none()


def _tracker_for(loaded_db, action):
    return loaded_db.scalars(
        select(DefaultProcurementTracker).where(DefaultProcurementTracker.procurement_action == action.id)
    ).one()


def _statuses(tracker):
    return {step.step_type: step.status for step in tracker.steps}


@pytest.fixture()
def approved_as_is(
    modified_loe_enabled,  # noqa: F811
    basic_user_auth_client,
    division_director_auth_client,
    loaded_db,
    test_can,
    make_agreement,  # noqa: F811
):
    """An Awarded agreement whose As-Is mod (one budget line executed) was just approved."""
    agreement, _ = make_agreement(test_can)
    executable = _add_bli(loaded_db, agreement, test_can)
    request_id = _submit(basic_user_auth_client, agreement.id, budget_line_item_ids=[executable.id]).json["id"]
    response = _review_mod(division_director_auth_client, request_id)
    assert response.status_code == 200, response.json
    loaded_db.expire_all()
    action = _mod_action(loaded_db, agreement.id)
    return agreement, executable, action, _tracker_for(loaded_db, action)


def test_approving_a_modified_loe_mod_starts_a_full_tracker(
    awarded_with_edit,  # noqa: F811
    basic_user_auth_client,
    division_director_auth_client,
    loaded_db,
    app_ctx,
):
    agreement, _, executable = awarded_with_edit
    request_id = _submit(basic_user_auth_client, agreement.id, budget_line_item_ids=[executable.id]).json["id"]

    response = _review_mod(division_director_auth_client, request_id)

    assert response.status_code == 200, response.json
    loaded_db.expire_all()
    mod = loaded_db.get(AgreementMod, response.json["agreement_mod_id"])
    assert mod.mod_type == ModType.MODIFIED_LOE

    action = _mod_action(loaded_db, agreement.id)
    assert action.agreement_mod_id == mod.id
    assert action.status == ProcurementActionStatus.PLANNED
    assert [bli.id for bli in action.budget_line_items] == [executable.id]

    tracker = _tracker_for(loaded_db, action)
    assert tracker.status == ProcurementTrackerStatus.ACTIVE
    assert tracker.active_step_number == 1
    statuses = _statuses(tracker)
    assert statuses.pop(ProcurementTrackerStepType.ACQUISITION_PLANNING) == ProcurementTrackerStepStatus.ACTIVE
    assert set(statuses.values()) == {ProcurementTrackerStepStatus.PENDING}

    tracker_event = loaded_db.scalars(
        select(OpsEvent)
        .where(OpsEvent.event_type == OpsEventType.CREATE_PROCUREMENT_TRACKER)
        .order_by(OpsEvent.id.desc())
        .limit(1)
    ).one()
    assert tracker_event.event_details["tracker_id"] == tracker.id


def test_approving_an_as_is_mod_skips_steps_2_to_4(approved_as_is, loaded_db, app_ctx):
    _, _, action, tracker = approved_as_is

    assert action.agreement_mod.mod_type == ModType.AS_IS
    statuses = _statuses(tracker)
    assert {t for t, s in statuses.items() if s == ProcurementTrackerStepStatus.SKIPPED} == SKIPPED_FOR_AS_IS
    assert statuses[ProcurementTrackerStepType.ACQUISITION_PLANNING] == ProcurementTrackerStepStatus.ACTIVE
    assert statuses[ProcurementTrackerStepType.PRE_AWARD] == ProcurementTrackerStepStatus.PENDING
    assert statuses[ProcurementTrackerStepType.AWARD] == ProcurementTrackerStepStatus.PENDING


def test_declining_a_mod_starts_no_tracker(
    awarded_with_edit,  # noqa: F811
    basic_user_auth_client,
    division_director_auth_client,
    loaded_db,
    app_ctx,
):
    agreement, _, executable = awarded_with_edit
    request_id = _submit(basic_user_auth_client, agreement.id, budget_line_item_ids=[executable.id]).json["id"]

    response = _review_mod(division_director_auth_client, request_id, "DECLINE")

    assert response.status_code == 200, response.json
    loaded_db.expire_all()
    assert _mod_action(loaded_db, agreement.id) is None
    assert (
        loaded_db.scalars(
            select(DefaultProcurementTracker).where(DefaultProcurementTracker.agreement_id == agreement.id)
        ).all()
        == []
    )
    assert loaded_db.get(ContractBudgetLineItem, executable.id).procurement_action_id is None


def test_tracker_list_puts_the_latest_mod_first_with_its_mod_details(
    approved_as_is, basic_user_auth_client, loaded_db, app_ctx
):
    agreement, executable, action, tracker = approved_as_is
    older = DefaultProcurementTracker.create_with_steps(
        agreement_id=agreement.id,
        status=ProcurementTrackerStatus.COMPLETED,
        created_on=datetime.datetime(2020, 1, 1),
    )
    loaded_db.add(older)
    loaded_db.commit()

    response = basic_user_auth_client.get("/api/v1/procurement-trackers/", query_string={"agreement_id": agreement.id})

    assert response.status_code == 200, response.json
    first, second = response.json["data"]
    assert first["id"] == tracker.id
    assert first["award_type"] == "MODIFICATION"
    assert first["agreement_mod_id"] == action.agreement_mod_id
    assert first["mod_type"] == "AS_IS"
    assert first["budget_line_item_ids"] == [executable.id]
    assert [step["status"] for step in first["steps"]][1:4] == ["SKIPPED"] * 3
    assert second["id"] == older.id
    assert second["award_type"] is None
    assert second["budget_line_item_ids"] == []


def test_completing_step_1_of_an_as_is_tracker_moves_to_step_5(
    approved_as_is, basic_user_auth_client, loaded_db, app_ctx
):
    _, _, _, tracker = approved_as_is
    step_1 = tracker.get_step(ProcurementTrackerStepType.ACQUISITION_PLANNING)

    response = basic_user_auth_client.patch(
        f"/api/v1/procurement-tracker-steps/{step_1.id}",
        json={
            "status": "COMPLETED",
            "date_completed": datetime.date.today().isoformat(),
            "task_completed_by": BASIC_USER_ID,
        },
    )

    assert response.status_code == 200, response.json
    loaded_db.expire_all()
    tracker = loaded_db.get(DefaultProcurementTracker, tracker.id)
    assert tracker.active_step_number == 5
    statuses = _statuses(tracker)
    assert statuses[ProcurementTrackerStepType.PRE_AWARD] == ProcurementTrackerStepStatus.ACTIVE
    assert {t for t, s in statuses.items() if s == ProcurementTrackerStepStatus.SKIPPED} == SKIPPED_FOR_AS_IS


def test_a_skipped_step_cannot_be_updated(approved_as_is, basic_user_auth_client, loaded_db, app_ctx):
    _, _, _, tracker = approved_as_is
    step_3 = tracker.get_step(ProcurementTrackerStepType.SOLICITATION)

    response = basic_user_auth_client.patch(
        f"/api/v1/procurement-tracker-steps/{step_3.id}", json={"notes": "Should not be saved"}
    )

    assert response.status_code == 400, response.json
    loaded_db.expire_all()
    assert loaded_db.get(type(step_3), step_3.id).status == ProcurementTrackerStepStatus.SKIPPED


def test_pre_award_request_allowed_when_step_4_was_skipped(approved_as_is, loaded_db, app_ctx):
    _, _, _, tracker = approved_as_is
    step_5 = tracker.get_step(ProcurementTrackerStepType.PRE_AWARD)
    context = ValidationContext(
        user=loaded_db.get(User, BASIC_USER_ID), updated_fields={"approval_requested": True}, db_session=loaded_db
    )

    Step4CompletionRequiredForApprovalRequestRule().validate(step_5, context)  # does not raise


def test_awarding_a_mod_obligates_only_its_budget_lines_and_records_its_number(
    approved_as_is, loaded_db, test_can, app_ctx
):
    agreement, executable, action, tracker = approved_as_is
    # Another cycle's Executing line on the same agreement isn't part of this mod's award.
    other_cycle = _add_bli(loaded_db, agreement, test_can, status=BudgetLineItemStatus.IN_EXECUTION)
    award_step = tracker.get_step(ProcurementTrackerStepType.AWARD)
    award_step.award_modification_number = "P00001"
    award_step.award_approval_status = "APPROVED"
    loaded_db.commit()
    obligated_date = datetime.date(2026, 9, 15)

    service = ProcurementTrackerStepService(loaded_db)
    service._handle_award_approval(award_step, "APPROVED", obligated_date, loaded_db.get(User, BASIC_USER_ID))
    loaded_db.commit()

    loaded_db.expire_all()
    assert loaded_db.get(ContractBudgetLineItem, executable.id).status == BudgetLineItemStatus.OBLIGATED
    assert loaded_db.get(ContractBudgetLineItem, other_cycle.id).status == BudgetLineItemStatus.IN_EXECUTION
    action = loaded_db.get(ProcurementAction, action.id)
    assert action.status == ProcurementActionStatus.AWARDED
    assert action.date_awarded_obligated == obligated_date
    assert action.agreement_mod.number == "P00001"

    history = AgreementAwardHistoryService(loaded_db).get_award_history(agreement.id)
    mod_entry = next(entry for entry in history if entry["modification_number"] == "P00001")
    assert mod_entry["fiscal_year_label"] == "FY 2026 Contract Modification (09/15/2026)"


def test_seeded_as_is_mod_on_agreement_523_has_its_own_tracker(basic_user_auth_client, loaded_db, app_ctx):
    """CONTRACT #523 seeds an approved As-Is mod for manual testing; its tracker is listed first."""
    mod = loaded_db.scalars(select(AgreementMod).where(AgreementMod.agreement_id == 523)).one()
    assert mod.mod_type == ModType.AS_IS

    response = basic_user_auth_client.get("/api/v1/procurement-trackers/", query_string={"agreement_id": 523})

    assert response.status_code == 200, response.json
    latest = response.json["data"][0]
    assert latest["agreement_mod_id"] == mod.id
    assert latest["award_type"] == "MODIFICATION"
    assert latest["status"] == "ACTIVE"
    assert [step["status"] for step in latest["steps"]] == [
        "ACTIVE",
        "SKIPPED",
        "SKIPPED",
        "SKIPPED",
        "PENDING",
        "PENDING",
    ]
    (bli_id,) = latest["budget_line_item_ids"]
    assert loaded_db.get(ContractBudgetLineItem, bli_id).status == BudgetLineItemStatus.IN_EXECUTION


def _executable_line(loaded_db, agreement, test_can, seeded_bli):
    """A Planned current-FY line that can be executed and, once Executing, edited."""
    return _add_bli(
        loaded_db,
        agreement,
        test_can,
        services_component_id=seeded_bli.services_component_id,
        date_needed=datetime.date(get_current_fiscal_year(), 9, 1),
    )


def _approve_mod(basic_user_auth_client, division_director_auth_client, agreement_id, budget_line_item_ids=()):
    request_id = _submit(basic_user_auth_client, agreement_id, budget_line_item_ids=list(budget_line_item_ids)).json[
        "id"
    ]
    response = _review_mod(division_director_auth_client, request_id)
    assert response.status_code == 200, response.json
    return response.json


def _add_pending_amount_edit(loaded_db, agreement, bli):
    """A pending Modified LOE edit, as an approved amount change request records it."""
    edit = ContractModificationEdit(
        agreement_id=agreement.id,
        modification_type=ModificationEditType.MODIFIED_LOE,
        budget_line_item_id=bli.id,
        field="amount",
        old_value=float(bli.amount),
        new_value=float(bli.amount) + 1000.0,
        requested_by_id=BASIC_USER_ID,
        requested_on=datetime.datetime.now(),
    )
    loaded_db.add(edit)
    loaded_db.commit()
    return edit


def _request_pre_award(tracker, loaded_db, status=None):
    pre_award = tracker.get_step(ProcurementTrackerStepType.PRE_AWARD)
    pre_award.pre_award_approval_requested = True
    pre_award.pre_award_approval_status = status
    loaded_db.commit()
    return pre_award


def test_second_approved_mod_joins_the_active_mod_and_its_locks(
    modified_loe_enabled,  # noqa: F811
    basic_user_auth_client,
    division_director_auth_client,
    loaded_db,
    test_can,
    make_agreement,  # noqa: F811
):
    """A request approved while the agreement's contract mod is in procurement joins it: one mod,
    one action, one tracker. Its lines fall under that mod's locks; the agreement's other lines
    stay editable."""
    agreement, seeded_bli = make_agreement(test_can)
    bli_a = _executable_line(loaded_db, agreement, test_can, seeded_bli)
    bli_b = _executable_line(loaded_db, agreement, test_can, seeded_bli)
    unrelated = _executable_line(loaded_db, agreement, test_can, seeded_bli)
    first = _approve_mod(basic_user_auth_client, division_director_auth_client, agreement.id, [bli_a.id])
    second = _approve_mod(basic_user_auth_client, division_director_auth_client, agreement.id, [bli_b.id])

    loaded_db.expire_all()
    assert first["agreement_mod_id"] == second["agreement_mod_id"]
    assert len(loaded_db.scalars(select(AgreementMod).where(AgreementMod.agreement_id == agreement.id)).all()) == 1
    action = _mod_action(loaded_db, agreement.id)  # one_or_none: a second action would raise
    assert sorted(bli.id for bli in action.budget_line_items) == sorted([bli_a.id, bli_b.id])
    tracker = _tracker_for(loaded_db, action)
    assert tracker.status == ProcurementTrackerStatus.ACTIVE

    response = basic_user_auth_client.get("/api/v1/procurement-trackers/", query_string={"agreement_id": agreement.id})
    mod_trackers = [t for t in response.json["data"] if t["award_type"] == "MODIFICATION"]
    assert len(mod_trackers) == 1
    assert sorted(mod_trackers[0]["budget_line_item_ids"]) == sorted([bli_a.id, bli_b.id])

    _request_pre_award(tracker, loaded_db, status="APPROVED")
    tracker.get_step(ProcurementTrackerStepType.PRE_AWARD).pre_award_requisition_approved_by = BASIC_USER_ID
    loaded_db.commit()
    loaded_db.expire_all()
    for bli_id in (bli_a.id, bli_b.id):
        bli = loaded_db.get(ContractBudgetLineItem, bli_id)
        assert compute_bli_editable(bli, in_review=False, is_super=False) is False
        assert get_pre_award_lock(bli.agreement, bli) == PreAwardLock.POST_APPROVAL
    unrelated = loaded_db.get(ContractBudgetLineItem, unrelated.id)
    assert compute_bli_editable(unrelated, in_review=False, is_super=False) is True
    assert get_pre_award_lock(unrelated.agreement) is None


def test_awarding_a_joined_mod_obligates_every_request_s_lines(
    modified_loe_enabled,  # noqa: F811
    basic_user_auth_client,
    division_director_auth_client,
    loaded_db,
    test_can,
    make_agreement,  # noqa: F811
):
    agreement, seeded_bli = make_agreement(test_can)
    bli_a = _executable_line(loaded_db, agreement, test_can, seeded_bli)
    bli_b = _executable_line(loaded_db, agreement, test_can, seeded_bli)
    _approve_mod(basic_user_auth_client, division_director_auth_client, agreement.id, [bli_a.id])
    _approve_mod(basic_user_auth_client, division_director_auth_client, agreement.id, [bli_b.id])
    loaded_db.expire_all()
    tracker = _tracker_for(loaded_db, _mod_action(loaded_db, agreement.id))
    award_step = tracker.get_step(ProcurementTrackerStepType.AWARD)
    award_step.award_approval_status = "APPROVED"
    loaded_db.commit()

    ProcurementTrackerStepService(loaded_db)._handle_award_approval(
        award_step, "APPROVED", datetime.date(2026, 9, 15), loaded_db.get(User, BASIC_USER_ID)
    )
    loaded_db.commit()

    loaded_db.expire_all()
    for bli_id in (bli_a.id, bli_b.id):
        assert loaded_db.get(ContractBudgetLineItem, bli_id).status == BudgetLineItemStatus.OBLIGATED


def test_joining_modified_loe_work_into_an_as_is_mod_at_step_1_unskips_steps_2_to_4(
    approved_as_is, basic_user_auth_client, division_director_auth_client, loaded_db, app_ctx
):
    agreement, executable, action, tracker = approved_as_is
    _add_pending_amount_edit(loaded_db, agreement, executable)

    joined = _approve_mod(basic_user_auth_client, division_director_auth_client, agreement.id)

    loaded_db.expire_all()
    assert joined["agreement_mod_id"] == action.agreement_mod_id
    mod = loaded_db.get(AgreementMod, action.agreement_mod_id)
    assert mod.mod_type == ModType.MODIFIED_LOE
    tracker = _tracker_for(loaded_db, action)
    assert tracker.active_step_number == 1
    statuses = _statuses(tracker)
    assert statuses.pop(ProcurementTrackerStepType.ACQUISITION_PLANNING) == ProcurementTrackerStepStatus.ACTIVE
    assert set(statuses.values()) == {ProcurementTrackerStepStatus.PENDING}


def test_joining_new_work_after_step_1_moves_an_as_is_tracker_back_to_step_2(
    approved_as_is, basic_user_auth_client, division_director_auth_client, loaded_db, app_ctx
):
    agreement, executable, action, tracker = approved_as_is
    step_1 = tracker.get_step(ProcurementTrackerStepType.ACQUISITION_PLANNING)
    step_1.status = ProcurementTrackerStepStatus.COMPLETED
    step_5 = tracker.get_step(ProcurementTrackerStepType.PRE_AWARD)
    step_5.status = ProcurementTrackerStepStatus.ACTIVE
    step_5.step_start_date = datetime.date.today()
    step_5.notes = "Kept"
    tracker.active_step_number = 5
    loaded_db.commit()
    _add_pending_amount_edit(loaded_db, agreement, executable)

    _approve_mod(basic_user_auth_client, division_director_auth_client, agreement.id)

    loaded_db.expire_all()
    tracker = _tracker_for(loaded_db, action)
    assert tracker.active_step_number == 2
    pre_solicitation = tracker.get_step(ProcurementTrackerStepType.PRE_SOLICITATION)
    assert pre_solicitation.status == ProcurementTrackerStepStatus.ACTIVE
    assert pre_solicitation.step_start_date == datetime.date.today()
    step_5 = tracker.get_step(ProcurementTrackerStepType.PRE_AWARD)
    assert step_5.status == ProcurementTrackerStepStatus.PENDING
    assert step_5.notes == "Kept"


def test_joining_more_as_is_work_leaves_the_tracker_as_is(
    approved_as_is,
    basic_user_auth_client,
    division_director_auth_client,
    loaded_db,
    test_can,
    app_ctx,
):
    agreement, _, action, _ = approved_as_is
    another = _add_bli(loaded_db, agreement, test_can)

    _approve_mod(basic_user_auth_client, division_director_auth_client, agreement.id, [another.id])

    loaded_db.expire_all()
    assert loaded_db.get(AgreementMod, action.agreement_mod_id).mod_type == ModType.AS_IS
    tracker = _tracker_for(loaded_db, action)
    assert {t for t, s in _statuses(tracker).items() if s == ProcurementTrackerStepStatus.SKIPPED} == SKIPPED_FOR_AS_IS
    assert loaded_db.get(ContractBudgetLineItem, another.id).procurement_action_id == action.id


@pytest.mark.parametrize("status", [None, "APPROVED"])
def test_no_new_modification_once_pre_award_approval_is_requested(
    approved_as_is, status, basic_user_auth_client, loaded_db, test_can, app_ctx
):
    """Pre-Award approval covers a fixed scope, so the mod in procurement stops taking requests."""
    agreement, _, _, tracker = approved_as_is
    _request_pre_award(tracker, loaded_db, status=status)
    another = _add_bli(loaded_db, agreement, test_can)

    response = _submit(basic_user_auth_client, agreement.id, budget_line_item_ids=[another.id])

    assert response.status_code == 400, response.json
    assert "Pre-Award approval" in str(response.json)
    agreement_response = basic_user_auth_client.get(f"/api/v1/agreements/{agreement.id}")
    assert agreement_response.json["is_active_contract_mod_locked"] is True


def test_a_declined_pre_award_reopens_the_mod(approved_as_is, basic_user_auth_client, loaded_db, test_can, app_ctx):
    agreement, _, _, tracker = approved_as_is
    _request_pre_award(tracker, loaded_db, status="DECLINED")
    another = _add_bli(loaded_db, agreement, test_can)

    response = _submit(basic_user_auth_client, agreement.id, budget_line_item_ids=[another.id])

    assert response.status_code == 201, response.json
    assert (
        basic_user_auth_client.get(f"/api/v1/agreements/{agreement.id}").json["is_active_contract_mod_locked"] is False
    )


def test_approving_after_pre_award_was_requested_is_rejected_and_writes_nothing(
    approved_as_is,
    basic_user_auth_client,
    division_director_auth_client,
    loaded_db,
    test_can,
    app_ctx,
):
    """A request sent before the mod's Pre-Award request can't be approved after it."""
    agreement, _, action, tracker = approved_as_is
    another = _add_bli(loaded_db, agreement, test_can)
    request_id = _submit(basic_user_auth_client, agreement.id, budget_line_item_ids=[another.id]).json["id"]
    _request_pre_award(tracker, loaded_db)

    response = _review_mod(division_director_auth_client, request_id)

    assert response.status_code == 400, response.json
    loaded_db.expire_all()
    another = loaded_db.get(ContractBudgetLineItem, another.id)
    assert another.status == BudgetLineItemStatus.PLANNED
    assert another.procurement_action_id is None


def test_a_completed_mod_lets_the_next_approval_start_a_new_one(
    approved_as_is,
    basic_user_auth_client,
    division_director_auth_client,
    loaded_db,
    test_can,
    app_ctx,
):
    agreement, _, action, tracker = approved_as_is
    tracker.status = ProcurementTrackerStatus.COMPLETED
    loaded_db.commit()
    another = _add_bli(loaded_db, agreement, test_can)

    approved = _approve_mod(basic_user_auth_client, division_director_auth_client, agreement.id, [another.id])

    loaded_db.expire_all()
    assert approved["agreement_mod_id"] != action.agreement_mod_id
    new_action = loaded_db.scalars(
        select(ProcurementAction).where(ProcurementAction.agreement_mod_id == approved["agreement_mod_id"])
    ).one()
    assert _tracker_for(loaded_db, new_action).status == ProcurementTrackerStatus.ACTIVE


def test_declining_a_request_leaves_the_active_mod_unchanged(
    approved_as_is, basic_user_auth_client, division_director_auth_client, loaded_db, test_can, app_ctx
):
    agreement, _, action, tracker = approved_as_is
    another = _add_bli(loaded_db, agreement, test_can)
    request_id = _submit(basic_user_auth_client, agreement.id, budget_line_item_ids=[another.id]).json["id"]

    response = _review_mod(division_director_auth_client, request_id, action="DECLINE")

    assert response.status_code == 200, response.json
    loaded_db.expire_all()
    assert loaded_db.get(ContractBudgetLineItem, another.id).procurement_action_id is None
    assert loaded_db.get(AgreementMod, action.agreement_mod_id).mod_type == ModType.AS_IS
    assert _tracker_for(loaded_db, action).active_step_number == 1
