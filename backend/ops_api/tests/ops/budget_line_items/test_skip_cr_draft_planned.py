"""Tests for the SKIP_CR_FOR_DRAFT_PLANNED capability.

When the flag is ON, two specific budget-line changes apply immediately instead of
creating a Change Request:
  1. Draft → Planned status change.
  2. In-Planned budget-detail edits (amount / can_id / date_needed) on a line that
     is and stays PLANNED.

When OFF, both route through the change-request workflow exactly as today.

Fixture discipline (critical): the routing decision has superuser and budget-team
bypass clauses. Flag behavior is exercised as ``basic_user_auth_client`` (id 521,
BASIC_USER) — a user with no bypass — so the flag is the only thing that changes
routing. Bypass regressions use budget-team / division-director / superuser clients.
"""

import datetime

import pytest
from flask import url_for

from models import (
    Agreement,
    BudgetLineItemChangeRequest,
    BudgetLineItemStatus,
    ContractBudgetLineItem,
    User,
)


def _delete_bli_and_crs(loaded_db, bli):
    """Delete any change requests created for a BLI, then the BLI itself."""
    crs = (
        loaded_db.query(BudgetLineItemChangeRequest)
        .filter(BudgetLineItemChangeRequest.budget_line_item_id == bli.id)
        .all()
    )
    for cr in crs:
        loaded_db.delete(cr)
    loaded_db.delete(bli)
    loaded_db.commit()


@pytest.fixture()
def skip_cr_enabled(app):
    """Turn the capability ON for the duration of a test."""
    original = app.config.get("SKIP_CR_FOR_DRAFT_PLANNED", False)
    app.config["SKIP_CR_FOR_DRAFT_PLANNED"] = True
    yield
    app.config["SKIP_CR_FOR_DRAFT_PLANNED"] = original


@pytest.fixture()
def skip_cr_disabled(app):
    """Turn the capability OFF for the duration of a test (regression baseline)."""
    original = app.config.get("SKIP_CR_FOR_DRAFT_PLANNED", False)
    app.config["SKIP_CR_FOR_DRAFT_PLANNED"] = False
    yield
    app.config["SKIP_CR_FOR_DRAFT_PLANNED"] = original


@pytest.fixture()
def basic_user_on_agreement(loaded_db):
    """Associate basic user 521 with contract agreement 1 so association checks pass,
    without granting a bypass (521 is a plain VIEWER_EDITOR)."""
    agreement = loaded_db.get(Agreement, 1)
    basic_user = loaded_db.get(User, 521)
    agreement.team_members.append(basic_user)
    loaded_db.commit()
    yield agreement
    if basic_user in agreement.team_members:
        agreement.team_members.remove(basic_user)
    loaded_db.commit()


def _make_bli(loaded_db, status, test_can, **overrides):
    """Create a ContractBudgetLineItem on agreement 1 (SC 1 PoP window 2043-2044)."""
    kwargs = dict(
        line_description="Skip-CR test BLI",
        agreement_id=1,
        can_id=test_can.id,
        amount=100.00,
        status=status,
        date_needed=datetime.date(2043, 9, 1),
        services_component_id=1,
    )
    kwargs.update(overrides)
    bli = ContractBudgetLineItem(**kwargs)
    loaded_db.add(bli)
    loaded_db.commit()
    return bli


# ---=== Flag ON: applies immediately ===---


def test_draft_to_planned_applies_immediately_when_flag_on(
    skip_cr_enabled, basic_user_auth_client, basic_user_on_agreement, loaded_db, test_can, app_ctx
):
    """Completing a Draft BLI → Planned applies directly: new status, no CR, 200."""
    bli = _make_bli(loaded_db, BudgetLineItemStatus.DRAFT, test_can)
    try:
        response = basic_user_auth_client.patch(
            url_for("api.budget-line-items-item", id=bli.id),
            json={"status": "PLANNED"},
        )
        assert response.status_code == 200, response.json
        loaded_db.refresh(bli)
        assert bli.status == BudgetLineItemStatus.PLANNED
        assert bli.change_requests_in_review is None
        assert bli.in_review is False
    finally:
        loaded_db.delete(bli)
        loaded_db.commit()


