"""Integration tests for deleting Budget Line Items as a change request (issue #5819, PR2).

Deletion eligibility now mirrors editability:
  - DRAFT (and any delete by a super user) is hard-deleted immediately (200),
  - PLANNED and IN_EXECUTION deletions create an approval change request (202); the BLI is left
    intact until the request is approved,
  - approving a deletion request deletes the BLI and records a "Budget Line Deleted" history entry,
  - rejecting it leaves the BLI intact,
  - deletion is blocked once Pre-Award is fully approved (OPS-2280 post-pre-award lock), since
    deletability mirrors editability.

The CR is a normal BUDGET_LINE_ITEM_CHANGE_REQUEST carrying a ``{"delete": true}`` sentinel, so it
keeps marking the BLI ``in_review`` and reuses the existing review/approval/notification plumbing.

``budget_team_auth_client`` (BUDGET_TEAM role) creates the request — associated with every agreement
but not a super user, so the deletion routes to a change request. ``division_director_auth_client`` is
the reviewer for managing division 5 (the division of CAN 500 used by ``test_can``).
"""

import datetime

import pytest
from flask import url_for
from sqlalchemy import text

from models import (
    AgreementReason,
    AgreementType,
    BudgetLineItemChangeRequest,
    BudgetLineItemStatus,
    ChangeRequestStatus,
    ChangeRequestType,
    ContractAgreement,
    ContractBudgetLineItem,
    ContractType,
    DefaultProcurementTracker,
    DefaultProcurementTrackerStep,
    ProcurementTrackerStatus,
    ProcurementTrackerStepType,
    ServicesComponent,
)

SYSTEM_OWNER_USER_ID = 503


@pytest.fixture()
def deletable_agreement(loaded_db, test_project):
    agreement = ContractAgreement(
        name="Delete BLI Test Agreement",
        contract_number="CT5819D",
        contract_type=ContractType.FIRM_FIXED_PRICE,
        agreement_type=AgreementType.CONTRACT,
        project_id=test_project.id,
        product_service_code_id=2,
        description="Agreement for deleting BLIs as change requests",
        agreement_reason=AgreementReason.NEW_REQ,
        project_officer_id=SYSTEM_OWNER_USER_ID,
        awarding_entity_id=1,
    )
    loaded_db.add(agreement)
    loaded_db.commit()

    yield agreement

    loaded_db.rollback()
    loaded_db.delete(agreement)
    loaded_db.commit()


def _make_bli(loaded_db, agreement, test_can, status):
    sc = ServicesComponent(agreement_id=agreement.id, number=1, optional=False)
    loaded_db.add(sc)
    loaded_db.commit()

    bli = ContractBudgetLineItem(
        agreement_id=agreement.id,
        line_description="BLI to delete",
        comments="original comment",
        amount=500000.00,
        can_id=test_can.id,
        date_needed=datetime.date(2043, 1, 1),
        status=status,
        proc_shop_fee_percentage=1.23,
        created_by=SYSTEM_OWNER_USER_ID,
        services_component_id=sc.id,
    )
    loaded_db.add(bli)
    loaded_db.commit()
    return bli, sc


def _cleanup_bli(loaded_db, bli_id, sc):
    """Remove any change request referencing the BLI, then the BLI and its services component.
    Safe whether or not the BLI was actually deleted by the test."""
    loaded_db.rollback()
    loaded_db.execute(text("DELETE FROM change_request WHERE budget_line_item_id = :id"), {"id": bli_id})
    loaded_db.commit()
    bli = loaded_db.get(ContractBudgetLineItem, bli_id)
    if bli is not None:
        loaded_db.delete(bli)
        loaded_db.commit()
    loaded_db.delete(sc)
    loaded_db.commit()


