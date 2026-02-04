"""
Event handlers for procurement tracker creation.

This module contains event subscribers that handle procurement tracker
and procurement action creation when budget line items transition to
IN_EXECUTION status.
"""

from typing import Optional, Tuple

from loguru import logger
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from models import (
    Agreement,
    BudgetLineItem,
    ChangeRequestStatus,
    ChangeRequestType,
    DefaultProcurementTracker,
    OpsEvent,
    ProcurementAction,
)
from models.events import OpsEventStatus, OpsEventType
from models.procurement_action import AwardType, ProcurementActionStatus
from models.procurement_tracker import ProcurementTrackerStatus


def procurement_tracker_trigger(event: OpsEvent, session: Session) -> None:
    """
    Handle UPDATE_CHANGE_REQUEST events to create procurement tracker and action.

    Creates DefaultProcurementTracker and ProcurementAction when:
    - A BudgetLineItemChangeRequest is approved
    - The budget line status changes to IN_EXECUTION
    - The agreement is not yet awarded
    - Neither tracker nor action exists yet for the agreement

    This subscriber implements idempotency to handle multiple budget lines
    transitioning to IN_EXECUTION at different times.

    Args:
        event: OpsEvent with UPDATE_CHANGE_REQUEST type
        session: SQLAlchemy session for database operations
    """
    try:
        # Extract and validate event details
        event_details = event.event_details or {}
        change_request = event_details.get("change_request")

        if not change_request:
            logger.debug("No change_request in event details, skipping")
            return

        # Validate change request and extract IDs
        is_valid, reason, agreement_id, budget_line_item_id = _validate_change_request_for_tracker_creation(
            change_request
        )

        if not is_valid:
            logger.debug(f"{reason}, skipping")
            return

        # Load agreement with row-level lock to prevent concurrent processing
        # This ensures only one handler processes this agreement at a time
        agreement_stmt = select(Agreement).where(Agreement.id == agreement_id).with_for_update()
        agreement = session.scalar(agreement_stmt)
        if not agreement:
            logger.warning(f"Agreement {agreement_id} not found, skipping tracker creation")
            return

        # Check if agreement is already awarded
        if agreement.is_awarded:
            logger.debug(f"Agreement {agreement_id} is already awarded, skipping tracker creation")
            return

        # Load the budget line item
        budget_line_item = session.get(BudgetLineItem, budget_line_item_id)
        if not budget_line_item:
            logger.warning(f"BudgetLineItem {budget_line_item_id} not found, skipping")
            return

        # Get existing tracker and action
        existing_tracker, existing_action = _get_existing_tracker_and_action(session, agreement_id)

        # Handle creation based on what exists
        _handle_tracker_action_creation(
            session, agreement_id, budget_line_item_id, budget_line_item, existing_tracker, existing_action, event
        )

    except IntegrityError as e:
        # This can happen if two handlers race and both try to create records
        # The row-level locks should prevent this, but handle gracefully just in case
        agreement_id_for_log = (
            change_request.get("agreement_id") if "change_request" in locals() and change_request else None
        )
        logger.warning(
            f"IntegrityError in procurement_tracker_trigger (likely duplicate creation attempt): {e}",
            extra={"event_id": event.id, "event_type": event.event_type.name, "agreement_id": agreement_id_for_log},
        )
        session.rollback()
    except Exception as e:
        agreement_id_for_log = (
            change_request.get("agreement_id") if "change_request" in locals() and change_request else None
        )
        logger.error(
            f"Error in procurement_tracker_trigger: {e}",
            exc_info=True,
            extra={"event_id": event.id, "event_type": event.event_type.name, "agreement_id": agreement_id_for_log},
        )


def _validate_change_request_for_tracker_creation(
    change_request: dict,
) -> Tuple[bool, Optional[str], Optional[int], Optional[int]]:
    """
    Validate that the change request should trigger tracker creation.

    Returns:
        Tuple of (is_valid, reason, agreement_id, budget_line_item_id)
    """
    # Filter: Only process BudgetLineItemChangeRequest
    change_request_type = change_request.get("change_request_type")
    if change_request_type != ChangeRequestType.BUDGET_LINE_ITEM_CHANGE_REQUEST.name:
        return False, f"Change request type is {change_request_type}, not BLI", None, None

    # Check if this is an approved IN_EXECUTION transition
    status = change_request.get("status")
    if status != ChangeRequestStatus.APPROVED.name:
        return False, f"Change request status is {status}, not APPROVED", None, None

    has_status_change = change_request.get("has_status_change", False)
    requested_change_data = change_request.get("requested_change_data", {})
    new_status = requested_change_data.get("status")

    if not (has_status_change and new_status == "IN_EXECUTION"):
        return (
            False,
            f"Not an IN_EXECUTION transition (has_status_change={has_status_change}, new_status={new_status})",
            None,
            None,
        )

    # Extract IDs
    agreement_id = change_request.get("agreement_id")
    budget_line_item_id = change_request.get("budget_line_item_id")

    if not agreement_id:
        return False, "No agreement_id in change request", None, None

    if not budget_line_item_id:
        return False, "No budget_line_item_id in change request", None, None

    return True, None, agreement_id, budget_line_item_id


