"""Email delivery for the usage-metrics report download link (OPS-4148).

Sends the UX team a short email containing a time-limited SAS download link to the weekly report
via Azure Communication Services (ACS).

Authentication uses the ACS **connection string**, which the infrastructure repo provisions as a
Key Vault secret (``<acs-resource-name>-connection-string``, fanned out to each environment's
vault). The job's managed identity reads that secret from Key Vault at run time -- the same way it
reads the storage account key used to sign the SAS -- so no ACS secret is stored in the job's
environment. ACS's own AAD/RBAC data-plane auth is deliberately not used: it requires the
``Contributor`` role on the ACS resource (ACS has no narrower built-in send role), which the
infrastructure does not grant.

Delivery is best-effort from the job's perspective in the sense that the report is already safely
in Blob storage before this runs; a send failure is logged and raised so the run surfaces it, but
the report itself is not lost.
"""

from __future__ import annotations

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


def build_email_message(sender: str, recipients: list[str], download_url: str, expiry_days: int) -> dict:
    """Build the ACS email message payload for the report-ready notification.

    The link is rendered in both plain text and HTML so it is clickable in HTML mail clients and
    still usable in plain-text ones. The body states the expiry and that the report names
    individual users, so recipients treat the link accordingly.
    """
    subject = "OPS usage metrics report is ready"
    plain_text = (
        "The latest OPS usage metrics report is ready.\n\n"
        f"Download it here (link expires in {expiry_days} days):\n{download_url}\n\n"
        "This report contains named user data -- please do not forward the link."
    )
    html = (
        "<p>The latest OPS usage metrics report is ready.</p>"
        f'<p><a href="{download_url}">Download the report</a> '  # noqa: B907 (HTML attr, not a repr)
        f"(link expires in {expiry_days} days).</p>"
        "<p>This report contains named user data &mdash; please do not forward the link.</p>"
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
) -> None:
    """Email the report download link to the UX team via ACS.

    :param connection_string: The ACS connection string, read from Key Vault by the caller. Never
        logged -- it embeds the resource's access key.
    :param sender: The verified ACS sender ("MailFrom") address.
    :param recipients: Non-empty list of recipient addresses.
    :param download_url: The SAS download URL to include in the email body.
    :param expiry_days: Days the link stays valid (rendered in the body).
    """
    if not recipients:
        logger.warning("No recipients configured; skipping report email.")
        return

    message = build_email_message(sender, recipients, download_url, expiry_days)

    logger.info(f"Sending usage-metrics report email to {len(recipients)} recipient(s) from {sender}.")
    client = EmailClient.from_connection_string(connection_string)
    poller = client.begin_send(message)
    result = poller.result()
    logger.info(
        f"Report email send completed (status: {result.get('status') if isinstance(result, dict) else result})."
    )
