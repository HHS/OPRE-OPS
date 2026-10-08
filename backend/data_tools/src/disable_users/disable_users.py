import os
import sys
import time
from datetime import datetime, timedelta

from azure.communication.email import EmailClient
from sqlalchemy import text
from sqlalchemy.orm import Session

from data_tools.environment.types import DataToolsConfig
from data_tools.src.common.db import init_db_from_config, setup_triggers
from data_tools.src.common.utils import get_or_create_sys_user
from data_tools.src.disable_users.email_sender import (
    send_admin_summary_email,
    send_disabled_user_email,
    send_inactivity_warning_email,
)
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
logger.remove()  # remove the default handler (id=0, diagnose=True) before adding our own
logger.add(sys.stdout, format=format, level="INFO", diagnose=False)
logger.add(sys.stderr, format=format, level="INFO", diagnose=False)

INACTIVITY_DAYS = 60
WARNING_DAYS = 7
# Warnings go out only in this run, so each at-risk user gets one per day. Assumes the job's cron
# (managed in OPRE-OPS-Data) runs hourly at the top of the hour. 13:00 UTC is 9am EDT / 8am EST.
WARNING_SEND_HOUR_UTC = 13


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
        # "status" mirrors the manual UI path's request.json payload so the usage-metrics
        # deactivated_users detector counts these automated deactivations too.
        event_details={
            "user_id": user_id,
            "status": UserStatus.INACTIVE.name,
            "message": "User deactivated via automated process.",
        },
    )
    se.add(ops_event)

    all_user_sessions = se.execute(text(ALL_ACTIVE_USER_SESSIONS_QUERY), {"user_id": user_id})
    for session in all_user_sessions:
        updated_user_session = UserSession(id=session[0], is_active=False, updated_by=system_admin_id)
        se.merge(updated_user_session)


def get_deactivation_date(user, latest_session) -> datetime | None:
    """Return when ``user`` becomes eligible for deactivation, or None if updated_on is unset.

    Shared by the disable and warning paths so they can't drift: both updated_on AND the latest
    session (if any) must be older than INACTIVITY_DAYS.
    """
    if user.updated_on is None:
        return None
    if latest_session is None:
        return user.updated_on + timedelta(days=INACTIVITY_DAYS)
    return max(user.updated_on, latest_session.last_active_at) + timedelta(days=INACTIVITY_DAYS)


