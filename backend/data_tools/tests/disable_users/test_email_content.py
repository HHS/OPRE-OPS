from data_tools.src.disable_users.email_content import (
    ADMIN_SUMMARY_SUBJECT,
    DISABLED_USER_SUBJECT,
    admin_summary_body,
    disabled_user_body,
)


def test_disabled_user_body_includes_email():
    body = disabled_user_body("jane.doe@example.gov")
    assert "jane.doe@example.gov" in body


def test_admin_summary_body_lists_each_disabled_user():
    disabled_users = [
        {"full_name": "Jane Doe", "division": "Division of Data and Improvement", "email": "jane.doe@example.gov"},
        {"full_name": "John Smith", "division": "N/A", "email": "john.smith@example.gov"},
    ]

    body = admin_summary_body(disabled_users)

    assert "- Jane Doe (Division of Data and Improvement) - jane.doe@example.gov" in body.splitlines()
    assert "- John Smith (N/A) - john.smith@example.gov" in body.splitlines()


def test_subjects_are_non_empty_strings():
    assert isinstance(DISABLED_USER_SUBJECT, str) and DISABLED_USER_SUBJECT
    assert isinstance(ADMIN_SUMMARY_SUBJECT, str) and ADMIN_SUMMARY_SUBJECT
