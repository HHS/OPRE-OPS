"""Integration tests for submitting a de-obligation request on an Obligated budget line
(OPS-6488). This story covers submission/recording only -- approving the resulting
modification (actually reducing the real amount and netting the CAN balance) is OPS-6489's
job and is explicitly rejected here until that ships (see test_approving_a_de_obligation_...).
"""

import datetime

import pytest
from flask import url_for
from sqlalchemy import select, text

from models import (
    AgreementReason,
    AgreementType,
    AwardType,
    BudgetLineItemStatus,
    ContractAgreement,
    ContractBudgetLineItem,
    ContractModificationEdit,
    ContractModificationRequest,
    ContractModificationRequestStatus,
    ContractType,
    ModificationEditType,
    OpsEvent,
    OpsEventType,
    ProcurementAction,
    ProcurementActionStatus,
    ServicesComponent,
    User,
)

SYSTEM_OWNER_USER_ID = 503
BASIC_USER_ID = 521


@pytest.fixture()
def modified_loe_enabled(app):
    """Turn ENABLE_MODIFIED_LOE_EDITS ON for the duration of a test."""
    original = app.config.get("ENABLE_MODIFIED_LOE_EDITS", False)
    app.config["ENABLE_MODIFIED_LOE_EDITS"] = True
    yield
    app.config["ENABLE_MODIFIED_LOE_EDITS"] = original


def _de_obligation_url(bli_id):
    return url_for("api.budget-line-item-de-obligation", id=bli_id)


def _submit_de_obligation(client, bli_id, requested_amount, **kwargs):
    body = {} if requested_amount is None else {"requested_amount": str(requested_amount)}
    return client.post(_de_obligation_url(bli_id), json=body, **kwargs)


def _submit_mod(client, agreement_id, **body):
    return client.post(url_for("api.agreements-contract-modifications", id=agreement_id), json=body)


def _review_mod(client, request_id, action="APPROVE", **body):
    return client.patch(
        url_for("api.contract-modification-requests-item", id=request_id), json={"action": action, **body}
    )


def _make_agreement(loaded_db, test_project, *, awarded: bool, name_suffix: str):
    agreement = ContractAgreement(
        name=f"De-obligation Test Agreement {name_suffix}",
        contract_number=f"CTDEOB{name_suffix}",
        contract_type=ContractType.FIRM_FIXED_PRICE,
        agreement_type=AgreementType.CONTRACT,
        project_id=test_project.id,
        product_service_code_id=2,
        description="Agreement for the OPS-6488 de-obligation tests",
        agreement_reason=AgreementReason.NEW_REQ,
        project_officer_id=SYSTEM_OWNER_USER_ID,
        awarding_entity_id=1,
    )
    loaded_db.add(agreement)
    loaded_db.flush()
    agreement.team_members.append(loaded_db.get(User, BASIC_USER_ID))
    if awarded:
        loaded_db.add(
            ProcurementAction(
                agreement_id=agreement.id, status=ProcurementActionStatus.AWARDED, award_type=AwardType.NEW_AWARD
            )
        )
    loaded_db.commit()
    loaded_db.refresh(agreement)
    return agreement


def _make_bli(loaded_db, agreement, test_can, status, amount=500000.00):
    sc = ServicesComponent(agreement_id=agreement.id, number=1, optional=False)
    loaded_db.add(sc)
    loaded_db.commit()

    bli = ContractBudgetLineItem(
        agreement_id=agreement.id,
        line_description="De-obligation test BLI",
        amount=amount,
        can_id=test_can.id,
        date_needed=datetime.date(2043, 1, 1),
        status=status,
        proc_shop_fee_percentage=0,
        created_by=SYSTEM_OWNER_USER_ID,
        services_component_id=sc.id,
    )
    loaded_db.add(bli)
    loaded_db.commit()
    return bli, sc


