"""Tests for OPS-1639 PR 1: Budget Team Requisition Approval - Notification Flow Fix.

This test suite verifies:
1. New database fields for requisition tracking
2. Fixed notification flow: DD approval → Budget Team notified (not requester)
3. Budget team approval → Requester notified
"""

from datetime import date

import pytest
from sqlalchemy import func, select

from models import Notification, ProcurementTracker, ProcurementTrackerStepStatus, User
from models.notifications import PreAwardApprovalNotification
from models.procurement_tracker import DefaultProcurementTrackerStep, ProcurementTrackerStepType
from models.users import Role


@pytest.fixture
def test_pre_award_step(app_ctx, loaded_db):
    """Create a test PRE_AWARD step for budget team requisition testing."""
    from models.procurement_tracker import ProcurementTrackerStep

    # Get the procurement tracker first
    tracker = loaded_db.get(ProcurementTracker, 1)

    # Ensure Step 4 (Evaluation) exists and is completed (required for pre-award approval)
    step_4 = next((step for step in tracker.steps if step.step_number == 4), None)
    step_4_was_created = False
    step_4_original_status = None

    if not step_4:
        step_4 = DefaultProcurementTrackerStep(
            procurement_tracker=tracker,
            step_number=4,
            step_type=ProcurementTrackerStepType.EVALUATION,
            status=ProcurementTrackerStepStatus.COMPLETED,
        )
        loaded_db.add(step_4)
        step_4_was_created = True
    else:
        step_4_original_status = step_4.status
        step_4.status = ProcurementTrackerStepStatus.COMPLETED
    loaded_db.commit()

    # Create a new PRE_AWARD step for testing
    step = DefaultProcurementTrackerStep(
        procurement_tracker=tracker,
        step_number=999,  # Use a high number to avoid conflicts
        step_type=ProcurementTrackerStepType.PRE_AWARD,
        status=ProcurementTrackerStepStatus.ACTIVE,
        pre_award_approval_requested=True,
        pre_award_approval_requested_by=500,  # Requester user ID
        pre_award_approval_requested_date=date.today(),
        pre_award_approval_status=None,  # Not yet approved by DD
    )
    loaded_db.add(step)
    loaded_db.commit()
    loaded_db.refresh(step)

    yield step

    # Cleanup: restore Step 4 to original state
    loaded_db.rollback()
    try:
        loaded_db.delete(step)
        loaded_db.commit()

        # Restore Step 4
        if step_4_was_created:
            step_4_restored = loaded_db.get(ProcurementTrackerStep, step_4.id)
            if step_4_restored:
                loaded_db.delete(step_4_restored)
                loaded_db.commit()
        elif step_4_original_status is not None:
            step_4_restored = loaded_db.get(ProcurementTrackerStep, step_4.id)
            if step_4_restored:
                step_4_restored.status = step_4_original_status
                loaded_db.commit()
    except Exception:
        loaded_db.rollback()


@pytest.fixture
def budget_team_user_ids(loaded_db):
    """Get user IDs of all budget team members for testing."""
    budget_team_query = select(User.id).join(User.roles).where(Role.name == "BUDGET_TEAM")
    return loaded_db.execute(budget_team_query).scalars().all()


