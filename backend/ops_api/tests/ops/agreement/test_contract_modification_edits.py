"""Integration tests for "Edits That Require a Contract Modification" (OPS-3072, AC9/AC10).

When a Division Director approves a money/time change request on an Awarded agreement, the
edit is applied in OPS as usual and also recorded as a ``ContractModificationEdit``. It stays
on the Award & Modifications tab list (GET /agreements/<id>/contract-modification-edits/) until
the user's contract modification is approved (see test_contract_modification_requests.py).

``basic_user_auth_client`` (user 521) is a team member on the test agreements and submits the
edits; ``division_director_auth_client`` (user 522) directs division 5, which manages
``test_can`` (CAN 500), and approves them.
"""

import datetime
from types import SimpleNamespace

import pytest
from flask import url_for
from sqlalchemy import inspect, select, text

from models import (
    AgreementHistory,
    AgreementHistoryType,
    AgreementMod,
    AgreementReason,
    AgreementType,
    AwardType,
    BudgetLineItemChangeRequest,
    BudgetLineItemStatus,
    ChangeRequestStatus,
    ContractAgreement,
    ContractBudgetLineItem,
    ContractModificationEdit,
    ContractType,
    GrantAgreement,
    ModificationEditType,
    OpsEvent,
    ProcurementAction,
    ProcurementActionStatus,
    ServicesComponent,
    User,
)
from ops_api.ops.services.contract_modification_edits import ContractModificationEditService
from ops_api.ops.services.ops_service import ValidationError

SYSTEM_OWNER_USER_ID = 503
BASIC_USER_ID = 521
DIVISION_DIRECTOR_USER_ID = 522


@pytest.fixture()
def modified_loe_enabled(app):
    original = app.config.get("ENABLE_MODIFIED_LOE_EDITS", False)
    app.config["ENABLE_MODIFIED_LOE_EDITS"] = True
    yield
    app.config["ENABLE_MODIFIED_LOE_EDITS"] = original


@pytest.fixture()
def modified_loe_disabled(app):
    original = app.config.get("ENABLE_MODIFIED_LOE_EDITS", False)
    app.config["ENABLE_MODIFIED_LOE_EDITS"] = False
    yield
    app.config["ENABLE_MODIFIED_LOE_EDITS"] = original


def _award(loaded_db, agreement):
    loaded_db.add(
        ProcurementAction(
            agreement_id=agreement.id,
            status=ProcurementActionStatus.AWARDED,
            award_type=AwardType.NEW_AWARD,
        )
    )
    loaded_db.commit()
    loaded_db.refresh(agreement)


