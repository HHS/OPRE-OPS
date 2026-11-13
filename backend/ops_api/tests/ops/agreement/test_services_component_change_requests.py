"""Integration tests for Services Component add/delete on Awarded agreements (OPS-6440, OPS-3072,
OPS-3268).

On an Awarded, tracked agreement, adding or deleting an SC applies directly and is tracked
immediately (no budget lines required, no Division Director approval -- OPS-3268 UX feedback
item 5), and deleting one is allowed for every user, not just superusers. Both are recorded as
"Edits That Require a Contract Modification". These tests cover the add, the delete, the legacy
pre-OPS-3268 deferred-add path still reachable for data created before that change, and the SC
lock while an edit is attached to a submitted modification that's in review.

``basic_user_auth_client`` (user 521) is a team member on the test agreements.
"""

import datetime

import pytest
from flask import url_for
from sqlalchemy import select, text, update

from models import (
    AgreementHistory,
    AgreementReason,
    AgreementType,
    AwardType,
    BudgetLineItemStatus,
    ContractAgreement,
    ContractBudgetLineItem,
    ContractModificationEdit,
    ContractType,
    ProcurementAction,
    ProcurementActionStatus,
    ServicesComponent,
    ServicesComponentChangeRequest,
    User,
)
from ops_api.ops.services.change_requests import ChangeRequestService

SYSTEM_OWNER_USER_ID = 503
BASIC_USER_ID = 521


@pytest.fixture()
def modified_loe_enabled(app):
    original = app.config.get("ENABLE_MODIFIED_LOE_EDITS", False)
    app.config["ENABLE_MODIFIED_LOE_EDITS"] = True
    yield
    app.config["ENABLE_MODIFIED_LOE_EDITS"] = original


@pytest.fixture()
def awarded_agreement(loaded_db, test_project, test_can):
    """An Awarded Contract agreement with SC1 and one Planned budget line on ``test_can``.

    That budget line is what resolves the agreement's Division Director (division 5).
    Cleans up everything the tests can create on it.
    """
    suffix = datetime.datetime.now().strftime("%H%M%S%f")
    agreement = ContractAgreement(
        name=f"SC Change Request Test Agreement {suffix}",
        contract_number=f"CTSCCR{suffix}",
        contract_type=ContractType.FIRM_FIXED_PRICE,
        agreement_type=AgreementType.CONTRACT,
        project_id=test_project.id,
        product_service_code_id=2,
        description="Agreement for the OPS-6440 services component change request tests",
        agreement_reason=AgreementReason.NEW_REQ,
        project_officer_id=SYSTEM_OWNER_USER_ID,
        awarding_entity_id=1,
    )
    loaded_db.add(agreement)
    loaded_db.flush()
    agreement.team_members.append(loaded_db.get(User, BASIC_USER_ID))
    loaded_db.add(
        ProcurementAction(
            agreement_id=agreement.id,
            status=ProcurementActionStatus.AWARDED,
            award_type=AwardType.NEW_AWARD,
        )
    )
    loaded_db.commit()

    sc1 = ServicesComponent(agreement_id=agreement.id, number=1, optional=False)
    loaded_db.add(sc1)
    loaded_db.commit()
    _add_bli(loaded_db, agreement, sc1, test_can, BudgetLineItemStatus.PLANNED)
    loaded_db.refresh(agreement)
    agreement_id = agreement.id

    yield agreement

    loaded_db.rollback()
    params = {"id": agreement_id}
    loaded_db.execute(text("DELETE FROM contract_modification_edit WHERE agreement_id = :id"), params)
    loaded_db.execute(text("DELETE FROM change_request WHERE agreement_id = :id"), params)
    loaded_db.execute(text("DELETE FROM procurement_action WHERE agreement_id = :id"), params)
    loaded_db.commit()
    for bli in loaded_db.query(ContractBudgetLineItem).filter_by(agreement_id=agreement_id).all():
        loaded_db.delete(bli)
    loaded_db.commit()
    for sc in loaded_db.query(ServicesComponent).filter_by(agreement_id=agreement_id).all():
        loaded_db.delete(sc)
    loaded_db.commit()
    agreement = loaded_db.get(ContractAgreement, agreement_id)
    if agreement is not None:
        loaded_db.delete(agreement)
        loaded_db.commit()