def _get_existing_tracker_and_action(
    session: Session, agreement_id: int
) -> Tuple[Optional[DefaultProcurementTracker], Optional[ProcurementAction]]:
    """
    Query for existing ACTIVE DefaultProcurementTracker and valid ProcurementAction.

    Uses SELECT FOR UPDATE to prevent race conditions when multiple budget lines
    transition to IN_EXECUTION simultaneously.

    Only returns tracker if it's ACTIVE (not INACTIVE or COMPLETED).
    Only returns action if it's a NEW_AWARD that is not AWARDED, CERTIFIED, or CANCELLED.

    Args:
        session: SQLAlchemy session
        agreement_id: Agreement ID to query for

    Returns:
        Tuple of (existing_tracker, existing_action)
    """
    # Find ACTIVE tracker with row-level lock to prevent race conditions
    tracker_stmt = (
        select(DefaultProcurementTracker)
        .where(
            DefaultProcurementTracker.agreement_id == agreement_id,
            DefaultProcurementTracker.status == ProcurementTrackerStatus.ACTIVE,
        )
        .with_for_update()
    )
    existing_tracker = session.scalar(tracker_stmt)

    # Find NEW_AWARD action that is not in a final state with row-level lock
    action_stmt = (
        select(ProcurementAction)
        .where(
            ProcurementAction.agreement_id == agreement_id,
            ProcurementAction.agreement_mod_id.is_(None),
            ProcurementAction.award_type == AwardType.NEW_AWARD,
            ProcurementAction.status.not_in(
                [
                    ProcurementActionStatus.AWARDED,
                    ProcurementActionStatus.CERTIFIED,
                    ProcurementActionStatus.CANCELLED,
                ]
            ),
        )
        .with_for_update()
    )
    existing_action = session.scalar(action_stmt)

    return existing_tracker, existing_action


def _create_new_procurement_action(
    session: Session, agreement_id: int, created_by: Optional[int] = None
) -> ProcurementAction:
    """
    Create a new ProcurementAction with default values.

    Args:
        session: SQLAlchemy session
        agreement_id: Agreement ID for the action
        created_by: User ID of the creator

    Returns:
        The created ProcurementAction instance
    """
    action = ProcurementAction(
        agreement_id=agreement_id,
        status=ProcurementActionStatus.PLANNED,
        award_type=AwardType.NEW_AWARD,
        agreement_mod_id=None,
        created_by=created_by,
    )
    session.add(action)
    return action


def _create_procurement_tracker_event(
    session: Session,
    tracker: DefaultProcurementTracker,
    created_by: Optional[int] = None,
    event_status: OpsEventStatus = OpsEventStatus.SUCCESS,
    error_message: Optional[str] = None,
) -> OpsEvent:
    """
    Create a CREATE_PROCUREMENT_TRACKER event.

    Args:
        session: SQLAlchemy session
        tracker: The created tracker (can be None for FAILED events)
        created_by: User ID of the creator
        event_status: SUCCESS or FAILED
        error_message: Error message for FAILED events

    Returns:
        The created OpsEvent instance
    """
    event_details = {
        "agreement_id": tracker.agreement_id if tracker else None,
        "tracker_id": tracker.id if tracker else None,
        "procurement_action_id": tracker.procurement_action if tracker else None,
        "status": tracker.status.name if tracker else None,
        "active_step_number": tracker.active_step_number if tracker else None,
    }

    if error_message:
        event_details["error_message"] = error_message

    ops_event = OpsEvent(
        event_type=OpsEventType.CREATE_PROCUREMENT_TRACKER,
        event_status=event_status,
        created_by=created_by,
        event_details=event_details,
    )
    session.add(ops_event)
    logger.debug(
        f"Created {event_status.name} event for CREATE_PROCUREMENT_TRACKER "
        f"(tracker_id={tracker.id if tracker else None})"
    )
    return ops_event


