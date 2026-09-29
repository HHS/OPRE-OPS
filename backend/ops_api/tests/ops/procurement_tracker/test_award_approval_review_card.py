"""Integration tests for pending-award-approvals endpoint (OPS-2280).

These tests require a running Docker stack (pytest-docker).
Run: cd backend/ops_api && pipenv run pytest tests/ops/procurement_tracker/test_award_approval_review_card.py
"""

import uuid
from datetime import date
from decimal import ROUND_HALF_UP, Decimal

import pytest

from models import (
    AgreementReason,
    AgreementType,
    AwardType,
    BudgetLineItemStatus,
    ContractAgreement,
    ContractBudgetLineItem,
    ContractType,
    ProcurementAction,
    ProcurementActionStatus,
    ProcurementTrackerStatus,
)
from models.procurement_tracker import (
    DefaultProcurementTracker,
    DefaultProcurementTrackerStep,
    ProcurementTracker,
    ProcurementTrackerStepStatus,
    ProcurementTrackerStepType,
)


@pytest.fixture
def test_pending_award_step(app_ctx, loaded_db):
    """Create a step where COR requested award approval but BT hasn't responded yet."""
    tracker = loaded_db.get(ProcurementTracker, 1)

    step = DefaultProcurementTrackerStep(
        procurement_tracker=tracker,
        step_number=996,
        step_type=ProcurementTrackerStepType.AWARD,
        status=ProcurementTrackerStepStatus.ACTIVE,
        award_approval_requested=True,
        award_approval_requested_by=500,
        award_approval_requested_date=date.today(),
        award_approval_status=None,  # Not yet responded
        award_contract_number="GS-123-456",
        award_amount=1500000.00,
        award_date=date(2024, 9, 30),
    )
    loaded_db.add(step)
    loaded_db.commit()

    yield step

    loaded_db.rollback()
    try:
        from models.procurement_tracker import ProcurementTrackerStep

        fresh = loaded_db.get(ProcurementTrackerStep, step.id)
        if fresh:
            loaded_db.delete(fresh)
            loaded_db.commit()
    except Exception:
        loaded_db.rollback()


@pytest.fixture
def test_already_approved_award_step(app_ctx, loaded_db):
    """Create a step where award approval was already approved — should NOT appear in pending."""
    tracker = loaded_db.get(ProcurementTracker, 1)

    step = DefaultProcurementTrackerStep(
        procurement_tracker=tracker,
        step_number=995,
        step_type=ProcurementTrackerStepType.AWARD,
        status=ProcurementTrackerStepStatus.ACTIVE,
        award_approval_requested=True,
        award_approval_requested_by=500,
        award_approval_requested_date=date.today(),
        award_approval_status="APPROVED",  # Already approved
        award_approval_responded_by=521,
    )
    loaded_db.add(step)
    loaded_db.commit()

    yield step

    loaded_db.rollback()
    try:
        from models.procurement_tracker import ProcurementTrackerStep

        fresh = loaded_db.get(ProcurementTrackerStep, step.id)
        if fresh:
            loaded_db.delete(fresh)
            loaded_db.commit()
    except Exception:
        loaded_db.rollback()


def test_pending_award_approvals_budget_team_sees_pending(budget_team_auth_client, test_pending_award_step, loaded_db):
    """Budget team sees AWARD steps where approval is requested but not yet responded."""
    response = budget_team_auth_client.get("/api/v1/procurement-tracker-steps/pending-award-approvals/")
    assert response.status_code == 200

    data = response.json
    step_ids = [s["id"] for s in data]
    assert test_pending_award_step.id in step_ids


def test_pending_award_approvals_excludes_already_approved(
    budget_team_auth_client, test_already_approved_award_step, loaded_db
):
    """Already-approved steps should NOT appear in pending."""
    response = budget_team_auth_client.get("/api/v1/procurement-tracker-steps/pending-award-approvals/")
    assert response.status_code == 200

    data = response.json
    step_ids = [s["id"] for s in data]
    assert test_already_approved_award_step.id not in step_ids


def test_pending_award_approvals_non_budget_team_gets_empty(client, test_pending_award_step, loaded_db):
    """Unauthenticated/non-budget-team user gets 401, not the list."""
    response = client.get("/api/v1/procurement-tracker-steps/pending-award-approvals/")
    assert response.status_code == 401