def _add_bli(loaded_db, agreement, sc, can, status):
    bli = ContractBudgetLineItem(
        agreement_id=agreement.id,
        line_description="SC change request test BLI",
        amount=100000.00,
        can_id=can.id,
        date_needed=datetime.date(2043, 1, 1),
        status=status,
        proc_shop_fee_percentage=0,
        created_by=SYSTEM_OWNER_USER_ID,
        services_component_id=sc.id if sc else None,
    )
    loaded_db.add(bli)
    loaded_db.commit()
    return bli


def _add_sc(loaded_db, agreement, number, *, awaiting_add_approval=False):
    sc = ServicesComponent(
        agreement_id=agreement.id, number=number, optional=False, awaiting_add_approval=awaiting_add_approval
    )
    loaded_db.add(sc)
    loaded_db.commit()
    return sc


def _sc_change_requests(loaded_db, agreement_id):
    loaded_db.expire_all()
    return list(
        loaded_db.scalars(
            select(ServicesComponentChangeRequest)
            .where(ServicesComponentChangeRequest.agreement_id == agreement_id)
            .order_by(ServicesComponentChangeRequest.id)
        ).all()
    )


def _edits(loaded_db, agreement_id):
    loaded_db.expire_all()
    return list(
        loaded_db.scalars(
            select(ContractModificationEdit)
            .where(ContractModificationEdit.agreement_id == agreement_id)
            .order_by(ContractModificationEdit.id)
        ).all()
    )


def _history_titles(loaded_db, agreement_id):
    loaded_db.expire_all()
    return [
        row.history_title
        for row in loaded_db.scalars(
            select(AgreementHistory).where(AgreementHistory.agreement_id_record == agreement_id)
        ).all()
    ]


def _post_sc(client, agreement_id, number):
    response = client.post(
        url_for("api.services-component-group"),
        json={"agreement_id": agreement_id, "number": number, "optional": False},
    )
    assert response.status_code == 201, response.json
    return response.json


def _patch_bli(client, bli_id, body):
    return client.patch(url_for("api.budget-line-items-item", id=bli_id), json=body)


# ---=== Creating an SC after award applies directly, with no budget lines required ===---


def test_sc_added_after_award_applies_directly(
    modified_loe_enabled, basic_user_auth_client, loaded_db, awarded_agreement, app_ctx
):
    """OPS-3268 UX feedback item 5: adding an SC is tracked on its own, with no budget lines
    required and no Division Director approval."""
    data = _post_sc(basic_user_auth_client, awarded_agreement.id, 2)

    assert data["awaiting_add_approval"] is False
    assert data["in_review"] is False
    assert _sc_change_requests(loaded_db, awarded_agreement.id) == []
    (edit,) = _edits(loaded_db, awarded_agreement.id)
    assert edit.services_component_id == data["id"]
    assert edit.budget_line_item_id is None
    assert edit.field == "services_component_create"
    assert edit.new_value == "SC2"
    assert edit.requested_by_id == BASIC_USER_ID


def test_sc_added_with_flag_off_is_not_pending(basic_user_auth_client, loaded_db, awarded_agreement, app, app_ctx):
    app.config["ENABLE_MODIFIED_LOE_EDITS"] = False

    data = _post_sc(basic_user_auth_client, awarded_agreement.id, 2)

    assert data["awaiting_add_approval"] is False
    assert _edits(loaded_db, awarded_agreement.id) == []


def test_draft_budget_line_on_already_added_sc_creates_no_additional_request(
    modified_loe_enabled, basic_user_auth_client, loaded_db, test_can, awarded_agreement, app_ctx
):
    sc2_id = _post_sc(basic_user_auth_client, awarded_agreement.id, 2)["id"]

    response = basic_user_auth_client.post(
        url_for("api.budget-line-items-group"),
        json={
            "agreement_id": awarded_agreement.id,
            "line_description": "Draft on already-added SC",
            "amount": 1000.0,
            "can_id": test_can.id,
            "status": "DRAFT",
            "services_component_id": sc2_id,
        },
    )
    assert response.status_code == 201, response.json

    assert _sc_change_requests(loaded_db, awarded_agreement.id) == []
    assert loaded_db.get(ServicesComponent, sc2_id).awaiting_add_approval is False
    (edit,) = _edits(loaded_db, awarded_agreement.id)
    assert edit.field == "services_component_create"


