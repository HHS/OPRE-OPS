from sqlalchemy import select

from models import (
    AgreementMod,
    DefaultProcurementTracker,
    DefaultProcurementTrackerStep,
    ProcurementAction,
    ProcurementTracker,
    ProcurementTrackerStatus,
    ProcurementTrackerStepStatus,
    ProcurementTrackerStepType,
)


def cleanup_award_history(loaded_db, agreement, vendor=None):
    """Delete committed award-history data for an agreement in FK-safe order.

    Trackers reference procurement actions; actions reference agreement mods, so
    they must be removed in that order. Deleting a tracker cascades its steps.
    """
    loaded_db.rollback()
    for tracker in loaded_db.scalars(
        select(ProcurementTracker).where(ProcurementTracker.agreement_id == agreement.id)
    ).all():
        loaded_db.delete(tracker)
    loaded_db.flush()
    for action in loaded_db.scalars(
        select(ProcurementAction).where(ProcurementAction.agreement_id == agreement.id)
    ).all():
        loaded_db.delete(action)
    loaded_db.flush()
    for mod in loaded_db.scalars(select(AgreementMod).where(AgreementMod.agreement_id == agreement.id)).all():
        loaded_db.delete(mod)
    loaded_db.delete(agreement)
    if vendor is not None:
        loaded_db.delete(vendor)
    loaded_db.commit()


def make_awarded_tracker(
    loaded_db,
    agreement_id,
    action_id,
    *,
    vendor=None,
    award_amount=None,
    award_date=None,
    requisition_number=None,
    requisition_approved_date=None,
    tracker_status=ProcurementTrackerStatus.COMPLETED,
    award_step_status=ProcurementTrackerStepStatus.COMPLETED,
    award_approval_status="APPROVED",
):
    """Create a tracker linked to a procurement action, with AWARD + PRE_AWARD steps.

    Defaults to a COMPLETED tracker whose AWARD step has been Budget-Team-approved —
    the state the award-history tab surfaces. Override ``tracker_status`` /
    ``award_step_status`` / ``award_approval_status`` to exercise the gating (e.g. an
    in-progress tracker whose award is already approved, or a tracker whose award has
    not yet been approved).
    """
    tracker = DefaultProcurementTracker(
        agreement_id=agreement_id,
        status=tracker_status,
        procurement_action=action_id,
        active_step_number=6,
    )
    loaded_db.add(tracker)
    loaded_db.flush()

    pre_award_step = DefaultProcurementTrackerStep(
        procurement_tracker=tracker,
        step_number=5,
        step_type=ProcurementTrackerStepType.PRE_AWARD,
        status=ProcurementTrackerStepStatus.COMPLETED,
        pre_award_requisition_number=requisition_number,
        pre_award_requisition_approved_date=requisition_approved_date,
    )
    award_step = DefaultProcurementTrackerStep(
        procurement_tracker=tracker,
        step_number=6,
        step_type=ProcurementTrackerStepType.AWARD,
        status=award_step_status,
        award_approval_status=award_approval_status,
        award_vendor_id=vendor.id if vendor else None,
        award_amount=award_amount,
        award_date=award_date,
    )
    loaded_db.add_all([pre_award_step, award_step])
    loaded_db.flush()
    return tracker


def remove_keys(d: dict, keys: list[str]):
    """
    Recursively remove keys from a dictionary.
    """
    if isinstance(d, dict):
        for key in keys:
            d.pop(key, None)
        for value in d.values():
            remove_keys(value, keys)
    elif isinstance(d, list):
        for item in d:
            remove_keys(item, keys)


class DummyContextManager:
    def __init__(self):
        self.metadata = {}

    def __enter__(self):
        return self

    def __exit__(self):
        print("No Op")
