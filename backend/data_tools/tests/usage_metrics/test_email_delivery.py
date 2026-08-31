from data_tools.src.usage_metrics.email_delivery import (
    build_email_message,
    parse_recipients,
    send_report_link_email,
)

DOWNLOAD_URL = "https://acct.blob.core.windows.net/data/reports/usage-metrics-2026-08-19.xlsx?sig=x"


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


def test_send_report_link_email_uses_mi_and_sends(mocker):
    credential = mocker.patch("data_tools.src.usage_metrics.email_delivery.DefaultAzureCredential")
    email_client_cls = mocker.patch("data_tools.src.usage_metrics.email_delivery.EmailClient")
    poller = email_client_cls.return_value.begin_send.return_value
    poller.result.return_value = {"status": "Succeeded"}

    send_report_link_email(
        "https://acs.communication.azure.com",
        "DoNotReply@example.com",
        ["ux1@example.com"],
        DOWNLOAD_URL,
        90,
        client_id="mi-client-id",
    )

    # Authenticated by the managed identity (client id passed through), not RBAC/connection string.
    credential.assert_called_once_with(managed_identity_client_id="mi-client-id")
    email_client_cls.assert_called_once_with("https://acs.communication.azure.com", credential.return_value)
    email_client_cls.return_value.begin_send.assert_called_once()
    poller.result.assert_called_once()


def test_send_report_link_email_noops_without_recipients(mocker):
    email_client_cls = mocker.patch("data_tools.src.usage_metrics.email_delivery.EmailClient")
    send_report_link_email("https://acs.communication.azure.com", "DoNotReply@example.com", [], DOWNLOAD_URL, 90)
    email_client_cls.assert_not_called()


def test_send_report_link_email_falls_back_to_rbac_without_client_id(mocker):
    credential = mocker.patch("data_tools.src.usage_metrics.email_delivery.DefaultAzureCredential")
    mocker.patch("data_tools.src.usage_metrics.email_delivery.EmailClient")

    send_report_link_email(
        "https://acs.communication.azure.com",
        "DoNotReply@example.com",
        ["ux1@example.com"],
        DOWNLOAD_URL,
        90,
        client_id=None,
    )

    # No managed-identity client id -> plain DefaultAzureCredential (RBAC).
    credential.assert_called_once_with()