def _cleanup(loaded_db, agreement_id, bli_id, sc):
    loaded_db.rollback()
    loaded_db.execute(text("DELETE FROM contract_modification_edit WHERE agreement_id = :id"), {"id": agreement_id})
    loaded_db.execute(text("DELETE FROM procurement_action WHERE agreement_id = :id"), {"id": agreement_id})
    loaded_db.commit()
    bli = loaded_db.get(ContractBudgetLineItem, bli_id)
    if bli is not None:
        loaded_db.delete(bli)
        loaded_db.commit()
    loaded_db.delete(sc)
    loaded_db.commit()
    agreement = loaded_db.get(ContractAgreement, agreement_id)
    if agreement is not None:
        loaded_db.delete(agreement)
        loaded_db.commit()


def _get_edit(loaded_db, bli_id):
    return loaded_db.scalars(
        select(ContractModificationEdit).where(
            ContractModificationEdit.budget_line_item_id == bli_id,
            ContractModificationEdit.agreement_mod_id.is_(None),
        )
    ).one_or_none()


# ---=== Submit ===---


def test_submit_records_pending_edit_and_requested_amount(
    modified_loe_enabled, basic_user_auth_client, loaded_db, test_can, test_project, app_ctx
):
    agreement = _make_agreement(loaded_db, test_project, awarded=True, name_suffix="A")
    bli, sc = _make_bli(loaded_db, agreement, test_can, BudgetLineItemStatus.OBLIGATED)
    try:
        response = _submit_de_obligation(basic_user_auth_client, bli.id, 100000.00)
        assert response.status_code == 200, response.json

        loaded_db.refresh(bli)
        assert float(bli.amount) == 500000.00  # original never mutated
        assert float(bli.requested_de_obligation_amount) == 100000.00

        edit = _get_edit(loaded_db, bli.id)
        assert edit is not None
        assert edit.modification_type == ModificationEditType.DE_OBLIGATION
        assert float(edit.old_value) == 500000.00
        assert float(edit.new_value) == 100000.00
    finally:
        _cleanup(loaded_db, agreement.id, bli.id, sc)


def test_full_amount_de_obligation_is_accepted(
    modified_loe_enabled, basic_user_auth_client, loaded_db, test_can, test_project, app_ctx
):
    """AC2: a line can be de-obligated in full."""
    agreement = _make_agreement(loaded_db, test_project, awarded=True, name_suffix="B")
    bli, sc = _make_bli(loaded_db, agreement, test_can, BudgetLineItemStatus.OBLIGATED)
    try:
        response = _submit_de_obligation(basic_user_auth_client, bli.id, 500000.00)
        assert response.status_code == 200, response.json
        loaded_db.refresh(bli)
        assert float(bli.requested_de_obligation_amount) == 500000.00
    finally:
        _cleanup(loaded_db, agreement.id, bli.id, sc)


def test_agreement_total_nets_the_pending_de_obligation(
    modified_loe_enabled, basic_user_auth_client, loaded_db, test_can, test_project, app_ctx
):
    """OPS-6488: the Agreement Total updates immediately -- nets against the pending request --
    without mutating the real amount."""
    agreement = _make_agreement(loaded_db, test_project, awarded=True, name_suffix="C")
    bli, sc = _make_bli(loaded_db, agreement, test_can, BudgetLineItemStatus.OBLIGATED)
    try:
        assert _submit_de_obligation(basic_user_auth_client, bli.id, 100000.00).status_code == 200
        loaded_db.refresh(agreement)
        assert agreement.agreement_subtotal == 400000.00
        assert agreement.lifetime_obligated == 400000.00
    finally:
        _cleanup(loaded_db, agreement.id, bli.id, sc)


def test_editing_back_to_the_original_amount_removes_the_pending_edit(
    modified_loe_enabled, basic_user_auth_client, loaded_db, test_can, test_project, app_ctx
):
    """Per the UX team's doc: "if the amount is edited back to the original, the card is removed"."""
    agreement = _make_agreement(loaded_db, test_project, awarded=True, name_suffix="D")
    bli, sc = _make_bli(loaded_db, agreement, test_can, BudgetLineItemStatus.OBLIGATED)
    try:
        assert _submit_de_obligation(basic_user_auth_client, bli.id, 100000.00).status_code == 200
        assert _submit_de_obligation(basic_user_auth_client, bli.id, 0).status_code == 200

        loaded_db.refresh(bli)
        assert bli.requested_de_obligation_amount is None
        assert _get_edit(loaded_db, bli.id) is None
    finally:
        _cleanup(loaded_db, agreement.id, bli.id, sc)