class TestRequisitionModelFields:
    """Test that new requisition fields exist and work correctly."""

    def test_requisition_fields_exist_on_model(self, app_ctx, loaded_db):
        """Test that all new requisition fields are present on the model."""
        step = DefaultProcurementTrackerStep()

        # Verify fields exist
        assert hasattr(step, "pre_award_requisition_number")
        assert hasattr(step, "pre_award_requisition_date")
        assert hasattr(step, "pre_award_requisition_approved_by")
        assert hasattr(step, "pre_award_requisition_approved_date")

    def test_requisition_fields_are_nullable(self, app_ctx, loaded_db, test_pre_award_step):
        """Test that requisition fields can be None (nullable)."""
        step = test_pre_award_step

        # All requisition fields should be None initially
        assert step.pre_award_requisition_number is None
        assert step.pre_award_requisition_date is None
        assert step.pre_award_requisition_approved_by is None
        assert step.pre_award_requisition_approved_date is None

    def test_can_set_requisition_fields(self, app_ctx, loaded_db, test_pre_award_step):
        """Test that requisition fields can be set and persisted."""
        step = test_pre_award_step

        # Set requisition fields
        step.pre_award_requisition_number = "REQ-2026-12345"
        step.pre_award_requisition_date = date(2026, 4, 30)
        step.pre_award_requisition_approved_by = 502  # Budget team user
        step.pre_award_requisition_approved_date = date(2026, 4, 30)

        loaded_db.commit()
        loaded_db.refresh(step)

        # Verify fields persisted
        assert step.pre_award_requisition_number == "REQ-2026-12345"
        assert step.pre_award_requisition_date == date(2026, 4, 30)
        assert step.pre_award_requisition_approved_by == 502
        assert step.pre_award_requisition_approved_date == date(2026, 4, 30)

    def test_requisition_approved_by_user_relationship(self, app_ctx, loaded_db, test_pre_award_step):
        """Test that FK relationship to User works correctly."""
        step = test_pre_award_step

        # Set approved_by to a valid user ID
        step.pre_award_requisition_approved_by = 502
        loaded_db.commit()
        loaded_db.refresh(step)

        # Verify relationship exists
        assert hasattr(step, "pre_award_requisition_approved_by_user")

        # If relationship is loaded, verify it points to correct user
        if step.pre_award_requisition_approved_by_user:
            assert step.pre_award_requisition_approved_by_user.id == 502


