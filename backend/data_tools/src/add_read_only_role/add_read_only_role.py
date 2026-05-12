"""Script to add READ_ONLY role if it doesn't already exist.

This script should be run after the database is initialized and migrations are applied.
It adds the READ_ONLY role with GET-only permissions.

Usage:
    ENV=local python data_tools/src/import_static_data/add_read_only_role.py
"""

import logging
import sys

import click
from sqlalchemy import text
from sqlalchemy.orm import Session, scoped_session, sessionmaker

from data_tools.src.common.db import init_db_from_config
from data_tools.src.common.utils import get_config

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def add_read_only_role(session: Session) -> None:
    """Add READ_ONLY role if it doesn't already exist."""

    # List of permissions for READ_ONLY role (from user_data.json5)
    read_only_permissions = [
        "GET_AGREEMENT",
        "GET_BUDGET_LINE_ITEM",
        "GET_SERVICES_COMPONENT",
        "GET_BLI_PACKAGE",
        "GET_CAN",
        "GET_DIVISION",
        "GET_NOTIFICATION",
        "GET_PORTFOLIO",
        "GET_RESEARCH_PROJECT",
        "GET_USER",
        "GET_HISTORY",
        "GET_WORKFLOW",
        "GET_CHANGE_REQUEST",
        "GET_CHANGE_REQUEST_REVIEW",
        "GET_UPLOAD_DOCUMENT",
    ]

    # Insert READ_ONLY role with permissions
    logger.info("Adding READ_ONLY role with %d permissions...", len(read_only_permissions))
    session.execute(
        text("INSERT INTO role (name, permissions) VALUES (:name, :permissions)"),
        {"name": "READ_ONLY", "permissions": read_only_permissions},
    )
    session.commit()

    # Get the assigned ID
    result = session.execute(text("SELECT id FROM role WHERE name = 'READ_ONLY'")).fetchone()

    logger.info("Successfully added READ_ONLY role with ID %s", result[0])


@click.command()
@click.option("--env", required=True, help="The environment to use (dev, local, azure).")
def main(env: str) -> None:
    """Main function to add READ_ONLY role."""
    config = get_config(env)
    logger.info(str(config.db_connection_string))
    engine, _ = init_db_from_config(config)
    if engine is None:
        logger.error("Failed to initialize the database engine.")
        sys.exit(1)

    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
        logger.info("Successfully connected to the database.")

    session_factory = scoped_session(sessionmaker(autocommit=False, autoflush=False, bind=engine))

    with session_factory() as session:
        add_read_only_role(session)

    logger.info("Procurement tracker backfill complete.")


if __name__ == "__main__":
    main()
