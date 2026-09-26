import os
import sys
import time
from datetime import timedelta

from azure.communication.email import EmailClient
from sqlalchemy import text
from sqlalchemy.orm import Session

from data_tools.environment.types import DataToolsConfig
from data_tools.src.common.db import init_db_from_config, setup_triggers
from data_tools.src.common.utils import get_or_create_sys_user
from data_tools.src.disable_users.email_sender import send_admin_summary_email, send_disabled_user_email
from data_tools.src.disable_users.queries import (
    ALL_ACTIVE_USER_SESSIONS_QUERY,
    EXCLUDED_USER_OIDC_IDS,
    GET_USER_ID_BY_OIDC_QUERY,
    get_active_user_admins,
    get_latest_user_session,
)
from data_tools.src.import_static_data.import_data import get_config
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
logger.add(sys.stdout, format=format, level="INFO", diagnose=False)
logger.add(sys.stderr, format=format, level="INFO", diagnose=False)


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
        updated_user_session = UserSession(id=session[0], is_active=False, updated_by=system_admin_id)
        se.merge(updated_user_session)


def update_disabled_users_status(conn: sqlalchemy.engine.Engine, config: DataToolsConfig):
    """Update the status of disabled users in the database."""

    with Session(conn) as se:
        logger.info("Checking for System User.")
        system_admin = get_or_create_sys_user(se)
        system_admin_id = system_admin.id

        setup_triggers(se, system_admin)

        logger.info("Fetching inactive users.")
        stale_users = []
        all_users = se.execute(select(User)).scalars().all()
        cutoff_date = datetime.now() - timedelta(days=60)
        for user in all_users:
            latest_session = get_latest_user_session(user_id=user.id, session=se)
            if user.status == UserStatus.ACTIVE:
                stale_user = user.updated_on < cutoff_date
                stale_session = latest_session and latest_session.last_active_at < cutoff_date
                never_logged_in = latest_session is None

                if (never_logged_in and stale_user) or (stale_session and stale_user):
                    stale_users.append(user)

        excluded_ids = get_ids_from_oidc_ids(se, EXCLUDED_USER_OIDC_IDS)
        disabled_users = [user for user in stale_users if user.id not in excluded_ids]

        if not disabled_users:
            logger.info("No inactive users found.")
            return

        user_ids = [user.id for user in disabled_users]
        logger.info("Inactive users found: {}".format(user_ids))

        divisions_by_id = {division.id: division.name for division in se.execute(select(Division)).scalars().all()}
        disabled_user_details = [
            {
                "email": user.email,
                "full_name": user.full_name or "N/A",
                "division": divisions_by_id.get(user.division, "N/A"),
            }
            for user in disabled_users
        ]

        # Snapshot active USER_ADMIN recipients before disabling anyone -- an admin who is
        # themselves stale could otherwise be disabled in this same run and silently drop out
        # of the recipient list before the summary email is sent below.
        admin_emails = [admin.email for admin in get_active_user_admins(se)]

        for user_id in user_ids:
            logger.info("Deactivating user: {}".format(user_id))
            disable_user(se, user_id, system_admin_id)

        se.commit()

        send_disable_notifications(config, disabled_user_details, admin_emails)


def send_disable_notifications(
    config: DataToolsConfig, disabled_user_details: list[dict], admin_emails: list[str]
) -> None:
    """Email a summary to all active USER_ADMINs, then email each disabled user individually.

    The admin summary is sent FIRST, deliberately: by the time this runs the disable/commit has
    already happened, so "these accounts were disabled" is already true, and there's no downside
    to sending the compliance-relevant admin summary before the individual notifications.

    Every send -- the admin summary and each individual notification -- is attempted
    independently: a failure is logged and collected, but never stops the remaining sends. If
    anything failed, a single RuntimeError is raised after every send has been attempted, so the
    job still exits non-zero (and the failure is visible), but one bad send can no longer silently
    prevent every other notification from going out.

    ``admin_emails`` must be captured by the caller before any user in this run was disabled (see
    the comment in update_disabled_users_status) so a just-disabled admin isn't silently dropped
    from the recipient list. ``disabled_user_details`` must be non-empty (the caller's early
    return already guarantees this), and each dict must already have a resolved "division" name
    (not a raw FK) -- this function has no DB access. No-ops (with a log line) when
    ``config.acs_connection_string``/``email_sender_address`` is None -- this keeps local/dev/
    pytest runs from attempting to send mail. AzureConfig never returns None for either property
    (it raises instead if unset), so that no-op path is only reachable for local/dev/pytest.

    Note: this is not idempotent. If a send fails, already-disabled users stay disabled but some
    notifications may never go out -- re-running the job will not resend them, since those users
    are no longer selected as stale. The job's non-zero exit is the signal to investigate
    manually.
    """
    if not config.acs_connection_string or not config.email_sender_address:
        logger.warning(
            "ACS email not configured (ACS_CONNECTION_STRING/EMAIL_SENDER_ADDRESS); "
            "skipping disable notification emails."
        )
        return

    sender = config.email_sender_address
    email_client = EmailClient.from_connection_string(config.acs_connection_string)

    failures = []

    if not admin_emails:
        logger.warning("No active USER_ADMINs found; skipping admin summary email.")
    else:
        try:
            send_admin_summary_email(email_client, sender, admin_emails, disabled_user_details)
        except Exception as e:
            logger.error(f"Failed to send admin summary email: {e}")
            failures.append("admin summary")

    for user in disabled_user_details:
        try:
            send_disabled_user_email(email_client, sender, user["email"])
        except Exception as e:
            logger.error(f"Failed to send disable notification email to {user['email']}: {e}")
            failures.append(user["email"])

    if failures:
        raise RuntimeError(f"Failed to send {len(failures)} disable notification(s): {failures}")


if __name__ == "__main__":
    logger.info("Starting Disable Inactive Users process.")

    script_env = os.getenv("ENV")
    script_config = get_config(script_env)
    db_engine, db_metadata_obj = init_db_from_config(script_config)

    update_disabled_users_status(db_engine, script_config)

    logger.info("Disable Inactive Users process complete.")