def get_inactivity_warnings(candidates: list[tuple], now: datetime) -> list[dict]:
    """Return a warning for each (user, deadline) in ``candidates`` that is 1..WARNING_DAYS days out
    and not being disabled this run."""
    # Count from the top of the hour so consecutive 13:00 runs are exactly 24h apart regardless of
    # start-up jitter, and the countdown drops by exactly 1 a day with no repeats. The one exception:
    # a deadline between the top of the hour and the job's actual start is disabled in that run, so
    # that user's last warning said 2 days rather than 1.
    # days_remaining is ceil((deadline - run_hour) / 1 day), in exact integer math.
    run_hour = now.replace(minute=0, second=0, microsecond=0)
    warnings = []
    for user, deadline in candidates:
        # deadline >= now keeps this disjoint from the users being disabled this run.
        days_remaining = -((run_hour - deadline) // timedelta(days=1))
        if deadline >= now and 1 <= days_remaining <= WARNING_DAYS:
            warnings.append({"email": user.email, "days_remaining": days_remaining})
    return warnings


def update_disabled_users_status(conn: sqlalchemy.engine.Engine, config: DataToolsConfig, now: datetime | None = None):
    """Update the status of disabled users in the database, then send pre-deactivation warnings.

    Warnings are sent after the disable path; if send_disable_notifications raises, that run's
    warnings are skipped.
    """
    now = datetime.now() if now is None else now

    with Session(conn) as se:
        logger.info("Checking for System User.")
        system_admin = get_or_create_sys_user(se)
        system_admin_id = system_admin.id

        setup_triggers(se, system_admin)

        logger.info("Fetching inactive users.")
        candidates = []
        all_users = se.execute(select(User)).scalars().all()
        for user in all_users:
            latest_session = get_latest_user_session(user_id=user.id, session=se)
            if user.status == UserStatus.ACTIVE:
                deadline = get_deactivation_date(user, latest_session)
                if deadline is not None:
                    candidates.append((user, deadline))

        excluded_ids = get_ids_from_oidc_ids(se, EXCLUDED_USER_OIDC_IDS)
        candidates = [(user, deadline) for user, deadline in candidates if user.id not in excluded_ids]
        disabled_users = [user for user, deadline in candidates if deadline < now]

        warnings = []
        if now.hour == WARNING_SEND_HOUR_UTC and config.environment_label:
            warnings = get_inactivity_warnings(candidates, now)

        if not disabled_users and not warnings:
            logger.info("No inactive users found.")
            return

        # Resolve the ACS sender config and construct the EmailClient now, before any user is
        # disabled or warned, so a misconfigured environment fails fast here instead of surfacing only
        # after the disable loop has already committed.
        sender = config.email_sender_address
        connection_string = config.acs_connection_string

        # The config properties themselves return None rather than raising when unset, because the
        # usage-metrics report shares them and must still upload its report when email is unwired.
        # This job has the opposite requirement: the admin summary is the compliance artifact for
        # this run, and the job is not idempotent -- re-running it will NOT re-send notifications for
        # users it already disabled, and warnings are only sent in the 13:00 run. So a remote
        # environment with no ACS wiring must fail before any user is touched rather than silently
        # disable people and skip the notifications.
        # local/dev/pytest return None cleanly, where no client is built and sending no-ops.
        if config.is_remote and not (connection_string and sender):
            raise ValueError(
                "ACS email is not configured (ACS_CONNECTION_STRING / EMAIL_SENDER_ADDRESS) in a "
                "remote environment. Refusing to disable or warn users, because their notifications and "
                "the admin summary could not be sent and this job does not re-send them on a later run."
            )

        email_client = EmailClient.from_connection_string(connection_string) if connection_string and sender else None

        if disabled_users:
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

            send_disable_notifications(email_client, sender, disabled_user_details, admin_emails)

        if warnings:
            send_inactivity_warnings(email_client, sender, warnings, config.environment_label, config.frontend_url)


def send_disable_notifications(
    email_client: EmailClient | None, sender: str | None, disabled_user_details: list[dict], admin_emails: list[str]
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
    from the recipient list. ``disabled_user_details`` must be non-empty (the caller's
    ``if disabled_users:`` guard already guarantees this), and each dict must already have a
    resolved "division" name (not a raw FK) -- this function has no DB access.

    ``email_client`` is built by the caller (update_disabled_users_status) before any user is
    disabled, so a misconfigured AzureConfig -- unset or a malformed connection string -- fails
    fast there instead of here. This function no-ops (with a log line) when ``email_client`` is
    None, which the caller only passes when ACS isn't configured (local/dev/pytest); AzureConfig
    never leaves it None.

    Note: this is not idempotent. If a send fails, already-disabled users stay disabled but some
    notifications may never go out -- re-running the job will not resend them, since those users
    are no longer selected as stale. The job's non-zero exit is the signal to investigate
    manually.
    """
    if email_client is None:
        logger.warning(
            "ACS email not configured (ACS_CONNECTION_STRING/EMAIL_SENDER_ADDRESS); "
            "skipping disable notification emails."
        )
        return

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


def send_inactivity_warnings(
    email_client: EmailClient, sender: str, warnings: list[dict], environment_label: str, frontend_url: str
) -> None:
    """Email each at-risk user that their account will be disabled within ``days_remaining`` days.

    Every send is attempted independently: a failure is logged and collected, and a single
    RuntimeError is raised after all sends have been attempted so the job exits non-zero.

    Warnings are stateless: a failed send is not retried, and that user simply misses that day's
    warning.
    """
    failures = []

    for warning in warnings:
        try:
            send_inactivity_warning_email(
                email_client, sender, warning["email"], warning["days_remaining"], environment_label, frontend_url
            )
        except Exception as e:
            logger.error(f"Failed to send inactivity warning email to {warning['email']}: {e}")
            failures.append(warning["email"])

    if failures:
        raise RuntimeError(f"Failed to send {len(failures)} inactivity warning(s): {failures}")


if __name__ == "__main__":
    logger.info("Starting Disable Inactive Users process.")

    script_env = os.getenv("ENV")
    script_config = get_config(script_env)
    db_engine, db_metadata_obj = init_db_from_config(script_config)

    update_disabled_users_status(db_engine, script_config)

    logger.info("Disable Inactive Users process complete.")
