import os
import sys
import time

from data_tools.src.common.db import init_db_from_config, setup_triggers
from data_tools.src.common.utils import get_config, get_or_create_sys_user
from loguru import logger
from sqlalchemy.orm import Session

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
logger.add(sys.stdout, format=format, level="INFO")
logger.add(sys.stderr, format=format, level="INFO")


def prune_user_sessions(db_engine):
    pass


def cleanup_user_sessions(db_engine, dry_run):
    pass


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
