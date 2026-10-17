"""Integration tests for the Modified LOE amount-edit carve-out (OPS-3072, slice 1).

Opens a narrow path for a non-superuser to edit the *amount* of an OBLIGATED Budget Line
Item once its agreement is Awarded, behind the ``ENABLE_MODIFIED_LOE_EDITS`` flag. The edit
still flows through the existing BudgetLineItemChangeRequest / Division Director approval
pipeline unchanged -- only the upfront "not in an editable state" rejection is bypassed.

The resulting (and every other) BudgetLineItemChangeRequest also starts reporting
``requires_contract_modification`` whenever its Agreement.is_awarded is True, independent of
the specific BLI's own status (Decision 1: a modified LOE is "anything that changes money or
time on the awarded contract," not just an OBLIGATED-specific flag).

``test_can`` (CAN 500) is managed by division 5; ``division_director_auth_client`` (user 522)
is that division's director, matching the existing pattern in
``test_delete_budget_line_change_request.py``.
"""

import datetime

import pytest
from flask import url_for
from sqlalchemy import text

from models import (
    AgreementReason,
    AgreementType,
    AwardType,
    BudgetLineItemChangeRequest,
    BudgetLineItemStatus,
    ChangeRequestStatus,
    ContractAgreement,
    ContractBudgetLineItem,
    ContractType,
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


@pytest.fixture()
def modified_loe_disabled(app):
    """Turn ENABLE_MODIFIED_LOE_EDITS OFF for the duration of a test (regression baseline)."""
    original = app.config.get("ENABLE_MODIFIED_LOE_EDITS", False)
    app.config["ENABLE_MODIFIED_LOE_EDITS"] = False
    yield
    app.config["ENABLE_MODIFIED_LOE_EDITS"] = original


def _make_agreement(loaded_db, test_project, *, awarded: bool, name_suffix: str):
    agreement = ContractAgreement(
        name=f"Modified LOE Test Agreement {name_suffix}",
        contract_number=f"CTMLOE{name_suffix}",
        contract_type=ContractType.FIRM_FIXED_PRICE,
        agreement_type=AgreementType.CONTRACT,
        project_id=test_project.id,
        product_service_code_id=2,
        description="Agreement for the OPS-3072 modified-LOE amount-edit tests",
        agreement_reason=AgreementReason.NEW_REQ,
        project_officer_id=SYSTEM_OWNER_USER_ID,
        awarding_entity_id=1,
    )
    loaded_db.add(agreement)
    loaded_db.flush()

    basic_user = loaded_db.get(User, BASIC_USER_ID)
    agreement.team_members.append(basic_user)

    if awarded:
        procurement_action = ProcurementAction(
            agreement_id=agreement.id,
            status=ProcurementActionStatus.AWARDED,
            award_type=AwardType.NEW_AWARD,
        )
        loaded_db.add(procurement_action)

    loaded_db.commit()
    loaded_db.refresh(agreement)
    return agreement


def _make_bli(loaded_db, agreement, test_can, status):
    sc = ServicesComponent(agreement_id=agreement.id, number=1, optional=False)
    loaded_db.add(sc)
    loaded_db.commit()

    bli = ContractBudgetLineItem(
        agreement_id=agreement.id,
        line_description="Modified LOE test BLI",
        amount=500000.00,
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
    """Mirrors test_delete_budget_line_change_request.py's cleanup: remove any change
    request first (FK), then the BLI, the services component, and finally the agreement."""
    loaded_db.rollback()
    loaded_db.execute(text("DELETE FROM change_request WHERE budget_line_item_id = :id"), {"id": bli_id})
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


# ---=== Flag ON, agreement Awarded, OBLIGATED BLI ===---


def test_obligated_amount_edit_on_awarded_agreement_creates_cr_when_flag_on(
    modified_loe_enabled,
    basic_user_auth_client,
    division_director_auth_client,
    loaded_db,
    test_can,
    test_project,
    app_ctx,
):
    agreement = _make_agreement(loaded_db, test_project, awarded=True, name_suffix="A")
    bli, sc = _make_bli(loaded_db, agreement, test_can, BudgetLineItemStatus.OBLIGATED)
    try:
        response = basic_user_auth_client.patch(
            url_for("api.budget-line-items-item", id=bli.id),
            json={"amount": 600000.00},
        )
        assert response.status_code == 202, response.json

        crs = (
            loaded_db.query(BudgetLineItemChangeRequest)
            .filter(BudgetLineItemChangeRequest.budget_line_item_id == bli.id)
            .all()
        )
        assert len(crs) == 1
        cr = crs[0]
        assert cr.status == ChangeRequestStatus.IN_REVIEW
        assert cr.has_budget_change is True
        assert cr.requires_contract_modification is True
        assert cr.to_dict()["requires_contract_modification"] is True

        # Still-unchanged until approved.
        loaded_db.refresh(bli)
        assert float(bli.amount) == 500000.00

        # Approves through the ordinary CR pipeline, unchanged.
        approve = division_director_auth_client.patch(
            url_for("api.change-requests-item", id=cr.id),
            json={"action": "APPROVE"},
        )
        assert approve.status_code == 200
        loaded_db.refresh(bli)
        assert float(bli.amount) == 600000.00

        updated_cr = loaded_db.get(BudgetLineItemChangeRequest, cr.id)
        assert updated_cr.status == ChangeRequestStatus.APPROVED
        assert updated_cr.requires_contract_modification is True
    finally:
        _cleanup(loaded_db, agreement.id, bli.id, sc)


def test_obligated_amount_edit_rejected_when_flag_off(
    modified_loe_disabled, basic_user_auth_client, loaded_db, test_can, test_project, app_ctx
):
    """Regression pin: identical scenario, flag off -> unchanged rejection."""
    agreement = _make_agreement(loaded_db, test_project, awarded=True, name_suffix="B")
    bli, sc = _make_bli(loaded_db, agreement, test_can, BudgetLineItemStatus.OBLIGATED)
    try:
        response = basic_user_auth_client.patch(
            url_for("api.budget-line-items-item", id=bli.id),
            json={"amount": 600000.00},
        )
        assert response.status_code == 400
        assert response.json["errors"]["status"] == "Budget Line Item is not in an editable state."
    finally:
        _cleanup(loaded_db, agreement.id, bli.id, sc)


def test_obligated_edit_rejected_when_flag_on_but_agreement_not_awarded(
    modified_loe_enabled, basic_user_auth_client, loaded_db, test_can, test_project, app_ctx
):
    """Flag on alone isn't enough -- the agreement must actually be Awarded."""
    agreement = _make_agreement(loaded_db, test_project, awarded=False, name_suffix="C")
    bli, sc = _make_bli(loaded_db, agreement, test_can, BudgetLineItemStatus.OBLIGATED)
    try:
        response = basic_user_auth_client.patch(
            url_for("api.budget-line-items-item", id=bli.id),
            json={"amount": 600000.00},
        )
        assert response.status_code == 400
        assert response.json["errors"]["status"] == "Budget Line Item is not in an editable state."
    finally:
        _cleanup(loaded_db, agreement.id, bli.id, sc)


def test_obligated_edit_rejected_when_other_fields_included(
    modified_loe_enabled, basic_user_auth_client, loaded_db, test_can, test_cans, test_project, app_ctx
):
    """Field-scoping holds: amount + can_id together on an OBLIGATED BLI still rejected --
    CAN/date_needed on OBLIGATED aren't part of this slice."""
    agreement = _make_agreement(loaded_db, test_project, awarded=True, name_suffix="D")
    bli, sc = _make_bli(loaded_db, agreement, test_can, BudgetLineItemStatus.OBLIGATED)
    try:
        response = basic_user_auth_client.patch(
            url_for("api.budget-line-items-item", id=bli.id),
            json={"amount": 600000.00, "can_id": test_cans[1].id},
        )
        assert response.status_code == 400
        assert response.json["errors"]["status"] == "Budget Line Item is not in an editable state."
    finally:
        _cleanup(loaded_db, agreement.id, bli.id, sc)


# ---=== requires_contract_modification widening (Decision 1) ===---


@pytest.mark.parametrize("status", [BudgetLineItemStatus.PLANNED, BudgetLineItemStatus.IN_EXECUTION])
def test_requires_contract_modification_true_on_awarded_agreement_regardless_of_bli_status(
    status, basic_user_auth_client, loaded_db, test_can, test_project, app_ctx
):
    """A PLANNED/IN_EXECUTION amount edit already works today with zero flag involvement --
    on an Awarded agreement it now additionally reports requires_contract_modification: true."""
    agreement = _make_agreement(loaded_db, test_project, awarded=True, name_suffix=f"E{status.value}")
    bli, sc = _make_bli(loaded_db, agreement, test_can, status)
    try:
        response = basic_user_auth_client.patch(
            url_for("api.budget-line-items-item", id=bli.id),
            json={"amount": 600000.00},
        )
        assert response.status_code == 202, response.json

        cr = (
            loaded_db.query(BudgetLineItemChangeRequest)
            .filter(BudgetLineItemChangeRequest.budget_line_item_id == bli.id)
            .one()
        )
        assert cr.requires_contract_modification is True
    finally:
        _cleanup(loaded_db, agreement.id, bli.id, sc)


def test_requires_contract_modification_false_on_non_awarded_agreement(
    basic_user_auth_client, loaded_db, test_can, test_project, app_ctx
):
    """Regression pin for the common, non-mod case: unchanged agreement -> flag reads false."""
    agreement = _make_agreement(loaded_db, test_project, awarded=False, name_suffix="F")
    bli, sc = _make_bli(loaded_db, agreement, test_can, BudgetLineItemStatus.PLANNED)
    try:
        response = basic_user_auth_client.patch(
            url_for("api.budget-line-items-item", id=bli.id),
            json={"amount": 600000.00},
        )
        assert response.status_code == 202, response.json

        cr = (
            loaded_db.query(BudgetLineItemChangeRequest)
            .filter(BudgetLineItemChangeRequest.budget_line_item_id == bli.id)
            .one()
        )
        assert cr.requires_contract_modification is False
    finally:
        _cleanup(loaded_db, agreement.id, bli.id, sc)