def test_draft_to_planned_does_not_null_financials(
    skip_cr_enabled, basic_user_auth_client, basic_user_on_agreement, loaded_db, test_can, app_ctx
):
    """Defect A guard: a status-only Draft→Planned PATCH (body = {status}) must leave
    amount / can_id / date_needed UNCHANGED after the direct apply."""
    original_date = datetime.date(2043, 9, 1)
    bli = _make_bli(loaded_db, BudgetLineItemStatus.DRAFT, test_can, amount=4321.00, date_needed=original_date)
    try:
        response = basic_user_auth_client.patch(
            url_for("api.budget-line-items-item", id=bli.id),
            json={"status": "PLANNED"},
        )
        assert response.status_code == 200, response.json
        loaded_db.refresh(bli)
        assert bli.status == BudgetLineItemStatus.PLANNED
        assert float(bli.amount) == 4321.00, "amount must not be nulled on status-only transition"
        assert bli.can_id == test_can.id, "can_id must not be nulled on status-only transition"
        assert bli.date_needed == original_date, "date_needed must not be nulled on status-only transition"
    finally:
        loaded_db.delete(bli)
        loaded_db.commit()


@pytest.mark.parametrize("field,value", [("amount", 999.99), ("date_needed", "2043-10-15")])
def test_in_planned_budget_edit_applies_immediately_when_flag_on(
    field, value, skip_cr_enabled, basic_user_auth_client, basic_user_on_agreement, loaded_db, test_can, app_ctx
):
    """An in-Planned budget-detail edit applies directly, no CR, 200."""
    bli = _make_bli(loaded_db, BudgetLineItemStatus.PLANNED, test_can)
    try:
        response = basic_user_auth_client.patch(
            url_for("api.budget-line-items-item", id=bli.id),
            json={field: value},
        )
        assert response.status_code == 200, response.json
        loaded_db.refresh(bli)
        assert bli.change_requests_in_review is None
        assert bli.in_review is False
    finally:
        loaded_db.delete(bli)
        loaded_db.commit()


def test_in_planned_can_edit_applies_immediately_when_flag_on(
    skip_cr_enabled, basic_user_auth_client, basic_user_on_agreement, loaded_db, test_cans, app_ctx
):
    """Changing can_id on a Planned line applies directly under the flag."""
    bli = _make_bli(loaded_db, BudgetLineItemStatus.PLANNED, test_cans[0])
    try:
        response = basic_user_auth_client.patch(
            url_for("api.budget-line-items-item", id=bli.id),
            json={"can_id": test_cans[1].id},
        )
        assert response.status_code == 200, response.json
        loaded_db.refresh(bli)
        assert bli.can_id == test_cans[1].id
        assert bli.change_requests_in_review is None
    finally:
        loaded_db.delete(bli)
        loaded_db.commit()


def test_in_planned_amount_edit_leaves_other_budget_fields_untouched(
    skip_cr_enabled, basic_user_auth_client, basic_user_on_agreement, loaded_db, test_can, app_ctx
):
    """Editing only `amount` on a Planned line must not null the other budget fields
    (can_id / date_needed) — the write set is restricted to what was actually sent."""
    original_date = datetime.date(2043, 9, 1)
    bli = _make_bli(loaded_db, BudgetLineItemStatus.PLANNED, test_can, amount=100.00, date_needed=original_date)
    try:
        response = basic_user_auth_client.patch(
            url_for("api.budget-line-items-item", id=bli.id),
            json={"amount": 250.00},
        )
        assert response.status_code == 200, response.json
        loaded_db.refresh(bli)
        assert float(bli.amount) == 250.00
        assert bli.can_id == test_can.id, "can_id must not be nulled by an amount-only edit"
        assert bli.date_needed == original_date, "date_needed must not be nulled by an amount-only edit"
        assert bli.change_requests_in_review is None
    finally:
        loaded_db.delete(bli)
        loaded_db.commit()


