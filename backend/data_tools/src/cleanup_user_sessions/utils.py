import os
import sys
import time
from datetime import datetime, timedelta

from data_tools.src.common.db import init_db_from_config, setup_triggers
from data_tools.src.common.utils import get_or_create_sys_user
from data_tools.src.import_static_data.import_data import get_config
from loguru import logger
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from models import UserSession

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


def cleanup_user_sessions(conn, dry_run: bool = True):
    """
    Deletes inactive or old user sessions (older than 30 days).

    Args:
        conn: SQLAlchemy engine connection.
        dry_run: If True, only prints sessions to be deleted without deleting.
    """
    with Session(conn) as se:
        logger.info("Starting cleanup of user sessions...")
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

        logger.info(f"Found {count} sessions eligible for deletion:")
        for s in sessions_to_delete:
            logger.info(
                f"Session ID={s.id}, user_id={s.user_id}, "
                f"is_active={s.is_active}, last_active_at={s.last_active_at}"
            )

        if dry_run:
            logger.info("Dry-run mode: no sessions deleted.")
            return

        confirm = input("\n Are you sure you want to delete these sessions? (yes/no): ").strip().lower()
        if confirm != "yes":
            logger.info("Deletion cancelled by user.")
            return

        logger.info("Deleting user sessions...")
        deleted_count = 0
        for s in sessions_to_delete:
            se.delete(s)
            deleted_count += 1

        se.commit()
        logger.info(f"Successfully deleted {deleted_count} user sessions.")


def main():
    """Main entry point for the cleanup script."""
    logger.info("Starting Cleanup User Sessions process.")

    script_env = os.getenv("ENV")
    script_config = get_config(script_env)
    db_engine, db_metadata_obj = init_db_from_config(script_config)

    # Set up sys user for auditing
    with Session(db_engine) as se:
        system_admin = get_or_create_sys_user(se)
        setup_triggers(se, system_admin)
        se.commit()

    dry_run_env = os.getenv("DRY_RUN", "true").lower() in ("true", "1", "yes")

    cleanup_user_sessions(db_engine, dry_run=dry_run_env)

    logger.info("Cleanup User Sessions process complete.")


if __name__ == "__main__":
    main()
