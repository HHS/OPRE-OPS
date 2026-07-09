"""Unit tests for award-step agreement history entries.

Tests create_procurement_tracker_step_update_history_event for AWARD steps.
These are pure unit tests — no DB or Docker required.
"""

from unittest.mock import MagicMock

from models.agreement_history import AgreementHistoryType, create_procurement_tracker_step_update_history_event

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_event(step_type, changes, step_extra=None):
    """Build a minimal mock OpsEvent for UPDATE_PROCUREMENT_TRACKER_STEP."""
    step = {
        "id": 100,
        "procurement_tracker_id": 7,
        "step_type": step_type,
        "step_number": 6 if step_type == "AWARD" else 5,
        "status": "ACTIVE",
        "approval_requested": True,
        "approval_requested_by": 503,
        "approval_status": None,
    }
    if step_extra:
        step.update(step_extra)

    event = MagicMock()
    event.id = 1
    event.created_by = 503
    event.created_on = MagicMock()
    event.created_on.strftime.return_value = "2024-06-01T00:00:00.000000Z"
    event.event_details = {
        "procurement_tracker_step": step,
        "procurement_tracker_step_updates": {
            "owner_id": 1,
            "updated_by": 503,
            "changes": changes,
        },
    }
    return event


def _make_user(full_name):
    u = MagicMock()
    u.full_name = full_name
    return u


def _make_session(requester_name="Amelia Popham", approver_name="Budget User"):
    """Return a mock session that resolves users by id."""
    requester = _make_user(requester_name)
    approver = _make_user(approver_name)

    tracker = MagicMock()
    tracker.agreement_id = 1

    session = MagicMock()

    # get(ProcurementTracker, id) returns tracker
    # get(User, 503) returns requester; get(User, 521) returns approver
    def _get(cls, pk):
        from models import User
        from models.procurement_tracker import ProcurementTracker

        if cls is ProcurementTracker:
            return tracker
        if cls is User and pk == 503:
            return requester
        if cls is User and pk == 521:
            return approver
        return None

    session.get.side_effect = _get
    return session


# ---------------------------------------------------------------------------
# AWARD step: approval_requested → "Award Approval Requested"
# ---------------------------------------------------------------------------


class TestAwardApprovalRequestedHistory:
    """AWARD step approval_requested=True must emit award-specific history row."""

    def test_title_is_award_approval_requested(self):
        event = _make_event("AWARD", {"approval_requested": {"old_value": False, "new_value": True}})
        session = _make_session()
        result = create_procurement_tracker_step_update_history_event(event, _make_user("Amelia Popham"), session)
        assert result is not None
        assert result.history_title == "Award Approval Requested"

    def test_message_contains_requester_name(self):
        event = _make_event("AWARD", {"approval_requested": {"old_value": False, "new_value": True}})
        session = _make_session(requester_name="Amelia Popham")
        result = create_procurement_tracker_step_update_history_event(event, _make_user("Amelia Popham"), session)
        assert "Amelia Popham" in result.history_message

    def test_message_mentions_budget_team(self):
        event = _make_event("AWARD", {"approval_requested": {"old_value": False, "new_value": True}})
        session = _make_session()
        result = create_procurement_tracker_step_update_history_event(event, _make_user("Test User"), session)
        assert "Budget Team" in result.history_message

    def test_message_does_not_mention_division_director(self):
        """Award requests go to Budget Team, not Division Director."""
        event = _make_event("AWARD", {"approval_requested": {"old_value": False, "new_value": True}})
        session = _make_session()
        result = create_procurement_tracker_step_update_history_event(event, _make_user("Test User"), session)
        assert "Division Director" not in result.history_message

    def test_history_type_is_procurement_tracker_step_updated(self):
        event = _make_event("AWARD", {"approval_requested": {"old_value": False, "new_value": True}})
        session = _make_session()
        result = create_procurement_tracker_step_update_history_event(event, _make_user("Test User"), session)
        assert result.history_type == AgreementHistoryType.PROCUREMENT_TRACKER_STEP_UPDATED

    def test_pre_award_request_still_uses_pre_award_title(self):
        """PRE_AWARD steps must keep their existing title/message."""
        event = _make_event("PRE_AWARD", {"approval_requested": {"old_value": False, "new_value": True}})
        session = _make_session()
        result = create_procurement_tracker_step_update_history_event(event, _make_user("Test User"), session)
        assert result.history_title == "Pre-Award Approval Requested"
        assert "Division Director" in result.history_message


# ---------------------------------------------------------------------------
# AWARD step: approval_status=APPROVED → "Agreement Awarded"
# ---------------------------------------------------------------------------


class TestAwardApprovalApprovedHistory:
    """AWARD step approval_status=APPROVED must emit 'Agreement Awarded'."""

    def _event_approved(self, step_type="AWARD"):
        return _make_event(
            step_type,
            {"approval_status": {"old_value": None, "new_value": "APPROVED"}},
            step_extra={"approval_status": "APPROVED", "approval_responded_by": 521},
        )

    def test_title_is_agreement_awarded(self):
        event = self._event_approved("AWARD")
        session = _make_session()
        result = create_procurement_tracker_step_update_history_event(event, _make_user("Budget User"), session)
        assert result is not None
        assert result.history_title == "Agreement Awarded"

    def test_message_mentions_budget_team(self):
        event = self._event_approved("AWARD")
        session = _make_session()
        result = create_procurement_tracker_step_update_history_event(event, _make_user("Budget User"), session)
        assert "Budget Team" in result.history_message

    def test_message_mentions_obligated_status(self):
        event = self._event_approved("AWARD")
        session = _make_session()
        result = create_procurement_tracker_step_update_history_event(event, _make_user("Budget User"), session)
        assert "Obligated" in result.history_message

    def test_message_does_not_mention_director(self):
        event = self._event_approved("AWARD")
        session = _make_session()
        result = create_procurement_tracker_step_update_history_event(event, _make_user("Budget User"), session)
        assert "Director" not in result.history_message

    def test_pre_award_approved_still_uses_pre_award_title(self):
        """PRE_AWARD APPROVED must keep existing 'Pre-Award Approved & Requisition Started' title."""
        event = self._event_approved("PRE_AWARD")
        event.event_details["procurement_tracker_step"]["step_number"] = 5
        session = _make_session()
        result = create_procurement_tracker_step_update_history_event(event, _make_user("Dave Director"), session)
        assert result.history_title == "Pre-Award Approved & Requisition Started"

    def test_history_type_is_procurement_tracker_step_updated(self):
        event = self._event_approved("AWARD")
        session = _make_session()
        result = create_procurement_tracker_step_update_history_event(event, _make_user("Budget User"), session)
        assert result.history_type == AgreementHistoryType.PROCUREMENT_TRACKER_STEP_UPDATED