# ---=== Linking a non-Draft budget line applies the add directly (OPS-3072/OPS-3268) ===---


def test_linking_a_non_draft_bli_applies_the_sc_addition_directly(
    modified_loe_enabled, basic_user_auth_client, loaded_db, test_can, awarded_agreement, app_ctx
):
    sc2 = _add_sc(loaded_db, awarded_agreement, 2, awaiting_add_approval=True)
    bli = _add_bli(loaded_db, awarded_agreement, None, test_can, BudgetLineItemStatus.PLANNED)
    sc2_id = sc2.id

    response = _patch_bli(basic_user_auth_client, bli.id, {"services_component_id": sc2_id})
    assert response.status_code == 200, response.json

    loaded_db.expire_all()
    sc2 = loaded_db.get(ServicesComponent, sc2_id)
    assert sc2.awaiting_add_approval is False
    assert sc2.in_review is False
    assert _sc_change_requests(loaded_db, awarded_agreement.id) == []

    (edit,) = _edits(loaded_db, awarded_agreement.id)
    assert edit.services_component_id == sc2_id
    assert edit.budget_line_item_id is None
    assert edit.field == "services_component_create"
    assert edit.new_value == "SC2"
    assert edit.requested_by_id == BASIC_USER_ID

    response = basic_user_auth_client.get(
        url_for("api.agreements-contract-modification-edits", id=awarded_agreement.id)
    )
    assert response.status_code == 200, response.json
    (record,) = response.json["data"]
    assert record["services_component_id"] == sc2_id


def test_requires_contract_modification_is_false_when_flag_off(
    app, basic_user_auth_client, loaded_db, test_can, awarded_agreement, app_ctx
):
    app.config["ENABLE_MODIFIED_LOE_EDITS"] = False
    sc2 = _add_sc(loaded_db, awarded_agreement, 2, awaiting_add_approval=True)
    bli = _add_bli(loaded_db, awarded_agreement, None, test_can, BudgetLineItemStatus.PLANNED)

    response = _patch_bli(basic_user_auth_client, bli.id, {"services_component_id": sc2.id})
    assert response.status_code == 200, response.json

    assert _edits(loaded_db, awarded_agreement.id) == []


def test_linking_planned_budget_lines_applies_the_pending_sc_addition(
    modified_loe_enabled, basic_user_auth_client, loaded_db, test_can, awarded_agreement, app_ctx
):
    """Per-resource path: the SC is POSTed first and its budget lines are linked afterwards."""
    sc2_id = _post_sc(basic_user_auth_client, awarded_agreement.id, 2)["id"]
    first = _add_bli(loaded_db, awarded_agreement, None, test_can, BudgetLineItemStatus.PLANNED)
    second = _add_bli(loaded_db, awarded_agreement, None, test_can, BudgetLineItemStatus.PLANNED)

    response = _patch_bli(basic_user_auth_client, first.id, {"services_component_id": sc2_id})
    assert response.status_code == 200, response.json
    response = _patch_bli(basic_user_auth_client, second.id, {"services_component_id": sc2_id})
    assert response.status_code == 200, response.json

    assert _sc_change_requests(loaded_db, awarded_agreement.id) == []
    response = basic_user_auth_client.get(url_for("api.services-component-item", id=sc2_id))
    assert response.json["awaiting_add_approval"] is False
    assert response.json["in_review"] is False
    (edit,) = [e for e in _edits(loaded_db, awarded_agreement.id) if e.services_component_id == sc2_id]
    assert edit.field == "services_component_create"


