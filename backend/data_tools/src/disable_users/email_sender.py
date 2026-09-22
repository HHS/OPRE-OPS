"""Sends the disable_users notification emails via Azure Communication Services (OPS-2102).

Message text lives in email_content.py -- this file only builds the ACS message payload,
sends it, and logs who each email went to and why. Failures are not caught here; by the time
this runs, the disable/commit has already succeeded, so a send failure should surface loudly
(non-zero exit) rather than being silently swallowed.

The caller is responsible for constructing the ``EmailClient`` (via
``EmailClient.from_connection_string(...)``) and passing it in -- this module never sees the
connection string itself, so it can't end up in this module's stack frames (and therefore
can't leak via a future ``logger.exception(...)`` with ``diagnose=True``).
"""

from __future__ import annotations

from azure.communication.email import EmailClient
from loguru import logger

from data_tools.src.disable_users.email_content import (
    ADMIN_SUMMARY_SUBJECT,
    DISABLED_USER_SUBJECT,
    admin_summary_body,
    disabled_user_body,
)


def _send_email(email_client: EmailClient, sender: str, recipients: list[str], subject: str, body: str) -> None:
    message = {
        "senderAddress": sender,
        "recipients": {"to": [{"address": address} for address in recipients]},
        "content": {"subject": subject, "plainText": body},
    }
    poller = email_client.begin_send(message)
    poller.result()


def send_disabled_user_email(email_client: EmailClient, sender: str, user_email: str) -> None:
    """Notify a single user that their own account was just disabled."""
    _send_email(email_client, sender, [user_email], DISABLED_USER_SUBJECT, disabled_user_body(user_email))
    logger.info(
        f"Sent disable notification email to {user_email} (reason: account automatically disabled for inactivity)."
    )


def send_admin_summary_email(
    email_client: EmailClient, sender: str, admin_emails: list[str], disabled_users: list[dict]
) -> None:
    """Notify all active USER_ADMINs about every user disabled in this run."""
    _send_email(email_client, sender, admin_emails, ADMIN_SUMMARY_SUBJECT, admin_summary_body(disabled_users))
    logger.info(
        f"Sent admin summary email to {', '.join(admin_emails)} "
        f"(reason: {len(disabled_users)} user(s) automatically disabled for inactivity)."
    )
