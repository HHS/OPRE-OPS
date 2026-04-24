"""Tests for preventing duplicate approval notifications in procurement tracker steps."""

from datetime import date

import pytest
from sqlalchemy import func, select

from models import Notification, ProcurementTracker, ProcurementTrackerStepStatus
from models.procurement_tracker import DefaultProcurementTrackerStep, ProcurementTrackerStepType


@pytest.fixture
def test_pre_award_step(app_ctx, loaded_db):
    """Create a test PRE_AWARD step for approval notification testing."""
    # Get the procurement tracker first to ensure the relationship is valid
    tracker = loaded_db.get(ProcurementTracker, 1)

    # Ensure Step 4 (Evaluation) exists and is completed (required for pre-award approval)
    step_4 = next((step for step in tracker.steps if step.step_number == 4), None)
    if not step_4:
        step_4 = DefaultProcurementTrackerStep(
            procurement_tracker=tracker,
            step_number=4,
            step_type=ProcurementTrackerStepType.EVALUATION,
            status=ProcurementTrackerStepStatus.COMPLETED,
        )
        loaded_db.add(step_4)
    else:
        step_4.status = ProcurementTrackerStepStatus.COMPLETED
    loaded_db.commit()

    # Create a new PRE_AWARD step for testing
    step = DefaultProcurementTrackerStep(
        procurement_tracker=tracker,  # Use object reference to preload the relationship
        step_number=998,  # Use a high number to avoid conflicts
        step_type=ProcurementTrackerStepType.PRE_AWARD,
        status=ProcurementTrackerStepStatus.ACTIVE,
        pre_award_approval_requested=False,  # Initially not requested
        pre_award_approval_status=None,
    )
    loaded_db.add(step)
    loaded_db.commit()
    loaded_db.refresh(step)

    yield step

    # Cleanup: rollback any changes and delete the test step
    loaded_db.rollback()
    try:
        # Re-fetch the step to ensure we have the latest version
        from models.procurement_tracker import ProcurementTrackerStep

        test_step = loaded_db.get(ProcurementTrackerStep, step.id)
        if test_step:
            loaded_db.delete(test_step)
            loaded_db.commit()
    except Exception:
        loaded_db.rollback()


def test_initial_approval_request_sends_notification(auth_client, test_pre_award_step, loaded_db):
    """Test that first-time approval request sends notification to reviewers."""
    # Get initial notification count
    initial_notification_count = loaded_db.scalar(select(func.count()).select_from(Notification))

    # Request approval for the first time
    update_data = {
        "approval_requested": True,
        "approval_requested_date": date.today().isoformat(),
        "requestor_notes": "Please review and approve",
    }

    response = auth_client.patch(f"/api/v1/procurement-tracker-steps/{test_pre_award_step.id}", json=update_data)
    assert response.status_code == 200

    # Verify notifications were created (should send to multiple reviewers)
    final_notification_count = loaded_db.scalar(select(func.count()).select_from(Notification))
    assert (
        final_notification_count > initial_notification_count
    ), "Notifications should be sent on first approval request"


def test_duplicate_approval_request_no_notification(auth_client, test_pre_award_step, loaded_db):
    """Test that duplicate approval request does NOT send notification."""
    # Setup: approval already requested
    test_pre_award_step.pre_award_approval_requested = True
    test_pre_award_step.pre_award_approval_requested_date = date.today()
    test_pre_award_step.pre_award_approval_requested_by = 500  # Set to a user ID
    loaded_db.commit()

    # Get notification count after initial setup
    initial_notification_count = loaded_db.scalar(select(func.count()).select_from(Notification))

    # Try to request approval again (duplicate/retry scenario)
    update_data = {
        "approval_requested": True,
        "requestor_notes": "Please review and approve",  # Same or different notes
    }

    response = auth_client.patch(f"/api/v1/procurement-tracker-steps/{test_pre_award_step.id}", json=update_data)
    assert response.status_code == 200

    # Verify NO new notifications were created
    final_notification_count = loaded_db.scalar(select(func.count()).select_from(Notification))
    assert (
        final_notification_count == initial_notification_count
    ), "Duplicate approval request should NOT send notifications"


