"""
Shared procurement workflow logic.

Provides the domain operations for creating and linking ProcurementAction,
ProcurementTracker, and BudgetLineItem records when budget lines transition
to IN_EXECUTION status.

Used by:
- data_tools backfill script
- data_tools spreadsheet ingest
- ops_api event handler
"""

from datetime import date
from typing import Optional

from loguru import logger
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from models.budget_line_items import BudgetLineItem, BudgetLineItemStatus
from models.events import OpsEvent, OpsEventStatus, OpsEventType
from models.procurement_action import AwardType, ProcurementAction, ProcurementActionStatus
from models.procurement_tracker import (
    DefaultProcurementTracker,
    ProcurementTrackerStatus,
)


# ---------------------------------------------------------------------------
# Query helpers
# ---------------------------------------------------------------------------


def has_obligated_blis(session: Session, agreement_id: int) -> bool:
    """Check if an agreement has any OBLIGATED budget line items."""
    return (
        session.execute(
            select(BudgetLineItem.id)
            .where(BudgetLineItem.agreement_id == agreement_id)
            .where(BudgetLineItem.status == BudgetLineItemStatus.OBLIGATED)
            .limit(1)
        ).scalar_one_or_none()
        is not None
    )


def get_earliest_obligated_fiscal_year(session: Session, agreement_id: int) -> Optional[int]:
    """Get the earliest fiscal year among OBLIGATED BLIs for an agreement."""
    result = session.execute(
        select(func.min(BudgetLineItem.fiscal_year))
        .where(BudgetLineItem.agreement_id == agreement_id)
        .where(BudgetLineItem.status == BudgetLineItemStatus.OBLIGATED)
    ).scalar_one_or_none()

    return int(result) if result is not None else None


def get_earliest_obligated_date_needed(session: Session, agreement_id: int) -> Optional[date]:
    """Get the earliest date_needed among OBLIGATED BLIs for an agreement."""
    return session.execute(
        select(func.min(BudgetLineItem.date_needed))
        .where(BudgetLineItem.agreement_id == agreement_id)
        .where(BudgetLineItem.status == BudgetLineItemStatus.OBLIGATED)
    ).scalar_one_or_none()


# ---------------------------------------------------------------------------
# BLI linking
# ---------------------------------------------------------------------------


def link_blis_to_action(
    session: Session,
    agreement: "Agreement",
    procurement_action: ProcurementAction,
    bli_status: BudgetLineItemStatus,
    fiscal_year: Optional[int] = None,
) -> int:
    """
    Link unlinked BLIs of the given status to a ProcurementAction.
    Optionally filter by fiscal year. Returns count of newly linked BLIs.
    """
    query = (
        select(BudgetLineItem)
        .where(BudgetLineItem.agreement_id == agreement.id)
        .where(BudgetLineItem.status == bli_status)
        .where(BudgetLineItem.procurement_action_id.is_(None))
    )

    if fiscal_year is not None:
        query = query.where(BudgetLineItem.fiscal_year == fiscal_year)

    unlinked_blis = session.execute(query).scalars().all()

    linked_count = 0
    for bli in unlinked_blis:
        bli.procurement_action_id = procurement_action.id
        linked_count += 1

    if linked_count:
        fy_msg = f" (FY {fiscal_year})" if fiscal_year else ""
        logger.info(
            f"Linked {linked_count} {bli_status.name} BLI(s){fy_msg} to "
            f"ProcurementAction {procurement_action.id} ({procurement_action.award_type.name}) "
            f"for Agreement {agreement.id} ('{agreement.name}')"
        )

    return linked_count


def link_single_bli_to_action(
    budget_line_item: BudgetLineItem,
    procurement_action: ProcurementAction,
) -> bool:
    """
    Link a single BLI to a ProcurementAction if not already linked.
    Returns True if newly linked.
    """
    if budget_line_item.procurement_action_id == procurement_action.id:
        return False

    budget_line_item.procurement_action_id = procurement_action.id
    logger.info(
        f"Linked BLI {budget_line_item.id} to ProcurementAction {procurement_action.id} "
        f"for Agreement {budget_line_item.agreement_id}"
    )
    return True


# ---------------------------------------------------------------------------
# Attribute syncing
# ---------------------------------------------------------------------------


def _sync_procurement_shop(action: ProcurementAction, agreement: "Agreement") -> None:
    """Sync procurement_shop_id from agreement.awarding_entity_id if they diverged."""
    if (
        action.procurement_shop_id != agreement.awarding_entity_id
        and agreement.awarding_entity_id is not None
    ):
        old_shop_id = action.procurement_shop_id
        action.procurement_shop_id = agreement.awarding_entity_id
        logger.info(
            f"Updated ProcurementAction {action.id} procurement_shop_id "
            f"from {old_shop_id} to {agreement.awarding_entity_id} "
            f"for Agreement {agreement.id} ('{agreement.name}')"
        )


