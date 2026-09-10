"""Tests for the OPS-5892 proposed agreement title write on Step 6 award approval.

Covers ``ProcurementTrackerStepService._apply_proposed_agreement_title`` and its call site in
``_handle_award_approval``: the title the COR proposes on the Step 6 award request is written to
``Agreement.name`` exactly when Budget Team approves the award, and never before.

Two layers are used on purpose:

- The APPROVED path and the save-the-title-without-approving path go through the API so the real
  validator chain runs.
- The declined/pending and blank-title branches are called on the service directly, because
  ``AwardApprovalResponseValidationRule`` rejects any ``approval_status`` other than ``APPROVED``
  at the API boundary — the early return in ``_handle_award_approval`` is the only thing protecting
  the agreement name on those paths, so it has to be exercised where it can be reached.
"""

from datetime import date

import pytest

from models import AgreementType, User, Vendor
from models.agreements import ContractAgreement
from models.procurement_action import AwardType, ProcurementAction, ProcurementActionStatus
from models.procurement_tracker import (
    DefaultProcurementTracker,
    DefaultProcurementTrackerStep,
    ProcurementTrackerStatus,
    ProcurementTrackerStepStatus,
    ProcurementTrackerStepType,
)
from models.services_components import CLIN
from ops_api.ops.services.procurement_tracker_steps import ProcurementTrackerStepService

ORIGINAL_NAME = "Original Draft Agreement Name"
PROPOSED_TITLE = "Final Signed Award Title"
OBLIGATED_DATE = date(2024, 9, 30)


@pytest.fixture
def award_step_awaiting_approval(app_ctx, loaded_db):
    """An AWARD step carrying a proposed agreement title, awaiting Budget Team approval.

    Mirrors the real sequence: the COR entered the proposed title on the award request in an
    earlier PATCH, so it is already on the step when Budget Team responds.
    """
    vendor = Vendor(name="Vendor for proposed title tests", duns="998877665")
    loaded_db.add(vendor)
    loaded_db.flush()

    agreement = ContractAgreement(
        name=ORIGINAL_NAME,
        agreement_type=AgreementType.CONTRACT,
        project_id=1000,
        vendor_id=vendor.id,
    )
    loaded_db.add(agreement)
    loaded_db.flush()

    loaded_db.add(CLIN(agreement_id=agreement.id, number=2001, name="CLIN for proposed title tests"))

    procurement_action = ProcurementAction(
        agreement_id=agreement.id,
        award_type=AwardType.NEW_AWARD,
        status=ProcurementActionStatus.IN_PROCESS,
    )
    loaded_db.add(procurement_action)
    loaded_db.flush()

    tracker = DefaultProcurementTracker(
        agreement_id=agreement.id,
        status=ProcurementTrackerStatus.ACTIVE,
        active_step_number=6,
        procurement_action=procurement_action.id,
    )
    loaded_db.add(tracker)
    loaded_db.flush()

    step = DefaultProcurementTrackerStep(
        procurement_tracker=tracker,
        step_number=6,
        step_type=ProcurementTrackerStepType.AWARD,
        status=ProcurementTrackerStepStatus.ACTIVE,
        award_approval_requested=True,
        award_approval_requested_by=500,
        award_approval_requested_date=date.today(),
        award_approval_status=None,  # Budget Team has not responded yet
        award_agreement_title=PROPOSED_TITLE,
    )
    loaded_db.add(step)
    loaded_db.commit()

    # No manual cleanup needed — the loaded_db SAVEPOINT rollback handles it
    return {"step": step, "agreement": agreement, "procurement_action": procurement_action, "tracker": tracker}


# ---------------------------------------------------------------------------
# Approved path — through the API so the real validator chain runs
# ---------------------------------------------------------------------------


def test_award_approval_applies_proposed_title_to_agreement_name(
    budget_team_auth_client, loaded_db, award_step_awaiting_approval
):
    """Budget Team approval overwrites agreement.name with the proposed title."""
    step = award_step_awaiting_approval["step"]
    agreement = award_step_awaiting_approval["agreement"]

    response = budget_team_auth_client.patch(
        f"/api/v1/procurement-tracker-steps/{step.id}",
        json={"approval_status": "APPROVED", "obligated_date": OBLIGATED_DATE.isoformat()},
    )
    assert response.status_code == 200

    loaded_db.refresh(agreement)
    assert agreement.name == PROPOSED_TITLE


