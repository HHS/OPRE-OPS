"""
Approve one or more ChangeRequest records out-of-band, on behalf of an assigned
reviewer, when no one with the right authority is available to approve via the UI.

Usage (from backend/ directory):
    python data_tools/src/approve_change_requests.py \\
        --env dev \\
        --approving-user-email jane.doe@example.com \\
        --change-request-id 4821 --change-request-id 4822 \\
        --reviewer-notes "Confirmed with COR via email 2026-07-30"

Set DRY_RUN=1 to preview changes without committing:
    DRY_RUN=1 python data_tools/src/approve_change_requests.py --env dev \\
        --approving-user-email jane.doe@example.com --change-request-id 4821
"""

import os
import sys
import time
from datetime import date, datetime

import click
from dotenv import load_dotenv
from loguru import logger
from sqlalchemy import func, inspect, select, text
from sqlalchemy.orm import Session, scoped_session, sessionmaker

from data_tools.src.common.db import init_db_from_config, setup_triggers
from data_tools.src.common.utils import commit_or_rollback, get_config, get_or_create_sys_user
from models import (
    Agreement,
    BudgetLineItem,
    BudgetLineItemStatus,
    ChangeRequest,
    ChangeRequestNotification,
    ChangeRequestStatus,
    ChangeRequestType,
    Division,
    NotificationType,
    OpsEvent,
    OpsEventStatus,
    OpsEventType,
    User,
    agreement_history_trigger_func,
)
from models.procurement_workflow import (
    get_or_create_procurement_records_for_new_award,
    link_blis_to_action,
)

load_dotenv(os.getenv("ENV_FILE", ".env"))

os.environ["TZ"] = "UTC"
time.tzset()

log_format = (
    "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
    "<level>{level: <8}</level> | "
    "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | "
    "<level>{message}</level>"
)
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
logger.remove()
logger.add(sys.stderr, format=log_format, level=LOG_LEVEL)

OUT_OF_BAND_MARKER = "[Approved via out-of-band script on behalf of assigned reviewer]"


def apply_change_request_data(target, data: dict) -> None:
    """Set each key in data onto target if it's a real mapped column attribute,
    converting the small set of fields that need type coercion first.

    requested_change_data stores plain JSON-safe primitives (as produced by
    PATCHRequestBodySchema.dump() when the change request was created) — e.g.
    status as a plain string like "IN_EXECUTION", date_needed as an ISO string
    like "2043-02-02". The real approval path (ChangeRequestService._apply_budget_line_item_changes)
    converts these back to real types via schema.load() before setattr; this
    reproduces just that conversion for the fields that need it.
    """
    coerced = dict(data)
    if "status" in coerced and coerced["status"] is not None:
        coerced["status"] = BudgetLineItemStatus(coerced["status"])
    if "date_needed" in coerced and coerced["date_needed"] is not None:
        coerced["date_needed"] = date.fromisoformat(coerced["date_needed"])

    mapped_columns = {c_attr.key for c_attr in inspect(target).mapper.column_attrs}
    for key, value in coerced.items():
        if key in mapped_columns:
            setattr(target, key, value)


def build_reviewer_notes(operator_note: str | None) -> str:
    if operator_note:
        return f"{operator_note} {OUT_OF_BAND_MARKER}"
    return OUT_OF_BAND_MARKER


def build_change_request_history_dict(change_request: "ChangeRequest", requestor_user: "User") -> dict:
    """Build the event_details['change_request'] dict shape that
    models.agreement_history.create_change_request_history_event expects."""
    return {
        "id": change_request.id,
        "requested_change_data": change_request.requested_change_data,
        "requested_change_diff": change_request.requested_change_diff,
        "reviewed_by_id": change_request.reviewed_by_id,
        "status": change_request.status.name,
        "budget_line_item_id": getattr(change_request, "budget_line_item_id", None),
        "agreement_id": change_request.agreement_id,
        "created_by_user": {"full_name": requestor_user.full_name if requestor_user else "Unknown User"},
    }


def convert_bli_status_to_pretty_string(status_name: str | None) -> str:
    """Local, trimmed copy of ops_api's convert_BLI_status_name_to_pretty_string."""
    try:
        return BudgetLineItemStatus(status_name).__str__() if status_name else BudgetLineItemStatus.DRAFT.__str__()
    except ValueError:
        return BudgetLineItemStatus.DRAFT.__str__()