def test_in_planned_combined_budget_and_line_description_both_apply_when_flag_on(
    skip_cr_enabled, basic_user_auth_client, basic_user_on_agreement, loaded_db, test_can, app_ctx
):
    """A save combining a budget field (amount) with an always-direct field
    (line_description) must apply BOTH directly — not silently drop line_description.
    Mirrors the flag-OFF behavior where line_description applies directly alongside the CR."""
    bli = _make_bli(loaded_db, BudgetLineItemStatus.PLANNED, test_can, amount=100.00, line_description="Original")
    try:
        response = basic_user_auth_client.patch(
            url_for("api.budget-line-items-item", id=bli.id),
            json={"amount": 300.00, "line_description": "Updated"},
        )
        assert response.status_code == 200, response.json
        loaded_db.refresh(bli)
        assert float(bli.amount) == 300.00, "amount should apply directly"
        assert bli.line_description == "Updated", "line_description must not be dropped"
        assert bli.change_requests_in_review is None
    finally:
        loaded_db.delete(bli)
        loaded_db.commit()


# ---=== Flag OFF: regression — still creates a CR ===---


def test_draft_to_planned_creates_cr_when_flag_off(
    skip_cr_disabled, basic_user_auth_client, basic_user_on_agreement, loaded_db, test_can, app_ctx
):
    bli = _make_bli(loaded_db, BudgetLineItemStatus.DRAFT, test_can)
    try:
        response = basic_user_auth_client.patch(
            url_for("api.budget-line-items-item", id=bli.id),
            json={"status": "PLANNED"},
        )
        assert response.status_code == 202, response.json
        loaded_db.refresh(bli)
        assert bli.status == BudgetLineItemStatus.DRAFT, "status change must NOT apply while pending review"
        assert bli.in_review is True
    finally:
        _delete_bli_and_crs(loaded_db, bli)


def test_in_planned_budget_edit_creates_cr_when_flag_off(
    skip_cr_disabled, basic_user_auth_client, basic_user_on_agreement, loaded_db, test_can, app_ctx
):
    bli = _make_bli(loaded_db, BudgetLineItemStatus.PLANNED, test_can)
    try:
        response = basic_user_auth_client.patch(
            url_for("api.budget-line-items-item", id=bli.id),
            json={"amount": 999.99},
        )
        assert response.status_code == 202, response.json
        loaded_db.refresh(bli)
        assert bli.in_review is True
    finally:
        _delete_bli_and_crs(loaded_db, bli)


# ---=== Scope guardrails ===---


def test_planned_to_executing_still_creates_cr_when_flag_on(
    skip_cr_enabled, basic_user_auth_client, basic_user_on_agreement, loaded_db, test_can, app_ctx
):
    """Only Draft→Planned is affected. Planned→Executing must still route for review
    even with the flag ON — proves the scope isn't broader than intended."""
    bli = _make_bli(loaded_db, BudgetLineItemStatus.PLANNED, test_can)
    try:
        response = basic_user_auth_client.patch(
            url_for("api.budget-line-items-item", id=bli.id),
            json={"status": "IN_EXECUTION"},
        )
        assert response.status_code == 202, response.json
        loaded_db.refresh(bli)
        assert bli.status == BudgetLineItemStatus.PLANNED, "status must NOT apply while pending review"
        assert bli.in_review is True
    finally:
        _delete_bli_and_crs(loaded_db, bli)


def test_in_planned_out_of_scope_field_not_newly_persisted_when_flag_on(
    skip_cr_enabled, basic_user_auth_client, basic_user_on_agreement, loaded_db, test_can, app_ctx
):
    """Defect B guard: editing an out-of-scope field (proc_shop_fee_percentage) on a
    Planned line must not be newly persisted via the flag.

    proc_shop_fee_percentage is neither a budget field (amount / can_id / date_needed) nor
    an always-direct field (services_component_id / grant_number_id / line_description /
    comments / clin_id), so it matches neither the flag's in-Planned path nor the CR path's
    direct-edit whitelist — behavior matches flag-OFF today (silently dropped). NOTE: do not
    use `comments` here, which IS an always-direct field and so applies directly regardless
    of the flag."""
    bli = _make_bli(loaded_db, BudgetLineItemStatus.PLANNED, test_can, proc_shop_fee_percentage=5.0)
    try:
        response = basic_user_auth_client.patch(
            url_for("api.budget-line-items-item", id=bli.id),
            json={"proc_shop_fee_percentage": 10.0},
        )
        # No budget field changed and no status change → nothing routes and nothing applies.
        assert response.status_code == 200, response.json
        loaded_db.refresh(bli)
        assert float(bli.proc_shop_fee_percentage) == 5.0, "out-of-scope field must not be newly persisted by the flag"
        assert bli.change_requests_in_review is None
    finally:
        loaded_db.delete(bli)
        loaded_db.commit()


