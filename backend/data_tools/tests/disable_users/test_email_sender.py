from data_tools.src.disable_users.email_content import ADMIN_SUMMARY_SUBJECT, DISABLED_USER_SUBJECT
from data_tools.src.disable_users.email_sender import send_admin_summary_email, send_disabled_user_email

SENDER = "DoNotReply@example.com"


def test_send_disabled_user_email_sends_to_that_user(mocker):
    email_client = mocker.MagicMock()
    email_client.begin_send.return_value.result.return_value = {"status": "Succeeded"}

    send_disabled_user_email(email_client, SENDER, "jane.doe@example.gov")

    sent_message = email_client.begin_send.call_args[0][0]
    assert sent_message["senderAddress"] == SENDER
    assert sent_message["recipients"]["to"] == [{"address": "jane.doe@example.gov"}]
    assert sent_message["content"]["subject"] == DISABLED_USER_SUBJECT
    assert "jane.doe@example.gov" in sent_message["content"]["plainText"]
    email_client.begin_send.return_value.result.assert_called_once()


def test_send_admin_summary_email_lists_all_admins_and_disabled_users(mocker):
    email_client = mocker.MagicMock()
    email_client.begin_send.return_value.result.return_value = {"status": "Succeeded"}

    admin_emails = ["admin1@example.gov", "admin2@example.gov"]
    disabled_users = [{"full_name": "Jane Doe", "division": "Division X", "email": "jane.doe@example.gov"}]

    send_admin_summary_email(email_client, SENDER, admin_emails, disabled_users)

    sent_message = email_client.begin_send.call_args[0][0]
    assert sent_message["recipients"]["to"] == [
        {"address": "admin1@example.gov"},
        {"address": "admin2@example.gov"},
    ]
    assert sent_message["content"]["subject"] == ADMIN_SUMMARY_SUBJECT
    assert "Jane Doe" in sent_message["content"]["plainText"]
    email_client.begin_send.return_value.result.assert_called_once()
