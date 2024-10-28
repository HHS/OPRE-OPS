import os
import sys
import time
from datetime import timedelta

from data_tools.src.common.db import init_db_from_config, setup_triggers
from data_tools.src.common.utils import get_or_create_sys_user
from data_tools.src.disable_users.queries import (
    ALL_ACTIVE_USER_SESSIONS_QUERY,
    EXCLUDED_USER_OIDC_IDS,
    GET_USER_ID_BY_OIDC_QUERY,
    get_latest_user_session,
)
from data_tools.src.import_static_data.import_data import get_config, init_db
from sqlalchemy import text
from sqlalchemy.orm import Mapper, Session

from models import *  # noqa: F403, F401

# Set the timezone to UTC
os.environ["TZ"] = "UTC"
time.tzset()

# logger configuration
format = (
    "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
    "<level>{level: <8}</level> | "
    "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | "
    "<level>{message}</level>"
)
logger.add(sys.stdout, format=format, level="INFO")
logger.add(sys.stderr, format=format, level="INFO")

def get_ids_from_oidc_ids(se, oidc_ids: list):
    """Retrieve user IDs corresponding to a list of OIDC IDs."""
    if not all(isinstance(oidc_id, str) for oidc_id in oidc_ids):
        raise ValueError("All oidc_ids must be strings.")

    ids = []
    for oidc_id in oidc_ids:
        user_id = se.execute(text(GET_USER_ID_BY_OIDC_QUERY), {"oidc_id": oidc_id}).scalar()

        if user_id is not None:
            ids.append(user_id)

    return ids

def disable_user(se, user_id, system_admin_id):
    """Deactivate a single user and log the change."""
    updated_user = User(id=user_id, status=UserStatus.INACTIVE, updated_by=system_admin_id)
    se.merge(updated_user)

    ops_event = OpsEvent(
        event_type=OpsEventType.UPDATE_USER,
        event_status=OpsEventStatus.SUCCESS,
        created_by=system_admin_id,
        event_details={"user_id": user_id, "message": "User deactivated via automated process."},
    )
    se.add(ops_event)

    all_user_sessions = se.execute(text(ALL_ACTIVE_USER_SESSIONS_QUERY), {"user_id": user_id})
    for session in all_user_sessions:
        updated_user_session = UserSession(
            id=session[0],
            is_active=False,
            updated_by=system_admin_id
        )
        se.merge(updated_user_session)


def update_disabled_users_status(conn: sqlalchemy.engine.Engine):
    """Update the status of disabled users in the database."""

    with Session(conn) as se:
        logger.info("Checking for System User.")
        system_admin = get_or_create_sys_user(se)
        system_admin_id = system_admin.id

        setup_triggers(se, system_admin)

        logger.info("Fetching inactive users.")
        results = []
        all_users = se.execute(select(User)).scalars().all()
        for user in all_users:
            latest_session = get_latest_user_session(user_id=user.id, session=se)
            if latest_session and latest_session.last_active_at < datetime.now() - timedelta(days=60):
                results.append(user.id)

        excluded_ids = get_ids_from_oidc_ids(se, EXCLUDED_USER_OIDC_IDS)
        user_ids = [uid for uid in results if uid not in excluded_ids]

        if not user_ids:
            logger.info("No inactive users found.")
            return

        logger.info("Inactive users found:", user_ids)

        for user_id in user_ids:
            logger.info("Deactivating user", user_id)
            disable_user(se, user_id, system_admin_id)

        se.commit()


if __name__ == "__main__":
    logger.info("Starting Disable Inactive Users process.")

    script_env = os.getenv("ENV")
    script_config = get_config(script_env)
    db_engine, db_metadata_obj = init_db_from_config(script_config)

    update_disabled_users_status(db_engine)

    logger.info("Disable Inactive Users process complete.")
