"""
Backfill procurement tracker and procurement action records for agreements
that have budget lines IN_EXECUTION but are missing these records.

Related to: https://github.com/HHS/OPRE-OPS/issues/5329

Usage (from backend/ directory):
    python data_tools/src/backfill_procurement_tracker.py --env dev

Only backfill specific agreement types:
    python data_tools/src/backfill_procurement_tracker.py --env dev --agreement-types CONTRACT --agreement-types GRANT

Set DRY_RUN=1 to preview changes without committing:
    DRY_RUN=1 python data_tools/src/backfill_procurement_tracker.py --env dev
"""

import os
import sys
import time
from datetime import date

import click
from dotenv import load_dotenv
from loguru import logger
from sqlalchemy import func, select
from sqlalchemy.orm import Session, scoped_session, sessionmaker

from data_tools.src.common.db import init_db_from_config, setup_triggers
from data_tools.src.common.utils import get_config, get_or_create_sys_user
from models import *  # noqa: F403, F401
from models import (
    Agreement,
    AgreementType,
    BudgetLineItem,
    BudgetLineItemStatus,
    OpsEvent,
    OpsEventStatus,
    OpsEventType,
)
from models.procurement_action import AwardType, ProcurementAction, ProcurementActionStatus
from models.procurement_tracker import (
    DefaultProcurementTracker,
    ProcurementTracker,
    ProcurementTrackerStatus,
    ProcurementTrackerStepStatus,
)
from models.users import User

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


def get_agreements_with_in_execution_blis(
    session: Session,
    agreement_types: list[AgreementType] | None = None,
) -> list[Agreement]:
    """
    Find all agreements that have at least one BLI in IN_EXECUTION status.
    Optionally filter by agreement type(s).
    """
    in_execution_agreement_ids = (
        select(BudgetLineItem.agreement_id)
        .where(BudgetLineItem.status == BudgetLineItemStatus.IN_EXECUTION)
        .where(BudgetLineItem.agreement_id.isnot(None))
        .distinct()
        .subquery()
    )

    query = (
        select(Agreement)
        .where(Agreement.id.in_(select(in_execution_agreement_ids.c.agreement_id)))
        .order_by(Agreement.id)
    )

    if agreement_types:
        query = query.where(Agreement.agreement_type.in_(agreement_types))

    return session.execute(query).scalars().all()


