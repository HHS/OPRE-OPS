"""
Backfill procurement tracker and procurement action records for agreements
that are missing these records:

1. Agreements with budget lines IN_EXECUTION (and IN_EXECUTION + OBLIGATED
   "mod" agreements) — see get_agreements_with_in_execution_blis().
2. CONTRACT, AA, and IAA agreements with an OBLIGATED BLI but zero ProcurementTrackers
   — e.g. imported directly at OBLIGATED status, skipping IN_EXECUTION entirely
   — see get_agreements_missing_award_tracker().

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

import click
from dotenv import load_dotenv
from loguru import logger
from sqlalchemy import select, text
from sqlalchemy.orm import Session, scoped_session, sessionmaker

from data_tools.src.common.db import init_db_from_config, setup_triggers
from data_tools.src.common.utils import get_config, get_or_create_sys_user
from models import *  # noqa: F403, F401
from models import (
    Agreement,
    AgreementType,
    BudgetLineItem,
    BudgetLineItemStatus,
)
from models.procurement_action import AwardType, ProcurementAction, ProcurementActionStatus
from models.procurement_tracker import ProcurementTracker, ProcurementTrackerStatus
from models.procurement_workflow import (
    get_earliest_obligated_date_needed,
    get_earliest_obligated_fiscal_year,
    get_or_create_procurement_records_for_modification,
    get_or_create_procurement_records_for_new_award,
    has_obligated_blis,
    link_blis_to_action,
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

SOURCE = "Backfill"


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
    dry_run = os.getenv("DRY_RUN", "").lower() in ("1", "true")
    if dry_run:
        logger.info("DRY_RUN mode enabled — changes will be rolled back.")

    agreements = get_agreements_with_in_execution_blis(session, agreement_types)
    logger.info(f"Found {len(agreements)} agreements with IN_EXECUTION BLIs.")
    for agreement in agreements:
        logger.debug(f"Agreement ID {agreement.id}, Name '{agreement.name}', Type '{agreement.agreement_type}'")

    created_trackers = 0
    created_actions = 0
    total_linked_blis = 0
    agreements_touched = 0

    for agreement in agreements:
        try:
            agreement_changed = False
            is_mod = has_obligated_blis(session, agreement.id)

            if is_mod:
                logger.debug(f"Agreement {agreement.id} has both OBLIGATED and IN_EXECUTION BLIs — treating as mod.")

                # NEW_AWARD: action (AWARDED) + tracker (COMPLETED) + earliest-FY OBLIGATED BLIs
                # No fallback if date_needed is null — leave the date unset rather than guessing.
                award_date = get_earliest_obligated_date_needed(session, agreement.id)
                new_award_action, _, ac, tc = get_or_create_procurement_records_for_new_award(
                    session,
                    agreement,
                    created_by=sys_user.id,
                    action_status=ProcurementActionStatus.AWARDED,
                    tracker_status=ProcurementTrackerStatus.COMPLETED,
                    date_awarded_obligated=award_date,
                    source=SOURCE,
                    include_terminal=True,
                )
                created_actions += int(ac)
                created_trackers += int(tc)
                agreement_changed = agreement_changed or ac or tc

                earliest_fy = get_earliest_obligated_fiscal_year(session, agreement.id)
                if earliest_fy:
                    linked = link_blis_to_action(
                        session,
                        agreement,
                        new_award_action,
                        BudgetLineItemStatus.OBLIGATED,
                        fiscal_year=earliest_fy,
                    )
                    total_linked_blis += linked
                    agreement_changed = agreement_changed or linked > 0

                # MODIFICATION: action + tracker + IN_EXECUTION BLIs
                mod_action, _, ac, tc = get_or_create_procurement_records_for_modification(
                    session, agreement, created_by=sys_user.id, source=SOURCE
                )
                created_actions += int(ac)
                created_trackers += int(tc)
                agreement_changed = agreement_changed or ac or tc

                linked = link_blis_to_action(
                    session,
                    agreement,
                    mod_action,
                    BudgetLineItemStatus.IN_EXECUTION,
                )
                total_linked_blis += linked
                agreement_changed = agreement_changed or linked > 0
            else:
                # NEW_AWARD only: action + tracker + IN_EXECUTION BLIs
                new_award_action, _, ac, tc = get_or_create_procurement_records_for_new_award(
                    session, agreement, created_by=sys_user.id, source=SOURCE, include_terminal=True
                )
                created_actions += int(ac)
                created_trackers += int(tc)
                agreement_changed = agreement_changed or ac or tc

                linked = link_blis_to_action(
                    session,
                    agreement,
                    new_award_action,
                    BudgetLineItemStatus.IN_EXECUTION,
                )
                total_linked_blis += linked
                agreement_changed = agreement_changed or linked > 0

            if agreement_changed:
                agreements_touched += 1

            if dry_run:
                logger.info(f"Dry run: rolling back changes for Agreement {agreement.id}.")
                session.rollback()
            else:
                session.commit()

        except Exception:
            logger.exception(f"Error processing Agreement {agreement.id} ('{agreement.name}')")
            session.rollback()
            raise

    verb = "Would create" if dry_run else "Created"
    logger.info(
        f"Backfill complete. {verb} {created_trackers} trackers, "
        f"{created_actions} actions, linked {total_linked_blis} BLIs, "
        f"touched {agreements_touched} agreement(s) (out of {len(agreements)} found)."
    )


# Matches load_master_spreadsheet_budget_lines_v2's _PROCUREMENT_ELIGIBLE_TYPES, not
# ops_api's AgreementAwardHistoryService._SUPPORTED_AGREEMENT_TYPES (CONTRACT, AA only).
# That's deliberate, not drift: IAA awards created/backfilled here are real DB state —
# a ProcurementAction/Tracker with an approved AWARD step — but the Awards and
# Modifications tab (and its frontend gate, isContractOrAaAgreement) does not show IAA
# yet, so they're currently invisible there. Widening the tab to IAA is a separate,
# frontend-touching product decision.
AWARD_BACKFILL_AGREEMENT_TYPES = (AgreementType.CONTRACT, AgreementType.AA, AgreementType.IAA)


def get_agreements_missing_award_tracker(session: Session) -> list[Agreement]:
    """
    Find CONTRACT, AA, and IAA agreements that have an OBLIGATED BLI but no
    NEW_AWARD ProcurementTracker.

    Covers agreements imported directly at OBLIGATED status (e.g. historical/
    already-awarded data), which skip IN_EXECUTION entirely and are therefore
    invisible to get_agreements_with_in_execution_blis().

    Excludes only agreements with an existing NEW_AWARD tracker, not any tracker —
    an agreement can have a MODIFICATION-only tracker (e.g. an IN_EXECUTION BLI
    processed as a modification while its OBLIGATED sibling never got a NEW_AWARD
    tracker of its own) and still need one backfilled here.
    """
    obligated_agreement_ids = (
        select(BudgetLineItem.agreement_id)
        .where(BudgetLineItem.status == BudgetLineItemStatus.OBLIGATED)
        .where(BudgetLineItem.agreement_id.isnot(None))
    )

    agreements_with_new_award_tracker = (
        select(ProcurementTracker.agreement_id)
        .join(ProcurementAction, ProcurementTracker.procurement_action == ProcurementAction.id)
        .where(ProcurementAction.award_type == AwardType.NEW_AWARD)
    )

    query = (
        select(Agreement)
        .where(Agreement.agreement_type.in_(AWARD_BACKFILL_AGREEMENT_TYPES))
        .where(Agreement.id.in_(obligated_agreement_ids))
        .where(Agreement.id.not_in(agreements_with_new_award_tracker))
        .order_by(Agreement.id)
    )

    return session.execute(query).scalars().all()


def backfill_missing_award_trackers(session: Session, sys_user: User) -> None:
    """
    For CONTRACT, AA, and IAA agreements with an OBLIGATED BLI but no
    ProcurementTracker at all, create a COMPLETED NEW_AWARD action/tracker,
    approve its AWARD step, and link the OBLIGATED BLIs to the action. For
    CONTRACT/AA this makes the award show on the Awards and Modifications tab;
    IAA awards are not yet shown there (see AWARD_BACKFILL_AGREEMENT_TYPES).

    If the agreement already has a NEW_AWARD action (any status), that action
    is reused rather than duplicated.
    """
    dry_run = os.getenv("DRY_RUN", "").lower() in ("1", "true")
    if dry_run:
        logger.info("DRY_RUN mode enabled — changes will be rolled back.")

    agreements = get_agreements_missing_award_tracker(session)
    logger.info(f"Found {len(agreements)} CONTRACT/AA/IAA agreements missing an award tracker.")
    for agreement in agreements:
        logger.debug(f"Agreement ID {agreement.id}, Name {agreement.name!r}, Type {agreement.agreement_type!r}")

    created_trackers = 0
    created_actions = 0
    total_linked_blis = 0
    agreements_touched = 0

    for agreement in agreements:
        try:
            # No fallback when every OBLIGATED BLI's date_needed is null — leave
            # date_awarded_obligated/award_date unset rather than guessing, so the
            # gap is visible and resolved by asking OPRE for the real date.
            award_date = get_earliest_obligated_date_needed(session, agreement.id)

            action, _, ac, tc = get_or_create_procurement_records_for_new_award(
                session,
                agreement,
                created_by=sys_user.id,
                action_status=ProcurementActionStatus.AWARDED,
                tracker_status=ProcurementTrackerStatus.COMPLETED,
                date_awarded_obligated=award_date,
                source=SOURCE,
                include_terminal=True,
            )
            created_actions += int(ac)
            created_trackers += int(tc)

            linked = link_blis_to_action(
                session,
                agreement,
                action,
                BudgetLineItemStatus.OBLIGATED,
            )
            total_linked_blis += linked

            if ac or tc or linked > 0:
                agreements_touched += 1

            if dry_run:
                logger.info(f"Dry run: rolling back changes for Agreement {agreement.id}.")
                session.rollback()
            else:
                session.commit()

        except Exception:
            logger.exception(f"Error processing Agreement {agreement.id} ({agreement.name!r})")
            session.rollback()
            raise

    verb = "Would create" if dry_run else "Created"
    logger.info(
        f"Award tracker backfill complete. {verb} {created_trackers} trackers, "
        f"{created_actions} actions, linked {total_linked_blis} BLIs, "
        f"touched {agreements_touched} agreement(s) (out of {len(agreements)} found)."
    )


AGREEMENT_TYPE_NAMES = [t.name for t in AgreementType]


@click.command()
@click.option("--env", required=True, help="The environment to use (dev, local, azure).")
@click.option(
    "--agreement-types",
    multiple=True,
    type=click.Choice(AGREEMENT_TYPE_NAMES, case_sensitive=False),
    help=(
        "Agreement types to backfill IN_EXECUTION records for (e.g. CONTRACT GRANT). "
        "If omitted, all types are processed. Does not affect the CONTRACT/AA-only "
        "OBLIGATED-with-no-tracker backfill, which always runs regardless of this option."
    ),
)
def main(env: str, agreement_types: tuple[str, ...]):
    """Backfill ProcurementTracker and ProcurementAction records for agreements missing them."""
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

    with db_engine.connect() as conn:
        conn.execute(text("SELECT 1"))
        logger.info("Successfully connected to the database.")

    session_factory = scoped_session(sessionmaker(autocommit=False, autoflush=False, bind=db_engine))

    with session_factory() as session:
        sys_user = get_or_create_sys_user(session)
        logger.info(f"Retrieved system user: {sys_user}")
        setup_triggers(session, sys_user)
        backfill_procurement_records(session, sys_user, parsed_types)
        backfill_missing_award_trackers(session, sys_user)

    logger.info("Procurement tracker backfill complete.")


if __name__ == "__main__":
    main()