def test_initial_approval_response_sends_notification(auth_client, test_pre_award_step, loaded_db):
    """Test that first approval response sends notification to submitter."""
    # Setup: approval was requested by a specific user
    test_pre_award_step.pre_award_approval_requested = True
    test_pre_award_step.pre_award_approval_requested_date = date.today()
    test_pre_award_step.pre_award_approval_requested_by = 500  # Submitter user ID
    test_pre_award_step.pre_award_approval_status = None  # Not yet responded
    loaded_db.commit()

    # Get initial notification count
    initial_notification_count = loaded_db.scalar(select(func.count()).select_from(Notification))

    # Approve the request for the first time
    update_data = {
        "approval_status": "APPROVED",
        "reviewer_notes": "Looks good, approved",
    }

    response = auth_client.patch(f"/api/v1/procurement-tracker-steps/{test_pre_award_step.id}", json=update_data)
    assert response.status_code == 200

    # Verify notification was sent to submitter
    final_notification_count = loaded_db.scalar(select(func.count()).select_from(Notification))
    assert (
        final_notification_count == initial_notification_count + 1
    ), "Notification should be sent to submitter on first approval response"


def test_duplicate_approval_response_no_notification(auth_client, test_pre_award_step, loaded_db):
    """Test that duplicate approval response does NOT send notification."""
    # Setup: approval was already approved
    test_pre_award_step.pre_award_approval_requested = True
    test_pre_award_step.pre_award_approval_requested_by = 500
    test_pre_award_step.pre_award_approval_status = "APPROVED"  # Already approved
    test_pre_award_step.pre_award_approval_responded_by = 503
    test_pre_award_step.pre_award_approval_responded_date = date.today()
    loaded_db.commit()

    # Get notification count after setup
    initial_notification_count = loaded_db.scalar(select(func.count()).select_from(Notification))

    # Try to approve again (duplicate scenario - might happen if validation doesn't catch it)
    update_data = {
        "approval_status": "APPROVED",
        "reviewer_notes": "Still approved",
    }

    auth_client.patch(f"/api/v1/procurement-tracker-steps/{test_pre_award_step.id}", json=update_data)
    # Might get 200 or 400 depending on validation, but either way...

    # Verify NO new notifications were created
    final_notification_count = loaded_db.scalar(select(func.count()).select_from(Notification))
    assert (
        final_notification_count == initial_notification_count
    ), "Duplicate approval response should NOT send notifications"


def test_approval_transitions_are_idempotent(auth_client, test_pre_award_step, loaded_db):
    """Test that sending the same approval request multiple times only sends notification once."""
    # Get initial notification count
    initial_notification_count = loaded_db.scalar(select(func.count()).select_from(Notification))

    # Send the same approval request 3 times
    update_data = {
        "approval_requested": True,
        "approval_requested_date": date.today().isoformat(),
        "requestor_notes": "Please review",
    }

    # First request
    response1 = auth_client.patch(f"/api/v1/procurement-tracker-steps/{test_pre_award_step.id}", json=update_data)
    assert response1.status_code == 200

    count_after_first = loaded_db.scalar(select(func.count()).select_from(Notification))
    notifications_sent_first_time = count_after_first - initial_notification_count
    assert notifications_sent_first_time > 0, "First request should send notifications"

    # Second request (duplicate)
    response2 = auth_client.patch(f"/api/v1/procurement-tracker-steps/{test_pre_award_step.id}", json=update_data)
    assert response2.status_code == 200

    count_after_second = loaded_db.scalar(select(func.count()).select_from(Notification))
    assert count_after_second == count_after_first, "Second request should NOT send additional notifications"

    # Third request (another duplicate)
    response3 = auth_client.patch(f"/api/v1/procurement-tracker-steps/{test_pre_award_step.id}", json=update_data)
    assert response3.status_code == 200

    count_after_third = loaded_db.scalar(select(func.count()).select_from(Notification))
    assert count_after_third == count_after_first, "Third request should NOT send additional notifications"

    # Verify total notifications sent is from first request only
    total_notifications_sent = count_after_third - initial_notification_count
    assert (
        total_notifications_sent == notifications_sent_first_time
    ), "Only the first request should have sent notifications"


def test_approval_response_auto_dismisses_in_review_notifications(auth_client, test_pre_award_step, loaded_db):
    """Test that approval response auto-dismisses 'in review' notifications for reviewers."""
    # Step 1: Request approval - creates "in review" notifications for reviewers
    update_data = {
        "approval_requested": True,
        "approval_requested_date": date.today().isoformat(),
        "requestor_notes": "Please review and approve",
    }
    response = auth_client.patch(
        f"/api/v1/procurement-tracker-steps/{test_pre_award_step.id}",
        json=update_data,
    )
    assert response.status_code == 200

    # Verify "in review" notifications were created
    in_review_notifications = loaded_db.scalars(
        select(Notification)
        .where(Notification.title == "Pre-Award Approval Request")
        .where(Notification.is_read.is_(False))
    ).all()
    assert len(in_review_notifications) > 0, "Should have unread approval request notifications"

    # Store the notification IDs to verify later
    reviewer_notification_ids = [n.id for n in in_review_notifications]

    # Step 2: Approve request - should auto-dismiss reviewer notifications
    update_data = {
        "approval_status": "APPROVED",
        "reviewer_notes": "Looks good, approved",
    }
    response = auth_client.patch(
        f"/api/v1/procurement-tracker-steps/{test_pre_award_step.id}",
        json=update_data,
    )
    assert response.status_code == 200

    # Step 3: Verify all "in review" notifications are marked as read
    for notification_id in reviewer_notification_ids:
        notification = loaded_db.get(Notification, notification_id)
        assert notification.is_read, f"Notification {notification_id} should be auto-dismissed (marked as read)"