@pytest.fixture()
def make_agreement(loaded_db, test_project):
    """Factory for a Contract agreement (optionally Awarded) with one BLI on ``test_can``.

    Cleans up everything the tests can create: edits, mods, change requests, BLIs, SCs.
    """
    created = []

    def _make(test_can, *, awarded=True, status=BudgetLineItemStatus.PLANNED):
        suffix = f"{len(created)}{datetime.datetime.now().strftime('%H%M%S%f')}"
        agreement = ContractAgreement(
            name=f"Contract Mod Edit Test Agreement {suffix}",
            contract_number=f"CTCME{suffix}",
            contract_type=ContractType.FIRM_FIXED_PRICE,
            agreement_type=AgreementType.CONTRACT,
            project_id=test_project.id,
            product_service_code_id=2,
            description="Agreement for the OPS-3072 contract-modification-edit tests",
            agreement_reason=AgreementReason.NEW_REQ,
            project_officer_id=SYSTEM_OWNER_USER_ID,
            awarding_entity_id=1,
        )
        loaded_db.add(agreement)
        loaded_db.flush()
        agreement.team_members.append(loaded_db.get(User, BASIC_USER_ID))
        loaded_db.commit()
        if awarded:
            _award(loaded_db, agreement)

        sc = ServicesComponent(agreement_id=agreement.id, number=1, optional=False)
        loaded_db.add(sc)
        loaded_db.commit()

        bli = ContractBudgetLineItem(
            agreement_id=agreement.id,
            line_description="Contract mod edit test BLI",
            amount=600000.00,
            can_id=test_can.id,
            date_needed=datetime.date(2043, 1, 1),
            status=status,
            proc_shop_fee_percentage=0,
            created_by=SYSTEM_OWNER_USER_ID,
            services_component_id=sc.id,
        )
        loaded_db.add(bli)
        loaded_db.commit()
        created.append((agreement.id, sc.id))
        return agreement, bli

    yield _make

    loaded_db.rollback()
    for agreement_id, _ in created:
        params = {"id": agreement_id}
        loaded_db.execute(text("DELETE FROM contract_modification_request WHERE agreement_id = :id"), params)
        loaded_db.execute(text("DELETE FROM contract_modification_edit WHERE agreement_id = :id"), params)
        loaded_db.execute(text("DELETE FROM agreement_mod WHERE agreement_id = :id"), params)
        loaded_db.execute(text("DELETE FROM change_request WHERE agreement_id = :id"), params)
        loaded_db.execute(text("DELETE FROM procurement_action WHERE agreement_id = :id"), params)
        loaded_db.commit()
        for bli in loaded_db.query(ContractBudgetLineItem).filter_by(agreement_id=agreement_id).all():
            loaded_db.delete(bli)
        loaded_db.commit()
        # Every SC on the agreement, including any a test added after the first one.
        for sc in loaded_db.query(ServicesComponent).filter_by(agreement_id=agreement_id).all():
            loaded_db.delete(sc)
        loaded_db.commit()
        agreement = loaded_db.get(ContractAgreement, agreement_id)
        if agreement is not None:
            loaded_db.delete(agreement)
            loaded_db.commit()


def _change_requests(loaded_db, bli_id):
    return (
        loaded_db.query(BudgetLineItemChangeRequest)
        .filter(BudgetLineItemChangeRequest.budget_line_item_id == bli_id)
        .order_by(BudgetLineItemChangeRequest.id)
        .all()
    )


def _review(client, cr_id, action="APPROVE"):
    response = client.patch(url_for("api.change-requests-item", id=cr_id), json={"action": action})
    assert response.status_code == 200, response.json
    return response


def _edits(loaded_db, agreement_id):
    loaded_db.expire_all()
    return list(
        loaded_db.scalars(
            select(ContractModificationEdit)
            .where(ContractModificationEdit.agreement_id == agreement_id)
            .order_by(ContractModificationEdit.id)
        ).all()
    )


def _get_pending(client, agreement_id):
    return client.get(url_for("api.agreements-contract-modification-edits", id=agreement_id))


# ---=== requires_contract_modification snapshot (Decision 2, revised) ===---


def test_requires_contract_modification_is_snapshotted_at_creation(
    basic_user_auth_client, loaded_db, test_can, make_agreement, app_ctx
):
    """A CR submitted before the award keeps reading False after the agreement is awarded."""
    agreement, bli = make_agreement(test_can, awarded=False)

    response = basic_user_auth_client.patch(
        url_for("api.budget-line-items-item", id=bli.id), json={"amount": 500000.00}
    )
    assert response.status_code == 202, response.json
    (cr,) = _change_requests(loaded_db, bli.id)
    assert cr.requires_contract_modification is False

    _award(loaded_db, agreement)
    assert agreement.is_awarded is True

    loaded_db.expire_all()
    cr = loaded_db.get(BudgetLineItemChangeRequest, cr.id)
    assert cr.requires_contract_modification is False
    assert cr.to_dict()["requires_contract_modification"] is False

    flagged_ids = loaded_db.scalars(
        select(BudgetLineItemChangeRequest.id).where(
            BudgetLineItemChangeRequest.agreement_id == agreement.id,
            BudgetLineItemChangeRequest.requires_contract_modification,
        )
    ).all()
    assert flagged_ids == []


