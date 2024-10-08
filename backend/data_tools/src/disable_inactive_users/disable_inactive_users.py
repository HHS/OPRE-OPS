import logging
import os

from data_tools.src.disable_inactive_users.queries import (
    ALL_ACTIVE_USER_SESSIONS_QUERY,
    EXCLUDED_USER_IDS,
    INACTIVE_USER_QUERY,
    SYSTEM_USER_EMAIL,
    SYSTEM_USER_ID,
    SYSTEM_USER_OIDC_ID,
    SYSTEM_USER_QUERY,
)
from data_tools.src.import_static_data.import_data import get_config, init_db
from sqlalchemy import text
from sqlalchemy.orm import Mapper, Session

from models import *  # noqa: F403, F401

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def create_system_user(se):
    """Create system user if it doesn't exist."""
    system_user = se.execute(
        text(SYSTEM_USER_QUERY),
        {"oidc_id": SYSTEM_USER_OIDC_ID}
    ).fetchone()

    if system_user is None:
        sys_user = User(
            id=SYSTEM_USER_ID,
            email=SYSTEM_USER_EMAIL,
            oidc_id=SYSTEM_USER_OIDC_ID,
            status=UserStatus.LOCKED
        )
        se.add(sys_user)
        se.commit()
        return sys_user.id

    return system_user[0]


def deactivate_user(se, user_id, system_user_id):
    """Deactivate a single user and log the change."""
    updated_user = User(id=user_id, status=UserStatus.INACTIVE, updated_by=system_user_id)
    se.merge(updated_user)

    db_audit = build_audit(updated_user, OpsDBHistoryType.UPDATED)
    ops_db_history = OpsDBHistory(
        event_type=OpsDBHistoryType.UPDATED,
        created_by=system_user_id,
        class_name=updated_user.__class__.__name__,
        row_key=db_audit.row_key,
        changes=db_audit.changes,
    )
    se.add(ops_db_history)

    ops_event = OpsEvent(
        event_type=OpsEventType.UPDATE_USER,
        event_status=OpsEventStatus.SUCCESS,
        created_by=system_user_id,
    )
    se.add(ops_event)

    all_user_sessions = se.execute(text(ALL_ACTIVE_USER_SESSIONS_QUERY), {"user_id": user_id})
    for session in all_user_sessions:
        updated_user_session = UserSession(
            id=session[0],
            is_active=False,
            updated_by=system_user_id
        )
        se.merge(updated_user_session)


def update_disabled_users_status(conn: sqlalchemy.engine.Engine):
    """Update the status of disabled users in the database."""
    with Session(conn) as se:
        logger.info("Checking for System User.")
        system_user_id = create_system_user(se)

        logger.info("Fetching inactive users.")
        results = se.execute(text(INACTIVE_USER_QUERY)).scalars().all()
        user_ids = [uid for uid in results if uid not in EXCLUDED_USER_IDS]

        if not user_ids:
            logger.info("No inactive users found.")
            return

        logger.info("Inactive users found:", user_ids)

        for user_id in user_ids:
            logger.info("Deactivating user", user_id)
            deactivate_user(se, user_id, system_user_id)

        se.commit()


if __name__ == "__main__":
    logger.info("Starting Disable Inactive Users process.")

    script_env = os.getenv("ENV")
    script_config = get_config(script_env)
    db_engine, db_metadata_obj = init_db(script_config)

    event.listen(Mapper, "after_configured", setup_schema(BaseModel))

    update_disabled_users_status(db_engine)

    logger.info("Disable Inactive Users process complete.")