def build_review_outcome_notification(change_request: "ChangeRequest") -> tuple[str | None, str | None]:
    """Ported, trimmed version of ops_api's build_review_outcome_title_and_message —
    only the APPROVED branches are needed here since this script never rejects."""
    if change_request.change_request_type == ChangeRequestType.AGREEMENT_CHANGE_REQUEST:
        return "Procurement Shop Change Approved", "Your procurement shop change request has been approved."

    # BUDGET_LINE_ITEM_CHANGE_REQUEST
    if "status" in change_request.requested_change_data:
        status_diff = change_request.requested_change_diff["status"]
        new_status = convert_bli_status_to_pretty_string(status_diff["new"])
        old_status = convert_bli_status_to_pretty_string(status_diff["old"])
        return (
            f"Budget Lines Approved from {old_status} to {new_status} Status",
            f"The status change you submitted was approved: {old_status} → {new_status}.",
        )
    if (
        "amount" in change_request.requested_change_data
        or "can_id" in change_request.requested_change_data
        or "date_needed" in change_request.requested_change_data
    ):
        return "Budget Change Request APPROVED", "Your budget change request has been approved."
    return None, None


def _collect_agreement_division_director_ids(agreement: "Agreement") -> tuple[set[int], set[int]]:
    """Walk agreement.budget_line_items -> can -> portfolio -> division to collect the
    set of division director/deputy ids with authority over this agreement."""
    director_ids: set[int] = set()
    deputy_ids: set[int] = set()
    for bli in agreement.budget_line_items:
        if bli.can and bli.can.portfolio and bli.can.portfolio.division:
            division = bli.can.portfolio.division
            if division.division_director_id:
                director_ids.add(division.division_director_id)
            if division.deputy_division_director_id:
                deputy_ids.add(division.deputy_division_director_id)
    return director_ids, deputy_ids


def warn_if_not_division_director(session: Session, change_request: "ChangeRequest", approving_user: "User") -> None:
    """Log a warning (never raises, never blocks) if approving_user is not the actual
    division director/deputy for this change request. Ported, warn-only version of
    ChangeRequestService._is_division_director_of_change_request."""
    if change_request.change_request_type == ChangeRequestType.AGREEMENT_CHANGE_REQUEST:
        agreement = session.get(Agreement, change_request.agreement_id)
        if agreement is None:
            return
        director_ids, deputy_ids = _collect_agreement_division_director_ids(agreement)
        if approving_user.id not in director_ids and approving_user.id not in deputy_ids:
            logger.warning(
                f"Approving user {approving_user.email} (id={approving_user.id}) is not a division "
                f"director/deputy for ChangeRequest {change_request.id}'s agreement — proceeding anyway "
                "(out-of-band approval)."
            )
        return

    # BudgetLineItemChangeRequest (also covers status/budget field changes)
    division_id = change_request.managing_division_id
    if division_id is None:
        return
    division = session.get(Division, division_id)
    if division is None:
        return
    if approving_user.id not in (division.division_director_id, division.deputy_division_director_id):
        logger.warning(
            f"Approving user {approving_user.email} (id={approving_user.id}) is not the division "
            f"director/deputy for ChangeRequest {change_request.id}'s managing division "
            f"({division_id}) — proceeding anyway (out-of-band approval)."
        )