@pytest.fixture()
def make_pre_award(loaded_db):
    """Factory that attaches an ACTIVE procurement tracker with a fully-approved PRE_AWARD step
    (DD approved + requisition approved) to an agreement — i.e. ``is_post_pre_award_locked`` is True.

    ``loaded_db``'s SAVEPOINT rollback would discard these rows on its own, but the sibling
    ``deletable_agreement`` fixture ORM-deletes its agreement in teardown, which FK-fails if the
    tracker still references it. So we must remove the tracker/step first. ProcurementTracker/Step
    are versioned (sqlalchemy-continuum); ORM-deleting them races the version bookkeeping, so we use
    raw SQL. The step row is deleted before the tracker row to respect the FK; this teardown runs
    before the agreement teardown because this fixture is requested after the BLI fixture (fixtures
    finalize in reverse)."""
    created_tracker_ids = []
    created_step_ids = []

    def _make(agreement_id):
        # DefaultProcurementTracker (not the now-abstract ProcurementTracker base); its
        # polymorphic identity sets tracker_type=DEFAULT automatically.
        tracker = DefaultProcurementTracker(
            agreement_id=agreement_id,
            status=ProcurementTrackerStatus.ACTIVE,
        )
        loaded_db.add(tracker)
        loaded_db.flush()

        step = DefaultProcurementTrackerStep(
            procurement_tracker_id=tracker.id,
            step_number=5,
            step_type=ProcurementTrackerStepType.PRE_AWARD,
            pre_award_approval_requested=True,
            pre_award_approval_status="APPROVED",
            pre_award_requisition_approved_by=SYSTEM_OWNER_USER_ID,
        )
        loaded_db.add(step)
        loaded_db.commit()
        created_tracker_ids.append(tracker.id)
        created_step_ids.append(step.id)
        return tracker

    yield _make

    loaded_db.rollback()
    for step_id in created_step_ids:
        loaded_db.execute(text("DELETE FROM procurement_tracker_step WHERE id = :id"), {"id": step_id})
    for tracker_id in created_tracker_ids:
        loaded_db.execute(text("DELETE FROM default_procurement_tracker WHERE id = :id"), {"id": tracker_id})
        loaded_db.execute(text("DELETE FROM procurement_tracker WHERE id = :id"), {"id": tracker_id})
    loaded_db.commit()


@pytest.mark.parametrize("status", [BudgetLineItemStatus.PLANNED, BudgetLineItemStatus.IN_EXECUTION])
def test_delete_planned_or_executing_bli_creates_change_request(
    budget_team_auth_client, division_director_auth_client, loaded_db, deletable_agreement, test_can, status, app_ctx
):
    """Deleting a PLANNED/IN_EXECUTION BLI returns 202 and creates a deletion CR; the BLI survives."""
    bli, sc = _make_bli(loaded_db, deletable_agreement, test_can, status)
    bli_id = bli.id
    agreement_id = deletable_agreement.id
    try:
        response = budget_team_auth_client.delete(url_for("api.budget-line-items-item", id=bli_id))
        assert response.status_code == 202

        # The BLI is still present (only the request was created).
        assert loaded_db.get(ContractBudgetLineItem, bli_id) is not None

        cr = (
            loaded_db.query(BudgetLineItemChangeRequest)
            .filter_by(budget_line_item_id=bli_id, status=ChangeRequestStatus.IN_REVIEW)
            .one()
        )
        assert cr.has_delete_change is True
        assert cr.requested_change_data == {"delete": True}
        assert cr.requested_change_diff == {"delete": {"old": 500000.0, "new": "Deleted"}}

        # Submitting the request records a "Budget Line Deletion Requested" history entry naming
        # the requestor (guards the request-created arm of the history builder).
        hist = division_director_auth_client.get(url_for("api.agreement-history", id=agreement_id, limit=100))
        assert hist.status_code == 200
        requested_entries = [h for h in hist.json["data"] if h["history_title"] == "Budget Line Deletion Requested"]
        assert len(requested_entries) >= 1
        message = requested_entries[0]["history_message"]
        assert f"requested to delete BL {bli_id}" in message
        assert "Unknown User" not in message
    finally:
        _cleanup_bli(loaded_db, bli_id, sc)


def test_delete_draft_bli_is_immediate(budget_team_auth_client, loaded_db, deletable_agreement, test_can, app_ctx):
    """A DRAFT BLI is hard-deleted immediately (200), no change request."""
    bli, sc = _make_bli(loaded_db, deletable_agreement, test_can, BudgetLineItemStatus.DRAFT)
    bli_id = bli.id
    try:
        response = budget_team_auth_client.delete(url_for("api.budget-line-items-item", id=bli_id))
        assert response.status_code == 200
        assert loaded_db.get(ContractBudgetLineItem, bli_id) is None
        assert loaded_db.query(BudgetLineItemChangeRequest).filter_by(budget_line_item_id=bli_id).count() == 0
    finally:
        _cleanup_bli(loaded_db, bli_id, sc)


