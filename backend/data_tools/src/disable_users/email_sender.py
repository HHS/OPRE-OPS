"""Sends the disable_users notification emails via Azure Communication Services (OPS-2102).

Message text lives in email_content.py -- this file only builds the ACS message payload,
sends it, and logs who each email went to and why. This module itself never catches send
failures -- disable_users.py's caller catches around every call it makes here (both the admin
summary and each individual notification), logs each failure, and still raises once at the end
if anything failed, so the job exits non-zero without letting one bad send block the rest.

Takes an already-constructed EmailClient (not a connection string) so the raw ACS secret never
sits in *this module's* stack frames. That alone is not a complete guarantee against leaking via
a logger configured with loguru's diagnose=True: a failure deep inside the ACS SDK/stdlib (e.g. a
malformed-key base64 decode error) can still print raw key material from *those* frames, which
this module's design does not reach. The actual backstop is disable_users.py's logger sinks being
configured with diagnose=False -- this module's client-injection pattern is good defense-in-depth,
not the sole protection.
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