# ---=== Direct-apply writes the edit row immediately (OPS-3072/OPS-3268) ===---


def test_awarded_amount_edit_applies_directly_and_is_recorded(
    modified_loe_enabled,
    basic_user_auth_client,
    loaded_db,
    test_can,
    make_agreement,
    app_ctx,
):
    agreement, bli = make_agreement(test_can)

    response = basic_user_auth_client.patch(
        url_for("api.budget-line-items-item", id=bli.id), json={"amount": 500000.00}
    )
    assert response.status_code == 200, response.json
    assert _change_requests(loaded_db, bli.id) == []

    # The edit is applied in OPS immediately ...
    loaded_db.expire_all()
    assert float(loaded_db.get(ContractBudgetLineItem, bli.id).amount) == 500000.00

    # ... and tracked as requiring a contract modification, with no approver.
    (edit,) = _edits(loaded_db, agreement.id)
    assert edit.modification_type == ModificationEditType.MODIFIED_LOE
    assert edit.change_request_id is None
    assert edit.budget_line_item_id == bli.id
    assert edit.field == "amount"
    assert edit.old_value == 600000.0
    assert edit.new_value == 500000.0
    assert edit.requested_by_id == BASIC_USER_ID
    assert edit.requested_on is not None
    assert edit.approved_by_id is None
    assert edit.approved_on is None
    assert edit.agreement_mod_id is None


def test_get_pending_edits_returns_card_shape(
    modified_loe_enabled,
    basic_user_auth_client,
    loaded_db,
    test_can,
    make_agreement,
    app_ctx,
):
    agreement, bli = make_agreement(test_can)
    basic_user_auth_client.patch(url_for("api.budget-line-items-item", id=bli.id), json={"amount": 500000.00})

    response = _get_pending(basic_user_auth_client, agreement.id)
    assert response.status_code == 200, response.json
    (record,) = response.json["data"]
    basic_user = loaded_db.get(User, BASIC_USER_ID)
    assert record["modification_type"] == "MODIFIED_LOE"
    assert record["budget_line_item_id"] == bli.id
    assert record["field"] == "amount"
    assert record["old_value"] == 600000.0
    assert record["new_value"] == 500000.0
    assert record["requested_by"] == {"id": BASIC_USER_ID, "full_name": basic_user.full_name}
    assert record["requested_on"] is not None
    assert record["change_request_id"] is None
    assert record["agreement_mod_id"] is None


def test_multi_field_save_records_one_edit_per_field(
    modified_loe_enabled,
    basic_user_auth_client,
    loaded_db,
    test_can,
    test_cans,
    make_agreement,
    app_ctx,
):
    """One save changing amount + CAN + Obligate By applies directly and records three edits."""
    agreement, bli = make_agreement(test_can)

    response = basic_user_auth_client.patch(
        url_for("api.budget-line-items-item", id=bli.id),
        json={"amount": 500000.00, "can_id": test_cans[1].id, "date_needed": "2043-06-01"},
    )
    assert response.status_code == 200, response.json
    assert _change_requests(loaded_db, bli.id) == []

    edits = _edits(loaded_db, agreement.id)
    assert sorted(edit.field for edit in edits) == ["amount", "can_id", "date_needed"]
    assert {edit.budget_line_item_id for edit in edits} == {bli.id}
    assert {edit.requested_by_id for edit in edits} == {BASIC_USER_ID}


def test_consecutive_edits_on_the_same_field_merge_into_one_row(
    modified_loe_enabled,
    basic_user_auth_client,
    loaded_db,
    test_can,
    make_agreement,
    app_ctx,
):
    """Repeated edits to the same field merge into one row: the From stays the awarded value,
    so a modification never carries more than the net change."""
    agreement, bli = make_agreement(test_can)
    for amount in (500000.00, 100000.00):
        response = basic_user_auth_client.patch(
            url_for("api.budget-line-items-item", id=bli.id), json={"amount": amount}
        )
        assert response.status_code == 200, response.json

    (edit,) = _edits(loaded_db, agreement.id)
    assert (edit.old_value, edit.new_value) == (600000.0, 100000.0)

    response = _get_pending(basic_user_auth_client, agreement.id)
    assert response.status_code == 200, response.json
    (record,) = response.json["data"]
    assert (record["old_value"], record["new_value"]) == (600000.0, 100000.0)
    assert record["id"] == edit.id


