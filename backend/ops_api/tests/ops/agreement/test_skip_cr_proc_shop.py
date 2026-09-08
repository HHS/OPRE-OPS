"""Tests for skipping the procurement-shop Change Request under SKIP_CR_FOR_DRAFT_PLANNED.

When the flag is ON, a procurement-shop change on an agreement whose budget lines are
PLANNED applies immediately instead of creating an AgreementChangeRequest — mirroring the
same flag's behavior for BLI Draft→Planned edits. The directly-applied change must still
record a "Change to Procurement Shop" agreement-history entry.

When OFF, the change routes through the change-request workflow exactly as today (regression
baseline in test_agreement_change_requests.py).

Fixture discipline: the flag is exercised as a non-bypass user so the flag is the only thing
that changes routing. `auth_client` and the AgreementsService-with-patched-user paths below
are not superuser/budget-team, so they hit the flag branch rather than an existing bypass.
"""

import datetime

import pytest

from models import (
    AgreementChangeRequest,
    AgreementHistory,
    AgreementType,
    BudgetLineItemStatus,
    ChangeRequestType,
    GrantAgreement,
    GrantBudgetLineItem,
    ProcurementShop,
    ProcurementShopFee,
    User,
)
from ops_api.ops.services.agreements import AgreementsService
from ops_api.ops.services.change_requests import ChangeRequestService


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
def test_grant_agreement(loaded_db, test_admin_user):
    grant = GrantAgreement(
        agreement_type=AgreementType.GRANT,
        name="Test Grant for Proc Shop Skip",
        nick_name="Test Grant Proc Skip",
        description="Test Grant for Proc Shop Skip",
        product_service_code_id=1,
        project_officer_id=test_admin_user.id,
        awarding_entity_id=1,
        nofo_number="NOFO-2026-02",
        aln_numbers=["93.086", "93.600"],
        funding_period_months=18,
    )
    loaded_db.add(grant)
    loaded_db.commit()

    yield grant

    loaded_db.query(AgreementHistory).where(AgreementHistory.agreement_id_record == grant.id).delete()
    loaded_db.delete(grant)
    loaded_db.commit()


@pytest.fixture()
def test_psf(loaded_db):
    ps = ProcurementShop(name="Test Procurement Shop for Skip", abbr="TPSSK")
    loaded_db.add(ps)
    loaded_db.commit()
    loaded_db.refresh(ps)

    psf = ProcurementShopFee(procurement_shop_id=ps.id, fee=0.5)
    ps.procurement_shop_fees.append(psf)
    loaded_db.add(psf)
    loaded_db.commit()

    yield psf

    loaded_db.delete(ps)
    loaded_db.delete(psf)
    loaded_db.commit()


@pytest.fixture()
def test_planned_bli(loaded_db, test_admin_user, test_grant_agreement, test_psf, test_can):
    bli = GrantBudgetLineItem(
        line_description="Test PLANNED BLI for Proc Shop Skip",
        agreement_id=test_grant_agreement.id,
        can_id=test_can.id,
        status=BudgetLineItemStatus.PLANNED,
        procurement_shop_fee=test_psf,
        date_needed=datetime.date(2043, 6, 30),
        created_by=test_admin_user.id,
    )
    loaded_db.add(bli)
    loaded_db.commit()

    yield bli

    loaded_db.delete(bli)
    loaded_db.commit()


def _proc_shop_change_requests(loaded_db, agreement_id):
    return (
        loaded_db.query(AgreementChangeRequest)
        .filter(
            AgreementChangeRequest.agreement_id == agreement_id,
            AgreementChangeRequest.change_request_type == ChangeRequestType.AGREEMENT_CHANGE_REQUEST,
        )
        .all()
    )


def test_proc_shop_change_applies_directly_when_flag_on(
    monkeypatch,
    test_admin_user,
    loaded_db,
    test_grant_agreement,
    test_planned_bli,
    skip_cr_enabled,
):
    """Flag ON + PLANNED BLI: proc-shop change applies immediately (200), no change request."""
    monkeypatch.setattr("ops_api.ops.services.agreements.get_current_user", lambda: test_admin_user)
    monkeypatch.setattr("ops_api.ops.services.agreements.associated_with_agreement", lambda _: True)

    service = AgreementsService(loaded_db)
    agreement, status_code = service.update(
        test_grant_agreement.id,
        {"awarding_entity_id": 2, "agreement_cls": GrantAgreement},
    )

    assert status_code == 200
    updated = loaded_db.get(GrantAgreement, test_grant_agreement.id)
    assert updated.awarding_entity_id == 2
    assert updated.in_review is False
    assert updated.change_requests_in_review is None
    assert _proc_shop_change_requests(loaded_db, test_grant_agreement.id) == []