class TestNotificationFlowFix:
    """Test the fixed notification flow for OPS-1639."""

    def test_dd_approval_notifies_budget_team_not_requester(
        self, auth_client, test_pre_award_step, loaded_db, budget_team_user_ids
    ):
        """CRITICAL FIX: When DD approves, budget team is notified (not requester).

        This is the main bug fix for OPS-1639:
        - OLD behavior: DD approval → requester notified
        - NEW behavior: DD approval → budget team notified
        """
        # Ensure there are budget team members
        assert len(budget_team_user_ids) > 0, "Test requires budget team users"

        requester_id = test_pre_award_step.pre_award_approval_requested_by

        # Get initial notification counts
        initial_total_count = loaded_db.scalar(select(func.count()).select_from(Notification))
        initial_requester_notifications = loaded_db.scalar(
            select(func.count()).select_from(Notification).where(Notification.recipient_id == requester_id)
        )
        initial_budget_team_notifications = {}
        for bt_id in budget_team_user_ids:
            initial_budget_team_notifications[bt_id] = loaded_db.scalar(
                select(func.count()).select_from(Notification).where(Notification.recipient_id == bt_id)
            )

        # DD approves the pre-award request
        update_data = {
            "approval_status": "APPROVED",
            "reviewer_notes": "Approved for budget team requisition",
        }

        response = auth_client.patch(f"/api/v1/procurement-tracker-steps/{test_pre_award_step.id}", json=update_data)
        assert response.status_code == 200

        # Verify notifications were sent
        final_total_count = loaded_db.scalar(select(func.count()).select_from(Notification))
        final_requester_notifications = loaded_db.scalar(
            select(func.count()).select_from(Notification).where(Notification.recipient_id == requester_id)
        )

        # CRITICAL: Requester should NOT receive notification after DD approval
        assert (
            final_requester_notifications == initial_requester_notifications
        ), "Requester should NOT be notified when DD approves (OPS-1639 fix)"

        # CRITICAL: Budget team members SHOULD receive notifications
        budget_team_notified_count = 0
        for bt_id in budget_team_user_ids:
            final_bt_notifications = loaded_db.scalar(
                select(func.count()).select_from(Notification).where(Notification.recipient_id == bt_id)
            )
            if final_bt_notifications > initial_budget_team_notifications[bt_id]:
                budget_team_notified_count += 1

        assert budget_team_notified_count == len(
            budget_team_user_ids
        ), f"All {len(budget_team_user_ids)} budget team members should be notified"

        # Verify total notification count increased by number of budget team members
        assert final_total_count == initial_total_count + len(
            budget_team_user_ids
        ), f"Should create {len(budget_team_user_ids)} notifications (one per budget team member)"

    def test_dd_approval_notification_has_correct_title_and_message(
        self, auth_client, test_pre_award_step, loaded_db, budget_team_user_ids
    ):
        """Test that DD approval notification has correct title and content."""
        # Ensure there are budget team members
        assert len(budget_team_user_ids) > 0, "Test requires budget team users"

        # DD approves
        update_data = {"approval_status": "APPROVED"}
        response = auth_client.patch(f"/api/v1/procurement-tracker-steps/{test_pre_award_step.id}", json=update_data)
        assert response.status_code == 200

        # Get notifications for budget team members
        budget_team_notifications = (
            loaded_db.execute(
                select(Notification)
                .where(Notification.recipient_id.in_(budget_team_user_ids))
                .order_by(Notification.created_on.desc())
                .limit(len(budget_team_user_ids))
            )
            .scalars()
            .all()
        )

        assert len(budget_team_notifications) > 0, "Should have budget team notifications"

        # Verify notification content
        for notification in budget_team_notifications:
            assert notification.title == "Budget Team Requisition Review Required"
            assert "Budget Team review and requisition entry is now required" in notification.message
            assert notification.procurement_tracker_step_id == test_pre_award_step.id

    def test_dd_decline_still_notifies_requester(self, auth_client, test_pre_award_step, loaded_db):
        """Test that DD decline still notifies the requester (existing behavior maintained)."""
        requester_id = test_pre_award_step.pre_award_approval_requested_by

        # Get initial notification count for requester
        initial_requester_notifications = loaded_db.scalar(
            select(func.count()).select_from(Notification).where(Notification.recipient_id == requester_id)
        )

        # DD declines
        update_data = {
            "approval_status": "DECLINED",
            "reviewer_notes": "Needs more information",
        }

        response = auth_client.patch(f"/api/v1/procurement-tracker-steps/{test_pre_award_step.id}", json=update_data)
        assert response.status_code == 200

        # Verify requester was notified
        final_requester_notifications = loaded_db.scalar(
            select(func.count()).select_from(Notification).where(Notification.recipient_id == requester_id)
        )

        assert (
            final_requester_notifications == initial_requester_notifications + 1
        ), "Requester should be notified when DD declines (existing behavior)"

    def test_budget_team_approval_notifies_requester(self, auth_client, test_pre_award_step, loaded_db):
        """Test that budget team approval notifies the original requester."""
        # Setup: DD has already approved
        test_pre_award_step.pre_award_approval_status = "APPROVED"
        test_pre_award_step.pre_award_approval_responded_by = 503  # DD user
        test_pre_award_step.pre_award_approval_responded_date = date.today()
        loaded_db.commit()

        requester_id = test_pre_award_step.pre_award_approval_requested_by

        # Get initial notification count for requester
        initial_requester_notifications = loaded_db.scalar(
            select(func.count()).select_from(Notification).where(Notification.recipient_id == requester_id)
        )

        # Budget team approves requisition
        update_data = {
            "status": "ACTIVE",
            "requisition_number": "REQ-2026-12345",
            "requisition_date": "2026-04-30",
        }

        response = auth_client.patch(f"/api/v1/procurement-tracker-steps/{test_pre_award_step.id}", json=update_data)
        assert response.status_code == 200

        # Verify approval fields were SERVER-CONTROLLED (set automatically)
        loaded_db.refresh(test_pre_award_step)
        assert test_pre_award_step.pre_award_requisition_approved_by == 503  # Current user
        assert test_pre_award_step.pre_award_requisition_approved_date == date.today()

        # Verify requester was notified
        final_requester_notifications = loaded_db.scalar(
            select(func.count()).select_from(Notification).where(Notification.recipient_id == requester_id)
        )

        assert (
            final_requester_notifications == initial_requester_notifications + 1
        ), "Requester should be notified when budget team approves requisition"

    def test_budget_team_approval_notification_has_correct_content(self, auth_client, test_pre_award_step, loaded_db):
        """Test that budget team approval notification has correct title and message."""
        # Setup: DD has already approved
        test_pre_award_step.pre_award_approval_status = "APPROVED"
        test_pre_award_step.pre_award_approval_responded_by = 503
        test_pre_award_step.pre_award_approval_responded_date = date.today()
        loaded_db.commit()

        requester_id = test_pre_award_step.pre_award_approval_requested_by

        # Budget team approves
        update_data = {
            "status": "ACTIVE",
            "requisition_number": "REQ-2026-12345",
            "requisition_date": "2026-04-30",
        }

        response = auth_client.patch(f"/api/v1/procurement-tracker-steps/{test_pre_award_step.id}", json=update_data)
        assert response.status_code == 200

        # Verify approval fields were SERVER-CONTROLLED (set automatically)
        loaded_db.refresh(test_pre_award_step)
        assert test_pre_award_step.pre_award_requisition_approved_by == 503  # Current user
        assert test_pre_award_step.pre_award_requisition_approved_date == date.today()

        # Get requester's most recent notification
        notification = loaded_db.execute(
            select(Notification)
            .where(Notification.recipient_id == requester_id)
            .order_by(Notification.created_on.desc())
            .limit(1)
        ).scalar_one()

        # Verify notification content
        assert notification.title == "Pre-Award Requisition Approved"
        assert "approved the Pre-Award Requisition" in notification.message
        assert "Final Consensus Memo can now be sent" in notification.message
        assert notification.procurement_tracker_step_id == test_pre_award_step.id

    def test_budget_team_approval_auto_dismisses_review_notifications(
        self, auth_client, test_pre_award_step, loaded_db, budget_team_user_ids
    ):
        """Test that budget team approval auto-dismisses budget team review notifications."""
        # Setup: DD approved, budget team has pending notifications
        test_pre_award_step.pre_award_approval_status = "APPROVED"
        loaded_db.commit()

        # Create budget team review notifications
        for bt_id in budget_team_user_ids[:2]:  # Just use first 2 for speed
            notification = PreAwardApprovalNotification(
                title="Budget Team Requisition Review Required",
                message="Test notification",
                is_read=False,
                recipient_id=bt_id,
                procurement_tracker_step_id=test_pre_award_step.id,
            )
            loaded_db.add(notification)
        loaded_db.commit()

        # Get count of unread budget team review notifications
        unread_count_before = loaded_db.scalar(
            select(func.count())
            .select_from(PreAwardApprovalNotification)
            .where(
                PreAwardApprovalNotification.title == "Budget Team Requisition Review Required",
                PreAwardApprovalNotification.is_read.is_(False),
                PreAwardApprovalNotification.procurement_tracker_step_id == test_pre_award_step.id,
            )
        )
        assert unread_count_before >= 2, "Should have unread notifications"

        # Budget team approves
        update_data = {
            "status": "ACTIVE",
            "requisition_number": "REQ-123",
            "requisition_date": "2026-04-30",
        }

        response = auth_client.patch(f"/api/v1/procurement-tracker-steps/{test_pre_award_step.id}", json=update_data)
        assert response.status_code == 200

        # Verify approval fields were SERVER-CONTROLLED (set automatically)
        loaded_db.refresh(test_pre_award_step)
        assert test_pre_award_step.pre_award_requisition_approved_by == 503  # Current user
        assert test_pre_award_step.pre_award_requisition_approved_date == date.today()

        # Verify notifications were auto-dismissed
        unread_count_after = loaded_db.scalar(
            select(func.count())
            .select_from(PreAwardApprovalNotification)
            .where(
                PreAwardApprovalNotification.title == "Budget Team Requisition Review Required",
                PreAwardApprovalNotification.is_read.is_(False),
                PreAwardApprovalNotification.procurement_tracker_step_id == test_pre_award_step.id,
            )
        )

        assert unread_count_after == 0, "All budget team review notifications should be auto-dismissed after approval"

    def test_requisition_update_after_approval_does_not_renotify(self, auth_client, test_pre_award_step, loaded_db):
        """Test that updating requisition fields after initial approval does not trigger duplicate notifications."""
        # Setup: DD approved, budget team already approved requisition
        test_pre_award_step.pre_award_approval_status = "APPROVED"
        test_pre_award_step.pre_award_approval_responded_by = 503
        test_pre_award_step.pre_award_approval_responded_date = date.today()
        test_pre_award_step.pre_award_requisition_number = "REQ-2026-12345"
        test_pre_award_step.pre_award_requisition_date = date.today()
        test_pre_award_step.pre_award_requisition_approved_by = 502
        test_pre_award_step.pre_award_requisition_approved_date = date.today()
        loaded_db.commit()

        requester_id = test_pre_award_step.pre_award_approval_requested_by

        # Get initial notification count for requester
        initial_requester_notifications = loaded_db.scalar(
            select(func.count()).select_from(Notification).where(Notification.recipient_id == requester_id)
        )

        # Budget team updates requisition fields (e.g., correcting the requisition number)
        update_data = {
            "status": "ACTIVE",
            "requisition_number": "REQ-2026-99999",  # Changed
            "requisition_date": "2026-04-30",  # Same date
        }

        response = auth_client.patch(f"/api/v1/procurement-tracker-steps/{test_pre_award_step.id}", json=update_data)
        assert response.status_code == 200

        # Verify requester was NOT notified again
        final_requester_notifications = loaded_db.scalar(
            select(func.count()).select_from(Notification).where(Notification.recipient_id == requester_id)
        )

        assert (
            final_requester_notifications == initial_requester_notifications
        ), "Requester should NOT be notified when requisition fields are updated after initial approval"


