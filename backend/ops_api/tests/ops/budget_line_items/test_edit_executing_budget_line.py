"""Integration tests for editing IN_EXECUTION Budget Line Items (issue #5819).

Executing BLIs are now editable like PLANNED ones:
  - budget-field edits (amount/can_id/date_needed) route through a change request (202) when the
    SKIP_CR_FOR_DRAFT_PLANNED capability is OFF, and apply directly (200) when it is ON (OPS-6195),
  - non-budget edits (line_description/services_component_id/comments) apply directly (200),
  - an already in-review BLI stays non-editable.

Under the OPS-2280 lock model, merely sitting at a pre-award tracker step no longer blocks editing.
Editing is blocked only while a Pre-Award approval is in review (requested, not yet decided) and
permanently once Pre-Award is fully approved (DD approved + requisition approved). These lock cases
are exercised below against real ProcurementTracker rows.

The `auth_client` fixture is the SYSTEM_OWNER user (id 503): authorized via the SYSTEM_OWNER
association bypass but NOT a super user, so budget edits route to a change request.
"""

import datetime

import pytest
from flask import url_for
from sqlalchemy import text

from models import (
    AgreementReason,
    AgreementType,
    BudgetLineItemStatus,
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


def _full_put_payload(bli, **overrides):
    """Build a complete PUT body. PUT is a full replacement and a non-DRAFT BLI must keep all
    status-change-required fields populated, so we always send the current values and override
    only what the test is changing."""
    payload = {
        "agreement_id": bli.agreement_id,
        "can_id": bli.can_id,
        "amount": float(bli.amount),
        "date_needed": bli.date_needed.isoformat(),
        "status": bli.status.name,
        "line_description": bli.line_description,
        "comments": bli.comments,
        "services_component_id": bli.services_component_id,
    }
    payload.update(overrides)
    return payload


@pytest.fixture()
def executing_agreement(loaded_db, test_project):
    agreement = ContractAgreement(
        name="Edit Executing BLI Test Agreement",
        contract_number="CT5819",
        contract_type=ContractType.FIRM_FIXED_PRICE,
        agreement_type=AgreementType.CONTRACT,
        project_id=test_project.id,
        product_service_code_id=2,
        description="Agreement for editing executing BLIs",
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


@pytest.fixture()
def executing_bli(loaded_db, executing_agreement, test_can):
    sc = ServicesComponent(agreement_id=executing_agreement.id, number=1, optional=False)
    loaded_db.add(sc)
    loaded_db.commit()

    bli = ContractBudgetLineItem(
        agreement_id=executing_agreement.id,
        line_description="Executing LI",
        comments="original comment",
        amount=100.12,
        can_id=test_can.id,
        date_needed=datetime.date(2043, 1, 1),
        status=BudgetLineItemStatus.IN_EXECUTION,
        proc_shop_fee_percentage=1.23,
        created_by=SYSTEM_OWNER_USER_ID,
        services_component_id=sc.id,
    )
    loaded_db.add(bli)
    loaded_db.commit()
    bli_id = bli.id

    yield bli

    # A budget edit may have created a change request referencing this BLI; remove it first
    # (ChangeRequest uses single-table inheritance, so budget_line_item_id lives on change_request).
    loaded_db.rollback()
    loaded_db.execute(text("DELETE FROM change_request WHERE budget_line_item_id = :id"), {"id": bli_id})
    loaded_db.commit()
    loaded_db.delete(bli)
    loaded_db.delete(sc)
    loaded_db.commit()


@pytest.fixture()
def make_pre_award(loaded_db):
    """Factory that attaches an ACTIVE procurement tracker with a PRE_AWARD step to an agreement.

    ``state`` selects the pre-award approval situation the lock model cares about:
      - "present": a PRE_AWARD step with no approval requested (neither in review nor locked),
      - "in_review": approval requested and pending (``is_pre_award_in_review`` is True),
      - "declined": approval requested and declined by the DD (neither in review nor locked),
      - "locked": fully approved — DD approved + requisition approved (``is_post_pre_award_locked``),
      - "award_approved": fully-approved pre-award PLUS an AWARD step whose award_approval_status is
        APPROVED — the Budget Team has approved the Award request, so the post-pre-award lock is
        released even though the AWARD step is not yet completed.

    ``loaded_db``'s SAVEPOINT rollback would discard these rows on its own, but the sibling
    ``executing_agreement`` fixture ORM-deletes its agreement in teardown, which FK-fails if the
    tracker still references it. So we must remove the tracker/step first. ProcurementTracker/Step
    are versioned (sqlalchemy-continuum); ORM-deleting them races the version bookkeeping, so we use
    raw SQL (mirroring test_validate_procurement_tracker_steps.py). The step row is deleted before
    the tracker row to respect the FK; this teardown runs before the agreement teardown because this
    fixture is requested after ``executing_bli`` (fixtures finalize in reverse)."""
    created_tracker_ids = []
    created_step_ids = []

    def _make(agreement_id, state="locked"):
        # DefaultProcurementTracker (not the now-abstract ProcurementTracker base); its
        # polymorphic identity sets tracker_type=DEFAULT automatically.
        tracker = DefaultProcurementTracker(
            agreement_id=agreement_id,
            status=ProcurementTrackerStatus.ACTIVE,
        )
        loaded_db.add(tracker)
        loaded_db.flush()

        steps = []
        if state == "present":
            # Sitting at a PRE_AWARD step with no approval requested: neither in-review nor locked.
            steps.append(
                DefaultProcurementTrackerStep(
                    procurement_tracker_id=tracker.id,
                    step_number=5,
                    step_type=ProcurementTrackerStepType.PRE_AWARD,
                    pre_award_approval_requested=False,
                )
            )
        elif state == "in_review":
            steps.append(
                DefaultProcurementTrackerStep(
                    procurement_tracker_id=tracker.id,
                    step_number=5,
                    step_type=ProcurementTrackerStepType.PRE_AWARD,
                    pre_award_approval_requested=True,
                    pre_award_approval_status="PENDING",
                )
            )
        elif state == "declined":
            # DD declined the Pre-Award request: the lock is released and editing reopens.
            steps.append(
                DefaultProcurementTrackerStep(
                    procurement_tracker_id=tracker.id,
                    step_number=5,
                    step_type=ProcurementTrackerStepType.PRE_AWARD,
                    pre_award_approval_requested=True,
                    pre_award_approval_status="DECLINED",
                )
            )
        elif state in ("locked", "award_approved"):
            steps.append(
                DefaultProcurementTrackerStep(
                    procurement_tracker_id=tracker.id,
                    step_number=5,
                    step_type=ProcurementTrackerStepType.PRE_AWARD,
                    pre_award_approval_requested=True,
                    pre_award_approval_status="APPROVED",
                    pre_award_requisition_approved_by=SYSTEM_OWNER_USER_ID,
                )
            )
            if state == "award_approved":
                steps.append(
                    DefaultProcurementTrackerStep(
                        procurement_tracker_id=tracker.id,
                        step_number=6,
                        step_type=ProcurementTrackerStepType.AWARD,
                        award_approval_requested=True,
                        award_approval_status="APPROVED",
                    )
                )
        else:
            raise ValueError(f"Unknown pre-award state: {state!r}")

        for step in steps:
            loaded_db.add(step)
        loaded_db.commit()
        created_tracker_ids.append(tracker.id)
        created_step_ids.extend(step.id for step in steps)
        return tracker

    yield _make

    loaded_db.rollback()
    for step_id in created_step_ids:
        loaded_db.execute(text("DELETE FROM procurement_tracker_step WHERE id = :id"), {"id": step_id})
    for tracker_id in created_tracker_ids:
        loaded_db.execute(text("DELETE FROM default_procurement_tracker WHERE id = :id"), {"id": tracker_id})
        loaded_db.execute(text("DELETE FROM procurement_tracker WHERE id = :id"), {"id": tracker_id})
    loaded_db.commit()


@pytest.fixture()
def skip_cr_enabled(app):
    """Turn the SKIP_CR_FOR_DRAFT_PLANNED capability ON for the duration of a test."""
    original = app.config.get("SKIP_CR_FOR_DRAFT_PLANNED", False)
    app.config["SKIP_CR_FOR_DRAFT_PLANNED"] = True
    yield
    app.config["SKIP_CR_FOR_DRAFT_PLANNED"] = original


@pytest.fixture()
def skip_cr_disabled(app):
    """Turn the SKIP_CR_FOR_DRAFT_PLANNED capability OFF for the duration of a test."""
    original = app.config.get("SKIP_CR_FOR_DRAFT_PLANNED", False)
    app.config["SKIP_CR_FOR_DRAFT_PLANNED"] = False
    yield
    app.config["SKIP_CR_FOR_DRAFT_PLANNED"] = original


def test_edit_executing_bli_budget_field_routes_to_change_request(
    skip_cr_disabled, auth_client, executing_bli, app_ctx
):
    """With the capability OFF, changing amount on an executing BLI (no procurement tracker → no
    pre-award lock) creates a CR, returns 202."""
    data = _full_put_payload(executing_bli, amount=200.50, requestor_notes="bump amount")
    response = auth_client.put(url_for("api.budget-line-items-item", id=executing_bli.id), json=data)

    assert response.status_code == 202
    assert response.json["in_review"] is True
    # The amount is NOT applied directly; it is held in the change request.
    assert response.json["amount"] == 100.12
    cr = response.json["change_requests_in_review"][0]
    assert cr["change_request_type"] == "BUDGET_LINE_ITEM_CHANGE_REQUEST"
    assert cr["requested_change_data"] == {"amount": 200.50}


def test_edit_executing_bli_non_budget_field_applies_directly(auth_client, executing_bli, app_ctx):
    """Changing line_description/comments on an executing BLI applies directly, returns 200."""
    data = _full_put_payload(
        executing_bli,
        line_description="Updated executing description",
        comments="updated comment",
    )
    response = auth_client.put(url_for("api.budget-line-items-item", id=executing_bli.id), json=data)

    assert response.status_code == 200
    assert response.json["line_description"] == "Updated executing description"
    assert response.json["comments"] == "updated comment"
    assert response.json["in_review"] is False


def test_edit_executing_bli_blocked_when_pre_award_in_review(auth_client, executing_bli, make_pre_award, app_ctx):
    """While a Pre-Award approval is in review (requested, not yet decided), an executing BLI is no
    longer editable (OPS-2280)."""
    make_pre_award(executing_bli.agreement_id, state="in_review")

    data = _full_put_payload(executing_bli, line_description="Should be blocked")
    response = auth_client.put(url_for("api.budget-line-items-item", id=executing_bli.id), json=data)

    assert response.status_code == 400
    # Assert the 400 is the pre-award-in-review lock (not an unrelated validation failure).
    assert "Pre-Award Approval is in review" in str(response.json)


def test_edit_executing_bli_blocked_when_post_pre_award_locked(auth_client, executing_bli, make_pre_award, app_ctx):
    """Once Pre-Award is fully approved (DD approved + requisition approved), editing is permanently
    locked (OPS-2280)."""
    make_pre_award(executing_bli.agreement_id, state="locked")

    data = _full_put_payload(executing_bli, comments="Should be blocked")
    response = auth_client.put(url_for("api.budget-line-items-item", id=executing_bli.id), json=data)

    assert response.status_code == 400
    assert "after Pre-Award Approval has been completed" in str(response.json)


def test_edit_executing_bli_editable_after_award_approved(auth_client, executing_bli, make_pre_award, app_ctx):
    """Once the Budget Team approves the Award request, the post-pre-award lock is released and an
    executing BLI becomes editable again — even though the AWARD step is not yet completed.
    A non-budget edit applies directly (200) instead of the 400 seen in the still-locked case."""
    make_pre_award(executing_bli.agreement_id, state="award_approved")

    data = _full_put_payload(executing_bli, line_description="Edited after award approval")
    response = auth_client.put(url_for("api.budget-line-items-item", id=executing_bli.id), json=data)

    assert response.status_code == 200
    assert response.json["line_description"] == "Edited after award approval"


def test_edit_executing_bli_meta_editable_after_award_approved(auth_client, executing_bli, make_pre_award, app_ctx):
    """The _meta unlocks (isEditable True, no lockedMessage) once the Award request is approved,
    mirroring the write-path release above so the pen icon and PATCH validation stay in lockstep."""
    make_pre_award(executing_bli.agreement_id, state="award_approved")

    response = auth_client.get(url_for("api.budget-line-items-item", id=executing_bli.id))

    assert response.status_code == 200
    meta = response.json["_meta"]
    assert meta["isEditable"] is True
    assert meta["isDeletable"] is True
    assert meta["lockedMessage"] is None


def test_edit_executing_bli_editable_during_pre_award_step_not_in_review(
    auth_client, executing_bli, make_pre_award, app_ctx
):
    """OPS-2280: merely sitting at a Pre-Award tracker step no longer blocks editing. With a
    PRE_AWARD step present but no approval requested, an executing BLI stays editable — verified
    against a real ProcurementTracker row (not just the in-memory helper unit tests)."""
    make_pre_award(executing_bli.agreement_id, state="present")

    data = _full_put_payload(executing_bli, line_description="Edited during pre-award, not in review")
    response = auth_client.put(url_for("api.budget-line-items-item", id=executing_bli.id), json=data)

    assert response.status_code == 200
    assert response.json["line_description"] == "Edited during pre-award, not in review"


def test_executing_bli_list_meta_at_pre_award(auth_client, executing_bli, make_pre_award, app_ctx):
    """The list endpoint's _meta builder is a separate code path from the single-item GET; verify it
    surfaces isEditable/isDeletable/lockedMessage for an executing BLI locked after Pre-Award
    approval."""
    make_pre_award(executing_bli.agreement_id, state="locked")

    response = auth_client.get(
        url_for("api.budget-line-items-group"),
        query_string={"agreement_id": executing_bli.agreement_id},
    )
    assert response.status_code == 200

    rows = [row for row in response.json if row["id"] == executing_bli.id]
    assert len(rows) == 1
    meta = rows[0]["_meta"]
    assert meta["isEditable"] is False
    assert meta["isDeletable"] is False
    assert meta["lockedMessage"] is not None
    assert "Pre-Award" in meta["lockedMessage"]


def test_edit_executing_bli_meta_is_editable_and_deletable(auth_client, executing_bli, app_ctx):
    """The GET _meta exposes isEditable and isDeletable True for an executing BLI (non-super).
    Deletion routes through an approval request (see the deletion tests), but the control is live."""
    response = auth_client.get(url_for("api.budget-line-items-item", id=executing_bli.id))

    assert response.status_code == 200
    meta = response.json["_meta"]
    assert meta["isEditable"] is True
    assert meta["isDeletable"] is True
    assert meta["lockedMessage"] is None


def test_edit_executing_bli_meta_locked_message_at_pre_award(auth_client, executing_bli, make_pre_award, app_ctx):
    """Once Pre-Award is fully approved the BLI is not editable and a lockedMessage explains why."""
    make_pre_award(executing_bli.agreement_id, state="locked")

    response = auth_client.get(url_for("api.budget-line-items-item", id=executing_bli.id))

    assert response.status_code == 200
    meta = response.json["_meta"]
    assert meta["isEditable"] is False
    assert meta["isDeletable"] is False
    assert meta["lockedMessage"] is not None
    assert "after Pre-Award Approval has been completed" in meta["lockedMessage"]


def test_edit_executing_bli_meta_locked_message_when_pre_award_in_review(
    auth_client, executing_bli, make_pre_award, app_ctx
):
    """While Pre-Award Approval is in review the BLI is not editable and the _meta lockedMessage
    reports the in-review reason — a distinct branch of get_bli_locked_message from the fully-locked
    message above."""
    make_pre_award(executing_bli.agreement_id, state="in_review")

    response = auth_client.get(url_for("api.budget-line-items-item", id=executing_bli.id))

    assert response.status_code == 200
    meta = response.json["_meta"]
    assert meta["isEditable"] is False
    assert meta["isDeletable"] is False
    assert meta["lockedMessage"] == "This budget line can't be edited while Pre-Award Approval is in review."


def test_edit_executing_bli_meta_editable_during_pre_award_step_not_in_review(
    auth_client, executing_bli, make_pre_award, app_ctx
):
    """OPS-2280 (meta side): a bare PRE_AWARD step with no approval requested does NOT lock the pen —
    guards against the meta over-blocking, mirroring the write-path 'present' test above."""
    make_pre_award(executing_bli.agreement_id, state="present")

    response = auth_client.get(url_for("api.budget-line-items-item", id=executing_bli.id))

    assert response.status_code == 200
    meta = response.json["_meta"]
    assert meta["isEditable"] is True
    assert meta["isDeletable"] is True
    assert meta["lockedMessage"] is None


def test_edit_executing_bli_unauthorized_user(basic_user_auth_client, executing_bli, app_ctx):
    """A user not associated with the agreement cannot edit the executing BLI."""
    data = _full_put_payload(executing_bli, line_description="nope")
    response = basic_user_auth_client.put(url_for("api.budget-line-items-item", id=executing_bli.id), json=data)

    assert response.status_code == 403


# ---=== OPS-6195: capability ON — executing budget edits apply directly until Pre-Award ===---


@pytest.mark.parametrize("pre_award_state", [None, "present", "declined"])
def test_edit_executing_bli_budget_field_applies_directly_when_flag_on(
    pre_award_state, skip_cr_enabled, auth_client, executing_bli, make_pre_award, app_ctx
):
    """With the capability ON, a budget-field edit on an executing BLI applies directly (200, no CR)
    when there is no Pre-Award request, when the PRE_AWARD step has not been requested, and after the
    DD declines the Pre-Award request."""
    if pre_award_state:
        make_pre_award(executing_bli.agreement_id, state=pre_award_state)

    data = _full_put_payload(executing_bli, amount=200.50)
    response = auth_client.put(url_for("api.budget-line-items-item", id=executing_bli.id), json=data)

    assert response.status_code == 200, response.json
    assert response.json["amount"] == 200.50
    assert response.json["in_review"] is False
    assert response.json["change_requests_in_review"] is None


@pytest.mark.parametrize(
    "pre_award_state,expected_message",
    [
        ("in_review", "Pre-Award Approval is in review"),
        ("locked", "after Pre-Award Approval has been completed"),
    ],
)
def test_edit_executing_bli_budget_field_blocked_by_pre_award_when_flag_on(
    pre_award_state, expected_message, skip_cr_enabled, auth_client, executing_bli, make_pre_award, app_ctx
):
    """The direct-edit path must not bypass the pre-award locks: while Pre-Award is in review, and
    once the DD has approved it, a budget-field edit on an executing BLI is rejected (400)."""
    make_pre_award(executing_bli.agreement_id, state=pre_award_state)

    data = _full_put_payload(executing_bli, amount=200.50)
    response = auth_client.put(url_for("api.budget-line-items-item", id=executing_bli.id), json=data)

    assert response.status_code == 400
    assert expected_message in str(response.json)


def test_planned_to_executing_still_routes_to_change_request_when_flag_on(
    skip_cr_enabled, auth_client, executing_bli, app_ctx, loaded_db
):
    """Starting procurement (Planned → Executing) still requires approval with the capability ON."""
    executing_bli.status = BudgetLineItemStatus.PLANNED
    loaded_db.commit()

    data = _full_put_payload(executing_bli, status="IN_EXECUTION")
    response = auth_client.put(url_for("api.budget-line-items-item", id=executing_bli.id), json=data)

    assert response.status_code == 202, response.json
    assert response.json["status"] == "PLANNED"
    assert response.json["in_review"] is True


@pytest.mark.parametrize("pre_award_state", ["in_review", "locked"])
def test_budget_team_executing_budget_edit_routes_to_change_request_during_pre_award_lock_when_flag_on(
    pre_award_state, skip_cr_enabled, budget_team_auth_client, executing_bli, make_pre_award, app_ctx
):
    """Budget Team is exempt from the pre-award locks, but only because their financial edits still
    go to the DD as a change request. The capability must not turn that into a direct write."""
    make_pre_award(executing_bli.agreement_id, state=pre_award_state)

    data = _full_put_payload(executing_bli, amount=200.50)
    response = budget_team_auth_client.put(url_for("api.budget-line-items-item", id=executing_bli.id), json=data)

    assert response.status_code == 202, response.json
    assert response.json["amount"] == 100.12
    assert response.json["in_review"] is True


def test_budget_team_draft_to_planned_routes_to_change_request_during_pre_award_lock_when_flag_on(
    skip_cr_enabled, budget_team_auth_client, executing_bli, make_pre_award, loaded_db, app_ctx
):
    """The Draft→Planned direct path must not bypass DD review for Budget Team during a lock either."""
    executing_bli.status = BudgetLineItemStatus.DRAFT
    loaded_db.commit()
    make_pre_award(executing_bli.agreement_id, state="in_review")

    data = _full_put_payload(executing_bli, status="PLANNED")
    response = budget_team_auth_client.put(url_for("api.budget-line-items-item", id=executing_bli.id), json=data)

    assert response.status_code == 202, response.json
    assert response.json["status"] == "DRAFT"
    assert response.json["in_review"] is True