def test_repeat_edit_replaces_rather_than_stacks(
    modified_loe_enabled, basic_user_auth_client, loaded_db, test_can, test_project, app_ctx
):
    agreement = _make_agreement(loaded_db, test_project, awarded=True, name_suffix="E")
    bli, sc = _make_bli(loaded_db, agreement, test_can, BudgetLineItemStatus.OBLIGATED)
    try:
        assert _submit_de_obligation(basic_user_auth_client, bli.id, 100000.00).status_code == 200
        assert _submit_de_obligation(basic_user_auth_client, bli.id, 150000.00).status_code == 200

        edits = loaded_db.scalars(
            select(ContractModificationEdit).where(ContractModificationEdit.budget_line_item_id == bli.id)
        ).all()
        assert len(edits) == 1
        assert float(edits[0].new_value) == 150000.00
        assert float(edits[0].old_value) == 500000.00  # original carried forward, not the first request's amount

        loaded_db.refresh(bli)
        assert float(bli.requested_de_obligation_amount) == 150000.00
    finally:
        _cleanup(loaded_db, agreement.id, bli.id, sc)


def test_submit_records_who_when_and_remote_ip(
    modified_loe_enabled, basic_user_auth_client, loaded_db, test_can, test_project, app_ctx
):
    agreement = _make_agreement(loaded_db, test_project, awarded=True, name_suffix="F")
    bli, sc = _make_bli(loaded_db, agreement, test_can, BudgetLineItemStatus.OBLIGATED)
    try:
        response = _submit_de_obligation(
            basic_user_auth_client, bli.id, 100000.00, environ_base={"REMOTE_ADDR": "10.7.8.9"}
        )
        assert response.status_code == 200, response.json

        event = loaded_db.scalars(
            select(OpsEvent)
            .where(OpsEvent.event_type == OpsEventType.SUBMIT_DE_OBLIGATION)
            .order_by(OpsEvent.id.desc())
            .limit(1)
        ).one()
        assert event.created_by == BASIC_USER_ID
        assert event.event_details["budget_line_item_id"] == bli.id
        assert event.event_details["requested_de_obligation_amount"] == 100000.00
        assert event.event_details["request.remote_addr"] == "10.7.8.9"
    finally:
        _cleanup(loaded_db, agreement.id, bli.id, sc)


# ---=== Validation ===---


def test_negative_amount_rejected(
    modified_loe_enabled, basic_user_auth_client, loaded_db, test_can, test_project, app_ctx
):
    agreement = _make_agreement(loaded_db, test_project, awarded=True, name_suffix="G")
    bli, sc = _make_bli(loaded_db, agreement, test_can, BudgetLineItemStatus.OBLIGATED)
    try:
        response = _submit_de_obligation(basic_user_auth_client, bli.id, -50.00)
        assert response.status_code == 400, response.json
        assert "requested_de_obligation_amount" in response.json["errors"]
    finally:
        _cleanup(loaded_db, agreement.id, bli.id, sc)


def test_amount_exceeding_remaining_rejected(
    modified_loe_enabled, basic_user_auth_client, loaded_db, test_can, test_project, app_ctx
):
    agreement = _make_agreement(loaded_db, test_project, awarded=True, name_suffix="H")
    bli, sc = _make_bli(loaded_db, agreement, test_can, BudgetLineItemStatus.OBLIGATED, amount=500000.00)
    try:
        response = _submit_de_obligation(basic_user_auth_client, bli.id, 500000.01)
        assert response.status_code == 400, response.json
        assert "requested_de_obligation_amount" in response.json["errors"]
    finally:
        _cleanup(loaded_db, agreement.id, bli.id, sc)