class TestAPISchemaFields:
    """Test that new requisition fields are exposed in API responses."""

    def test_requisition_fields_in_api_response(self, auth_client, test_pre_award_step):
        """Test that requisition fields appear in API GET response."""
        response = auth_client.get(f"/api/v1/procurement-tracker-steps/{test_pre_award_step.id}")
        assert response.status_code == 200

        data = response.json

        # Verify requisition fields are present in response
        assert "requisition_number" in data
        assert "requisition_date" in data
        assert "requisition_approved_by" in data
        assert "requisition_approved_date" in data

        # Initially should be None/null
        assert data["requisition_number"] is None
        assert data["requisition_date"] is None
        assert data["requisition_approved_by"] is None
        assert data["requisition_approved_date"] is None

    def test_can_update_requisition_fields_via_api(self, auth_client, test_pre_award_step, loaded_db):
        """Test that requisition fields can be updated via API and approval fields are server-controlled."""
        update_data = {
            "status": "ACTIVE",
            "requisition_number": "REQ-2026-99999",
            "requisition_date": "2026-04-30",
        }

        response = auth_client.patch(f"/api/v1/procurement-tracker-steps/{test_pre_award_step.id}", json=update_data)
        assert response.status_code == 200

        # Verify user-provided fields were updated
        loaded_db.refresh(test_pre_award_step)
        assert test_pre_award_step.pre_award_requisition_number == "REQ-2026-99999"
        assert test_pre_award_step.pre_award_requisition_date == date(2026, 4, 30)

        # Verify approval fields were SERVER-CONTROLLED (set automatically)
        assert test_pre_award_step.pre_award_requisition_approved_by == 503  # Current user from auth_client
        assert test_pre_award_step.pre_award_requisition_approved_date == date.today()

        # Verify fields appear in response
        data = response.json
        assert data["requisition_number"] == "REQ-2026-99999"
        assert data["requisition_date"] == "2026-04-30"
        assert data["requisition_approved_by"] == 503  # Server-controlled
        assert data["requisition_approved_date"] == date.today().isoformat()  # Server-controlled