# ---------------------------------------------------------------------------
# OpsEvent creation
# ---------------------------------------------------------------------------


def _create_action_event(
    session: Session,
    action: ProcurementAction,
    created_by: Optional[int] = None,
    source: Optional[str] = None,
) -> None:
    """Create a CREATE_PROCUREMENT_ACTION OpsEvent."""
    event_details = {
        "agreement_id": action.agreement_id,
        "action_id": action.id,
        "status": action.status.name,
        "award_type": action.award_type.name,
    }
    if source:
        event_details["message"] = f"{source}: created {action.award_type.name} action"

    session.add(
        OpsEvent(
            event_type=OpsEventType.CREATE_PROCUREMENT_ACTION,
            event_status=OpsEventStatus.SUCCESS,
            created_by=created_by,
            event_details=event_details,
        )
    )


def _create_tracker_event(
    session: Session,
    tracker: DefaultProcurementTracker,
    created_by: Optional[int] = None,
    source: Optional[str] = None,
) -> None:
    """Create a CREATE_PROCUREMENT_TRACKER OpsEvent."""
    event_details = {
        "agreement_id": tracker.agreement_id,
        "tracker_id": tracker.id,
        "procurement_action_id": tracker.procurement_action,
        "status": tracker.status.name,
        "active_step_number": tracker.active_step_number,
    }
    if source:
        event_details["message"] = f"{source}: created tracker for agreement {tracker.agreement_id}"

    session.add(
        OpsEvent(
            event_type=OpsEventType.CREATE_PROCUREMENT_TRACKER,
            event_status=OpsEventStatus.SUCCESS,
            created_by=created_by,
            event_details=event_details,
        )
    )


# ---------------------------------------------------------------------------
# High-level workflow operations
# ---------------------------------------------------------------------------


def get_or_create_procurement_records_for_new_award(
    session: Session,
    agreement: "Agreement",
    created_by: Optional[int] = None,
    action_status: ProcurementActionStatus = ProcurementActionStatus.PLANNED,
    tracker_status: ProcurementTrackerStatus = ProcurementTrackerStatus.ACTIVE,
    date_awarded_obligated: Optional[date] = None,
    source: Optional[str] = None,
) -> tuple[ProcurementAction, DefaultProcurementTracker, bool, bool]:
    """
    Get or create a NEW_AWARD ProcurementAction and tracker for the agreement.
    Syncs procurement_shop_id. Creates audit OpsEvents for new records.

    Returns (action, tracker, action_created, tracker_created).
    """
    action, action_created = ProcurementAction.get_or_create_for_agreement(
        session,
        agreement,
        award_type=AwardType.NEW_AWARD,
        status=action_status,
        date_awarded_obligated=date_awarded_obligated,
        created_by=created_by,
    )

    if action_created:
        _create_action_event(session, action, created_by=created_by, source=source)

    _sync_procurement_shop(action, agreement)

    tracker, tracker_created = DefaultProcurementTracker.get_or_create_for_action(
        session,
        agreement_id=agreement.id,
        procurement_action_id=action.id,
        status=tracker_status,
        created_by=created_by,
    )

    if tracker_created:
        _create_tracker_event(session, tracker, created_by=created_by, source=source)

    # Apply step statuses based on tracker_status
    if tracker_status == ProcurementTrackerStatus.COMPLETED:
        tracker.mark_completed(completed_date=date_awarded_obligated)

    return action, tracker, action_created, tracker_created


def get_or_create_procurement_records_for_modification(
    session: Session,
    agreement: "Agreement",
    created_by: Optional[int] = None,
    source: Optional[str] = None,
) -> tuple[ProcurementAction, DefaultProcurementTracker, bool, bool]:
    """
    Get or create a MODIFICATION ProcurementAction and ACTIVE tracker.

    Returns (action, tracker, action_created, tracker_created).
    """
    action, action_created = ProcurementAction.get_or_create_for_agreement(
        session,
        agreement,
        award_type=AwardType.MODIFICATION,
        status=ProcurementActionStatus.PLANNED,
        created_by=created_by,
    )

    if action_created:
        _create_action_event(session, action, created_by=created_by, source=source)

    _sync_procurement_shop(action, agreement)

    tracker, tracker_created = DefaultProcurementTracker.get_or_create_for_action(
        session,
        agreement_id=agreement.id,
        procurement_action_id=action.id,
        status=ProcurementTrackerStatus.ACTIVE,
        created_by=created_by,
    )

    if tracker_created:
        _create_tracker_event(session, tracker, created_by=created_by, source=source)

    return action, tracker, action_created, tracker_created
