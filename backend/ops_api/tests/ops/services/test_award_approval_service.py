"""Unit tests for award approval service logic (OPS-2280).

Tests the three new methods on ProcurementTrackerStepService:
- _handle_award_approval (BLI transitions + agreement award marking)
- _handle_award_approval_notifications (request + approve notifications)
- Double-award guard in _advance_active_step_if_needed
"""

from datetime import date
from unittest.mock import MagicMock, patch

from flask import Flask

from models.budget_line_items import BudgetLineItemStatus
from models.procurement_action import ProcurementActionStatus
from models.procurement_tracker import ProcurementTrackerStepType
from ops_api.ops.services.procurement_tracker_steps import ProcurementTrackerStepService

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_service():
    service = ProcurementTrackerStepService.__new__(ProcurementTrackerStepService)
    service.db_session = MagicMock()
    return service


def _make_step(step_type=ProcurementTrackerStepType.AWARD, approval_requested=True, approval_status=None):
    step = MagicMock()
    step.step_type = step_type
    step.award_approval_requested = approval_requested
    step.award_approval_status = approval_status
    step.award_requestor_notes = None
    step.award_approval_reviewer_notes = None
    step.award_approval_requested_by = 503
    step.id = 100
    return step


def _make_agreement(project_officer_id=503, alternate_project_officer_id=None, team_members=None):
    agreement = MagicMock()
    agreement.id = 1
    agreement.display_name = "Test Agreement"
    agreement.project_officer_id = project_officer_id
    agreement.alternate_project_officer_id = alternate_project_officer_id
    agreement.team_members = team_members or []
    agreement.budget_line_items = []
    return agreement


def _make_bli(status):
    bli = MagicMock()
    bli.status = status
    return bli


def _make_current_user(user_id=521, full_name="Budget User"):
    user = MagicMock()
    user.id = user_id
    user.full_name = full_name
    return user


# ---------------------------------------------------------------------------
# _handle_award_approval: BLI transitions
# ---------------------------------------------------------------------------


class TestHandleAwardApprovalBLITransitions:
    """On award APPROVED, BLIs must be transitioned correctly."""

    def test_in_execution_bli_set_to_obligated(self):
        service = _make_service()
        bli = _make_bli(BudgetLineItemStatus.IN_EXECUTION)
        agreement = _make_agreement()
        agreement.budget_line_items = [bli]
        step = _make_step()
        step.procurement_tracker.agreement = agreement

        service._handle_award_approval(step, "APPROVED", None, _make_current_user())

        assert bli.status == BudgetLineItemStatus.OBLIGATED

    def test_planned_bli_set_to_planned_mod(self):
        service = _make_service()
        bli = _make_bli(BudgetLineItemStatus.PLANNED)
        agreement = _make_agreement()
        agreement.budget_line_items = [bli]
        step = _make_step()
        step.procurement_tracker.agreement = agreement

        service._handle_award_approval(step, "APPROVED", None, _make_current_user())

        assert bli.status == BudgetLineItemStatus.PLANNED_MOD

    def test_draft_bli_not_changed(self):
        service = _make_service()
        bli = _make_bli(BudgetLineItemStatus.DRAFT)
        agreement = _make_agreement()
        agreement.budget_line_items = [bli]
        step = _make_step()
        step.procurement_tracker.agreement = agreement

        service._handle_award_approval(step, "APPROVED", None, _make_current_user())

        assert bli.status == BudgetLineItemStatus.DRAFT

    def test_obligated_bli_not_changed(self):
        service = _make_service()
        bli = _make_bli(BudgetLineItemStatus.OBLIGATED)
        agreement = _make_agreement()
        agreement.budget_line_items = [bli]
        step = _make_step()
        step.procurement_tracker.agreement = agreement

        service._handle_award_approval(step, "APPROVED", None, _make_current_user())

        assert bli.status == BudgetLineItemStatus.OBLIGATED

    def test_mixed_blis_all_transitioned_correctly(self):
        service = _make_service()
        bli_exec = _make_bli(BudgetLineItemStatus.IN_EXECUTION)
        bli_planned = _make_bli(BudgetLineItemStatus.PLANNED)
        bli_draft = _make_bli(BudgetLineItemStatus.DRAFT)
        agreement = _make_agreement()
        agreement.budget_line_items = [bli_exec, bli_planned, bli_draft]
        step = _make_step()
        step.procurement_tracker.agreement = agreement

        service._handle_award_approval(step, "APPROVED", None, _make_current_user())

        assert bli_exec.status == BudgetLineItemStatus.OBLIGATED
        assert bli_planned.status == BudgetLineItemStatus.PLANNED_MOD
        assert bli_draft.status == BudgetLineItemStatus.DRAFT

    def test_declined_does_not_transition_blis(self):
        service = _make_service()
        bli = _make_bli(BudgetLineItemStatus.IN_EXECUTION)
        agreement = _make_agreement()
        agreement.budget_line_items = [bli]
        step = _make_step()
        step.procurement_tracker.agreement = agreement

        service._handle_award_approval(step, "DECLINED", None, _make_current_user())

        assert bli.status == BudgetLineItemStatus.IN_EXECUTION


# ---------------------------------------------------------------------------
# _handle_award_approval: obligated_date threading
# ---------------------------------------------------------------------------


