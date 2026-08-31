"""Tests for pending-award-approvals endpoint (OPS-2280).

Service-layer unit tests run without Docker.
Integration tests (marked with requires_db) need a running Docker stack.
"""

from unittest.mock import MagicMock

from models.procurement_tracker import ProcurementTrackerStepType
from ops_api.ops.services.procurement_tracker_steps import ProcurementTrackerStepService

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_role(name):
    """Create a mock role with a proper .name attribute (not MagicMock display name)."""
    role = MagicMock()
    role.name = name
    return role


def _make_user(roles=None):
    user = MagicMock()
    user.id = 1
    user.roles = [_make_role(r) for r in (roles or [])]
    return user


def _make_award_step(approval_requested=True, approval_status=None):
    step = MagicMock()
    step.step_type = ProcurementTrackerStepType.AWARD
    step.award_approval_requested = approval_requested
    step.award_approval_status = approval_status
    return step


# ---------------------------------------------------------------------------
# Unit tests — get_pending_award_approvals_for_user
# ---------------------------------------------------------------------------


class TestGetPendingAwardApprovalsForUser:
    """Service method returns pending AWARD steps for BUDGET_TEAM/SYSTEM_OWNER."""

    def test_returns_empty_for_missing_user(self):
        """If user not found, return empty list."""
        service = ProcurementTrackerStepService.__new__(ProcurementTrackerStepService)
        session = MagicMock()
        session.get.return_value = None
        service.db_session = session

        result = service.get_pending_award_approvals_for_user(9999)
        assert result == []

    def test_returns_empty_for_non_budget_team_user(self):
        """Non-BUDGET_TEAM users get an empty list."""
        service = ProcurementTrackerStepService.__new__(ProcurementTrackerStepService)
        session = MagicMock()
        user = _make_user(roles=["REVIEWER_APPROVER"])
        session.get.return_value = user
        service.db_session = session

        result = service.get_pending_award_approvals_for_user(user.id)
        assert result == []

    def test_budget_team_user_gets_query_executed(self):
        """BUDGET_TEAM users trigger the pending-award query and receive the results."""
        service = ProcurementTrackerStepService.__new__(ProcurementTrackerStepService)
        session = MagicMock()
        user = _make_user(roles=["BUDGET_TEAM"])
        session.get.return_value = user

        mock_step = _make_award_step()
        session.scalars.return_value.all.return_value = [mock_step]
        service.db_session = session

        result = service.get_pending_award_approvals_for_user(user.id)

        # DB was queried (not short-circuited) and the mock step is returned
        session.scalars.assert_called_once()
        assert result == [mock_step]

    def test_system_owner_gets_query_executed(self):
        """SYSTEM_OWNER users also trigger the pending-award query and receive results."""
        service = ProcurementTrackerStepService.__new__(ProcurementTrackerStepService)
        session = MagicMock()
        user = _make_user(roles=["SYSTEM_OWNER"])
        session.get.return_value = user

        mock_step = _make_award_step()
        session.scalars.return_value.all.return_value = [mock_step]
        service.db_session = session

        result = service.get_pending_award_approvals_for_user(user.id)

        # DB was queried (not short-circuited) and the mock step is returned
        session.scalars.assert_called_once()
        assert result == [mock_step]