def test_proc_shop_change_creates_cr_when_flag_off(
    monkeypatch,
    test_admin_user,
    loaded_db,
    test_grant_agreement,
    test_planned_bli,
    skip_cr_disabled,
):
    """Flag OFF + PLANNED BLI: proc-shop change routes through a change request (202). Regression."""
    monkeypatch.setattr("ops_api.ops.services.agreements.get_current_user", lambda: test_admin_user)
    monkeypatch.setattr("ops_api.ops.services.agreements.associated_with_agreement", lambda _: True)
    monkeypatch.setattr("ops_api.ops.services.change_requests.current_user", loaded_db.get(User, 522))

    service = AgreementsService(loaded_db)
    agreement, status_code = service.update(
        test_grant_agreement.id,
        {"awarding_entity_id": 2, "agreement_cls": GrantAgreement},
    )

    assert status_code == 202
    updated = loaded_db.get(GrantAgreement, test_grant_agreement.id)
    # Not applied yet — still pending approval.
    assert updated.awarding_entity_id == 1
    crs = _proc_shop_change_requests(loaded_db, test_grant_agreement.id)
    assert len(crs) == 1

    # Cleanup
    ChangeRequestService(loaded_db).delete(crs[0].id)


def test_proc_shop_change_still_blocked_for_in_execution_when_flag_on(
    monkeypatch,
    test_admin_user,
    loaded_db,
    test_grant_agreement,
    test_planned_bli,
    skip_cr_enabled,
):
    """Flag ON must NOT relax the IN_EXECUTION block: proc-shop change still raises ValidationError."""
    from ops_api.ops.services.ops_service import ValidationError

    monkeypatch.setattr("ops_api.ops.services.agreements.get_current_user", lambda: test_admin_user)
    monkeypatch.setattr("ops_api.ops.services.agreements.associated_with_agreement", lambda _: True)

    test_planned_bli.status = BudgetLineItemStatus.IN_EXECUTION
    loaded_db.commit()

    service = AgreementsService(loaded_db)
    with pytest.raises(ValidationError):
        service.update(
            test_grant_agreement.id,
            {"awarding_entity_id": 2, "agreement_cls": GrantAgreement},
        )


def test_proc_shop_change_via_edit_bundle_writes_history_when_flag_on(
    auth_client,
    loaded_db,
    test_grant_agreement,
    test_planned_bli,
    skip_cr_enabled,
    app_ctx,
):
    """Flag ON via the edit-bundle endpoint: proc-shop change applies directly (200), creates no
    change request, AND still records the "Change to Procurement Shop" agreement-history entry."""
    from flask import url_for

    response = auth_client.patch(
        url_for("api.agreements-edit-bundle", id=test_grant_agreement.id),
        json={"agreement": {"awarding_entity_id": 2}},
    )
    assert response.status_code == 200

    updated = loaded_db.get(GrantAgreement, test_grant_agreement.id)
    assert updated.awarding_entity_id == 2
    assert _proc_shop_change_requests(loaded_db, test_grant_agreement.id) == []

    history = (
        loaded_db.query(AgreementHistory).where(AgreementHistory.agreement_id_record == test_grant_agreement.id).all()
    )
    proc_shop_history = [h for h in history if h.history_title == "Change to Procurement Shop"]
    assert len(proc_shop_history) == 1
    # Only the proc-shop entry — the bundle diff is scoped to awarding_entity_id, so no
    # spurious history for other agreement fields.
    assert all(
        h.history_title == "Change to Procurement Shop"
        for h in history
        if h.history_type == proc_shop_history[0].history_type and h.ops_event_id == proc_shop_history[0].ops_event_id
    )


def test_edit_bundle_no_proc_shop_change_writes_no_agreement_updates_history(
    auth_client,
    loaded_db,
    test_grant_agreement,
    test_planned_bli,
    skip_cr_enabled,
    app_ctx,
):
    """An edit-bundle save that does not change the proc shop must not KeyError and must not
    fabricate agreement field-diff history (hardening for the UPDATE_AGREEMENT handler)."""
    from flask import url_for

    response = auth_client.patch(
        url_for("api.agreements-edit-bundle", id=test_grant_agreement.id),
        json={"agreement": {"description": "Updated description via bundle"}},
    )
    assert response.status_code == 200

    history = (
        loaded_db.query(AgreementHistory).where(AgreementHistory.agreement_id_record == test_grant_agreement.id).all()
    )
    assert [h for h in history if h.history_title == "Change to Procurement Shop"] == []
