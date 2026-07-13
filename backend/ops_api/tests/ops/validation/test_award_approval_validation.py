"""Unit tests for award approval validation rules (OPS-2280).

Tests AwardApprovalResponseAuthorizationRule, AwardApprovalResponseValidationRule,
and NoUpdatingCompletedProcurementStepRule (AWARD carve-out).
No DB or Docker required.
"""

from unittest.mock import MagicMock

import pytest

from models.procurement_tracker import ProcurementTrackerStepStatus, ProcurementTrackerStepType
from ops_api.ops.validation.context import ValidationContext
from ops_api.ops.validation.rules.procurement_tracker_step import (
    AwardApprovalResponseAuthorizationRule,
    AwardApprovalResponseValidationRule,
    NoUpdatingCompletedProcurementStepRule,
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_role(name):
    role = MagicMock()
    role.name = name
    return role


def _make_context(user_id=521, roles=None, updated_fields=None, db_session=None):
    user = MagicMock()
    user.id = user_id
    user.roles = [_make_role(r) for r in (roles or [])]

    session = db_session or MagicMock()
    session.get.return_value = user

    context = MagicMock(spec=ValidationContext)
    context.user = user
    context.db_session = session
    context.updated_fields = updated_fields or {}
    return context


def _make_award_step(approval_requested=True, approval_status=None):
    agreement = MagicMock()
    agreement.budget_line_items = []

    tracker = MagicMock()
    tracker.agreement = agreement

    step = MagicMock()
    step.step_type = ProcurementTrackerStepType.AWARD
    step.id = 100
    step.procurement_tracker = tracker
    step.award_approval_requested = approval_requested
    step.award_approval_status = approval_status
    return step


def _make_pre_award_step():
    step = MagicMock()
    step.step_type = ProcurementTrackerStepType.PRE_AWARD
    step.pre_award_approval_requested = True
    step.pre_award_approval_status = None
    return step


# ---------------------------------------------------------------------------
# AwardApprovalResponseAuthorizationRule
# ---------------------------------------------------------------------------


class TestAwardApprovalResponseAuthorizationRule:
    """Only BUDGET_TEAM and SYSTEM_OWNER can respond to award approval requests."""

    rule = AwardApprovalResponseAuthorizationRule()

    def test_passes_for_non_award_step(self):
        step = _make_pre_award_step()
        ctx = _make_context(updated_fields={"approval_status": "APPROVED"})
        # Should not raise for PRE_AWARD steps
        self.rule.validate(step, ctx)

    def test_passes_when_approval_status_not_updated(self):
        step = _make_award_step()
        ctx = _make_context(updated_fields={"reviewer_notes": "some notes"})
        self.rule.validate(step, ctx)

    def test_budget_team_user_passes(self):
        step = _make_award_step()
        ctx = _make_context(roles=["BUDGET_TEAM"], updated_fields={"approval_status": "APPROVED"})
        self.rule.validate(step, ctx)  # Should not raise

    def test_system_owner_passes(self):
        step = _make_award_step()
        ctx = _make_context(roles=["SYSTEM_OWNER"], updated_fields={"approval_status": "APPROVED"})
        self.rule.validate(step, ctx)  # Should not raise

    def test_reviewer_approver_not_authorized(self):
        from ops_api.ops.services.ops_service import AuthorizationError

        step = _make_award_step()
        ctx = _make_context(roles=["REVIEWER_APPROVER"], updated_fields={"approval_status": "APPROVED"})
        with pytest.raises(AuthorizationError):
            self.rule.validate(step, ctx)

    def test_no_role_not_authorized(self):
        from ops_api.ops.services.ops_service import AuthorizationError

        step = _make_award_step()
        ctx = _make_context(roles=[], updated_fields={"approval_status": "APPROVED"})
        with pytest.raises(AuthorizationError):
            self.rule.validate(step, ctx)


# ---------------------------------------------------------------------------
# AwardApprovalResponseValidationRule
# ---------------------------------------------------------------------------


class TestAwardApprovalResponseValidationRule:
    """Validates award approval response state: must be requested, must not be already processed."""

    rule = AwardApprovalResponseValidationRule()

    def test_passes_for_non_award_step(self):
        step = _make_pre_award_step()
        ctx = _make_context(updated_fields={"approval_status": "APPROVED"})
        self.rule.validate(step, ctx)

    def test_passes_when_approval_status_not_updated(self):
        step = _make_award_step()
        ctx = _make_context(updated_fields={"reviewer_notes": "notes"})
        self.rule.validate(step, ctx)

    def test_passes_when_requested_and_pending(self):
        step = _make_award_step(approval_requested=True, approval_status=None)
        ctx = _make_context(updated_fields={"approval_status": "APPROVED"})
        self.rule.validate(step, ctx)  # Should not raise

    def test_raises_when_approval_not_requested(self):
        from ops_api.ops.services.ops_service import ValidationError

        step = _make_award_step(approval_requested=False, approval_status=None)
        ctx = _make_context(updated_fields={"approval_status": "APPROVED"})
        with pytest.raises(ValidationError):
            self.rule.validate(step, ctx)

    def test_raises_when_already_approved(self):
        from ops_api.ops.services.ops_service import ValidationError

        step = _make_award_step(approval_requested=True, approval_status="APPROVED")
        ctx = _make_context(updated_fields={"approval_status": "APPROVED"})
        with pytest.raises(ValidationError):
            self.rule.validate(step, ctx)

    def test_raises_when_already_declined(self):
        from ops_api.ops.services.ops_service import ValidationError

        step = _make_award_step(approval_requested=True, approval_status="DECLINED")
        ctx = _make_context(updated_fields={"approval_status": "APPROVED"})
        with pytest.raises(ValidationError):
            self.rule.validate(step, ctx)

    def test_raises_when_declining_without_reviewer_notes(self):
        from ops_api.ops.services.ops_service import ValidationError

        step = _make_award_step(approval_requested=True, approval_status=None)
        ctx = _make_context(updated_fields={"approval_status": "DECLINED"})
        with pytest.raises(ValidationError) as exc_info:
            self.rule.validate(step, ctx)
        assert "reviewer_notes" in exc_info.value.validation_errors

    def test_raises_when_declining_with_blank_reviewer_notes(self):
        from ops_api.ops.services.ops_service import ValidationError

        step = _make_award_step(approval_requested=True, approval_status=None)
        ctx = _make_context(updated_fields={"approval_status": "DECLINED", "reviewer_notes": "   "})
        with pytest.raises(ValidationError) as exc_info:
            self.rule.validate(step, ctx)
        assert "reviewer_notes" in exc_info.value.validation_errors

    def test_passes_when_declining_with_reviewer_notes(self):
        step = _make_award_step(approval_requested=True, approval_status=None)
        ctx = _make_context(updated_fields={"approval_status": "DECLINED", "reviewer_notes": "Needs revision."})
        self.rule.validate(step, ctx)  # Should not raise


# ---------------------------------------------------------------------------
# NoUpdatingCompletedProcurementStepRule — AWARD carve-out
# ---------------------------------------------------------------------------


def _make_completed_award_step():
    step = MagicMock()
    step.step_type = ProcurementTrackerStepType.AWARD
    step.status = ProcurementTrackerStepStatus.COMPLETED
    return step


def _make_completed_pre_award_step():
    step = MagicMock()
    step.step_type = ProcurementTrackerStepType.PRE_AWARD
    step.status = ProcurementTrackerStepStatus.COMPLETED
    return step


class TestNoUpdatingCompletedProcurementStepRuleAwardCarveOut:
    """AWARD steps in COMPLETED status should still accept approval-only field patches."""

    rule = NoUpdatingCompletedProcurementStepRule()

    def test_passes_for_active_step(self):
        step = MagicMock()
        step.status = ProcurementTrackerStepStatus.ACTIVE
        step.step_type = ProcurementTrackerStepType.AWARD
        ctx = _make_context(updated_fields={"approval_status": "APPROVED"})
        self.rule.validate(step, ctx)  # Should not raise

    def test_passes_for_completed_award_step_with_approval_status_only(self):
        step = _make_completed_award_step()
        ctx = _make_context(updated_fields={"approval_status": "APPROVED"})
        self.rule.validate(step, ctx)  # Should not raise

    def test_passes_for_completed_award_step_with_approval_fields(self):
        step = _make_completed_award_step()
        ctx = _make_context(
            updated_fields={
                "approval_status": "DECLINED",
                "reviewer_notes": "See notes.",
                "obligated_date": "2026-07-01",
            }
        )
        self.rule.validate(step, ctx)  # Should not raise

    def test_raises_for_completed_award_step_with_non_approval_field(self):
        from ops_api.ops.services.ops_service import ValidationError

        step = _make_completed_award_step()
        ctx = _make_context(updated_fields={"status": "IN_PROGRESS"})
        with pytest.raises(ValidationError):
            self.rule.validate(step, ctx)

    def test_raises_for_completed_award_step_with_mixed_fields(self):
        from ops_api.ops.services.ops_service import ValidationError

        step = _make_completed_award_step()
        ctx = _make_context(updated_fields={"approval_status": "APPROVED", "status": "IN_PROGRESS"})
        with pytest.raises(ValidationError):
            self.rule.validate(step, ctx)

    def test_raises_for_completed_non_award_step_with_approval_fields(self):
        from ops_api.ops.services.ops_service import ValidationError

        step = _make_completed_pre_award_step()
        ctx = _make_context(updated_fields={"approval_status": "APPROVED"})
        with pytest.raises(ValidationError):
            self.rule.validate(step, ctx)