def test_proposed_title_saved_without_approval_leaves_agreement_name_unchanged(
    budget_team_auth_client, loaded_db, award_step_awaiting_approval
):
    """Saving a new proposed title while approval is still pending must not touch agreement.name.

    This is the COR editing the award request form. The name only changes at approval.
    """
    step = award_step_awaiting_approval["step"]
    agreement = award_step_awaiting_approval["agreement"]

    response = budget_team_auth_client.patch(
        f"/api/v1/procurement-tracker-steps/{step.id}",
        json={"agreement_title": "A Newly Typed Title"},
    )
    assert response.status_code == 200

    loaded_db.refresh(step)
    loaded_db.refresh(agreement)
    assert step.award_agreement_title == "A Newly Typed Title"
    assert agreement.name == ORIGINAL_NAME


# ---------------------------------------------------------------------------
# Not-approved paths — the early return in _handle_award_approval
# ---------------------------------------------------------------------------


@pytest.mark.parametrize("approval_status", ["DECLINED", "PENDING", None])
def test_award_not_approved_leaves_agreement_name_unchanged(loaded_db, award_step_awaiting_approval, approval_status):
    """Anything other than APPROVED must leave agreement.name alone.

    ``AwardApprovalResponseValidationRule`` blocks these statuses at the API boundary today, so
    this pins the service-level guard that would otherwise be the last line of defence.
    """
    step = award_step_awaiting_approval["step"]
    agreement = award_step_awaiting_approval["agreement"]
    current_user = loaded_db.get(User, 523)

    service = ProcurementTrackerStepService(loaded_db)
    service._handle_award_approval(step, approval_status, OBLIGATED_DATE, current_user)

    assert agreement.name == ORIGINAL_NAME


# ---------------------------------------------------------------------------
# Blank-title guard and trimming
# ---------------------------------------------------------------------------


@pytest.mark.parametrize("proposed_title", [None, "", "   ", "\t\n "])
def test_blank_proposed_title_leaves_agreement_name_unchanged(loaded_db, award_step_awaiting_approval, proposed_title):
    """A missing or whitespace-only proposed title must never blank out the agreement name."""
    step = award_step_awaiting_approval["step"]
    agreement = award_step_awaiting_approval["agreement"]
    step.award_agreement_title = proposed_title

    ProcurementTrackerStepService._apply_proposed_agreement_title(step, agreement)

    assert agreement.name == ORIGINAL_NAME


def test_proposed_title_is_stripped_before_being_applied(loaded_db, award_step_awaiting_approval):
    """Surrounding whitespace from the form input is trimmed off the applied name."""
    step = award_step_awaiting_approval["step"]
    agreement = award_step_awaiting_approval["agreement"]
    step.award_agreement_title = "  Padded Award Title  "

    ProcurementTrackerStepService._apply_proposed_agreement_title(step, agreement)

    assert agreement.name == "Padded Award Title"


# ---------------------------------------------------------------------------
# Awarded-agreement immutability interaction
# ---------------------------------------------------------------------------


def test_name_is_written_even_though_it_is_an_immutable_awarded_field(loaded_db, award_step_awaiting_approval):
    """The title write must still land when the agreement already reads as awarded.

    ``ContractAgreement.immutable_awarded_fields`` includes ``name``, but
    ``ImmutableAwardedFieldsRule`` is only registered on the AgreementsService update path, not in
    the Step 6 validator chain. A single PATCH that both completes the step and approves the award
    runs ``_advance_active_step_if_needed`` first, which can mark the procurement action AWARDED —
    so ``agreement.is_awarded`` can already be True when the name is assigned.

    This test pins that ordering: if the write is ever refactored to route through
    ``AgreementsService.update()``, the immutability rule would reject it and this fails.
    """
    step = award_step_awaiting_approval["step"]
    agreement = award_step_awaiting_approval["agreement"]
    procurement_action = award_step_awaiting_approval["procurement_action"]
    current_user = loaded_db.get(User, 523)

    # Simulate _advance_active_step_if_needed having already marked the action AWARDED
    procurement_action.status = ProcurementActionStatus.AWARDED
    procurement_action.date_awarded_obligated = OBLIGATED_DATE
    loaded_db.flush()

    assert "name" in agreement.immutable_awarded_fields
    assert agreement.is_awarded is True

    service = ProcurementTrackerStepService(loaded_db)
    service._handle_award_approval(step, "APPROVED", OBLIGATED_DATE, current_user)

    assert agreement.name == PROPOSED_TITLE
