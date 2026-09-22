"""Subject/body text for the disable_users notification emails (OPS-2102).

Edit the strings and functions below to change what gets sent -- this file has no
sending logic, only text.
"""

DISABLED_USER_SUBJECT = "Your OPS account has been disabled"

ADMIN_SUMMARY_SUBJECT = "OPS: user account(s) automatically disabled"


def disabled_user_body(email: str) -> str:
    """Body of the email sent to a user whose own account was just disabled."""
    return (
        f"Your OPRE OPS account ({email}) has been automatically disabled due to prolonged "
        "inactivity.\n\n"
        "If you need continued access, please contact your organization's OPS User Admin to "
        "have your account reactivated."
    )


def admin_summary_body(disabled_users: list[dict]) -> str:
    """Body of the summary email sent to all active USER_ADMINs.

    ``disabled_users`` is a list of dicts with "full_name", "division", and "email" keys,
    one per user disabled in this run. "division" must be the division's display name
    (a string, e.g. "Division of Data and Improvement", or "N/A" if the user has none) --
    not the numeric Division foreign key.
    """
    lines = ["The automated inactivity check disabled the following OPS user account(s):", ""]
    for user in disabled_users:
        lines.append(f"- {user['full_name']} ({user['division']}) - {user['email']}")
    lines.append("")
    lines.append(
        "This is an automated compliance notification. No action is required unless one of "
        "these accounts should be reactivated."
    )
    return "\n".join(lines)