@pytest.mark.parametrize("status", [BudgetLineItemStatus.PLANNED, BudgetLineItemStatus.IN_EXECUTION])
def test_super_user_delete_bypasses_change_request(
    power_user_auth_client, loaded_db, deletable_agreement, test_can, status, app_ctx
):
    """A super user deleting a PLANNED/IN_EXECUTION BLI hard-deletes it immediately (200), skipping
    the change-request approval flow that a non-super-user would be routed through."""
    bli, sc = _make_bli(loaded_db, deletable_agreement, test_can, status)
    bli_id = bli.id
    try:
        response = power_user_auth_client.delete(url_for("api.budget-line-items-item", id=bli_id))
        assert response.status_code == 200
        assert loaded_db.get(ContractBudgetLineItem, bli_id) is None
        assert loaded_db.query(BudgetLineItemChangeRequest).filter_by(budget_line_item_id=bli_id).count() == 0
    finally:
        _cleanup_bli(loaded_db, bli_id, sc)


def test_delete_executing_bli_blocked_at_pre_award(
    budget_team_auth_client, loaded_db, deletable_agreement, test_can, make_pre_award, app_ctx
):
    """Once Pre-Award is fully approved (post-pre-award lock), an executing BLI can't be deleted —
    deletability mirrors editability (OPS-2280)."""
    bli, sc = _make_bli(loaded_db, deletable_agreement, test_can, BudgetLineItemStatus.IN_EXECUTION)
    bli_id = bli.id
    make_pre_award(deletable_agreement.id)
    try:
        response = budget_team_auth_client.delete(url_for("api.budget-line-items-item", id=bli_id))
        assert response.status_code == 400
        assert "not in a deletable state" in str(response.json)
        assert loaded_db.get(ContractBudgetLineItem, bli_id) is not None
    finally:
        _cleanup_bli(loaded_db, bli_id, sc)


def test_delete_bli_blocked_when_already_in_review(
    budget_team_auth_client, loaded_db, deletable_agreement, test_can, app_ctx
):
    """A BLI that already has a pending change request can't get a second (deletion) request."""
    bli, sc = _make_bli(loaded_db, deletable_agreement, test_can, BudgetLineItemStatus.PLANNED)
    bli_id = bli.id
    existing_cr = BudgetLineItemChangeRequest(
        agreement_id=deletable_agreement.id,
        budget_line_item_id=bli_id,
        change_request_type=ChangeRequestType.BUDGET_LINE_ITEM_CHANGE_REQUEST,
        status=ChangeRequestStatus.IN_REVIEW,
        requested_change_data={"amount": 123.45},
    )
    loaded_db.add(existing_cr)
    loaded_db.commit()
    try:
        response = budget_team_auth_client.delete(url_for("api.budget-line-items-item", id=bli_id))
        assert response.status_code == 400
        # An in-review BLI is not editable, so the shared deletability gate rejects it — assert the
        # specific message so this doesn't silently pass on an unrelated 400.
        assert "not in a deletable state" in str(response.json)
        assert loaded_db.get(ContractBudgetLineItem, bli_id) is not None
    finally:
        _cleanup_bli(loaded_db, bli_id, sc)


