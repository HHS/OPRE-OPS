"""Integration tests for editing IN_EXECUTION Budget Line Items (issue #5819).

Executing BLIs are now editable like PLANNED ones:
  - budget-field edits (amount/can_id/date_needed) route through a change request (202),
  - non-budget edits (line_description/services_component_id/comments) apply directly (200),
  - edits are blocked once the agreement reaches Pre-Award (procurement tracker step >= 5),
  - an already in-review BLI stays non-editable.

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
    ProcurementTrackerStatus,
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
def make_tracker_at_step(loaded_db):
    """Factory that attaches an ACTIVE procurement tracker at a given step to an agreement.

    ProcurementTracker is a versioned model (sqlalchemy-continuum); ORM-deleting it in teardown
    races the version bookkeeping, so we clean up with raw SQL (mirroring the pattern in
    test_validate_procurement_tracker_steps.py)."""
    created_ids = []

    def _make(agreement_id, step_number):
        # DefaultProcurementTracker (not the now-abstract ProcurementTracker base); its
        # polymorphic identity sets tracker_type=DEFAULT automatically.
        tracker = DefaultProcurementTracker(
            agreement_id=agreement_id,
            status=ProcurementTrackerStatus.ACTIVE,
            active_step_number=step_number,
        )
        loaded_db.add(tracker)
        loaded_db.commit()
        created_ids.append(tracker.id)
        return tracker

    yield _make

    loaded_db.rollback()
    for tracker_id in created_ids:
        loaded_db.execute(text("DELETE FROM default_procurement_tracker WHERE id = :id"), {"id": tracker_id})
        loaded_db.execute(text("DELETE FROM procurement_tracker WHERE id = :id"), {"id": tracker_id})
    loaded_db.commit()


def test_edit_executing_bli_budget_field_routes_to_change_request(auth_client, executing_bli, app_ctx):
    """Changing amount on an executing BLI (steps 1-4 / no tracker) creates a CR, returns 202."""
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


def test_edit_executing_bli_blocked_at_pre_award_step_5(auth_client, executing_bli, make_tracker_at_step, app_ctx):
    """Once the agreement reaches Pre-Award (step 5), an executing BLI is no longer editable."""
    make_tracker_at_step(executing_bli.agreement_id, 5)

    data = _full_put_payload(executing_bli, line_description="Should be blocked")
    response = auth_client.put(url_for("api.budget-line-items-item", id=executing_bli.id), json=data)

    assert response.status_code == 400
    # Assert the 400 is the editability lock (not an unrelated validation failure).
    assert "not in an editable state" in str(response.json)


def test_edit_executing_bli_blocked_at_award_step_6(auth_client, executing_bli, make_tracker_at_step, app_ctx):
    """Award (step 6) also blocks editing."""
    make_tracker_at_step(executing_bli.agreement_id, 6)

    data = _full_put_payload(executing_bli, comments="Should be blocked")
    response = auth_client.put(url_for("api.budget-line-items-item", id=executing_bli.id), json=data)

    assert response.status_code == 400
    assert "not in an editable state" in str(response.json)


def test_edit_executing_bli_editable_at_step_4(auth_client, executing_bli, make_tracker_at_step, app_ctx):
    """Step 4 (Evaluation) is the highest still-editable step; verify the editable side of the
    boundary against a real ProcurementTracker row (not just the in-memory helper unit tests)."""
    make_tracker_at_step(executing_bli.agreement_id, 4)

    data = _full_put_payload(executing_bli, line_description="Edited at step 4")
    response = auth_client.put(url_for("api.budget-line-items-item", id=executing_bli.id), json=data)

    assert response.status_code == 200
    assert response.json["line_description"] == "Edited at step 4"


def test_executing_bli_list_meta_at_pre_award(auth_client, executing_bli, make_tracker_at_step, app_ctx):
    """The list endpoint's _meta builder is a separate code path from the single-item GET; verify it
    surfaces isEditable/isDeletable/lockedMessage for an executing BLI blocked at Pre-Award."""
    make_tracker_at_step(executing_bli.agreement_id, 5)

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


def test_edit_executing_bli_meta_locked_message_at_pre_award(auth_client, executing_bli, make_tracker_at_step, app_ctx):
    """At Pre-Award the BLI is not editable and a lockedMessage explains why."""
    make_tracker_at_step(executing_bli.agreement_id, 5)

    response = auth_client.get(url_for("api.budget-line-items-item", id=executing_bli.id))

    assert response.status_code == 200
    meta = response.json["_meta"]
    assert meta["isEditable"] is False
    assert meta["isDeletable"] is False
    assert meta["lockedMessage"] is not None
    assert "Pre-Award" in meta["lockedMessage"]


def test_edit_executing_bli_unauthorized_user(basic_user_auth_client, executing_bli, app_ctx):
    """A user not associated with the agreement cannot edit the executing BLI."""
    data = _full_put_payload(executing_bli, line_description="nope")
    response = basic_user_auth_client.put(url_for("api.budget-line-items-item", id=executing_bli.id), json=data)

    assert response.status_code == 403
