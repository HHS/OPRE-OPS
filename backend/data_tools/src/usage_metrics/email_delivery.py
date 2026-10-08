"""Email delivery for the usage-metrics report download link (OPS-4148).

Sends the UX team a short email containing a time-limited SAS download link to the sprint's report
via Azure Communication Services (ACS).

Authentication uses the ACS **connection string**, which the infrastructure repo provisions as a
Key Vault secret (``<acs-resource-name>-connection-string``, fanned out to each environment's
vault). Terraform reads that secret at *apply* time and injects it into the job as a Container App
secret (``ACS_CONNECTION_STRING``), the same way the storage account key used to sign the SAS is
injected -- so the job itself needs no Key Vault access at run time. ACS's own AAD/RBAC data-plane
auth is deliberately not used: it requires the ``Contributor`` role on the ACS resource (ACS has no
narrower built-in send role), which the infrastructure does not grant.

Delivery is best-effort from the job's perspective in the sense that the report is already safely
in Blob storage before this runs; a send failure is logged and raised so the run surfaces it, but
the report itself is not lost.
"""

from __future__ import annotations

from datetime import date

from azure.communication.email import EmailClient
from loguru import logger


def parse_recipients(raw: str | None) -> list[str]:
    """Split a comma-separated recipient string into a de-duplicated, ordered list of addresses.

    Whitespace around each address is stripped and blank entries are dropped, so a value like
    ``"a@x.gov, b@x.gov,"`` yields ``["a@x.gov", "b@x.gov"]``. Order is preserved (first
    occurrence wins) so the email's To: header is stable across runs.
    """
    if not raw:
        return []
    seen: dict[str, None] = {}
    for part in raw.split(","):
        address = part.strip()
        if address and address not in seen:
            seen[address] = None
    return list(seen.keys())


def _format_period(period_start: date, period_end: date) -> str:
    """Render the reporting window as a human-readable date range, e.g. "Sep 26 - Oct 10, 2026"."""
    return f"{period_start.strftime('%b %-d')} - {period_end.strftime('%b %-d, %Y')}"


def build_email_message(
    sender: str,
    recipients: list[str],
    download_url: str,
    expiry_days: int,
    period_start: date,
    period_end: date,
) -> dict:
    """Build the ACS email message payload for the report-ready notification.

    The link is rendered in both plain text and HTML so it is clickable in HTML mail clients and
    still usable in plain-text ones. The body states the sprint's reporting period, the expiry,
    and that the report names individual users, so recipients treat the link accordingly.

    :param period_start: First date covered by the report (inclusive).
    :param period_end: Last date covered by the report (inclusive) -- the sprint-end Friday.
    """
    subject = "Your OPS Usage Metrics Report Is Ready"
    period = _format_period(period_start, period_end)
    plain_text = (
        f"The OPS usage metrics report for the sprint ending {period_end.strftime('%B %-d, %Y')} "
        f"({period}) is now available.\n\n"
        f"Download the report (link expires in {expiry_days} days):\n{download_url}\n\n"
        "Please note that this report contains named user data. Do not forward this link.\n\n"
        "Thank you,\nOPS Reporting"
    )
    html = (
        f"<p>The OPS usage metrics report for the sprint ending "
        f"{period_end.strftime('%B %-d, %Y')} ({period}) is now available.</p>"
        f'<p><a href="{download_url}">Download the report</a> '  # noqa: B907 (HTML attr, not a repr)
        f"(link expires in {expiry_days} days).</p>"
        "<p>Please note that this report contains named user data. Do not forward this link.</p>"
        "<p>Thank you,<br>OPS Reporting</p>"
    )
    return {
        "senderAddress": sender,
        "recipients": {"to": [{"address": address} for address in recipients]},
        "content": {"subject": subject, "plainText": plain_text, "html": html},
    }


def send_report_link_email(
    connection_string: str,
    sender: str,
    recipients: list[str],
    download_url: str,
    expiry_days: int,
    period_start: date,
    period_end: date,
) -> None:
    """Email the report download link to the UX team via ACS.

    Raises when ACS reports anything other than a ``Succeeded`` status. ``begin_send`` returning a
    result is not the same as the mail being accepted -- a throttled or quota-exceeded send (the
    likely failure on a first send from a newly created managed domain) completes the poller with a
    ``Failed`` status. Without this check the job would exit 0 and the only signal that no email
    went out would be a human noticing an empty inbox a sprint later.

    :param connection_string: The ACS connection string, supplied by the caller from config. Never
        logged -- it embeds the resource's access key.
    :param sender: The verified ACS sender ("MailFrom") address.
    :param recipients: Non-empty list of recipient addresses.
    :param download_url: The SAS download URL to include in the email body.
    :param expiry_days: Days the link stays valid (rendered in the body).
    :param period_start: First date covered by the report (inclusive), rendered in the body.
    :param period_end: Last date covered by the report (inclusive), rendered in the body.
    """
    if not recipients:
        logger.warning("No recipients configured; skipping report email.")
        return

    message = build_email_message(sender, recipients, download_url, expiry_days, period_start, period_end)

    logger.info(f"Sending usage-metrics report email to {len(recipients)} recipient(s) from {sender}.")
    client = EmailClient.from_connection_string(connection_string)
    poller = client.begin_send(message)
    result = poller.result()

    status = result.get("status") if isinstance(result, dict) else getattr(result, "status", result)
    if str(status) != "Succeeded":
        # The report itself is already in Blob storage, so this does not lose the report -- it
        # surfaces that the notification failed, which is otherwise invisible.
        raise RuntimeError(f"ACS reported a non-successful send status for the usage-metrics report email: {status!r}.")

    logger.info(f"Report email send completed (status: {status}).")