def test_pending_award_approvals_includes_award_fields(budget_team_auth_client, test_pending_award_step, loaded_db):
    """Response must include contract_number, award_amount, award_date for the card."""
    response = budget_team_auth_client.get("/api/v1/procurement-tracker-steps/pending-award-approvals/")
    assert response.status_code == 200

    matching = [s for s in response.json if s["id"] == test_pending_award_step.id]
    assert len(matching) == 1
    step_data = matching[0]

    assert step_data.get("contract_number") == "GS-123-456"
    assert step_data.get("award_amount") == 1500000.00
    assert step_data.get("award_date") == "2024-09-30"
    assert step_data.get("approval_requested_by") == 500


def test_approve_award_without_obligated_date_is_rejected(budget_team_auth_client, test_pending_award_step, loaded_db):
    """Approving an AWARD step without an obligated date must be rejected (OPS-2280).

    The obligated date must never be assumed to be today — it is first documented elsewhere.
    """
    response = budget_team_auth_client.patch(
        f"/api/v1/procurement-tracker-steps/{test_pending_award_step.id}",
        json={"approval_status": "APPROVED"},
    )
    assert response.status_code == 400
    assert "obligated_date" in str(response.json)


def test_approve_award_with_obligated_date_succeeds(budget_team_auth_client, test_pending_award_step, loaded_db):
    """Approving an AWARD step with an obligated date succeeds and records the date."""
    response = budget_team_auth_client.patch(
        f"/api/v1/procurement-tracker-steps/{test_pending_award_step.id}",
        json={"approval_status": "APPROVED", "obligated_date": "2024-09-30"},
    )
    assert response.status_code == 200

    loaded_db.refresh(test_pending_award_step)
    assert test_pending_award_step.award_approval_status == "APPROVED"


# ---------------------------------------------------------------------------
# agreement_total snapshot at time of award (OPS-5379)
#
# test_pending_award_step is tied to tracker 1, whose procurement_action is seeded
# action 100 for agreement 13 ("CONTRACT #13: Procurement Tracker Test Contract").
# That agreement has three seeded budget lines, all on the same CAN's procurement
# shop (IBC, fee 4.8%): $250,000 DRAFT, $150,000 PLANNED, $200,000 IN_EXECUTION.
# Expected snapshot = (150,000 + 200,000) * 1.048 = $366,800.00 — the DRAFT line is
# excluded, and a naive all-BLI sum would instead be $628,800.00.
# ---------------------------------------------------------------------------


@pytest.fixture
def test_zero_bli_award_step(app_ctx, loaded_db):
    """A NEW_AWARD action for a fresh agreement with no budget lines at all.

    Its live Agreement.agreement_total is $0, so approving it must leave the
    ProcurementAction.agreement_total snapshot NULL rather than storing 0.00
    (Decision 6 — a stored $0 would be indistinguishable from "worth nothing"
    and, under write-once, permanently uncorrectable).
    """
    agreement = ContractAgreement(
        name=f"OPS-5379 Zero-BLI Award Test {uuid.uuid4()}",
        description="Agreement with no budget lines for the zero-total snapshot test",
        product_service_code_id=1,
        agreement_reason=AgreementReason.NEW_REQ,
        project_officer_id=503,
        agreement_type=AgreementType.CONTRACT,
        awarding_entity_id=4,
        contract_type=ContractType.FIRM_FIXED_PRICE,
        created_by=503,
    )
    loaded_db.add(agreement)
    loaded_db.flush()

    action = ProcurementAction(
        agreement_id=agreement.id,
        award_type=AwardType.NEW_AWARD,
        status=ProcurementActionStatus.PLANNED,
        created_by=503,
    )
    loaded_db.add(action)
    loaded_db.flush()

    tracker = DefaultProcurementTracker.create_with_steps(
        agreement_id=agreement.id,
        status=ProcurementTrackerStatus.ACTIVE,
        procurement_action=action.id,
    )
    loaded_db.add(tracker)
    loaded_db.commit()

    award_step = next(s for s in tracker.steps if s.step_type == ProcurementTrackerStepType.AWARD)
    award_step.status = ProcurementTrackerStepStatus.ACTIVE
    award_step.award_approval_requested = True
    award_step.award_approval_requested_by = 500
    award_step.award_approval_requested_date = date.today()
    award_step.award_approval_status = None
    loaded_db.commit()

    yield award_step, action

    loaded_db.rollback()


def test_approve_award_snapshots_agreement_total_excluding_draft(
    budget_team_auth_client, test_pending_award_step, loaded_db
):
    """Approving the award snapshots the non-DRAFT total (amount + fee) onto the
    procurement action, excluding the $250,000 DRAFT budget line."""
    response = budget_team_auth_client.patch(
        f"/api/v1/procurement-tracker-steps/{test_pending_award_step.id}",
        json={"approval_status": "APPROVED", "obligated_date": "2024-09-30"},
    )
    assert response.status_code == 200

    action = loaded_db.get(ProcurementAction, 100)
    loaded_db.refresh(action)
    assert action.agreement_total == Decimal("366800.00")