def link_blis_to_action(
    session: Session,
    agreement: Agreement,
    procurement_action: ProcurementAction,
    bli_status: BudgetLineItemStatus,
    fiscal_year: int | None = None,
) -> int:
    """
    Link BLIs of the given status to a ProcurementAction. Optionally filter by fiscal year.
    Returns the number of BLIs that were newly linked.
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


def get_earliest_obligated_fiscal_year(session: Session, agreement_id: int) -> int | None:
    """Get the earliest fiscal year among OBLIGATED BLIs for an agreement."""
    result = session.execute(
        select(func.min(BudgetLineItem.fiscal_year))
        .where(BudgetLineItem.agreement_id == agreement_id)
        .where(BudgetLineItem.status == BudgetLineItemStatus.OBLIGATED)
    ).scalar_one_or_none()

    return int(result) if result is not None else None


def get_earliest_obligated_date_needed(session: Session, agreement_id: int) -> date | None:
    """Get the earliest date_needed among OBLIGATED BLIs for an agreement."""
    return session.execute(
        select(func.min(BudgetLineItem.date_needed))
        .where(BudgetLineItem.agreement_id == agreement_id)
        .where(BudgetLineItem.status == BudgetLineItemStatus.OBLIGATED)
    ).scalar_one_or_none()


def ensure_action_and_tracker(
    session: Session,
    agreement: Agreement,
    sys_user: User,
    award_type: AwardType,
    action_status: ProcurementActionStatus = ProcurementActionStatus.PLANNED,
    tracker_status: ProcurementTrackerStatus = ProcurementTrackerStatus.ACTIVE,
    date_awarded_obligated: date | None = None,
) -> tuple[ProcurementAction, bool, bool]:
    """
    Ensure a ProcurementAction and ProcurementTracker exist for the given agreement and award type.
    Returns (procurement_action, action_created, tracker_created).
    """
    existing_action = session.execute(
        select(ProcurementAction).where(
            ProcurementAction.agreement_id == agreement.id,
            ProcurementAction.award_type == award_type,
        )
    ).scalar_one_or_none()

    action_created = False
    procurement_action = existing_action

    if not existing_action:
        procurement_action = ProcurementAction(
            agreement_id=agreement.id,
            award_type=award_type,
            status=action_status,
            procurement_shop_id=agreement.awarding_entity_id,
            date_awarded_obligated=date_awarded_obligated,
            created_by=sys_user.id,
        )
        session.add(procurement_action)
        session.flush()
        action_created = True
        logger.info(
            f"Created ProcurementAction ({award_type.name}) for Agreement {agreement.id} "
            f"('{agreement.name}') with procurement_shop_id={agreement.awarding_entity_id}"
        )
        session.add(
            OpsEvent(
                event_type=OpsEventType.CREATE_PROCUREMENT_ACTION,
                event_status=OpsEventStatus.SUCCESS,
                created_by=sys_user.id,
                event_details={
                    "procurement_action_id": procurement_action.id,
                    "agreement_id": agreement.id,
                    "message": f"Backfill: created {award_type.name} action",
                },
            )
        )
    else:
        # Ensure existing action has procurement_shop from agreement
        if (
            procurement_action.procurement_shop_id != agreement.awarding_entity_id
            and agreement.awarding_entity_id is not None
        ):
            old_shop_id = procurement_action.procurement_shop_id
            procurement_action.procurement_shop_id = agreement.awarding_entity_id
            logger.info(
                f"Updated ProcurementAction {procurement_action.id} procurement_shop_id "
                f"from {old_shop_id} to {agreement.awarding_entity_id} "
                f"for Agreement {agreement.id} ('{agreement.name}')"
            )

    # Check for a tracker linked to this action
    existing_tracker = session.execute(
        select(ProcurementTracker).where(
            ProcurementTracker.agreement_id == agreement.id,
            ProcurementTracker.procurement_action == procurement_action.id,
        )
    ).scalar_one_or_none()

    tracker_created = False
    if not existing_tracker:
        tracker = DefaultProcurementTracker.create_with_steps(
            agreement_id=agreement.id,
            procurement_action=procurement_action.id,
            status=tracker_status,
            created_by=sys_user.id,
        )
        session.add(tracker)
        session.flush()

        # Activate step 1 with start date to match API behavior
        for step in tracker.steps:
            if step.step_number == 1:
                step.status = ProcurementTrackerStepStatus.ACTIVE
                step.step_start_date = date.today()
                break

        tracker_created = True
        logger.info(
            f"Created DefaultProcurementTracker for Agreement {agreement.id} "
            f"('{agreement.name}') — {award_type.name} with {len(tracker.steps)} steps"
        )
        session.add(
            OpsEvent(
                event_type=OpsEventType.CREATE_PROCUREMENT_TRACKER,
                event_status=OpsEventStatus.SUCCESS,
                created_by=sys_user.id,
                event_details={
                    "procurement_tracker_id": tracker.id,
                    "agreement_id": agreement.id,
                    "message": f"Backfill: created tracker for {award_type.name}",
                },
            )
        )

    return procurement_action, action_created, tracker_created


def backfill_procurement_records(
    session: Session,
    sys_user: User,
    agreement_types: list[AgreementType] | None = None,
) -> None:
    """
    For each agreement with IN_EXECUTION BLIs, ensure it has the correct
    ProcurementAction(s) and ProcurementTracker(s):

    - IN_EXECUTION only: 1 NEW_AWARD action/tracker, link IN_EXECUTION BLIs
    - IN_EXECUTION + OBLIGATED (mod): 2 actions/trackers:
        - NEW_AWARD: link OBLIGATED BLIs from the earliest fiscal year
        - MODIFICATION: link IN_EXECUTION BLIs

    If agreement_types is provided, only agreements of those types are processed.
    """
    agreements = get_agreements_with_in_execution_blis(session, agreement_types)
    logger.info(f"Found {len(agreements)} agreements with IN_EXECUTION BLIs.")
    for agreement in agreements:
        logger.info(f"Agreement ID {agreement.id}, Name '{agreement.name}', Type '{agreement.agreement_type}'")

    created_trackers = 0
    created_actions = 0
    total_linked_blis = 0

    for agreement in agreements:
        try:
            is_mod = has_obligated_blis(session, agreement.id)

            if is_mod:
                logger.info(f"Agreement {agreement.id} has both OBLIGATED and IN_EXECUTION BLIs — treating as mod.")

                # NEW_AWARD: action (AWARDED) + tracker (COMPLETED) + earliest-FY OBLIGATED BLIs
                award_date = get_earliest_obligated_date_needed(session, agreement.id)
                new_award_action, ac, tc = ensure_action_and_tracker(
                    session,
                    agreement,
                    sys_user,
                    AwardType.NEW_AWARD,
                    action_status=ProcurementActionStatus.AWARDED,
                    tracker_status=ProcurementTrackerStatus.COMPLETED,
                    date_awarded_obligated=award_date,
                )
                created_actions += int(ac)
                created_trackers += int(tc)

                earliest_fy = get_earliest_obligated_fiscal_year(session, agreement.id)
                if earliest_fy:
                    total_linked_blis += link_blis_to_action(
                        session,
                        agreement,
                        new_award_action,
                        BudgetLineItemStatus.OBLIGATED,
                        fiscal_year=earliest_fy,
                    )

                # MODIFICATION: action + tracker + IN_EXECUTION BLIs
                mod_action, ac, tc = ensure_action_and_tracker(session, agreement, sys_user, AwardType.MODIFICATION)
                created_actions += int(ac)
                created_trackers += int(tc)

                total_linked_blis += link_blis_to_action(
                    session,
                    agreement,
                    mod_action,
                    BudgetLineItemStatus.IN_EXECUTION,
                )
            else:
                # NEW_AWARD only: action + tracker + IN_EXECUTION BLIs
                new_award_action, ac, tc = ensure_action_and_tracker(session, agreement, sys_user, AwardType.NEW_AWARD)
                created_actions += int(ac)
                created_trackers += int(tc)

                total_linked_blis += link_blis_to_action(
                    session,
                    agreement,
                    new_award_action,
                    BudgetLineItemStatus.IN_EXECUTION,
                )

            if os.getenv("DRY_RUN"):
                logger.info(f"Dry run: rolling back changes for Agreement {agreement.id}.")
                session.rollback()
            else:
                session.commit()

        except Exception:
            logger.exception(f"Error processing Agreement {agreement.id} ('{agreement.name}')")
            session.rollback()
            raise

    logger.info(
        f"Backfill complete. Created {created_trackers} trackers, "
        f"{created_actions} actions, linked {total_linked_blis} BLIs."
    )


AGREEMENT_TYPE_NAMES = [t.name for t in AgreementType]


@click.command()
@click.option("--env", required=True, help="The environment to use (dev, local, azure).")
@click.option(
    "--agreement-types",
    multiple=True,
    type=click.Choice(AGREEMENT_TYPE_NAMES, case_sensitive=False),
    help="Agreement types to backfill (e.g. CONTRACT GRANT). If omitted, all types are processed.",
)
def main(env: str, agreement_types: tuple[str, ...]):
    """Backfill ProcurementTracker and ProcurementAction records for IN_EXECUTION agreements."""
    parsed_types = [AgreementType[name] for name in agreement_types] if agreement_types else None

    if parsed_types:
        logger.info(f"Starting procurement tracker backfill for types: {[t.name for t in parsed_types]}")
    else:
        logger.info("Starting procurement tracker backfill for all agreement types.")

    script_config = get_config(env)
    db_engine, _ = init_db_from_config(script_config)

    if db_engine is None:
        logger.error("Failed to initialize the database engine.")
        sys.exit(1)

    from sqlalchemy import text

    with db_engine.connect() as conn:
        conn.execute(text("SELECT 1"))
        logger.info("Successfully connected to the database.")

    session_factory = scoped_session(sessionmaker(autocommit=False, autoflush=False, bind=db_engine))

    with session_factory() as session:
        sys_user = get_or_create_sys_user(session)
        logger.info(f"Retrieved system user: {sys_user}")
        setup_triggers(session, sys_user)
        backfill_procurement_records(session, sys_user, parsed_types)

    logger.info("Procurement tracker backfill complete.")


if __name__ == "__main__":
    main()