def test_an_edit_that_nets_to_no_change_drops_the_pending_edit(
    modified_loe_enabled,
    basic_user_auth_client,
    loaded_db,
    test_can,
    make_agreement,
    app_ctx,
):
    """Editing a field back to its awarded value drops the pending edit entirely -- there is
    nothing left for a contract modification to carry."""
    agreement, bli = make_agreement(test_can)
    for amount in (500000.00, 600000.00):
        response = basic_user_auth_client.patch(
            url_for("api.budget-line-items-item", id=bli.id), json={"amount": amount}
        )
        assert response.status_code == 200, response.json

    assert _edits(loaded_db, agreement.id) == []


def test_each_field_tracks_its_own_edit_on_the_same_bl(
    modified_loe_enabled,
    basic_user_auth_client,
    loaded_db,
    test_can,
    test_cans,
    make_agreement,
    app_ctx,
):
    agreement, bli = make_agreement(test_can)
    for payload in ({"amount": 500000.00}, {"can_id": test_cans[1].id}, {"amount": 100000.00}):
        response = basic_user_auth_client.patch(url_for("api.budget-line-items-item", id=bli.id), json=payload)
        assert response.status_code == 200, response.json

    response = _get_pending(basic_user_auth_client, agreement.id)
    assert response.status_code == 200, response.json
    assert sorted((r["field"], r["new_value"]) for r in response.json["data"]) == [
        ("amount", 100000.0),
        ("can_id", test_cans[1].id),
    ]


def test_delete_supersedes_earlier_edits_on_the_bl(
    modified_loe_enabled,
    basic_user_auth_client,
    loaded_db,
    test_can,
    make_agreement,
    app_ctx,
):
    agreement, bli = make_agreement(test_can)
    bli_id = bli.id
    response = basic_user_auth_client.patch(
        url_for("api.budget-line-items-item", id=bli_id), json={"amount": 500000.00}
    )
    assert response.status_code == 200, response.json

    response = basic_user_auth_client.delete(url_for("api.budget-line-items-item", id=bli_id))
    assert response.status_code == 200, response.json

    # The earlier amount edit is superseded by the delete, which carries the awarded amount.
    (edit,) = _edits(loaded_db, agreement.id)
    assert edit.field == "delete"
    assert edit.budget_line_item_id == bli_id
    assert edit.old_value == 600000.0
    assert edit.new_value == "Deleted"


def test_losing_a_concurrent_direct_edit_save_raises_a_validation_error(
    modified_loe_enabled, loaded_db, test_can, make_agreement, app_ctx
):
    """Two saves that both see no pending row for the same field: the second hits the new
    ix_contract_modification_edit_one_pending_bli_field index and gets a ValidationError (a 400
    at the API), not a raw IntegrityError (a 500)."""
    agreement, bli = make_agreement(test_can)
    service = ContractModificationEditService(loaded_db)
    service.record_direct_edit(bli, "amount", 600000.0, 500000.0, BASIC_USER_ID)
    loaded_db.commit()

    # The second save read before the first committed, so it doesn't see the pending row.
    with pytest.MonkeyPatch.context() as monkeypatch:
        monkeypatch.setattr(service, "_pending_for_budget_line", lambda *args, **kwargs: [])

        with pytest.raises(ValidationError) as error:
            service.record_direct_edit(bli, "amount", 600000.0, 100000.0, BASIC_USER_ID)

    assert "amount" in error.value.validation_errors
    loaded_db.rollback()
    (edit,) = _edits(loaded_db, agreement.id)
    assert (edit.old_value, edit.new_value) == (600000.0, 500000.0)