def test_superuser_linking_a_planned_budget_line_applies_the_sc_addition(
    modified_loe_enabled, power_user_auth_client, loaded_db, test_can, awarded_agreement, app_ctx
):
    """A superuser's link clears the pending flag too, but bypasses the tracked-edit recording."""
    sc2 = _add_sc(loaded_db, awarded_agreement, 2, awaiting_add_approval=True)
    bli = _add_bli(loaded_db, awarded_agreement, None, test_can, BudgetLineItemStatus.PLANNED)
    sc2_id = sc2.id

    response = _patch_bli(power_user_auth_client, bli.id, {"services_component_id": sc2_id})
    assert response.status_code == 200, response.json

    assert _sc_change_requests(loaded_db, awarded_agreement.id) == []
    assert loaded_db.get(ServicesComponent, sc2_id).awaiting_add_approval is False


def test_ensure_add_request_rereads_flag_after_lock(
    app, mocker, modified_loe_enabled, loaded_db, test_can, awarded_agreement, app_ctx
):
    mocker.patch("ops_api.ops.utils.budget_line_items_helpers.is_super_user", return_value=False)
    sc2 = _add_sc(loaded_db, awarded_agreement, 2, awaiting_add_approval=True)
    _add_bli(loaded_db, awarded_agreement, sc2, test_can, BudgetLineItemStatus.PLANNED)
    # An approval committed by another request: the row is updated, the loaded SC still says pending.
    loaded_db.execute(
        update(ServicesComponent).where(ServicesComponent.id == sc2.id).values(awaiting_add_approval=False),
        execution_options={"synchronize_session": False},
    )
    assert sc2.awaiting_add_approval is True

    with app.test_request_context():
        change_request_id = ChangeRequestService(loaded_db).ensure_services_component_add_change_request(sc2)

    assert change_request_id is None
    assert _sc_change_requests(loaded_db, awarded_agreement.id) == []


# ---=== Draft -> Planned on a pending SC's budget line applies the add too ===---


def test_draft_to_planned_on_pending_sc_applies_the_sc_addition_too(
    modified_loe_enabled, basic_user_auth_client, loaded_db, test_can, awarded_agreement, app_ctx
):
    sc2 = _add_sc(loaded_db, awarded_agreement, 2, awaiting_add_approval=True)
    bli = _add_bli(loaded_db, awarded_agreement, sc2, test_can, BudgetLineItemStatus.DRAFT)
    sc2_id = sc2.id

    response = basic_user_auth_client.patch(
        url_for("api.budget-line-items-item", id=bli.id), json={"status": "PLANNED"}
    )
    assert response.status_code == 200, response.json

    loaded_db.expire_all()
    assert loaded_db.get(ServicesComponent, sc2_id).awaiting_add_approval is False
    fields = {edit.field for edit in _edits(loaded_db, awarded_agreement.id)}
    assert "services_component_create" in fields
    assert "status" in fields
    assert _sc_change_requests(loaded_db, awarded_agreement.id) == []


def test_draft_to_planned_on_already_added_sc_records_no_sc_edit(
    modified_loe_enabled, basic_user_auth_client, loaded_db, test_can, awarded_agreement, app_ctx
):
    sc2 = _add_sc(loaded_db, awarded_agreement, 2)
    bli = _add_bli(loaded_db, awarded_agreement, sc2, test_can, BudgetLineItemStatus.DRAFT)

    response = basic_user_auth_client.patch(
        url_for("api.budget-line-items-item", id=bli.id), json={"status": "PLANNED"}
    )
    assert response.status_code == 200, response.json

    fields = {edit.field for edit in _edits(loaded_db, awarded_agreement.id)}
    assert "services_component_create" not in fields
    assert "status" in fields