@pytest.mark.parametrize(
    "status", [BudgetLineItemStatus.DRAFT, BudgetLineItemStatus.PLANNED, BudgetLineItemStatus.IN_EXECUTION]
)
def test_non_obligated_line_rejected(
    status, modified_loe_enabled, basic_user_auth_client, loaded_db, test_can, test_project, app_ctx
):
    agreement = _make_agreement(loaded_db, test_project, awarded=True, name_suffix=f"I{status.value}")
    bli, sc = _make_bli(loaded_db, agreement, test_can, status)
    try:
        response = _submit_de_obligation(basic_user_auth_client, bli.id, 100000.00)
        assert response.status_code == 400, response.json
        assert "status" in response.json["errors"]
    finally:
        _cleanup(loaded_db, agreement.id, bli.id, sc)


def test_non_awarded_agreement_rejected(
    modified_loe_enabled, basic_user_auth_client, loaded_db, test_can, test_project, app_ctx
):
    agreement = _make_agreement(loaded_db, test_project, awarded=False, name_suffix="J")
    bli, sc = _make_bli(loaded_db, agreement, test_can, BudgetLineItemStatus.OBLIGATED)
    try:
        response = _submit_de_obligation(basic_user_auth_client, bli.id, 100000.00)
        assert response.status_code == 400, response.json
        assert "agreement_id" in response.json["errors"]
    finally:
        _cleanup(loaded_db, agreement.id, bli.id, sc)


def test_unassociated_user_rejected(
    modified_loe_enabled, division_6_director_auth_client, loaded_db, test_can, test_project, app_ctx
):
    agreement = _make_agreement(loaded_db, test_project, awarded=True, name_suffix="K")
    bli, sc = _make_bli(loaded_db, agreement, test_can, BudgetLineItemStatus.OBLIGATED)
    try:
        response = _submit_de_obligation(division_6_director_auth_client, bli.id, 100000.00)
        assert response.status_code == 403, response.json
    finally:
        _cleanup(loaded_db, agreement.id, bli.id, sc)


# ---=== Approval is not yet supported (OPS-6489) ===---


def test_approving_a_de_obligation_request_is_rejected(
    modified_loe_enabled,
    basic_user_auth_client,
    division_director_auth_client,
    loaded_db,
    test_can,
    test_project,
    app_ctx,
):
    agreement = _make_agreement(loaded_db, test_project, awarded=True, name_suffix="L")
    bli, sc = _make_bli(loaded_db, agreement, test_can, BudgetLineItemStatus.OBLIGATED)
    try:
        assert _submit_de_obligation(basic_user_auth_client, bli.id, 100000.00).status_code == 200
        mod_request_id = _submit_mod(basic_user_auth_client, agreement.id).json["id"]

        response = _review_mod(division_director_auth_client, mod_request_id, "APPROVE")
        assert response.status_code == 400, response.json

        request = loaded_db.get(ContractModificationRequest, mod_request_id)
        assert request.status == ContractModificationRequestStatus.IN_REVIEW
    finally:
        _cleanup(loaded_db, agreement.id, bli.id, sc)


def test_declining_a_de_obligation_request_puts_the_edit_back_to_pending(
    modified_loe_enabled,
    basic_user_auth_client,
    division_director_auth_client,
    loaded_db,
    test_can,
    test_project,
    app_ctx,
):
    agreement = _make_agreement(loaded_db, test_project, awarded=True, name_suffix="M")
    bli, sc = _make_bli(loaded_db, agreement, test_can, BudgetLineItemStatus.OBLIGATED)
    try:
        assert _submit_de_obligation(basic_user_auth_client, bli.id, 100000.00).status_code == 200
        mod_request_id = _submit_mod(basic_user_auth_client, agreement.id).json["id"]

        response = _review_mod(division_director_auth_client, mod_request_id, "DECLINE")
        assert response.status_code == 200, response.json

        request = loaded_db.get(ContractModificationRequest, mod_request_id)
        assert request.status == ContractModificationRequestStatus.DECLINED
        assert _get_edit(loaded_db, bli.id) is not None  # still pending, available for a new mod
    finally:
        _cleanup(loaded_db, agreement.id, bli.id, sc)