def test_approving_deletion_request_deletes_bli_and_records_history(
    budget_team_auth_client, division_director_auth_client, loaded_db, deletable_agreement, test_can, app_ctx
):
    """Approving a deletion CR deletes the BLI, returns 200, and records a BUDGET_LINE_ITEM_DELETED
    history entry.

    BLOCKER-1 guard: the approval finalizes the CR and notifies the submitter while the CR row still
    exists, then deletes the BLI last. The 200 below proves the post-commit reads (the submitter
    notification and the response's re-serialization of the change request) do not crash on the
    cascade-deleted CR. The durable record of the deletion is the AgreementHistory entry asserted
    here plus the automatic OpsDBHistory trail; the ChangeRequest row and its notification row are
    intentionally cascade-removed with the BLI."""
    bli, sc = _make_bli(loaded_db, deletable_agreement, test_can, BudgetLineItemStatus.PLANNED)
    bli_id = bli.id
    agreement_id = deletable_agreement.id
    try:
        # Submit the deletion request.
        response = budget_team_auth_client.delete(url_for("api.budget-line-items-item", id=bli_id))
        assert response.status_code == 202
        cr = (
            loaded_db.query(BudgetLineItemChangeRequest)
            .filter_by(budget_line_item_id=bli_id, status=ChangeRequestStatus.IN_REVIEW)
            .one()
        )
        cr_id = cr.id

        prev_hist = division_director_auth_client.get(url_for("api.agreement-history", id=agreement_id, limit=100))
        prev_hist_count = len(prev_hist.json["data"])

        # Approve it.
        response = division_director_auth_client.patch(
            url_for("api.change-requests-item", id=cr_id),
            json={"action": "APPROVE", "reviewer_notes": "ok to delete"},
        )
        assert response.status_code == 200
        # BLOCKER-1: the response must be a clean serialization of the (now cascade-deleted) CR,
        # not a degraded/error body — the snapshot captured before deletion drives this.
        assert "error" not in response.json
        assert response.json["id"] == cr_id
        assert response.json["has_delete_change"] is True

        # The BLI (and, via cascade, the CR row) are gone.
        assert loaded_db.get(ContractBudgetLineItem, bli_id) is None
        assert loaded_db.get(BudgetLineItemChangeRequest, cr_id) is None

        # A "Budget Line Deleted" history entry was recorded on approval, and its message names the
        # reviewer and requestor (guards the "Unknown User" fallback in the history builder).
        hist = division_director_auth_client.get(url_for("api.agreement-history", id=agreement_id, limit=100))
        assert hist.status_code == 200
        assert len(hist.json["data"]) > prev_hist_count
        deletion_entries = [h for h in hist.json["data"] if h["history_title"] == "Budget Line Deleted"]
        assert len(deletion_entries) >= 1
        message = deletion_entries[0]["history_message"]
        assert f"approved the deletion of BL {bli_id}" in message
        assert "requested by" in message
        assert "Unknown User" not in message
    finally:
        _cleanup_bli(loaded_db, bli_id, sc)


def test_rejecting_deletion_request_keeps_bli(
    budget_team_auth_client, division_director_auth_client, loaded_db, deletable_agreement, test_can, app_ctx
):
    """Rejecting a deletion CR leaves the BLI intact and records a decline history entry."""
    bli, sc = _make_bli(loaded_db, deletable_agreement, test_can, BudgetLineItemStatus.PLANNED)
    bli_id = bli.id
    agreement_id = deletable_agreement.id
    try:
        response = budget_team_auth_client.delete(url_for("api.budget-line-items-item", id=bli_id))
        assert response.status_code == 202
        cr = (
            loaded_db.query(BudgetLineItemChangeRequest)
            .filter_by(budget_line_item_id=bli_id, status=ChangeRequestStatus.IN_REVIEW)
            .one()
        )

        response = division_director_auth_client.patch(
            url_for("api.change-requests-item", id=cr.id),
            json={"action": "REJECT", "reviewer_notes": "keep it"},
        )
        assert response.status_code == 200

        assert loaded_db.get(ContractBudgetLineItem, bli_id) is not None
        loaded_db.refresh(cr)
        assert cr.status == ChangeRequestStatus.REJECTED

        # A "Budget Line Deletion Declined" history entry was recorded on rejection.
        hist = division_director_auth_client.get(url_for("api.agreement-history", id=agreement_id, limit=100))
        assert hist.status_code == 200
        declined_entries = [h for h in hist.json["data"] if h["history_title"] == "Budget Line Deletion Declined"]
        assert len(declined_entries) >= 1
        message = declined_entries[0]["history_message"]
        assert f"declined the deletion of BL {bli_id}" in message
        assert "Unknown User" not in message
    finally:
        _cleanup_bli(loaded_db, bli_id, sc)


def test_delete_unauthorized_user(basic_user_auth_client, loaded_db, deletable_agreement, test_can, app_ctx):
    """A user not associated with the agreement cannot delete (or request deletion of) the BLI."""
    bli, sc = _make_bli(loaded_db, deletable_agreement, test_can, BudgetLineItemStatus.PLANNED)
    bli_id = bli.id
    try:
        response = basic_user_auth_client.delete(url_for("api.budget-line-items-item", id=bli_id))
        assert response.status_code == 403
        assert loaded_db.get(ContractBudgetLineItem, bli_id) is not None
    finally:
        _cleanup_bli(loaded_db, bli_id, sc)