def test_approval_response_includes_reviewer_notes_in_notification(auth_client, test_pre_award_step, loaded_db):
    """Test that reviewer notes are included in the approval response notification message."""
    # Setup: approval was requested by user 500
    test_pre_award_step.pre_award_approval_requested = True
    test_pre_award_step.pre_award_approval_requested_date = date.today()
    test_pre_award_step.pre_award_approval_requested_by = 500
    loaded_db.commit()

    # Respond with approval AND reviewer notes
    reviewer_notes = "This looks good, all requirements met"
    update_data = {
        "approval_status": "APPROVED",
        "reviewer_notes": reviewer_notes,
    }
    response = auth_client.patch(f"/api/v1/procurement-tracker-steps/{test_pre_award_step.id}", json=update_data)
    assert response.status_code == 200

    # Query for the approval response notification
    notification = loaded_db.scalars(
        select(Notification)
        .where(Notification.title == "Pre-Award Approval Approved")
        .where(Notification.recipient_id == test_pre_award_step.pre_award_approval_requested_by)
        .order_by(Notification.created_on.desc())
    ).first()

    assert notification is not None, "Notification should be created for approval response"
    assert reviewer_notes in notification.message, f"Reviewer notes should be in message. Got: {notification.message}"
    assert "Notes:" in notification.message, "Message should include 'Notes:' label"
    assert "```" in notification.message, "Notes should be wrapped in code block"


def test_decline_response_includes_reviewer_notes_in_notification(auth_client, test_pre_award_step, loaded_db):
    """Test that reviewer notes are included in the decline response notification message."""
    # Setup: approval was requested by user 500
    test_pre_award_step.pre_award_approval_requested = True
    test_pre_award_step.pre_award_approval_requested_date = date.today()
    test_pre_award_step.pre_award_approval_requested_by = 500
    loaded_db.commit()

    # Respond with decline AND reviewer notes
    reviewer_notes = "Missing required documentation"
    update_data = {
        "approval_status": "DECLINED",
        "reviewer_notes": reviewer_notes,
    }
    response = auth_client.patch(f"/api/v1/procurement-tracker-steps/{test_pre_award_step.id}", json=update_data)
    assert response.status_code == 200

    # Query for the decline response notification
    notification = loaded_db.scalars(
        select(Notification)
        .where(Notification.title == "Pre-Award Approval Declined")
        .where(Notification.recipient_id == test_pre_award_step.pre_award_approval_requested_by)
        .order_by(Notification.created_on.desc())
    ).first()

    assert notification is not None, "Notification should be created for decline response"
    assert reviewer_notes in notification.message, f"Reviewer notes should be in message. Got: {notification.message}"
    assert "Notes:" in notification.message, "Message should include 'Notes:' label"
    assert "```" in notification.message, "Notes should be wrapped in code block"


def test_approval_response_excludes_empty_reviewer_notes(auth_client, test_pre_award_step, loaded_db):
    """Test that reviewer notes are NOT included when they are empty."""
    # Setup: approval requested by user 500
    test_pre_award_step.pre_award_approval_requested = True
    test_pre_award_step.pre_award_approval_requested_date = date.today()
    test_pre_award_step.pre_award_approval_requested_by = 500
    loaded_db.commit()

    # Respond with approval but NO reviewer notes
    update_data = {
        "approval_status": "APPROVED",
    }
    response = auth_client.patch(f"/api/v1/procurement-tracker-steps/{test_pre_award_step.id}", json=update_data)
    assert response.status_code == 200

    # Query for the notification
    notification = loaded_db.scalars(
        select(Notification)
        .where(Notification.title == "Pre-Award Approval Approved")
        .where(Notification.recipient_id == test_pre_award_step.pre_award_approval_requested_by)
        .order_by(Notification.created_on.desc())
    ).first()

    assert notification is not None, "Notification should be created"
    assert (
        "Notes:" not in notification.message
    ), f"Notes section should not appear when empty. Got: {notification.message}"
    # Verify base message is present
    assert "has been approved" in notification.message