def test_approve_award_snapshot_is_write_once(budget_team_auth_client, test_pending_award_step, loaded_db):
    """Once written, the snapshot must never change — even if a budget line on the
    agreement is edited afterward."""
    response = budget_team_auth_client.patch(
        f"/api/v1/procurement-tracker-steps/{test_pending_award_step.id}",
        json={"approval_status": "APPROVED", "obligated_date": "2024-09-30"},
    )
    assert response.status_code == 200

    action = loaded_db.get(ProcurementAction, 100)
    loaded_db.refresh(action)
    original_total = action.agreement_total
    assert original_total == Decimal("366800.00")

    planned_bli = next(bli for bli in action.agreement.budget_line_items if bli.status == BudgetLineItemStatus.PLANNED)
    planned_bli.amount = Decimal("999999.00")
    loaded_db.commit()

    loaded_db.refresh(action)
    assert action.agreement_total == original_total


def test_approve_award_with_zero_non_draft_total_leaves_snapshot_null(
    budget_team_auth_client, test_zero_bli_award_step, loaded_db
):
    """An agreement with no non-DRAFT budget lines has a $0 live total; approving must
    leave agreement_total NULL rather than storing 0.00."""
    award_step, action = test_zero_bli_award_step

    response = budget_team_auth_client.patch(
        f"/api/v1/procurement-tracker-steps/{award_step.id}",
        json={"approval_status": "APPROVED", "obligated_date": "2024-09-30"},
    )
    assert response.status_code == 200

    loaded_db.refresh(action)
    assert action.status == ProcurementActionStatus.AWARDED
    assert action.agreement_total is None


def test_approve_award_snapshot_spans_multiple_fiscal_years_and_quantizes(
    budget_team_auth_client, test_pending_award_step, loaded_db
):
    """The snapshot covers every non-DRAFT budget line agreement-wide — not just those
    in the same fiscal year as the award — and rounds sub-cent fee residue
    (ROUND_HALF_UP), which the seeded whole-dollar amounts alone never exercise."""
    action = loaded_db.get(ProcurementAction, 100)
    agreement = action.agreement

    extra_bli = ContractBudgetLineItem(
        agreement_id=agreement.id,
        can_id=507,
        amount=Decimal("1000.33"),
        status=BudgetLineItemStatus.PLANNED,
        date_needed=date(2030, 1, 1),  # a different fiscal year than the other seeded BLIs
        created_by=503,
    )
    loaded_db.add(extra_bli)
    loaded_db.commit()

    response = budget_team_auth_client.patch(
        f"/api/v1/procurement-tracker-steps/{test_pending_award_step.id}",
        json={"approval_status": "APPROVED", "obligated_date": "2024-09-30"},
    )
    assert response.status_code == 200

    loaded_db.refresh(action)
    expected = (Decimal("150000") + Decimal("200000") + Decimal("1000.33")) * (
        Decimal("1") + Decimal("4.8") / Decimal("100")
    )
    expected = expected.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    assert action.agreement_total == expected


def test_approve_award_snapshot_surfaces_as_contract_total_in_award_history(budget_team_auth_client, loaded_db):
    """The snapshot flows through to the Awards & Modifications tab's Contract Total —
    closing the loop on the user-visible bug this change fixes.

    Deliberately approves the seeded step 6 directly rather than reusing
    test_pending_award_step's extra AWARD step (step_number=996): tracker.steps is
    ordered by step_number, so ProcurementTracker.get_step(AWARD) — which the
    award-history read side uses to decide whether a cycle is "approved" — always
    resolves to step 6 first. Approving the higher-numbered step instead would leave
    step 6's award_approval_status null and the read side would report no history at
    all, even though the write side had already snapshotted the total.
    """
    tracker = loaded_db.get(ProcurementTracker, 1)
    seeded_award_step = tracker.get_step(ProcurementTrackerStepType.AWARD)

    response = budget_team_auth_client.patch(
        f"/api/v1/procurement-tracker-steps/{seeded_award_step.id}",
        json={"approval_status": "APPROVED", "obligated_date": "2024-09-30"},
    )
    assert response.status_code == 200

    history_response = budget_team_auth_client.get("/api/v1/agreements/13/award-history/")
    assert history_response.status_code == 200

    records = history_response.json["data"]
    assert len(records) == 1
    assert records[0]["contract_total"] == "366800.00"