def test_losing_a_concurrent_direct_delete_save_raises_a_validation_error(
    modified_loe_enabled, loaded_db, test_can, make_agreement, app_ctx
):
    """The delete path's own concurrency handling, mirroring the edit path's."""
    agreement, bli = make_agreement(test_can)
    service = ContractModificationEditService(loaded_db)
    service.record_direct_delete(bli, 600000.0, BASIC_USER_ID)
    loaded_db.commit()

    # The second, concurrent delete also read before the first committed.
    with pytest.MonkeyPatch.context() as monkeypatch:
        monkeypatch.setattr(service, "_pending_for_budget_line", lambda *args, **kwargs: [])

        with pytest.raises(ValidationError) as error:
            service.record_direct_delete(bli, 600000.0, BASIC_USER_ID)

    assert "budget_line_item" in error.value.validation_errors
    loaded_db.rollback()
    (edit,) = _edits(loaded_db, agreement.id)
    assert edit.field == "delete"


def test_delete_edit_survives_the_bli_deletion(
    modified_loe_enabled,
    basic_user_auth_client,
    loaded_db,
    test_can,
    make_agreement,
    app_ctx,
):
    agreement, bli = make_agreement(test_can)
    bli_id = bli.id

    response = basic_user_auth_client.delete(url_for("api.budget-line-items-item", id=bli_id))
    assert response.status_code == 200, response.json
    assert _change_requests(loaded_db, bli_id) == []

    loaded_db.expire_all()
    assert loaded_db.get(ContractBudgetLineItem, bli_id) is None

    (edit,) = _edits(loaded_db, agreement.id)
    assert edit.field == "delete"
    assert edit.budget_line_item_id == bli_id
    assert edit.old_value == 600000.0
    assert edit.new_value == "Deleted"
    assert edit.change_request_id is None


def test_non_awarded_agreement_records_no_edit(
    modified_loe_enabled,
    basic_user_auth_client,
    division_director_auth_client,
    loaded_db,
    test_can,
    make_agreement,
    app_ctx,
):
    agreement, bli = make_agreement(test_can, awarded=False)
    basic_user_auth_client.patch(url_for("api.budget-line-items-item", id=bli.id), json={"amount": 500000.00})
    (cr,) = _change_requests(loaded_db, bli.id)

    _review(division_director_auth_client, cr.id)

    loaded_db.expire_all()
    assert float(loaded_db.get(ContractBudgetLineItem, bli.id).amount) == 500000.00
    assert _edits(loaded_db, agreement.id) == []


def test_flag_off_records_no_edit(
    modified_loe_disabled,
    basic_user_auth_client,
    division_director_auth_client,
    loaded_db,
    test_can,
    make_agreement,
    app_ctx,
):
    """PLANNED edits on an Awarded agreement already work with the flag off; no edit is tracked."""
    agreement, bli = make_agreement(test_can)
    basic_user_auth_client.patch(url_for("api.budget-line-items-item", id=bli.id), json={"amount": 500000.00})
    (cr,) = _change_requests(loaded_db, bli.id)

    _review(division_director_auth_client, cr.id)

    assert _edits(loaded_db, agreement.id) == []


def test_draft_to_planned_on_awarded_agreement_records_edit(
    modified_loe_enabled,
    basic_user_auth_client,
    loaded_db,
    test_can,
    make_agreement,
    app_ctx,
):
    """Draft -> Planned on an Awarded agreement applies directly and is tracked for the next
    contract modification, independent of SKIP_CR_FOR_DRAFT_PLANNED."""
    agreement, bli = make_agreement(test_can, status=BudgetLineItemStatus.DRAFT)
    response = basic_user_auth_client.patch(
        url_for("api.budget-line-items-item", id=bli.id), json={"status": "PLANNED"}
    )
    assert response.status_code == 200, response.json
    assert _change_requests(loaded_db, bli.id) == []

    (edit,) = _edits(loaded_db, agreement.id)
    assert edit.field == "status"
    assert edit.old_value == "DRAFT"
    assert edit.new_value == "PLANNED"