def test_moving_a_budget_line_off_an_already_added_sc_keeps_its_edit(
    modified_loe_enabled, basic_user_auth_client, loaded_db, test_can, awarded_agreement, app_ctx
):
    """Once an SC's addition has applied directly, moving its budget line elsewhere doesn't
    retract the already-recorded edit (OPS-3072/OPS-3268: it already happened)."""
    sc2 = _add_sc(loaded_db, awarded_agreement, 2, awaiting_add_approval=True)
    bli = _add_bli(loaded_db, awarded_agreement, None, test_can, BudgetLineItemStatus.PLANNED)
    _patch_bli(basic_user_auth_client, bli.id, {"services_component_id": sc2.id})
    sc1_id = loaded_db.scalar(
        select(ServicesComponent.id).where(
            ServicesComponent.agreement_id == awarded_agreement.id, ServicesComponent.number == 1
        )
    )

    response = _patch_bli(basic_user_auth_client, bli.id, {"services_component_id": sc1_id})
    assert response.status_code == 200, response.json

    assert _sc_change_requests(loaded_db, awarded_agreement.id) == []
    fields = {edit.field for edit in _edits(loaded_db, awarded_agreement.id) if edit.services_component_id == sc2.id}
    assert "services_component_create" in fields


def test_deleting_a_planned_budget_line_does_not_discard_its_already_applied_sc_addition(
    modified_loe_enabled, basic_user_auth_client, loaded_db, test_can, awarded_agreement, app_ctx
):
    """The SC's addition stays recorded even though deleting a budget line that only went
    Draft -> Planned after the award drops its own now-moot status edit (OPS-3072/OPS-3268)."""
    sc2 = _add_sc(loaded_db, awarded_agreement, 2, awaiting_add_approval=True)
    bli = _add_bli(loaded_db, awarded_agreement, sc2, test_can, BudgetLineItemStatus.DRAFT)
    bli_id = bli.id
    sc2_id = sc2.id

    response = basic_user_auth_client.patch(
        url_for("api.budget-line-items-item", id=bli_id), json={"status": "PLANNED"}
    )
    assert response.status_code == 200, response.json
    assert loaded_db.get(ServicesComponent, sc2_id).awaiting_add_approval is False

    response = basic_user_auth_client.delete(url_for("api.budget-line-items-item", id=bli_id))
    assert response.status_code == 200, response.json

    edits = {(e.field, e.services_component_id, e.budget_line_item_id) for e in _edits(loaded_db, awarded_agreement.id)}
    assert edits == {("services_component_create", sc2_id, None)}


def test_superuser_deleting_the_last_planned_budget_line_leaves_no_sc_change_request(
    modified_loe_enabled, power_user_auth_client, loaded_db, test_can, awarded_agreement, app_ctx
):
    sc2 = _add_sc(loaded_db, awarded_agreement, 2, awaiting_add_approval=True)
    bli = _add_bli(loaded_db, awarded_agreement, None, test_can, BudgetLineItemStatus.PLANNED)
    _patch_bli(power_user_auth_client, bli.id, {"services_component_id": sc2.id})
    bli_id = bli.id

    response = power_user_auth_client.delete(url_for("api.budget-line-items-item", id=bli_id))
    assert response.status_code == 200, response.json

    assert _sc_change_requests(loaded_db, awarded_agreement.id) == []


# ---=== Deleting an SC applies directly for every user (OPS-3072/OPS-3268) ===---


@pytest.mark.parametrize("client_fixture", ["basic_user_auth_client", "budget_team_auth_client"])
def test_deleting_sc_with_planned_budget_lines_applies_directly_for_any_user(
    request, client_fixture, modified_loe_enabled, loaded_db, test_can, awarded_agreement, app_ctx
):
    client = request.getfixturevalue(client_fixture)
    sc2 = _add_sc(loaded_db, awarded_agreement, 2)
    bli = _add_bli(loaded_db, awarded_agreement, sc2, test_can, BudgetLineItemStatus.PLANNED)
    sc2_id, bli_id = sc2.id, bli.id

    response = client.delete(url_for("api.services-component-item", id=sc2_id))

    assert response.status_code == 200, response.json
    loaded_db.expire_all()
    assert loaded_db.get(ServicesComponent, sc2_id) is None
    # The FK is ON DELETE SET NULL: the budget line survives, just unlinked.
    assert loaded_db.get(ContractBudgetLineItem, bli_id).services_component_id is None
    (edit,) = _edits(loaded_db, awarded_agreement.id)
    assert edit.field == "delete"
    assert edit.services_component_id == sc2_id
    assert edit.new_value == "Deleted"


