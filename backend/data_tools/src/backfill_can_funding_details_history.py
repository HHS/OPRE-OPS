"""
Backfill CANHistory records for UPDATE_CAN OpsEvents whose "changes" dict contains
funding_details.* keys, which were silently dropped by create_can_update_history_event
before CANHistoryType.CAN_FUNDING_DETAILS_EDITED existed.

Related to: production run of load_cans against a real dataset recorded OpsEvents with
correct funding_details.* changes, but no corresponding CANHistory rows were created.
This is intended as a one-time ad-hoc backfill.

Usage (from backend/ directory):
    python data_tools/src/backfill_can_funding_details_history.py --env dev

Set DRY_RUN=1 to preview changes without committing:
    DRY_RUN=1 python data_tools/src/backfill_can_funding_details_history.py --env dev
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
from models import CANHistory, OpsEvent, OpsEventStatus, OpsEventType, User
from models.can_history import can_history_trigger_func

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


def get_update_can_events_with_funding_details_changes(session: Session) -> list[OpsEvent]:
    """
    Find all successful UPDATE_CAN OpsEvents whose "changes" dict contains at least one
    funding_details.* key.
    """
    events = (
        session.execute(
            select(OpsEvent)
            .where(OpsEvent.event_type == OpsEventType.UPDATE_CAN)
            .where(OpsEvent.event_status == OpsEventStatus.SUCCESS)
            .order_by(OpsEvent.id)
        )
        .scalars()
        .all()
    )

    return [
        event
        for event in events
        if any(
            key.startswith("funding_details.") for key in event.event_details.get("can_updates", {}).get("changes", {})
        )
    ]


def backfill_can_funding_details_history(session: Session, sys_user: User) -> None:
    """
    Re-run can_history_trigger_func for every UPDATE_CAN OpsEvent with funding_details.*
    changes. add_history_events already de-duplicates by (timestamp, history_type,
    history_message, fiscal_year) against existing rows, so this is safe to re-run and
    leaves previously-recorded nick_name/description/portfolio_id history untouched.
    """
    dry_run = os.getenv("DRY_RUN", "").lower() in ("1", "true")
    if dry_run:
        logger.info("DRY_RUN mode enabled — changes will be rolled back.")

    events = get_update_can_events_with_funding_details_changes(session)
    logger.info(f"Found {len(events)} UPDATE_CAN events with funding_details changes.")

    created_history_count = 0
    for event in events:
        try:
            before_count = len(
                session.execute(select(CANHistory).where(CANHistory.ops_event_id == event.id)).scalars().all()
            )
            can_history_trigger_func(event, session, sys_user, dry_run=True)
            session.flush()
            after_count = len(
                session.execute(select(CANHistory).where(CANHistory.ops_event_id == event.id)).scalars().all()
            )
            created_history_count += after_count - before_count

            if dry_run:
                logger.info(f"Dry run: rolling back changes for OpsEvent {event.id}.")
                session.rollback()
            else:
                session.commit()

        except Exception:
            logger.exception(f"Error processing OpsEvent {event.id}")
            session.rollback()
            raise

    verb = "Would create" if dry_run else "Created"
    logger.info(f"Backfill complete. {verb} {created_history_count} CANHistory records.")


@click.command()
@click.option("--env", required=True, help="The environment to use (dev, local, azure).")
def main(env: str):
    """Backfill CANHistory records for UPDATE_CAN OpsEvents with funding_details.* changes."""
    logger.info("Starting CAN funding details history backfill.")

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
        backfill_can_funding_details_history(session, sys_user)

    logger.info("CAN funding details history backfill complete.")


if __name__ == "__main__":
    main()
