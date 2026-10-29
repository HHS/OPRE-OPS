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


def test_requires_contract_modification_sql_expression_matches_awarded_crs(
    modified_loe_enabled, basic_user_auth_client, loaded_db, test_can, make_agreement, app_ctx
):
    agreement, bli = make_agreement(test_can)

    response = basic_user_auth_client.patch(
        url_for("api.budget-line-items-item", id=bli.id), json={"amount": 500000.00}
    )
    assert response.status_code == 202, response.json
    (cr,) = _change_requests(loaded_db, bli.id)

    flagged_ids = loaded_db.scalars(
        select(BudgetLineItemChangeRequest.id).where(
            BudgetLineItemChangeRequest.agreement_id == agreement.id,
            BudgetLineItemChangeRequest.requires_contract_modification,
        )
    ).all()
    assert flagged_ids == [cr.id]


# ---=== Approval writes the edit row (Decisions 12, 13) ===---


def test_approved_planned_amount_edit_is_applied_and_recorded(
    modified_loe_enabled,
    basic_user_auth_client,
    division_director_auth_client,
    loaded_db,
    test_can,
    make_agreement,
    app_ctx,
):
    agreement, bli = make_agreement(test_can)

    response = basic_user_auth_client.patch(
        url_for("api.budget-line-items-item", id=bli.id), json={"amount": 500000.00}
    )
    assert response.status_code == 202, response.json
    (cr,) = _change_requests(loaded_db, bli.id)

    # Nothing is listed while the request is still in review.
    assert _edits(loaded_db, agreement.id) == []

    _review(division_director_auth_client, cr.id)

    # The edit is applied in OPS immediately, as for any approved change request ...
    loaded_db.expire_all()
    assert float(loaded_db.get(ContractBudgetLineItem, bli.id).amount) == 500000.00

    # ... and tracked as requiring a contract modification.
    (edit,) = _edits(loaded_db, agreement.id)
    assert edit.modification_type == ModificationEditType.MODIFIED_LOE
    assert edit.change_request_id == cr.id
    assert edit.budget_line_item_id == bli.id
    assert edit.field == "amount"
    assert edit.old_value == 600000.0
    assert edit.new_value == 500000.0
    assert edit.requested_by_id == BASIC_USER_ID
    assert edit.requested_on == cr.created_on
    assert edit.approved_by_id == DIVISION_DIRECTOR_USER_ID
    assert edit.approved_on is not None
    assert edit.agreement_mod_id is None


def test_get_pending_edits_returns_card_shape(
    modified_loe_enabled,
    basic_user_auth_client,
    division_director_auth_client,
    loaded_db,
    test_can,
    make_agreement,
    app_ctx,
):
    agreement, bli = make_agreement(test_can)
    basic_user_auth_client.patch(url_for("api.budget-line-items-item", id=bli.id), json={"amount": 500000.00})
    (cr,) = _change_requests(loaded_db, bli.id)
    _review(division_director_auth_client, cr.id)

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
    assert record["change_request_id"] == cr.id
    assert record["agreement_mod_id"] is None


def test_multi_field_save_records_one_edit_per_field(
    modified_loe_enabled,
    basic_user_auth_client,
    division_director_auth_client,
    loaded_db,
    test_can,
    test_cans,
    make_agreement,
    app_ctx,
):
    """One save changing amount + CAN + Obligate By is three change requests -> three edits."""
    agreement, bli = make_agreement(test_can)

    response = basic_user_auth_client.patch(
        url_for("api.budget-line-items-item", id=bli.id),
        json={"amount": 500000.00, "can_id": test_cans[1].id, "date_needed": "2043-06-01"},
    )
    assert response.status_code == 202, response.json
    crs = _change_requests(loaded_db, bli.id)
    assert len(crs) == 3
    for cr in crs:
        _review(division_director_auth_client, cr.id)

    edits = _edits(loaded_db, agreement.id)
    assert sorted(edit.field for edit in edits) == ["amount", "can_id", "date_needed"]
    assert {edit.budget_line_item_id for edit in edits} == {bli.id}
    assert {edit.requested_by_id for edit in edits} == {BASIC_USER_ID}


def test_consecutive_edits_on_same_bl_list_only_the_latest(
    modified_loe_enabled,
    basic_user_auth_client,
    division_director_auth_client,
    loaded_db,
    test_can,
    make_agreement,
    app_ctx,
):
    """The BL's current value is what goes into the modification, so only its latest edit is listed."""
    agreement, bli = make_agreement(test_can)
    for amount in (500000.00, 100000.00):
        response = basic_user_auth_client.patch(
            url_for("api.budget-line-items-item", id=bli.id), json={"amount": amount}
        )
        assert response.status_code == 202, response.json
        _review(division_director_auth_client, _change_requests(loaded_db, bli.id)[-1].id)

    # every approved edit is still recorded
    edits = _edits(loaded_db, agreement.id)
    assert [(e.old_value, e.new_value) for e in edits] == [(600000.0, 500000.0), (500000.0, 100000.0)]

    response = _get_pending(basic_user_auth_client, agreement.id)
    assert response.status_code == 200, response.json
    (record,) = response.json["data"]
    assert (record["old_value"], record["new_value"]) == (500000.0, 100000.0)
    assert record["id"] == edits[-1].id