def test_draft_to_planned_on_non_awarded_agreement_records_no_edit(
    modified_loe_enabled,
    basic_user_auth_client,
    division_director_auth_client,
    loaded_db,
    test_can,
    make_agreement,
    app_ctx,
):
    agreement, bli = make_agreement(test_can, awarded=False, status=BudgetLineItemStatus.DRAFT)
    response = basic_user_auth_client.patch(
        url_for("api.budget-line-items-item", id=bli.id), json={"status": "PLANNED"}
    )
    assert response.status_code in (200, 202), response.json
    for cr in _change_requests(loaded_db, bli.id):
        assert cr.requires_contract_modification is False
        _review(division_director_auth_client, cr.id)

    assert _edits(loaded_db, agreement.id) == []


def test_draft_amount_edit_on_awarded_agreement_applies_directly(
    modified_loe_enabled,
    basic_user_auth_client,
    loaded_db,
    test_can,
    make_agreement,
    app_ctx,
):
    """Draft budget lines on an Awarded agreement are edited freely, without approval."""
    agreement, bli = make_agreement(test_can, status=BudgetLineItemStatus.DRAFT)
    response = basic_user_auth_client.patch(
        url_for("api.budget-line-items-item", id=bli.id), json={"amount": 123456.00}
    )
    assert response.status_code == 200, response.json
    assert _change_requests(loaded_db, bli.id) == []
    assert _edits(loaded_db, agreement.id) == []


# ---=== GET errors ===---


def test_get_pending_edits_unknown_agreement_returns_404(basic_user_auth_client, app_ctx):
    assert _get_pending(basic_user_auth_client, 9999999).status_code == 404


def test_get_pending_edits_non_contract_agreement_returns_400(basic_user_auth_client, loaded_db, app_ctx):
    grant = loaded_db.scalars(select(GrantAgreement).limit(1)).first()
    assert _get_pending(basic_user_auth_client, grant.id).status_code == 400


def test_get_pending_edits_requires_auth(client, app_ctx):
    assert _get_pending(client, 1).status_code == 401


# ---=== POST start modification (Decision 18) ===---


def _direct_amount_edit(basic_client, loaded_db, bli, amount=500000.00):
    response = basic_client.patch(url_for("api.budget-line-items-item", id=bli.id), json={"amount": amount})
    assert response.status_code == 200, response.json


# ---=== AC10: who / when / what / remote IP for the modified-LOE amount edit ===---


def test_amount_edit_on_awarded_agreement_is_recorded_with_who_when_what(
    modified_loe_enabled,
    basic_user_auth_client,
    loaded_db,
    test_can,
    make_agreement,
    app_ctx,
):
    """A direct amount edit on an Awarded agreement records who, when, and what on the agreement
    history, and the remote IP on the linked OpsEvent."""
    agreement, bli = make_agreement(test_can)
    event_ip = {"REMOTE_ADDR": "10.1.2.3"}

    response = basic_user_auth_client.patch(
        url_for("api.budget-line-items-item", id=bli.id),
        json={"amount": 500000.00},
        environ_base=event_ip,
    )
    assert response.status_code == 200, response.json

    loaded_db.expire_all()
    (entry,) = loaded_db.scalars(
        select(AgreementHistory).where(
            AgreementHistory.agreement_id == agreement.id,
            AgreementHistory.history_type == AgreementHistoryType.BUDGET_LINE_ITEM_UPDATED,
        )
    ).all()

    basic_user = loaded_db.get(User, BASIC_USER_ID)
    # what + who
    assert f"BL {bli.id}" in entry.history_message
    assert "$600,000.00" in entry.history_message
    assert "$500,000.00" in entry.history_message
    assert basic_user.full_name in entry.history_message
    # when
    assert entry.timestamp
    # who + remote IP, on the linked event
    event = loaded_db.get(OpsEvent, entry.ops_event_id)
    assert event.created_by == basic_user.id
    assert event.event_details["request.remote_addr"] == "10.1.2.3"


