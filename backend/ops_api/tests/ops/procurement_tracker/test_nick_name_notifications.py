"""Notification-body tests for issue #6144.

`agreement.display_name` is the single chokepoint for the in-app notification bodies
in `services/procurement_tracker_steps.py`. These tests pin that the nickname (once
set) actually shows up in the notification message, rather than the full title.
"""

from datetime import date

import pytest
from sqlalchemy import func, select

from models import Notification
from models.agreements import Agreement
from models.notifications import AwardApprovalNotification, PreAwardApprovalNotification
from models.procurement_tracker import (
    DefaultProcurementTrackerStep,
    ProcurementTracker,
    ProcurementTrackerStepStatus,
    ProcurementTrackerStepType,
)


@pytest.fixture
def nicknamed_agreement(app_ctx, loaded_db):
    """Give the tracker-1 agreement a distinctive nickname for the duration of the test."""
    tracker = loaded_db.get(ProcurementTracker, 1)
    agreement = loaded_db.get(Agreement, tracker.agreement_id)

    original_nick_name = agreement.nick_name
    agreement.nick_name = "NOTIFY-NICK-TEST"
    loaded_db.commit()
    loaded_db.refresh(agreement)

    yield agreement, tracker

    agreement.nick_name = original_nick_name
    loaded_db.commit()


@pytest.fixture
def test_pre_award_notification_step(app_ctx, loaded_db, nicknamed_agreement):
    """A PRE_AWARD step, not yet requested, ready to trigger the request notification."""
    _, tracker = nicknamed_agreement

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

    step = DefaultProcurementTrackerStep(
        procurement_tracker=tracker,
        step_number=997,
        step_type=ProcurementTrackerStepType.PRE_AWARD,
        status=ProcurementTrackerStepStatus.ACTIVE,
        pre_award_approval_requested=False,
        pre_award_approval_status=None,
    )
    loaded_db.add(step)
    loaded_db.commit()
    loaded_db.refresh(step)

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
def test_award_notification_step(app_ctx, loaded_db, nicknamed_agreement):
    """An AWARD step, not yet approved, ready to trigger the approved notification."""
    _, tracker = nicknamed_agreement

    step = DefaultProcurementTrackerStep(
        procurement_tracker=tracker,
        step_number=996,
        step_type=ProcurementTrackerStepType.AWARD,
        status=ProcurementTrackerStepStatus.ACTIVE,
        award_approval_requested=True,
        award_approval_requested_by=500,
        award_approval_requested_date=date.today(),
        award_approval_status=None,
    )
    loaded_db.add(step)
    loaded_db.commit()
    loaded_db.refresh(step)

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


def test_pre_award_approval_request_notification_uses_nick_name(
    auth_client, nicknamed_agreement, test_pre_award_notification_step, loaded_db
):
    """The pre-award approval request notification should name the agreement by nickname."""
    agreement, _ = nicknamed_agreement
    initial_notification_count = loaded_db.scalar(select(func.count()).select_from(Notification))

    update_data = {
        "approval_requested": True,
        "approval_requested_date": date.today().isoformat(),
        "requestor_notes": "Please review and approve",
    }
    response = auth_client.patch(
        f"/api/v1/procurement-tracker-steps/{test_pre_award_notification_step.id}", json=update_data
    )
    assert response.status_code == 200

    final_notification_count = loaded_db.scalar(select(func.count()).select_from(Notification))
    assert final_notification_count > initial_notification_count

    notification = loaded_db.scalars(
        select(PreAwardApprovalNotification)
        .where(PreAwardApprovalNotification.procurement_tracker_step_id == test_pre_award_notification_step.id)
        .order_by(PreAwardApprovalNotification.id.desc())
    ).first()

    assert notification is not None
    assert agreement.nick_name in notification.message
    assert agreement.name not in notification.message


def test_award_approved_notification_uses_nick_name(
    auth_client, nicknamed_agreement, test_award_notification_step, loaded_db
):
    """The award-approved notification should name the agreement by nickname."""
    agreement, _ = nicknamed_agreement

    response = auth_client.patch(
        f"/api/v1/procurement-tracker-steps/{test_award_notification_step.id}",
        json={"approval_status": "APPROVED", "obligated_date": date.today().isoformat()},
    )
    assert response.status_code == 200

    notification = loaded_db.scalars(
        select(AwardApprovalNotification)
        .where(AwardApprovalNotification.procurement_tracker_step_id == test_award_notification_step.id)
        .order_by(AwardApprovalNotification.id.desc())
    ).first()

    assert notification is not None
    assert agreement.nick_name in notification.message
    assert agreement.name not in notification.message
