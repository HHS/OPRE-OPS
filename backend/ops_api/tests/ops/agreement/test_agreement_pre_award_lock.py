"""Integration tests for the agreement-level pre-award locks (OPS-6195).

Agreement fields and services components share the BLI pre-award locks: they cannot be edited
while a Pre-Award Approval is in review, nor once it has been fully approved (DD approved +
requisition approved) until the Award request is approved. A DD decline reopens editing, and the
Budget Team is exempt.

The `auth_client` fixture is the SYSTEM_OWNER user (id 503): authorized via the SYSTEM_OWNER
association bypass but not Budget Team, so the locks apply to it.
"""

import pytest
from flask import url_for
from sqlalchemy import text

from models import (
    AgreementReason,
    AgreementType,
    ContractAgreement,
    ContractType,
    DefaultProcurementTracker,
    DefaultProcurementTrackerStep,
    ProcurementTrackerStatus,
    ProcurementTrackerStepType,
    ServicesComponent,
)

SYSTEM_OWNER_USER_ID = 503

PRE_AWARD_STEP_FIELDS = {
    "in_review": {"pre_award_approval_requested": True, "pre_award_approval_status": "PENDING"},
    "declined": {"pre_award_approval_requested": True, "pre_award_approval_status": "DECLINED"},
    "locked": {
        "pre_award_approval_requested": True,
        "pre_award_approval_status": "APPROVED",
        "pre_award_requisition_approved_by": SYSTEM_OWNER_USER_ID,
    },
}

IN_REVIEW_MESSAGE = "Cannot modify the Agreement while Pre-Award Approval is in review."
LOCKED_MESSAGE = "Cannot modify the Agreement after Pre-Award Approval has been completed."


@pytest.fixture()
def lock_agreement(loaded_db, test_project):
    agreement = ContractAgreement(
        name="Agreement Pre-Award Lock Test Agreement",
        contract_type=ContractType.FIRM_FIXED_PRICE,
        agreement_type=AgreementType.CONTRACT,
        project_id=test_project.id,
        product_service_code_id=2,
        description="Original description",
        agreement_reason=AgreementReason.NEW_REQ,
        project_officer_id=SYSTEM_OWNER_USER_ID,
        awarding_entity_id=1,
    )
    loaded_db.add(agreement)
    loaded_db.commit()
    sc = ServicesComponent(agreement_id=agreement.id, number=1, optional=False, description="Original SC")
    loaded_db.add(sc)
    loaded_db.commit()

    yield agreement, sc

    loaded_db.rollback()
    loaded_db.execute(text("DELETE FROM services_component WHERE agreement_id = :id"), {"id": agreement.id})
    loaded_db.commit()
    loaded_db.delete(agreement)
    loaded_db.commit()


@pytest.fixture()
def make_pre_award(loaded_db):
    """Attach an ACTIVE tracker whose PRE_AWARD step is in the given state. Tracker rows are
    versioned, so teardown uses raw SQL (see test_edit_executing_budget_line.py)."""
    created = []

    def _make(agreement_id, state):
        tracker = DefaultProcurementTracker(agreement_id=agreement_id, status=ProcurementTrackerStatus.ACTIVE)
        loaded_db.add(tracker)
        loaded_db.flush()
        step = DefaultProcurementTrackerStep(
            procurement_tracker_id=tracker.id,
            step_number=5,
            step_type=ProcurementTrackerStepType.PRE_AWARD,
            **PRE_AWARD_STEP_FIELDS[state],
        )
        loaded_db.add(step)
        loaded_db.commit()
        created.append((tracker.id, step.id))

    yield _make

    loaded_db.rollback()
    for tracker_id, step_id in created:
        loaded_db.execute(text("DELETE FROM procurement_tracker_step WHERE id = :id"), {"id": step_id})
        loaded_db.execute(text("DELETE FROM default_procurement_tracker WHERE id = :id"), {"id": tracker_id})
        loaded_db.execute(text("DELETE FROM procurement_tracker WHERE id = :id"), {"id": tracker_id})
    loaded_db.commit()


@pytest.mark.parametrize("state,expected_message", [("in_review", IN_REVIEW_MESSAGE), ("locked", LOCKED_MESSAGE)])
def test_agreement_patch_blocked_by_pre_award(
    state, expected_message, auth_client, lock_agreement, make_pre_award, app_ctx
):
    agreement, _ = lock_agreement
    make_pre_award(agreement.id, state)

    response = auth_client.patch(url_for("api.agreements-item", id=agreement.id), json={"description": "Blocked"})

    assert response.status_code == 400
    assert expected_message in str(response.json)


@pytest.mark.parametrize("state", [None, "declined"])
def test_agreement_patch_allowed_without_pre_award_lock(
    state, auth_client, lock_agreement, make_pre_award, loaded_db, app_ctx
):
    """No Pre-Award request, or a DD-declined one, leaves the agreement editable."""
    agreement, _ = lock_agreement
    if state:
        make_pre_award(agreement.id, state)

    response = auth_client.patch(url_for("api.agreements-item", id=agreement.id), json={"description": "Edited"})

    assert response.status_code == 200, response.json
    loaded_db.refresh(agreement)
    assert agreement.description == "Edited"


def test_agreement_patch_budget_team_exempt_from_pre_award_lock(
    budget_team_auth_client, lock_agreement, make_pre_award, app_ctx
):
    agreement, _ = lock_agreement
    make_pre_award(agreement.id, "locked")

    response = budget_team_auth_client.patch(
        url_for("api.agreements-item", id=agreement.id), json={"description": "Budget Team edit"}
    )

    assert response.status_code == 200, response.json


@pytest.mark.parametrize("state,expected_message", [("in_review", IN_REVIEW_MESSAGE), ("locked", LOCKED_MESSAGE)])
def test_services_component_edits_blocked_by_pre_award(
    state, expected_message, auth_client, lock_agreement, make_pre_award, app_ctx
):
    agreement, sc = lock_agreement
    make_pre_award(agreement.id, state)

    update = auth_client.patch(url_for("api.services-component-item", id=sc.id), json={"description": "Blocked"})
    create = auth_client.post(
        url_for("api.services-component-group"), json={"agreement_id": agreement.id, "number": 2, "optional": False}
    )
    delete = auth_client.delete(url_for("api.services-component-item", id=sc.id))

    for response in (update, create, delete):
        assert response.status_code == 400
        assert expected_message in str(response.json)


def test_services_component_patch_allowed_after_pre_award_declined(
    auth_client, lock_agreement, make_pre_award, app_ctx
):
    agreement, sc = lock_agreement
    make_pre_award(agreement.id, "declined")

    response = auth_client.patch(url_for("api.services-component-item", id=sc.id), json={"description": "Edited"})

    assert response.status_code == 200, response.json
    assert response.json["description"] == "Edited"