def approve_change_request(
    session: Session,
    change_request_id: int,
    approving_user: User,
    sys_user: User,
    reviewer_notes: str | None = None,
) -> bool:
    """Approve one ChangeRequest exactly as a real UI "Approve" click would.

    Returns True if the change request was approved, False if it was skipped
    (not found, already reviewed, an unsupported type, or its target
    BudgetLineItem/Agreement no longer exists).
    """
    change_request = session.get(ChangeRequest, change_request_id)
    if change_request is None:
        logger.error(f"ChangeRequest {change_request_id} not found — skipping.")
        return False

    if change_request.status != ChangeRequestStatus.IN_REVIEW:
        logger.error(
            f"ChangeRequest {change_request_id} is not IN_REVIEW (current status: "
            f"{change_request.status}) — skipping."
        )
        return False

    if change_request.change_request_type not in (
        ChangeRequestType.BUDGET_LINE_ITEM_CHANGE_REQUEST,
        ChangeRequestType.AGREEMENT_CHANGE_REQUEST,
    ):
        logger.error(
            f"ChangeRequest {change_request_id} has an unsupported change_request_type "
            f"({change_request.change_request_type}) — skipping."
        )
        return False

    # Warn-only director check — always proceeds regardless of result.
    warn_if_not_division_director(session, change_request, approving_user)

    requestor = session.get(User, change_request.created_by)

    change_request.reviewed_by_id = approving_user.id
    change_request.reviewed_on = datetime.now()
    change_request.reviewer_notes = build_reviewer_notes(reviewer_notes)
    change_request.status = ChangeRequestStatus.APPROVED

    if change_request.change_request_type == ChangeRequestType.BUDGET_LINE_ITEM_CHANGE_REQUEST:
        target = session.get(BudgetLineItem, change_request.budget_line_item_id)
        if target is None:
            logger.error(
                f"BudgetLineItem {change_request.budget_line_item_id} not found for "
                f"ChangeRequest {change_request_id} — skipping."
            )
            return False
        apply_change_request_data(target, change_request.requested_change_data)
    else:  # AGREEMENT_CHANGE_REQUEST
        target = session.get(Agreement, change_request.agreement_id)
        if target is None:
            logger.error(
                f"Agreement {change_request.agreement_id} not found for ChangeRequest "
                f"{change_request_id} — skipping."
            )
            return False
        apply_change_request_data(target, change_request.requested_change_data)

    session.flush()

    change_request_dict = build_change_request_history_dict(change_request, requestor)
    ops_event = OpsEvent(
        event_type=OpsEventType.UPDATE_CHANGE_REQUEST,
        event_status=OpsEventStatus.SUCCESS,
        created_by=approving_user.id,
        event_details={"change_request": change_request_dict},
    )
    session.add(ops_event)
    session.flush()
    agreement_history_trigger_func(ops_event, session, sys_user, dry_run=True)

    title, message = build_review_outcome_notification(change_request)
    if title and message:
        session.add(
            ChangeRequestNotification(
                change_request_id=change_request.id,
                title=title,
                message=message,
                is_read=False,
                recipient_id=change_request.created_by,
                notification_type=NotificationType.CHANGE_REQUEST_NOTIFICATION,
            )
        )

    if (
        change_request.change_request_type == ChangeRequestType.BUDGET_LINE_ITEM_CHANGE_REQUEST
        and change_request.requested_change_data.get("status") == BudgetLineItemStatus.IN_EXECUTION.value
    ):
        agreement = session.get(Agreement, change_request.agreement_id)
        if agreement is not None and not agreement.is_awarded:
            action, _tracker, _, _ = get_or_create_procurement_records_for_new_award(
                session, agreement, created_by=approving_user.id, source="ApproveChangeRequest"
            )
            link_blis_to_action(session, agreement, action, BudgetLineItemStatus.IN_EXECUTION)

    return True


@click.command()
@click.option("--env", required=True, help="The environment to use (dev, local, azure).")
@click.option("--approving-user-email", required=True, help="Email of the user authorizing this out-of-band approval.")
@click.option(
    "--change-request-id",
    "change_request_ids",
    multiple=True,
    type=int,
    help="ChangeRequest id to approve. Repeatable.",
)
@click.option("--reviewer-notes", default=None, help="Optional note to prepend to reviewer_notes.")
def main(env: str, approving_user_email: str, change_request_ids: tuple[int, ...], reviewer_notes: str | None):
    """Approve one or more ChangeRequests out-of-band, on behalf of the assigned reviewer."""
    if not change_request_ids:
        logger.error("At least one --change-request-id is required.")
        sys.exit(1)

    script_config = get_config(env)
    db_engine, _ = init_db_from_config(script_config)

    if db_engine is None:
        logger.error("Failed to initialize the database engine.")
        sys.exit(1)

    with db_engine.connect() as conn:
        conn.execute(text("SELECT 1"))
        logger.info("Successfully connected to the database.")

    session_factory = scoped_session(sessionmaker(autocommit=False, autoflush=False, bind=db_engine))

    with session_factory() as session:
        sys_user = get_or_create_sys_user(session)
        setup_triggers(session, sys_user)

        approving_user = session.execute(
            select(User).where(func.lower(User.email) == approving_user_email.lower())
        ).scalar_one_or_none()
        if approving_user is None:
            logger.error(f"No user found with email {approving_user_email!r}. Aborting.")
            sys.exit(1)

        approved_count = 0
        skipped_count = 0
        for cr_id in change_request_ids:
            try:
                if approve_change_request(session, cr_id, approving_user, sys_user, reviewer_notes):
                    commit_or_rollback(session)
                    approved_count += 1
                    logger.info(f"Approved ChangeRequest {cr_id}.")
                else:
                    session.rollback()
                    skipped_count += 1
            except Exception:
                logger.exception(f"Error approving ChangeRequest {cr_id}.")
                session.rollback()
                skipped_count += 1

    verb = "Would approve" if os.getenv("DRY_RUN") else "Approved"
    logger.info(f"{verb} {approved_count} change request(s). Skipped {skipped_count}.")


if __name__ == "__main__":
    main()