def _create_procurement_action_event(
    session: Session,
    action: ProcurementAction,
    created_by: Optional[int] = None,
    event_status: OpsEventStatus = OpsEventStatus.SUCCESS,
    error_message: Optional[str] = None,
) -> OpsEvent:
    """
    Create a CREATE_PROCUREMENT_ACTION event.

    Args:
        session: SQLAlchemy session
        action: The created action (can be None for FAILED events)
        created_by: User ID of the creator
        event_status: SUCCESS or FAILED
        error_message: Error message for FAILED events

    Returns:
        The created OpsEvent instance
    """
    event_details = {
        "agreement_id": action.agreement_id if action else None,
        "action_id": action.id if action else None,
        "agreement_mod_id": action.agreement_mod_id if action else None,
        "status": action.status.name if action else None,
        "award_type": action.award_type.name if action else None,
    }

    if error_message:
        event_details["error_message"] = error_message

    ops_event = OpsEvent(
        event_type=OpsEventType.CREATE_PROCUREMENT_ACTION,
        event_status=event_status,
        created_by=created_by,
        event_details=event_details,
    )
    session.add(ops_event)
    logger.debug(
        f"Created {event_status.name} event for CREATE_PROCUREMENT_ACTION "
        f"(action_id={action.id if action else None})"
    )
    return ops_event


def _associate_budget_line_with_action(
    budget_line_item: BudgetLineItem, action: ProcurementAction, budget_line_item_id: int, agreement_id: int
) -> None:
    """
    Associate a budget line item with a procurement action if not already associated.

    Args:
        budget_line_item: BudgetLineItem to associate
        action: ProcurementAction to associate with
        budget_line_item_id: ID of the budget line item (for logging)
        agreement_id: ID of the agreement (for logging)
    """
    if budget_line_item.procurement_action_id != action.id:
        budget_line_item.procurement_action_id = action.id
        logger.info(f"Associated BLI {budget_line_item_id} with action for agreement {agreement_id}")
    else:
        logger.debug(f"BLI {budget_line_item_id} already associated with action for agreement {agreement_id}")


def _handle_both_exist(
    budget_line_item: BudgetLineItem,
    existing_tracker: DefaultProcurementTracker,
    existing_action: ProcurementAction,
    agreement_id: int,
    budget_line_item_id: int,
) -> None:
    """
    Handle scenario where both tracker and action exist.

    Associates budget line with action and ensures tracker is linked to action.

    Args:
        budget_line_item: BudgetLineItem instance
        existing_tracker: Existing tracker
        existing_action: Existing action
        agreement_id: Agreement ID (for logging)
        budget_line_item_id: Budget line item ID (for logging)
    """
    _associate_budget_line_with_action(budget_line_item, existing_action, budget_line_item_id, agreement_id)

    # Ensure tracker is linked to action
    if existing_tracker.procurement_action != existing_action.id:
        existing_tracker.procurement_action = existing_action.id
        logger.info(f"Linked tracker to action for agreement {agreement_id}")


def _handle_neither_exist(
    session: Session,
    agreement_id: int,
    budget_line_item_id: int,
    budget_line_item: BudgetLineItem,
    created_by: Optional[int],
) -> None:
    """
    Handle scenario where neither tracker nor action exist.

    Creates both tracker and action, links them together, and creates SUCCESS events.
    On failure, creates FAILED events for both and re-raises the exception.

    Args:
        session: SQLAlchemy session
        agreement_id: Agreement ID
        budget_line_item_id: Budget line item ID (for logging)
        budget_line_item: BudgetLineItem instance
        created_by: User ID of the creator
    """
    logger.info(f"Creating tracker and action for agreement {agreement_id}")

    try:
        tracker = DefaultProcurementTracker.create_with_steps(
            agreement_id=agreement_id, status=ProcurementTrackerStatus.ACTIVE, created_by=created_by
        )
        session.add(tracker)

        action = _create_new_procurement_action(session, agreement_id, created_by=created_by)
        session.flush()  # Ensure action.id and tracker.id are available

        # Link tracker to action
        tracker.procurement_action = action.id

        # Associate budget line with action
        budget_line_item.procurement_action_id = action.id

        # Create SUCCESS events for tracker and action creation
        _create_procurement_tracker_event(session, tracker, created_by=created_by)
        _create_procurement_action_event(session, action, created_by=created_by)

        logger.info(
            f"Successfully created tracker and action for agreement {agreement_id}, "
            f"associated BLI {budget_line_item_id}"
        )
    except Exception as e:
        # Create FAILED events for both tracker and action
        _create_procurement_tracker_event(
            session, None, created_by=created_by, event_status=OpsEventStatus.FAILED, error_message=str(e)
        )
        _create_procurement_action_event(
            session, None, created_by=created_by, event_status=OpsEventStatus.FAILED, error_message=str(e)
        )
        raise


