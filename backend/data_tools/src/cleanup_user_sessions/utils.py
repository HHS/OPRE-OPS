import os
import sys
import time
from datetime import datetime, timedelta

import sqlalchemy
from loguru import logger
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from data_tools.src.common.db import init_db_from_config, setup_triggers
from data_tools.src.common.utils import get_or_create_sys_user
from data_tools.src.import_static_data.import_data import get_config
from models import OpsEvent, OpsEventStatus, OpsEventType, UserSession

# Set timezone to UTC
os.environ["TZ"] = "UTC"
time.tzset()

# Logger configuration
format = (
    "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
    "<level>{level: <8}</level> | "
    "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | "
    "<level>{message}</level>"
)

# Remove the default Loguru handler
logger.remove()

# Add custom stdout and stderr log handlers at the INFO level using the defined format.
# Logs containing "SafeUserSchema not found" are filtered out to suppress harmless noise
# in contexts where SafeUserSchema isn’t registered (e.g., standalone scripts).
logger.add(
    sys.stdout,
    format=format,
    level="INFO",
    filter=lambda record: (
        "SafeUserSchema not found" not in record["message"]
    )
)
logger.add(
    sys.stderr,
    format=format,
    level="INFO",
    filter=lambda record: (
        "SafeUserSchema not found" not in record["message"]
    )
)


def get_system_admin_id(se: Session) -> int:
    """Get or create a system admin user for auditing/triggers."""
    system_admin = get_or_create_sys_user(se)

    # If user is newly created (not yet in DB), add and commit it
    if system_admin.id is None:
        se.add(system_admin)
        se.commit()  # Save to DB and assign ID

    setup_triggers(se, system_admin)
    se.commit()  # Commit any trigger setup changes

    return system_admin.id


def fetch_sessions_to_delete(se: Session, cutoff_date: datetime):
    """Fetch user sessions matching the cleanup criteria."""
    stmt = select(UserSession).where(
        or_(
            UserSession.is_active == False,  # noqa: E712
            UserSession.last_active_at < cutoff_date,
        )
    )
    return se.execute(stmt).scalars().all()


def log_summary(sessions, cutoff_date):
    count = len(sessions)
    if count == 0:
        logger.info(f"No inactive or old sessions found; nothing to delete. Cutoff date: {cutoff_date.isoformat()}")
        return

    logger.info(f"Found {count:,} sessions eligible for deletion.")
    logger.info(f"Cutoff date: {cutoff_date.isoformat()}")

    sample = sessions[:5]
    for s in sample:
        logger.info(
            f"Sample Session → id={s.id}, user_id={s.user_id}, "
            f"is_active={s.is_active}, last_active_at={s.last_active_at}"
        )

    if count > 5:
        logger.info(f"...and {count - 5:,} more sessions omitted from logs.")


def delete_sessions(session: Session, user_sessions, system_admin_id: int):
    """Delete given sessions and log audit events."""
    for us in user_sessions:
        delete_session_and_log_event(session, us, system_admin_id)
    session.commit()
    logger.info(f"Successfully deleted {len(user_sessions):,} user sessions.")


def delete_session_and_log_event(session: Session, user_session, system_admin_id: int):
    """Delete a user session and log an OpsEvent."""
    session.delete(user_session)
    ops_event = OpsEvent(
        event_type=OpsEventType.DELETE_USER_SESSION,
        event_status=OpsEventStatus.SUCCESS,
        created_by=system_admin_id,
        event_details={
            "id": user_session.id,
            "user_id": user_session.user_id,
            "message": "User session deleted via automated process."
        },
    )
    session.add(ops_event)


def cleanup_user_sessions(conn: sqlalchemy.engine.Engine):
    """Deletes inactive or old user sessions (older than 30 days)."""
    with Session(conn) as se:
        logger.info("Checking for System User...")
        system_admin_id = get_system_admin_id(se)

        logger.info("Fetching user sessions for cleanup...")
        cutoff_date = datetime.now() - timedelta(days=30)
        sessions_to_delete = fetch_sessions_to_delete(se, cutoff_date)

        log_summary(sessions_to_delete, cutoff_date)

        if sessions_to_delete:
            logger.info("Deleting user sessions...")
            delete_sessions(se, sessions_to_delete, system_admin_id)


if __name__ == "__main__":
    logger.info("Starting Cleanup User Sessions process.")

    script_env = os.getenv("ENV")
    script_config = get_config(script_env)
    db_engine, db_metadata_obj = init_db_from_config(script_config)

    cleanup_user_sessions(db_engine)

    logger.info("Cleanup User Sessions process complete.")