def test_latest_edit_is_kept_per_field_on_the_same_bl(
    modified_loe_enabled,
    basic_user_auth_client,
    division_director_auth_client,
    loaded_db,
    test_can,
    test_cans,
    make_agreement,
    app_ctx,
):
    agreement, bli = make_agreement(test_can)
    for payload in ({"amount": 500000.00}, {"can_id": test_cans[1].id}, {"amount": 100000.00}):
        response = basic_user_auth_client.patch(url_for("api.budget-line-items-item", id=bli.id), json=payload)
        assert response.status_code == 202, response.json
        _review(division_director_auth_client, _change_requests(loaded_db, bli.id)[-1].id)

    response = _get_pending(basic_user_auth_client, agreement.id)
    assert response.status_code == 200, response.json
    assert [(r["field"], r["new_value"]) for r in response.json["data"]] == [
        ("can_id", test_cans[1].id),
        ("amount", 100000.0),
    ]


def test_delete_supersedes_earlier_edits_on_the_bl(
    modified_loe_enabled,
    basic_user_auth_client,
    division_director_auth_client,
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
    assert response.status_code == 202, response.json
    _review(division_director_auth_client, _change_requests(loaded_db, bli_id)[-1].id)

    response = basic_user_auth_client.delete(url_for("api.budget-line-items-item", id=bli_id))
    assert response.status_code == 202, response.json
    _review(division_director_auth_client, _change_requests(loaded_db, bli_id)[-1].id)

    assert len(_edits(loaded_db, agreement.id)) == 2
    response = _get_pending(basic_user_auth_client, agreement.id)
    assert response.status_code == 200, response.json
    (record,) = response.json["data"]
    assert record["field"] == "delete"
    assert record["budget_line_item_id"] == bli_id


def test_approved_delete_edit_survives_bli_and_change_request_deletion(
    modified_loe_enabled,
    basic_user_auth_client,
    division_director_auth_client,
    loaded_db,
    test_can,
    make_agreement,
    app_ctx,
):
    agreement, bli = make_agreement(test_can)
    bli_id = bli.id

    response = basic_user_auth_client.delete(url_for("api.budget-line-items-item", id=bli_id))
    assert response.status_code == 202, response.json
    (cr,) = _change_requests(loaded_db, bli_id)
    assert cr.requires_contract_modification is True

    _review(division_director_auth_client, cr.id)

    loaded_db.expire_all()
    assert loaded_db.get(ContractBudgetLineItem, bli_id) is None
    assert loaded_db.get(BudgetLineItemChangeRequest, cr.id) is None

    (edit,) = _edits(loaded_db, agreement.id)
    assert edit.field == "delete"
    assert edit.budget_line_item_id == bli_id
    assert edit.old_value == 600000.0
    assert edit.new_value == "Deleted"
    assert edit.change_request_id is None


def test_rejected_change_request_records_no_edit(
    modified_loe_enabled,
    basic_user_auth_client,
    division_director_auth_client,
    loaded_db,
    test_can,
    make_agreement,
    app_ctx,
):
    agreement, bli = make_agreement(test_can)
    basic_user_auth_client.patch(url_for("api.budget-line-items-item", id=bli.id), json={"amount": 500000.00})
    (cr,) = _change_requests(loaded_db, bli.id)

    _review(division_director_auth_client, cr.id, action="REJECT")

    assert _edits(loaded_db, agreement.id) == []


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


@pytest.fixture()
def skip_cr_for_draft_planned_enabled(app):
    original = app.config.get("SKIP_CR_FOR_DRAFT_PLANNED", False)
    app.config["SKIP_CR_FOR_DRAFT_PLANNED"] = True
    yield
    app.config["SKIP_CR_FOR_DRAFT_PLANNED"] = original


def test_draft_to_planned_on_awarded_agreement_records_edit(
    modified_loe_enabled,
    skip_cr_for_draft_planned_enabled,
    basic_user_auth_client,
    division_director_auth_client,
    loaded_db,
    test_can,
    make_agreement,
    app_ctx,
):
    """Draft -> Planned on an Awarded agreement requires a contract modification, so it goes to
    Division Director approval even when SKIP_CR_FOR_DRAFT_PLANNED is on."""
    agreement, bli = make_agreement(test_can, status=BudgetLineItemStatus.DRAFT)
    response = basic_user_auth_client.patch(
        url_for("api.budget-line-items-item", id=bli.id), json={"status": "PLANNED"}
    )
    assert response.status_code == 202, response.json
    (cr,) = _change_requests(loaded_db, bli.id)
    assert cr.requires_contract_modification is True

    _review(division_director_auth_client, cr.id)

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


def _approved_amount_edit(basic_client, director_client, loaded_db, bli, amount=500000.00):
    response = basic_client.patch(url_for("api.budget-line-items-item", id=bli.id), json={"amount": amount})
    assert response.status_code == 202, response.json
    _review(director_client, _change_requests(loaded_db, bli.id)[-1].id)


# ---=== AC10: who / when / what / remote IP for the modified-LOE amount edit ===---


def test_planned_amount_edit_request_and_approval_are_recorded(
    modified_loe_enabled,
    basic_user_auth_client,
    division_director_auth_client,
    loaded_db,
    test_can,
    make_agreement,
    app_ctx,
):
    """The edit flows through the existing change-request pipeline, which records who, when,
    and what on the agreement history and the remote IP on the linked OpsEvent."""
    agreement, bli = make_agreement(test_can)
    basic_client_event_ip = {"REMOTE_ADDR": "10.1.2.3"}
    director_event_ip = {"REMOTE_ADDR": "10.4.5.6"}

    response = basic_user_auth_client.patch(
        url_for("api.budget-line-items-item", id=bli.id),
        json={"amount": 500000.00},
        environ_base=basic_client_event_ip,
    )
    assert response.status_code == 202, response.json
    (cr,) = _change_requests(loaded_db, bli.id)
    response = division_director_auth_client.patch(
        url_for("api.change-requests-item", id=cr.id),
        json={"action": "APPROVE"},
        environ_base=director_event_ip,
    )
    assert response.status_code == 200, response.json

    loaded_db.expire_all()
    history = loaded_db.scalars(
        select(AgreementHistory)
        .where(
            AgreementHistory.agreement_id == agreement.id,
            AgreementHistory.history_type.in_(
                [AgreementHistoryType.CHANGE_REQUEST_CREATED, AgreementHistoryType.CHANGE_REQUEST_UPDATED]
            ),
        )
        .order_by(AgreementHistory.id)
    ).all()
    assert len(history) == 2
    requested, approved = history

    basic_user = loaded_db.get(User, BASIC_USER_ID)
    director = loaded_db.get(User, DIVISION_DIRECTOR_USER_ID)
    for entry, user, ip in ((requested, basic_user, "10.1.2.3"), (approved, director, "10.4.5.6")):
        # what + who
        assert f"BL {bli.id}" in entry.history_message
        assert "$600,000.00" in entry.history_message
        assert "$500,000.00" in entry.history_message
        assert user.full_name in entry.history_message
        # when
        assert entry.timestamp
        # who + remote IP, on the linked event
        event = loaded_db.get(OpsEvent, entry.ops_event_id)
        assert event.created_by == user.id
        assert event.event_details["request.remote_addr"] == ip


def test_attach_pending_edits_to_mod_only_attaches_the_given_edits(
    modified_loe_enabled,
    basic_user_auth_client,
    division_director_auth_client,
    loaded_db,
    test_can,
    make_agreement,
    app_ctx,
):
    """An edit approved after the modification request was submitted must stay pending rather
    than be silently swept into the modification when the request is approved."""
    agreement, bli = make_agreement(test_can)
    _approved_amount_edit(basic_user_auth_client, division_director_auth_client, loaded_db, bli, 550000.00)
    _approved_amount_edit(basic_user_auth_client, division_director_auth_client, loaded_db, bli, 500000.00)
    read_edit, late_edit = _edits(loaded_db, agreement.id)

    agreement_mod = AgreementMod(agreement_id=agreement.id)
    loaded_db.add(agreement_mod)
    loaded_db.flush()
    attached = ContractModificationEditService(loaded_db).attach_pending_edits_to_mod(
        agreement.id, agreement_mod.id, [read_edit.id]
    )
    loaded_db.commit()

    assert attached == 1
    edits = {edit.id: edit.agreement_mod_id for edit in _edits(loaded_db, agreement.id)}
    assert edits == {read_edit.id: agreement_mod.id, late_edit.id: None}


def test_get_pending_edits_eager_loads_requested_by(
    modified_loe_enabled,
    basic_user_auth_client,
    division_director_auth_client,
    loaded_db,
    test_can,
    make_agreement,
    app_ctx,
):
    agreement, bli = make_agreement(test_can)
    _approved_amount_edit(basic_user_auth_client, division_director_auth_client, loaded_db, bli)
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
