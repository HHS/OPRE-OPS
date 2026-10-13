import re

import pytest

from data_tools.src.disable_users.email_content import (
    ADMIN_SUMMARY_SUBJECT,
    DISABLED_USER_SUBJECT,
    admin_summary_body,
    disabled_user_body,
    inactivity_warning_body,
    inactivity_warning_subject,
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


def test_inactivity_warning_subject_is_tagged_only_on_staging():
    production_subject = inactivity_warning_subject(3, "Production")

    assert inactivity_warning_subject(3, "Staging") == f"[STAGING] {production_subject}"
    assert "[STAGING]" not in production_subject


@pytest.mark.parametrize("days_remaining, countdown", [(1, "1 day"), (7, "7 days")])
def test_inactivity_warning_subject_pluralizes_days(days_remaining, countdown):
    assert re.search(rf"\b{countdown}\b", inactivity_warning_subject(days_remaining, "Production"))


def test_inactivity_warning_body_includes_environment_url_email_and_countdown():
    body = inactivity_warning_body("jane.doe@example.gov", 3, "Staging", "https://stg.ops.opre.acf.gov/")

    assert "Staging" in body
    assert "https://stg.ops.opre.acf.gov/" in body.splitlines()
    assert "jane.doe@example.gov" in body
    assert "3 days" in body
