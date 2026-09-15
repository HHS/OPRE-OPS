from loguru import logger

from data_tools.src.usage_metrics.email_delivery import (
    build_email_message,
    parse_recipients,
    send_report_link_email,
)

DOWNLOAD_URL = "https://acct.blob.core.windows.net/data/reports/usage-metrics-2026-08-19.xlsx?sig=x"
FAKE_ACS_CREDENTIAL = "not-a-real-credential"
CONNECTION_STRING = f"endpoint=https://acs.communication.azure.com/;accesskey={FAKE_ACS_CREDENTIAL}"


def test_parse_recipients_splits_strips_and_dedupes():
    raw = " ux1@example.com , ux2@example.com,ux1@example.com,"
    # Whitespace trimmed, blanks dropped, order preserved, duplicates removed.
    assert parse_recipients(raw) == ["ux1@example.com", "ux2@example.com"]


def test_parse_recipients_empty_and_none():
    assert parse_recipients(None) == []
    assert parse_recipients("") == []
    assert parse_recipients("   ,  ,") == []


def test_build_email_message_shape_and_link():
    recipients = ["ux1@example.com", "ux2@example.com"]
    message = build_email_message("DoNotReply@example.com", recipients, DOWNLOAD_URL, 90)

    assert message["senderAddress"] == "DoNotReply@example.com"
    assert message["recipients"]["to"] == [
        {"address": "ux1@example.com"},
        {"address": "ux2@example.com"},
    ]
    # Link appears in both plain-text and HTML bodies; expiry is stated.
    assert DOWNLOAD_URL in message["content"]["plainText"]
    assert DOWNLOAD_URL in message["content"]["html"]
    assert "90 days" in message["content"]["plainText"]
    # Named-user-data warning is present.
    assert "named user data" in message["content"]["plainText"]


def test_send_report_link_email_uses_connection_string_and_sends(mocker):
    email_client_cls = mocker.patch("data_tools.src.usage_metrics.email_delivery.EmailClient")
    client = email_client_cls.from_connection_string.return_value
    poller = client.begin_send.return_value
    poller.result.return_value = {"status": "Succeeded"}

    send_report_link_email(
        CONNECTION_STRING,
        "DoNotReply@example.com",
        ["ux1@example.com"],
        DOWNLOAD_URL,
        90,
    )

    # Authenticated by the Key Vault-sourced connection string, not AAD/managed identity -- the
    # infrastructure provisions the connection string and grants the job no role on the ACS resource.
    email_client_cls.from_connection_string.assert_called_once_with(CONNECTION_STRING)
    email_client_cls.assert_not_called()
    client.begin_send.assert_called_once()
    poller.result.assert_called_once()


def test_send_report_link_email_noops_without_recipients(mocker):
    email_client_cls = mocker.patch("data_tools.src.usage_metrics.email_delivery.EmailClient")
    send_report_link_email(CONNECTION_STRING, "DoNotReply@example.com", [], DOWNLOAD_URL, 90)
    email_client_cls.from_connection_string.assert_not_called()


def test_send_report_link_email_does_not_log_connection_string(mocker, caplog):
    email_client_cls = mocker.patch("data_tools.src.usage_metrics.email_delivery.EmailClient")
    email_client_cls.from_connection_string.return_value.begin_send.return_value.result.return_value = {}

    # Remove only our own sink on the way out -- a bare logger.remove() would also drop the
    # stdout/stderr sinks that data_tools adds at import time.
    handler_id = logger.add(caplog.handler, format="{message}", level="INFO")
    try:
        send_report_link_email(CONNECTION_STRING, "DoNotReply@example.com", ["ux1@example.com"], DOWNLOAD_URL, 90)
    finally:
        logger.remove(handler_id)

    # Guard that the send actually logged (otherwise the assertions below pass vacuously).
    assert "Sending usage-metrics report email" in caplog.text
    # The connection string embeds the ACS access key; it must never reach the job logs.
    assert "accesskey" not in caplog.text.lower()
    assert FAKE_ACS_CREDENTIAL not in caplog.text
