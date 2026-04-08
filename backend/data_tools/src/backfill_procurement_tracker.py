"""
Backfill procurement tracker and procurement action records for agreements
that have budget lines IN_EXECUTION but are missing these records.

Related to: https://github.com/HHS/OPRE-OPS/issues/5329

Usage (from backend/ directory):
    python data_tools/src/backfill_procurement_tracker.py --env dev

Set DRY_RUN=1 to preview changes without committing:
    DRY_RUN=1 python data_tools/src/backfill_procurement_tracker.py --env dev
"""

import os
import sys
import time

import click
from dotenv import load_dotenv
from loguru import logger
from sqlalchemy import select
from sqlalchemy.orm import Session, scoped_session, sessionmaker

from data_tools.src.common.db import init_db_from_config, setup_triggers
from data_tools.src.common.utils import get_config, get_or_create_sys_user
from models import *  # noqa: F403, F401
from models import (
    Agreement,
    BudgetLineItem,
    BudgetLineItemStatus,
    OpsEvent,
    OpsEventStatus,
    OpsEventType,
)
from models.procurement_action import AwardType, ProcurementAction, ProcurementActionStatus
from models.procurement_tracker import DefaultProcurementTracker, ProcurementTracker
from models.users import User

load_dotenv(os.getenv("ENV_FILE", ".env"))

os.environ["TZ"] = "UTC"
time.tzset()

format = (
    "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
    "<level>{level: <8}</level> | "
    "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | "
    "<level>{message}</level>"
)
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
logger.remove()
logger.configure(handlers=[{"sink": sys.stdout, "format": format, "level": LOG_LEVEL}])
logger.add(sys.stderr, format=format, level=LOG_LEVEL)


def get_agreements_in_execution_missing_tracker_or_action(session: Session) -> list[Agreement]:
    """
    Find agreements that have at least one BLI in IN_EXECUTION status
    and are missing a ProcurementTracker and/or a NEW_AWARD ProcurementAction.
    """
    # Subquery: agreement IDs with at least one IN_EXECUTION BLI
    in_execution_agreement_ids = (
        select(BudgetLineItem.agreement_id)
        .where(BudgetLineItem.status == BudgetLineItemStatus.IN_EXECUTION)
        .where(BudgetLineItem.agreement_id.isnot(None))
        .distinct()
        .subquery()
    )

    # Subquery: agreement IDs that already have a ProcurementTracker
    has_tracker = (
        select(ProcurementTracker.agreement_id)
        .distinct()
        .subquery()
    )

    # Subquery: agreement IDs that already have a NEW_AWARD ProcurementAction
    has_new_award_action = (
        select(ProcurementAction.agreement_id)
        .where(ProcurementAction.award_type == AwardType.NEW_AWARD)
        .distinct()
        .subquery()
    )

    agreements = (
        session.execute(
            select(Agreement)
            .where(Agreement.id.in_(select(in_execution_agreement_ids.c.agreement_id)))
            .where(
                (Agreement.id.not_in(select(has_tracker.c.agreement_id)))
                | (Agreement.id.not_in(select(has_new_award_action.c.agreement_id)))
            )
        )
        .scalars()
        .all()
    )

    return agreements


def backfill_procurement_records(session: Session, sys_user: User) -> None:
    """
    For each qualifying agreement, ensure it has:
    1. A ProcurementAction with award_type=NEW_AWARD
    2. A DefaultProcurementTracker with 6 steps
    """
    agreements = get_agreements_in_execution_missing_tracker_or_action(session)
    logger.info(
        f"Found {len(agreements)} agreements with IN_EXECUTION BLIs "
        f"missing a tracker and/or action."
    )
    # also log the IDs and names and types of these agreements for easier debugging
    for agreement in agreements:
        logger.info(
            f"Agreement ID {agreement.id}, Name '{agreement.name}', Type '{agreement.agreement_type}'"
        )

    created_trackers = 0
    created_actions = 0

    for agreement in agreements:
        # Check individually so we only create what's missing
        existing_tracker = session.execute(
            select(ProcurementTracker).where(ProcurementTracker.agreement_id == agreement.id)
        ).scalar_one_or_none()

        existing_action = session.execute(
            select(ProcurementAction).where(
                ProcurementAction.agreement_id == agreement.id,
                ProcurementAction.award_type == AwardType.NEW_AWARD,
            )
        ).scalar_one_or_none()

        try:
            procurement_action = existing_action
            if not existing_action:
                procurement_action = ProcurementAction(
                    agreement_id=agreement.id,
                    award_type=AwardType.NEW_AWARD,
                    status=ProcurementActionStatus.PLANNED,
                    created_by=sys_user.id,
                )
                session.add(procurement_action)
                session.flush()
                created_actions += 1
                logger.info(
                    f"Created ProcurementAction (NEW_AWARD) for Agreement {agreement.id} "
                    f"('{agreement.name}')"
                )

                session.add(
                    OpsEvent(
                        event_type=OpsEventType.CREATE_PROCUREMENT_ACTION,
                        event_status=OpsEventStatus.SUCCESS,
                        created_by=sys_user.id,
                        event_details={
                            "procurement_action_id": procurement_action.id,
                            "agreement_id": agreement.id,
                            "message": "Backfill: created NEW_AWARD action for IN_EXECUTION agreement",
                        },
                    )
                )

            if not existing_tracker:
                tracker = DefaultProcurementTracker.create_with_steps(
                    agreement_id=agreement.id,
                    procurement_action=procurement_action.id,
                    created_by=sys_user.id,
                )
                session.add(tracker)
                session.flush()
                created_trackers += 1
                logger.info(
                    f"Created DefaultProcurementTracker for Agreement {agreement.id} "
                    f"('{agreement.name}') with {len(tracker.steps)} steps"
                )

                session.add(
                    OpsEvent(
                        event_type=OpsEventType.CREATE_PROCUREMENT_TRACKER,
                        event_status=OpsEventStatus.SUCCESS,
                        created_by=sys_user.id,
                        event_details={
                            "procurement_tracker_id": tracker.id,
                            "agreement_id": agreement.id,
                            "message": "Backfill: created tracker for IN_EXECUTION agreement",
                        },
                    )
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
        f"Backfill complete. Created {created_trackers} trackers and {created_actions} actions."
    )


@click.command()
@click.option("--env", required=True, help="The environment to use (dev, local, azure).")
def main(env: str):
    """Backfill ProcurementTracker and ProcurementAction records for IN_EXECUTION agreements."""
    logger.info("Starting procurement tracker backfill.")

    script_config = get_config(env)
    db_engine, _ = init_db_from_config(script_config)

    if db_engine is None:
        logger.error("Failed to initialize the database engine.")
        sys.exit(1)

    from sqlalchemy import text

    with db_engine.connect() as conn:
        conn.execute(text("SELECT 1"))
        logger.info("Successfully connected to the database.")

    Session = scoped_session(sessionmaker(autocommit=False, autoflush=False, bind=db_engine))

    with Session() as session:
        sys_user = get_or_create_sys_user(session)
        logger.info(f"Retrieved system user: {sys_user}")
        setup_triggers(session, sys_user)
        backfill_procurement_records(session, sys_user)

    logger.info("Procurement tracker backfill complete.")


if __name__ == "__main__":
    main()
