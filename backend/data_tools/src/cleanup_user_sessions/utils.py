import os
import sys
import time
from datetime import datetime, timedelta

import sqlalchemy
from data_tools.src.common.db import init_db_from_config, setup_triggers
from data_tools.src.common.utils import get_or_create_sys_user
from data_tools.src.import_static_data.import_data import get_config
from loguru import logger
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from models import OpsEvent, OpsEventStatus, OpsEventType, UserSession

os.environ["TZ"] = "UTC"
time.tzset()

format = (
    "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
    "<level>{level: <8}</level> | "
    "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | "
    "<level>{message}</level>"
)
logger.add(sys.stdout, format=format, level="INFO")
logger.add(sys.stderr, format=format, level="INFO")


def cleanup_user_sessions(conn: sqlalchemy.engine.Engine):
    """
    Deletes inactive or old user sessions (older than 30 days).

    Args:
        conn: SQLAlchemy engine connection.
        dry_run: If True, only prints sessions to be deleted without deleting.
    """
    with Session(conn) as se:
        logger.info("Checking for System User.")
        system_admin = get_or_create_sys_user(se)
        system_admin_id = system_admin.id

        setup_triggers(se, system_admin)

        logger.info("Fetching user sessions for cleanup...")
        cutoff_date = datetime.now() - timedelta(days=30)

        stmt = select(UserSession).where(
            or_(
                UserSession.is_active == False,  # noqa: E712
                UserSession.last_active_at < cutoff_date,
            )
        )

        sessions_to_delete = se.execute(stmt).scalars().all()
        count = len(sessions_to_delete)

        if count == 0:
            logger.info("No inactive or old sessions found.")
            return

        # Log summary only
        logger.info(f"Found {count:,} sessions eligible for deletion.")
        logger.info(f"Cutoff date: {cutoff_date.isoformat()}")

        # Log small sample for verification
        sample = sessions_to_delete[:5]
        for s in sample:
            logger.debug(
                f"Sample Session → ID={s.id}, user_id={s.user_id}, "
                f"is_active={s.is_active}, last_active_at={s.last_active_at}"
            )

        if count > 5:
            logger.info(f"...and {count - 5:,} more sessions omitted from logs.")

        logger.info("Deleting user sessions...")

        for s in sessions_to_delete:
            delete_user_sessions(se, s, system_admin_id)

        se.commit()
        logger.info(f"Successfully deleted {count:,} user sessions.")


def delete_user_sessions(se, user_session, system_admin_id):
    se.delete(user_session)

    ops_event = OpsEvent(
        # event_type=OpsEventType.DELETE,
        event_status=OpsEventStatus.SUCCESS,
        created_by=system_admin_id,
        event_details={
            "id": user_session.id,
            "user_id": user_session.user_id,
            "message": "User session deleted via automated process."
        },
    )
    se.add(ops_event)


if __name__ == "__main__":
    logger.info("Starting Cleanup User Sessions process.")

    script_env = os.getenv("ENV")
    script_config = get_config(script_env)
    db_engine, db_metadata_obj = init_db_from_config(script_config)

    cleanup_user_sessions(db_engine)

    logger.info("Cleanup User Sessions process complete.")