class TestHandleAwardApprovalObligatedDate:
    """Obligated date is applied to IN_EXECUTION BLIs when provided."""

    def test_obligated_date_set_on_executing_blis(self):
        service = _make_service()
        bli = _make_bli(BudgetLineItemStatus.IN_EXECUTION)
        bli.date_needed = date(2024, 9, 1)
        agreement = _make_agreement()
        agreement.budget_line_items = [bli]
        step = _make_step()
        step.procurement_tracker.agreement = agreement

        obligated_date = date(2024, 9, 30)
        service._handle_award_approval(step, "APPROVED", obligated_date, _make_current_user())

        assert bli.date_needed == obligated_date

    def test_obligated_date_none_leaves_bli_date_unchanged(self):
        service = _make_service()
        bli = _make_bli(BudgetLineItemStatus.IN_EXECUTION)
        original_date = date(2024, 8, 15)
        bli.date_needed = original_date
        agreement = _make_agreement()
        agreement.budget_line_items = [bli]
        step = _make_step()
        step.procurement_tracker.agreement = agreement

        service._handle_award_approval(step, "APPROVED", None, _make_current_user())

        assert bli.date_needed == original_date


# ---------------------------------------------------------------------------
# _handle_award_approval_notifications: request notification
# ---------------------------------------------------------------------------


def _flask_app():
    """Minimal Flask app for providing application context in unit tests."""
    app = Flask(__name__)
    app.config["OPS_FRONTEND_URL"] = "http://localhost:3000"
    return app


class TestAwardApprovalRequestNotification:
    """When approval_requested transitions False→True, Budget Team is notified."""

    def test_request_transition_notifies_budget_team(self):
        service = _make_service()
        step = _make_step()
        agreement = _make_agreement()
        step.procurement_tracker.agreement = agreement
        service.db_session.execute.return_value.scalars.return_value.all.return_value = [10, 11]

        notification_service = MagicMock()

        with _flask_app().app_context():
            with patch(
                "ops_api.ops.services.notifications.NotificationService",
                return_value=notification_service,
            ):
                service._handle_award_approval_notifications(
                    step=step,
                    data={"approval_requested": True},
                    current_user=_make_current_user(),
                    old_award_approval_requested=False,
                    old_award_approval_status=None,
                )

        notification_service.create.assert_called()
        all_calls = notification_service.create.call_args_list
        recipient_ids = [c[0][0]["recipient_id"] for c in all_calls]
        assert 10 in recipient_ids
        assert 11 in recipient_ids

    def test_no_notification_when_approval_not_transitioning(self):
        service = _make_service()
        step = _make_step()
        agreement = _make_agreement()
        step.procurement_tracker.agreement = agreement

        notification_service = MagicMock()

        with _flask_app().app_context():
            with patch(
                "ops_api.ops.services.notifications.NotificationService",
                return_value=notification_service,
            ):
                service._handle_award_approval_notifications(
                    step=step,
                    data={},  # No approval_requested change
                    current_user=_make_current_user(),
                    old_award_approval_requested=True,
                    old_award_approval_status=None,
                )

        notification_service.create.assert_not_called()


# ---------------------------------------------------------------------------
# _handle_award_approval_notifications: approved notification
# ---------------------------------------------------------------------------


class TestAwardApprovalApprovedNotification:
    """When approval_status transitions None→APPROVED, requester+team are notified."""

    def test_approved_transition_notifies_requester(self):
        service = _make_service()
        step = _make_step(approval_status="APPROVED")
        agreement = _make_agreement(project_officer_id=503)
        step.procurement_tracker.agreement = agreement
        service.db_session.execute.return_value.scalars.return_value.all.return_value = []

        notification_service = MagicMock()

        with _flask_app().app_context():
            with patch(
                "ops_api.ops.services.notifications.NotificationService",
                return_value=notification_service,
            ):
                service._handle_award_approval_notifications(
                    step=step,
                    data={"approval_status": "APPROVED"},
                    current_user=_make_current_user(),
                    old_award_approval_requested=True,
                    old_award_approval_status=None,  # Transitioning from None → APPROVED
                )

        # Should notify the requester (award_approval_requested_by = 503)
        notification_service.create.assert_called()

    def test_no_notification_when_status_not_transitioning(self):
        service = _make_service()
        step = _make_step(approval_status="APPROVED")
        agreement = _make_agreement()
        step.procurement_tracker.agreement = agreement
        service.db_session.execute.return_value.scalars.return_value.all.return_value = []

        notification_service = MagicMock()

        with _flask_app().app_context():
            with patch(
                "ops_api.ops.services.notifications.NotificationService",
                return_value=notification_service,
            ):
                service._handle_award_approval_notifications(
                    step=step,
                    data={"approval_status": "APPROVED"},
                    current_user=_make_current_user(),
                    old_award_approval_requested=True,
                    old_award_approval_status="APPROVED",  # Already was APPROVED — no transition
                )

        notification_service.create.assert_not_called()


# ---------------------------------------------------------------------------
# Double-award guard in _advance_active_step_if_needed
# ---------------------------------------------------------------------------


class TestDoubleAwardGuard:
    """_advance_active_step_if_needed must not overwrite date_awarded_obligated if already set."""

    def test_already_awarded_action_not_overwritten(self):
        service = _make_service()
        step = MagicMock()
        step.step_number = 6
        step.step_completed_date = None

        procurement_tracker = MagicMock()
        procurement_tracker.status = MagicMock()
        all_steps = [MagicMock(step_number=i) for i in range(1, 7)]
        procurement_tracker.steps = all_steps
        procurement_tracker.procurement_action = 1  # ID
        step.procurement_tracker = procurement_tracker

        from models.procurement_action import AwardType

        proc_action = MagicMock()
        proc_action.award_type = AwardType.NEW_AWARD
        proc_action.status = ProcurementActionStatus.AWARDED
        original_date = date(2024, 9, 30)
        proc_action.date_awarded_obligated = original_date
        service.db_session.get.return_value = proc_action

        data = {"status": "COMPLETED"}
        current_user = _make_current_user()

        service._advance_active_step_if_needed(step, data, current_user)

        # date_awarded_obligated must NOT be overwritten since it's already set
        assert proc_action.date_awarded_obligated == original_date