def _handle_tracker_exists_only(
    session: Session,
    agreement_id: int,
    budget_line_item_id: int,
    budget_line_item: BudgetLineItem,
    existing_tracker: DefaultProcurementTracker,
    created_by: Optional[int],
) -> None:
    """
    Handle scenario where only tracker exists.

    Creates action, links tracker to it, and creates SUCCESS event.
    On failure, creates FAILED event and re-raises the exception.

    Args:
        session: SQLAlchemy session
        agreement_id: Agreement ID
        budget_line_item_id: Budget line item ID (for logging)
        budget_line_item: BudgetLineItem instance
        existing_tracker: Existing tracker
        created_by: User ID of the creator
    """
    logger.warning(f"Tracker exists but action missing for agreement {agreement_id}, creating action")

    try:
        action = _create_new_procurement_action(session, agreement_id, created_by=created_by)
        session.flush()  # Ensure action.id is available

        # Link tracker to new action
        existing_tracker.procurement_action = action.id

        # Associate budget line with action
        budget_line_item.procurement_action_id = action.id

        # Create SUCCESS event for action creation
        _create_procurement_action_event(session, action, created_by=created_by)

        logger.info(f"Created missing action for agreement {agreement_id}, associated BLI {budget_line_item_id}")
    except Exception as e:
        # Create FAILED event for action creation
        _create_procurement_action_event(
            session, None, created_by=created_by, event_status=OpsEventStatus.FAILED, error_message=str(e)
        )
        raise


def _handle_action_exists_only(
    session: Session,
    agreement_id: int,
    budget_line_item_id: int,
    budget_line_item: BudgetLineItem,
    existing_action: ProcurementAction,
    created_by: Optional[int],
) -> None:
    """
    Handle scenario where only action exists.

    Creates tracker, links it to action, and creates SUCCESS event.
    On failure, creates FAILED event and re-raises the exception.

    Args:
        session: SQLAlchemy session
        agreement_id: Agreement ID
        budget_line_item_id: Budget line item ID (for logging)
        budget_line_item: BudgetLineItem instance
        existing_action: Existing action
        created_by: User ID of the creator
    """
    logger.warning(f"Action exists but tracker missing for agreement {agreement_id}, creating tracker")

    try:
        tracker = DefaultProcurementTracker.create_with_steps(
            agreement_id=agreement_id, status=ProcurementTrackerStatus.ACTIVE, created_by=created_by
        )
        session.add(tracker)
        session.flush()  # Ensure tracker.id is available

        # Link tracker to existing action
        tracker.procurement_action = existing_action.id

        # Associate budget line with action
        _associate_budget_line_with_action(budget_line_item, existing_action, budget_line_item_id, agreement_id)

        # Create SUCCESS event for tracker creation
        _create_procurement_tracker_event(session, tracker, created_by=created_by)

        logger.info(f"Created missing tracker for agreement {agreement_id}")
    except Exception as e:
        # Create FAILED event for tracker creation
        _create_procurement_tracker_event(
            session, None, created_by=created_by, event_status=OpsEventStatus.FAILED, error_message=str(e)
        )
        raise


def _handle_tracker_action_creation(
    session: Session,
    agreement_id: int,
    budget_line_item_id: int,
    budget_line_item: BudgetLineItem,
    existing_tracker: Optional[DefaultProcurementTracker],
    existing_action: Optional[ProcurementAction],
    event: OpsEvent,
) -> None:
    """
    Handle creation of tracker and/or action based on what exists.

    Handles 4 scenarios:
    1. Both exist - associate budget line and ensure tracker is linked to action
    2. Neither exists - create both and link them
    3. Only tracker exists - create action and link tracker to it
    4. Only action exists - create tracker and link it to action

    Args:
        session: SQLAlchemy session
        agreement_id: Agreement ID
        budget_line_item_id: Budget line item ID
        budget_line_item: BudgetLineItem instance
        existing_tracker: Existing tracker or None
        existing_action: Existing action or None
        event: OpsEvent with user context
    """
    tracker_exists = existing_tracker is not None
    action_exists = existing_action is not None

    if tracker_exists and action_exists:
        _handle_both_exist(budget_line_item, existing_tracker, existing_action, agreement_id, budget_line_item_id)
    elif not tracker_exists and not action_exists:
        _handle_neither_exist(session, agreement_id, budget_line_item_id, budget_line_item, event.created_by)
    elif tracker_exists and not action_exists:
        _handle_tracker_exists_only(
            session, agreement_id, budget_line_item_id, budget_line_item, existing_tracker, event.created_by
        )
    else:
        _handle_action_exists_only(
            session, agreement_id, budget_line_item_id, budget_line_item, existing_action, event.created_by
        )