def test_deleting_sc_with_planned_budget_lines_applies_directly_when_flag_off(
    basic_user_auth_client, loaded_db, test_can, awarded_agreement, app_ctx
):
    sc2 = _add_sc(loaded_db, awarded_agreement, 2)
    _add_bli(loaded_db, awarded_agreement, sc2, test_can, BudgetLineItemStatus.PLANNED)
    sc2_id = sc2.id

    response = basic_user_auth_client.delete(url_for("api.services-component-item", id=sc2_id))

    assert response.status_code == 200, response.json
    loaded_db.expire_all()
    assert loaded_db.get(ServicesComponent, sc2_id) is None


def test_deleting_sc_with_only_draft_budget_lines_applies_directly(
    modified_loe_enabled, basic_user_auth_client, loaded_db, test_can, awarded_agreement, app_ctx
):
    """OPS-3268 UX feedback item 5: deleting an SC is tracked on its own, even one with no
    non-Draft budget lines."""
    sc2 = _add_sc(loaded_db, awarded_agreement, 2)
    bli = _add_bli(loaded_db, awarded_agreement, sc2, test_can, BudgetLineItemStatus.DRAFT)
    sc2_id, bli_id = sc2.id, bli.id

    response = basic_user_auth_client.delete(url_for("api.services-component-item", id=sc2_id))

    assert response.status_code == 200, response.json
    loaded_db.expire_all()
    assert loaded_db.get(ServicesComponent, sc2_id) is None
    assert loaded_db.get(ContractBudgetLineItem, bli_id).services_component_id is None
    assert _sc_change_requests(loaded_db, awarded_agreement.id) == []
    (edit,) = _edits(loaded_db, awarded_agreement.id)
    assert edit.field == "delete"
    assert edit.services_component_id == sc2_id


def test_superuser_deleting_sc_with_planned_budget_lines_applies_directly(
    modified_loe_enabled, power_user_auth_client, loaded_db, test_can, awarded_agreement, app_ctx
):
    sc2 = _add_sc(loaded_db, awarded_agreement, 2)
    bli = _add_bli(loaded_db, awarded_agreement, sc2, test_can, BudgetLineItemStatus.PLANNED)
    sc2_id, bli_id = sc2.id, bli.id

    response = power_user_auth_client.delete(url_for("api.services-component-item", id=sc2_id))

    assert response.status_code == 200, response.json
    loaded_db.expire_all()
    assert loaded_db.get(ServicesComponent, sc2_id) is None
    assert loaded_db.get(ContractBudgetLineItem, bli_id).services_component_id is None
    assert _sc_change_requests(loaded_db, awarded_agreement.id) == []


# ---=== Deleting an SC is blocked while its budget line is in an in-review modification ===---


def _submit(client, agreement_id, **body):
    return client.post(url_for("api.agreements-contract-modifications", id=agreement_id), json=body)


def test_deleting_sc_whose_budget_line_is_in_an_in_review_modification_is_blocked(
    modified_loe_enabled, basic_user_auth_client, loaded_db, test_can, awarded_agreement, app_ctx
):
    """OPS-3268: the SC->BLI FK is ON DELETE SET NULL with no history trigger, so deleting the SC
    while its budget line is selected in an in-review Contract Modification Request would
    silently null the line's services_component_id out from under the Division Director's
    review -- and once null, the Director's re-validation on approval no longer sees the SC's
    awaiting-approval gate."""
    sc2 = _add_sc(loaded_db, awarded_agreement, 2)
    bli = ContractBudgetLineItem(
        agreement_id=awarded_agreement.id,
        line_description="SC change request test BLI",
        amount=100000.00,
        can_id=test_can.id,
        date_needed=datetime.date.today(),
        status=BudgetLineItemStatus.PLANNED,
        proc_shop_fee_percentage=0,
        created_by=SYSTEM_OWNER_USER_ID,
        services_component_id=sc2.id,
    )
    loaded_db.add(bli)
    loaded_db.commit()
    sc2_id, bli_id = sc2.id, bli.id

    submit_response = _submit(basic_user_auth_client, awarded_agreement.id, budget_line_item_ids=[bli_id])
    assert submit_response.status_code == 201, submit_response.json

    response = basic_user_auth_client.delete(url_for("api.services-component-item", id=sc2_id))

    assert response.status_code == 400, response.json
    loaded_db.expire_all()
    assert loaded_db.get(ServicesComponent, sc2_id) is not None
    assert loaded_db.get(ContractBudgetLineItem, bli_id).services_component_id == sc2_id