def test_incomplete_draft_to_planned_still_blocked_when_flag_on(
    skip_cr_enabled, basic_user_auth_client, basic_user_on_agreement, loaded_db, test_can, app_ctx
):
    """Validation runs before the routing decision, so an incomplete Draft (no
    date_needed) is still rejected when transitioning to Planned with the flag ON."""
    bli = _make_bli(loaded_db, BudgetLineItemStatus.DRAFT, test_can, date_needed=None)
    try:
        response = basic_user_auth_client.patch(
            url_for("api.budget-line-items-item", id=bli.id),
            json={"status": "PLANNED"},
        )
        assert response.status_code == 400, response.json
        loaded_db.refresh(bli)
        assert bli.status == BudgetLineItemStatus.DRAFT
    finally:
        loaded_db.delete(bli)
        loaded_db.commit()


def test_status_and_budget_edit_combined_still_rejected_when_flag_on(
    skip_cr_enabled, basic_user_auth_client, basic_user_on_agreement, loaded_db, test_can, app_ctx
):
    """The 'status change cannot be combined with other edits' rule runs before the
    routing decision, so it is preserved with the flag ON."""
    bli = _make_bli(loaded_db, BudgetLineItemStatus.DRAFT, test_can)
    try:
        response = basic_user_auth_client.patch(
            url_for("api.budget-line-items-item", id=bli.id),
            json={"status": "PLANNED", "amount": 555.55},
        )
        assert response.status_code == 400, response.json
    finally:
        loaded_db.delete(bli)
        loaded_db.commit()


# ---=== Defect C: edit-bundle shares the same routing seam ===---


def test_edit_bundle_in_planned_edit_applies_immediately_when_flag_on(
    skip_cr_enabled, basic_user_auth_client, basic_user_on_agreement, loaded_db, test_can, app_ctx
):
    """An in-Planned budget edit submitted through the atomic edit-bundle endpoint routes
    through the SAME update_with_change_request_ids seam (commit=False). With the flag ON it
    must apply directly inside the bundle transaction — no CR, no financial-field wipe."""
    bli = _make_bli(loaded_db, BudgetLineItemStatus.PLANNED, test_can, amount=100.00)
    original_date = bli.date_needed
    try:
        response = basic_user_auth_client.patch(
            url_for("api.agreements-edit-bundle", id=1),
            json={"budget_line_items": {"update": [{"id": bli.id, "amount": 456.00}]}},
        )
        assert response.status_code == 200, response.json
        assert not response.json.get("change_request_ids"), "no CR should be created under the flag"
        loaded_db.refresh(bli)
        assert float(bli.amount) == 456.00
        assert bli.can_id == test_can.id, "can_id must not be wiped inside the bundle transaction"
        assert bli.date_needed == original_date, "date_needed must not be wiped inside the bundle transaction"
        assert bli.in_review is False
    finally:
        loaded_db.delete(bli)
        loaded_db.commit()


# ---=== Bypass regression: identical behavior flag ON and OFF ===---


@pytest.mark.parametrize("flag_value", [True, False])
def test_budget_team_bypass_unchanged_by_flag(flag_value, app, budget_team_auth_client, loaded_db, test_can, app_ctx):
    """Budget-team direct-edit bypass on a DRAFT line behaves identically flag ON/OFF."""
    original = app.config.get("SKIP_CR_FOR_DRAFT_PLANNED", False)
    app.config["SKIP_CR_FOR_DRAFT_PLANNED"] = flag_value
    bli = _make_bli(loaded_db, BudgetLineItemStatus.DRAFT, test_can)
    try:
        response = budget_team_auth_client.patch(
            url_for("api.budget-line-items-item", id=bli.id),
            json={"amount": 777.77},
        )
        assert response.status_code == 200, response.json
        loaded_db.refresh(bli)
        assert float(bli.amount) == 777.77
        assert bli.change_requests_in_review is None
    finally:
        app.config["SKIP_CR_FOR_DRAFT_PLANNED"] = original
        loaded_db.delete(bli)
        loaded_db.commit()