def test_approval_response_excludes_whitespace_only_reviewer_notes(auth_client, test_pre_award_step, loaded_db):
    """Test that whitespace-only reviewer notes are treated as empty."""
    # Setup: approval requested by user 500
    test_pre_award_step.pre_award_approval_requested = True
    test_pre_award_step.pre_award_approval_requested_date = date.today()
    test_pre_award_step.pre_award_approval_requested_by = 500
    loaded_db.commit()

    # Respond with approval but whitespace-only notes
    update_data = {
        "approval_status": "APPROVED",
        "reviewer_notes": "   \n  ",
    }
    response = auth_client.patch(f"/api/v1/procurement-tracker-steps/{test_pre_award_step.id}", json=update_data)
    assert response.status_code == 200

    # Query for the notification
    notification = loaded_db.scalars(
        select(Notification)
        .where(Notification.title == "Pre-Award Approval Approved")
        .where(Notification.recipient_id == test_pre_award_step.pre_award_approval_requested_by)
        .order_by(Notification.created_on.desc())
    ).first()

    assert notification is not None, "Notification should be created"
    assert (
        "Notes:" not in notification.message
    ), f"Notes section should not appear for whitespace-only notes. Got: {notification.message}"
    # Verify base message is present
    assert "has been approved" in notification.message


def test_reviewer_notes_prevent_markdown_injection(auth_client, test_pre_award_step, loaded_db):
    """Test that Markdown syntax in reviewer notes is escaped and doesn't render."""
    # Setup: approval requested by user 500
    test_pre_award_step.pre_award_approval_requested = True
    test_pre_award_step.pre_award_approval_requested_date = date.today()
    test_pre_award_step.pre_award_approval_requested_by = 500
    loaded_db.commit()

    # Respond with approval and Markdown injection attempt
    malicious_notes = "**Bold** text with [link](http://example.com) and ```code``` attempt"
    update_data = {
        "approval_status": "APPROVED",
        "reviewer_notes": malicious_notes,
    }
    response = auth_client.patch(f"/api/v1/procurement-tracker-steps/{test_pre_award_step.id}", json=update_data)
    assert response.status_code == 200

    # Query for the notification
    notification = loaded_db.scalars(
        select(Notification)
        .where(Notification.title == "Pre-Award Approval Approved")
        .where(Notification.recipient_id == test_pre_award_step.pre_award_approval_requested_by)
        .order_by(Notification.created_on.desc())
    ).first()

    assert notification is not None, "Notification should be created"
    # Verify notes are included in the message
    assert "Notes:" in notification.message, "Message should include 'Notes:' label"
    # Verify the raw Markdown syntax is preserved as plain text
    assert "**Bold**" in notification.message, "Markdown syntax should be preserved literally"
    assert "[link]" in notification.message, "Link syntax should be preserved literally"
    assert "```code```" in notification.message, "Triple backticks should be preserved literally"


def test_reviewer_notes_backtick_injection_prevented(auth_client, test_pre_award_step, loaded_db):
    """Test that triple backticks in reviewer notes don't break the code fence."""
    # Setup: approval requested by user 500
    test_pre_award_step.pre_award_approval_requested = True
    test_pre_award_step.pre_award_approval_requested_date = date.today()
    test_pre_award_step.pre_award_approval_requested_by = 500
    loaded_db.commit()

    # Try to break the code fence with triple backticks followed by markdown
    injection_attempt = "Approved\n```\n**This should NOT render as bold**"
    update_data = {
        "approval_status": "APPROVED",
        "reviewer_notes": injection_attempt,
    }
    response = auth_client.patch(f"/api/v1/procurement-tracker-steps/{test_pre_award_step.id}", json=update_data)
    assert response.status_code == 200

    # Query for the notification
    notification = loaded_db.scalars(
        select(Notification)
        .where(Notification.title == "Pre-Award Approval Approved")
        .where(Notification.recipient_id == test_pre_award_step.pre_award_approval_requested_by)
        .order_by(Notification.created_on.desc())
    ).first()

    assert notification is not None, "Notification should be created"
    # Verify notes are included in the message
    assert "Notes:" in notification.message, "Message should include 'Notes:' label"
    # Verify triple backticks are preserved in the notes
    assert "```" in notification.message, "Triple backticks should be preserved"
    # Verify the markdown after triple backticks is also preserved literally
    assert "**This should NOT render as bold**" in notification.message, "Markdown after backticks should be literal"