def test_attach_pending_edits_to_mod_only_attaches_the_given_edits(
    modified_loe_enabled,
    basic_user_auth_client,
    loaded_db,
    test_can,
    test_cans,
    make_agreement,
    app_ctx,
):
    """An edit attached to a modification request must stay attached, separate from any other
    pending edit on the same budget line."""
    agreement, bli = make_agreement(test_can)
    _direct_amount_edit(basic_user_auth_client, loaded_db, bli, 550000.00)
    basic_user_auth_client.patch(url_for("api.budget-line-items-item", id=bli.id), json={"can_id": test_cans[1].id})
    amount_edit, can_edit = _edits(loaded_db, agreement.id)

    agreement_mod = AgreementMod(agreement_id=agreement.id)
    loaded_db.add(agreement_mod)
    loaded_db.flush()
    attached = ContractModificationEditService(loaded_db).attach_pending_edits_to_mod(
        agreement.id, agreement_mod.id, [amount_edit.id]
    )
    loaded_db.commit()

    assert attached == 1
    edits = {edit.id: edit.agreement_mod_id for edit in _edits(loaded_db, agreement.id)}
    assert edits == {amount_edit.id: agreement_mod.id, can_edit.id: None}


def test_get_pending_edits_eager_loads_requested_by(
    modified_loe_enabled,
    basic_user_auth_client,
    loaded_db,
    test_can,
    make_agreement,
    app_ctx,
):
    agreement, bli = make_agreement(test_can)
    _direct_amount_edit(basic_user_auth_client, loaded_db, bli)
    loaded_db.expire_all()

    (edit,) = ContractModificationEditService(loaded_db).get_pending_for_agreement(agreement.id)

    assert "requested_by" not in inspect(edit).unloaded


def test_pre_award_planned_to_executing_request_cannot_be_approved_after_award(
    modified_loe_enabled,
    basic_user_auth_client,
    division_director_auth_client,
    loaded_db,
    test_can,
    make_agreement,
    app_ctx,
):
    """A Planned->Executing request submitted before the award passes the request-time guard;
    approving it after the award would execute a BL without a Contract Modification."""
    agreement, bli = make_agreement(test_can, awarded=False)
    response = basic_user_auth_client.patch(
        url_for("api.budget-line-items-item", id=bli.id), json={"status": BudgetLineItemStatus.IN_EXECUTION.name}
    )
    assert response.status_code == 202, response.json
    (cr,) = _change_requests(loaded_db, bli.id)

    _award(loaded_db, agreement)
    response = division_director_auth_client.patch(
        url_for("api.change-requests-item", id=cr.id), json={"action": "APPROVE"}
    )

    assert response.status_code == 400, response.json
    assert "Contract Modification" in response.json["errors"]["status"]
    loaded_db.expire_all()
    assert loaded_db.get(BudgetLineItemChangeRequest, cr.id).status == ChangeRequestStatus.IN_REVIEW
    assert loaded_db.get(ContractBudgetLineItem, bli.id).status == BudgetLineItemStatus.PLANNED
    assert _edits(loaded_db, agreement.id) == []


# ---=== Services Component rows (OPS-6440) ===---


def _edit(field, *, bli_id=None, sc_id=None):
    return SimpleNamespace(field=field, budget_line_item_id=bli_id, services_component_id=sc_id)


def test_latest_per_budget_line_field_keys_services_components_separately():
    """SC rows have no budget line, so two SC adds must not collapse into one row."""
    sc2_add = _edit("services_component_create", sc_id=2)
    sc3_add = _edit("services_component_create", sc_id=3)
    amount = _edit("amount", bli_id=10)

    latest = ContractModificationEditService._latest_per_budget_line_field([sc2_add, sc3_add, amount])

    assert latest == [sc2_add, sc3_add, amount]
