"""Email delivery for the usage-metrics report download link (OPS-4148).

Sends the UX team a short email containing a time-limited SAS download link to the weekly report
via Azure Communication Services (ACS). Authentication uses the same managed identity the job
already uses for Blob access (``DefaultAzureCredential`` with ``MI_CLIENT_ID``), so no ACS
connection string / secret is stored on the job.

Delivery is best-effort from the job's perspective in the sense that the report is already safely
in Blob storage before this runs; a send failure is logged and raised so the run surfaces it, but
the report itself is not lost.
"""

from __future__ import annotations

import os

from azure.communication.email import EmailClient
from azure.identity import DefaultAzureCredential
from loguru import logger

MI_CLIENT_ID = os.getenv("MI_CLIENT_ID")


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
    acs_endpoint: str,
    sender: str,
    recipients: list[str],
    download_url: str,
    expiry_days: int,
    client_id: str | None = MI_CLIENT_ID,
) -> None:
    """Email the report download link to the UX team via ACS, authenticated by managed identity.

    :param acs_endpoint: The ACS resource endpoint, e.g. "https://<res>.communication.azure.com".
    :param sender: The verified ACS sender ("MailFrom") address.
    :param recipients: Non-empty list of recipient addresses.
    :param download_url: The SAS download URL to include in the email body.
    :param expiry_days: Days the link stays valid (rendered in the body).
    :param client_id: Managed-identity client id; falls back to RBAC when None.
    """
    if not recipients:
        logger.warning("No recipients configured; skipping report email.")
        return

    if client_id is None:
        logger.warning("No client ID provided. Using RBAC for ACS email.")
        credential = DefaultAzureCredential()
    else:
        credential = DefaultAzureCredential(managed_identity_client_id=client_id)

    message = build_email_message(sender, recipients, download_url, expiry_days)

    logger.info(f"Sending usage-metrics report email to {len(recipients)} recipient(s) via {acs_endpoint}.")
    client = EmailClient(acs_endpoint, credential)
    poller = client.begin_send(message)
    result = poller.result()
    logger.info(
        f"Report email send completed (status: {result.get('status') if isinstance(result, dict) else result})."
    )