# ---=== Bundle (atomic multi-entity edit) ===---


def test_bundle_new_sc_with_planned_budget_line_applies_directly(
    modified_loe_enabled, basic_user_auth_client, loaded_db, test_can, awarded_agreement, app_ctx
):
    bli = _add_bli(loaded_db, awarded_agreement, None, test_can, BudgetLineItemStatus.PLANNED)

    response = basic_user_auth_client.patch(
        url_for("api.agreements-edit-bundle", id=awarded_agreement.id),
        json={
            "services_components": {"create": [{"ref": "sc2", "number": 2, "optional": False}]},
            "budget_line_items": {"update": [{"id": bli.id, "services_component_ref": "sc2"}]},
        },
    )

    assert response.status_code == 200, response.json
    loaded_db.expire_all()
    sc2 = loaded_db.scalars(
        select(ServicesComponent).where(
            ServicesComponent.agreement_id == awarded_agreement.id, ServicesComponent.number == 2
        )
    ).one()
    assert sc2.awaiting_add_approval is False
    assert _sc_change_requests(loaded_db, awarded_agreement.id) == []
    (edit,) = [e for e in _edits(loaded_db, awarded_agreement.id) if e.services_component_id == sc2.id]
    assert edit.field == "services_component_create"


def test_bundle_deleting_draft_budget_lines_then_their_sc_applies_directly(
    modified_loe_enabled, basic_user_auth_client, loaded_db, test_can, awarded_agreement, app_ctx
):
    sc2 = _add_sc(loaded_db, awarded_agreement, 2)
    bli = _add_bli(loaded_db, awarded_agreement, sc2, test_can, BudgetLineItemStatus.DRAFT)
    sc2_id = sc2.id

    response = basic_user_auth_client.patch(
        url_for("api.agreements-edit-bundle", id=awarded_agreement.id),
        json={"services_components": {"delete": [sc2_id]}, "budget_line_items": {"delete": [bli.id]}},
    )

    assert response.status_code == 200, response.json
    loaded_db.expire_all()
    assert loaded_db.get(ServicesComponent, sc2_id) is None
    assert _sc_change_requests(loaded_db, awarded_agreement.id) == []
    # OPS-3268 UX feedback item 5: deleting an SC is tracked on its own, even with no non-Draft
    # budget lines.
    (edit,) = _edits(loaded_db, awarded_agreement.id)
    assert edit.field == "delete"
    assert edit.services_component_id == sc2_id


def test_bundle_deleting_an_sc_with_a_planned_budget_line_applies_directly(
    modified_loe_enabled, basic_user_auth_client, loaded_db, test_can, awarded_agreement, app_ctx
):
    sc2 = _add_sc(loaded_db, awarded_agreement, 2)
    bli = _add_bli(loaded_db, awarded_agreement, sc2, test_can, BudgetLineItemStatus.PLANNED)
    sc3 = _add_sc(loaded_db, awarded_agreement, 3)
    sc2_id, sc3_id, bli_id = sc2.id, sc3.id, bli.id

    response = basic_user_auth_client.patch(
        url_for("api.agreements-edit-bundle", id=awarded_agreement.id),
        json={"services_components": {"delete": [sc3_id, sc2_id]}},
    )

    assert response.status_code == 200, response.json
    loaded_db.expire_all()
    assert loaded_db.get(ServicesComponent, sc2_id) is None
    assert loaded_db.get(ServicesComponent, sc3_id) is None
    assert loaded_db.get(ContractBudgetLineItem, bli_id).services_component_id is None
    # OPS-3268 UX feedback item 5: sc3 (no budget lines at all) is tracked too, not just sc2.
    edits = {(e.services_component_id, e.field) for e in _edits(loaded_db, awarded_agreement.id)}
    assert edits == {(sc2_id, "delete"), (sc3_id, "delete")}
