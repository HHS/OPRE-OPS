from datetime import datetime, timedelta
from unittest.mock import MagicMock, patch

import pytest

from data_tools.src.disable_users.disable_users import (
    disable_user,
    get_ids_from_oidc_ids,
    send_disable_notifications,
    update_disabled_users_status,
)
from models import Division, OpsEventStatus, OpsEventType, User, UserStatus

system_admin_id = 111


@pytest.fixture
def mock_session():
    """Fixture for creating a mock SQLAlchemy session."""
    session = MagicMock()
    session.execute.return_value.fetchone.return_value = None
    return session


def test_deactivate_user(mock_session):
    user_id = 1

    mock_session.execute.return_value = [(1,), (2,)]

    disable_user(mock_session, user_id, system_admin_id)

    assert mock_session.merge.call_count == 3
    assert mock_session.add.call_count == 1

    user_call = mock_session.merge.call_args_list[0]
    assert user_call[0][0].id == user_id
    assert user_call[0][0].status == UserStatus.INACTIVE
    assert user_call[0][0].updated_by == system_admin_id

    user_session_call_1 = mock_session.merge.call_args_list[1]
    assert user_session_call_1[0][0].id == user_id
    assert user_session_call_1[0][0].is_active is False
    assert user_session_call_1[0][0].updated_by == system_admin_id

    ops_events_call = mock_session.add.call_args_list[0]
    assert ops_events_call[0][0].event_type == OpsEventType.UPDATE_USER
    assert ops_events_call[0][0].event_status == OpsEventStatus.SUCCESS
    assert ops_events_call[0][0].created_by == system_admin_id


@patch("data_tools.src.disable_users.disable_users.logger")
def test_no_inactive_users(mock_logger, mock_session, mocker):
    mocker.patch(
        "data_tools.src.disable_users.disable_users.get_or_create_sys_user", return_value=User(id=system_admin_id)
    )
    mocker.patch("data_tools.src.disable_users.disable_users.get_latest_user_session", return_value=[])
    mocker.patch("data_tools.src.disable_users.disable_users.setup_triggers")
    mock_send_disable_notifications = mocker.patch(
        "data_tools.src.disable_users.disable_users.send_disable_notifications"
    )

    update_disabled_users_status(mock_session, MagicMock())

    mock_logger.info.assert_any_call("Checking for System User.")
    mock_logger.info.assert_any_call("Fetching inactive users.")
    mock_logger.info.assert_any_call("No inactive users found.")
    mock_send_disable_notifications.assert_not_called()


def test_valid_oidc_ids(mock_session):
    mock_session.execute.return_value.scalar.side_effect = [1, 2, None]  # Mock responses for OIDC IDs

    oidc_ids = ["oidc_1", "oidc_2", "oidc_3"]
    expected_ids = [1, 2]

    result = get_ids_from_oidc_ids(mock_session, oidc_ids)
    assert result == expected_ids

    empty_result = get_ids_from_oidc_ids(mock_session, [])
    assert empty_result == []


def test_invalid_oidc_id_type(mock_session):
    oidc_ids = ["valid_oidc", 123, "another_valid_oidc"]

    with pytest.raises(ValueError) as context:
        get_ids_from_oidc_ids(mock_session, oidc_ids)

    assert str(context.value) == "All oidc_ids must be strings."


def _make_stale_user(user_id, email):
    return MagicMock(
        id=user_id,
        email=email,
        full_name="First Last",
        division=None,
        status=UserStatus.ACTIVE,
        updated_on=datetime.now() - timedelta(days=61),
    )


def _session_returning(mock_session):
    """Patch Session(conn) so `with Session(conn) as se:` inside the function under test yields
    mock_session directly, instead of wrapping conn in a real (unconfigurable) Session."""
    cm = MagicMock()
    cm.__enter__.return_value = mock_session
    cm.__exit__.return_value = False
    return cm


def _execute_results(*results):
    """Build a `mock_session.execute.side_effect` list, one MagicMock per expected `se.execute(...)`
    call, each pre-wired so `.scalars().all()` returns the corresponding `results` entry. Needed
    because `update_disabled_users_status` now issues two distinct `select(...).scalars().all()`
    queries (users, then divisions) against the same mock session -- a single configured return
    value would make both resolve to the same (wrong) result."""
    mocks = []
    for result in results:
        result_mock = MagicMock()
        result_mock.scalars.return_value.all.return_value = result
        mocks.append(result_mock)
    return mocks


def test_disables_users_then_calls_send_disable_notifications(mock_session, mocker):
    stale_user = _make_stale_user(1, "stale.user@example.gov")
    mocker.patch("data_tools.src.disable_users.disable_users.Session", return_value=_session_returning(mock_session))
    mocker.patch(
        "data_tools.src.disable_users.disable_users.get_or_create_sys_user", return_value=User(id=system_admin_id)
    )
    mocker.patch("data_tools.src.disable_users.disable_users.setup_triggers")
    mocker.patch("data_tools.src.disable_users.disable_users.get_latest_user_session", return_value=None)
    mocker.patch("data_tools.src.disable_users.disable_users.get_ids_from_oidc_ids", return_value=[])
    mock_session.execute.side_effect = _execute_results([stale_user], [])

    call_order = []
    mock_admin = MagicMock(email="admin@example.gov")

    def _record_get_admins(*args, **kwargs):
        call_order.append("get_active_user_admins")
        return [mock_admin]

    def _record_disable_user(*args, **kwargs):
        call_order.append("disable_user")

    mocker.patch("data_tools.src.disable_users.disable_users.get_active_user_admins", side_effect=_record_get_admins)
    mock_disable_user = mocker.patch(
        "data_tools.src.disable_users.disable_users.disable_user", side_effect=_record_disable_user
    )
    mock_send_disable_notifications = mocker.patch(
        "data_tools.src.disable_users.disable_users.send_disable_notifications"
    )
    mock_config = MagicMock()

    update_disabled_users_status(mock_session, mock_config)

    mock_disable_user.assert_called_once_with(mock_session, 1, system_admin_id)
    mock_session.commit.assert_called_once()
    mock_send_disable_notifications.assert_called_once_with(
        mock_config,
        [{"email": "stale.user@example.gov", "full_name": "First Last", "division": "N/A"}],
        ["admin@example.gov"],
    )
    assert call_order == ["get_active_user_admins", "disable_user"]


def test_disables_users_then_calls_send_disable_notifications_keeps_stale_admin_in_recipients(mock_session, mocker):
    stale_admin = _make_stale_user(1, "stale.admin@example.gov")
    mocker.patch("data_tools.src.disable_users.disable_users.Session", return_value=_session_returning(mock_session))
    mocker.patch(
        "data_tools.src.disable_users.disable_users.get_or_create_sys_user", return_value=User(id=system_admin_id)
    )
    mocker.patch("data_tools.src.disable_users.disable_users.setup_triggers")
    mocker.patch("data_tools.src.disable_users.disable_users.get_latest_user_session", return_value=None)
    mocker.patch("data_tools.src.disable_users.disable_users.get_ids_from_oidc_ids", return_value=[])
    mock_session.execute.side_effect = _execute_results([stale_admin], [])
    # This admin is themselves stale and about to be disabled in this same run -- because
    # get_active_user_admins is snapshotted before the disable loop, their own email must still
    # reach the admin recipient list passed to send_disable_notifications.
    mocker.patch(
        "data_tools.src.disable_users.disable_users.get_active_user_admins",
        return_value=[MagicMock(email="stale.admin@example.gov")],
    )
    mocker.patch("data_tools.src.disable_users.disable_users.disable_user")
    mock_send_disable_notifications = mocker.patch(
        "data_tools.src.disable_users.disable_users.send_disable_notifications"
    )

    update_disabled_users_status(mock_session, MagicMock())

    admin_emails_arg = mock_send_disable_notifications.call_args[0][2]
    assert "stale.admin@example.gov" in admin_emails_arg


def test_update_disabled_users_status_resolves_division_names_before_notifying(loaded_db, mocker):
    division = Division(name="Test Division Alpha", abbreviation="TDA")
    loaded_db.add(division)
    loaded_db.flush()  # assign division.id so it can be set on the users below at construction time

    stale_user_with_division = User(
        email="stale.user@example.gov",
        first_name="Stale",
        last_name="User",
        status=UserStatus.ACTIVE,
        division=division.id,
        updated_on=datetime.now() - timedelta(days=61),
    )
    stale_user_without_name_or_division = User(
        email="no.division.user@example.gov",
        status=UserStatus.ACTIVE,
        updated_on=datetime.now() - timedelta(days=61),
    )
    loaded_db.add_all([stale_user_with_division, stale_user_without_name_or_division])
    loaded_db.commit()

    mocker.patch("data_tools.src.disable_users.disable_users.Session", return_value=_session_returning(loaded_db))
    # setup_triggers attaches a handle_error listener that SQLAlchemy 2.0 only permits on an
    # Engine/Dialect, not a Connection -- loaded_db's session is bound to a Connection, and its
    # own fixture already wires up equivalent before_commit/after_flush history tracking, so this
    # call is both incompatible and redundant in this test context.
    mocker.patch("data_tools.src.disable_users.disable_users.setup_triggers")
    mock_send_disable_notifications = mocker.patch(
        "data_tools.src.disable_users.disable_users.send_disable_notifications"
    )

    update_disabled_users_status(loaded_db, MagicMock())

    disabled_user_details = mock_send_disable_notifications.call_args[0][1]
    assert {
        "email": "stale.user@example.gov",
        "full_name": "Stale User",
        "division": "Test Division Alpha",
    } in disabled_user_details
    assert {
        "email": "no.division.user@example.gov",
        "full_name": "N/A",
        "division": "N/A",
    } in disabled_user_details


@patch("data_tools.src.disable_users.disable_users.logger")
def test_send_disable_notifications_noop_when_acs_not_configured(mock_logger, mocker):
    mock_email_client_cls = mocker.patch("data_tools.src.disable_users.disable_users.EmailClient")
    mock_send_disabled_user_email = mocker.patch("data_tools.src.disable_users.disable_users.send_disabled_user_email")
    mock_send_admin_summary_email = mocker.patch("data_tools.src.disable_users.disable_users.send_admin_summary_email")
    mock_config = MagicMock(acs_connection_string=None, email_sender_address=None)
    disabled_user_details = [{"email": "stale.user@example.gov", "full_name": "Stale User", "division": "N/A"}]

    send_disable_notifications(mock_config, disabled_user_details, ["admin@example.gov"])

    mock_send_disabled_user_email.assert_not_called()
    mock_send_admin_summary_email.assert_not_called()
    mock_email_client_cls.from_connection_string.assert_not_called()
    mock_logger.warning.assert_called_once()


def test_send_disable_notifications_skips_admin_summary_when_no_active_admins(mocker):
    mocker.patch("data_tools.src.disable_users.disable_users.EmailClient")
    mock_send_disabled_user_email = mocker.patch("data_tools.src.disable_users.disable_users.send_disabled_user_email")
    mock_send_admin_summary_email = mocker.patch("data_tools.src.disable_users.disable_users.send_admin_summary_email")
    mock_config = MagicMock(
        acs_connection_string="fake-connection-string", email_sender_address="DoNotReply@example.com"
    )
    disabled_user_details = [{"email": "stale.user@example.gov", "full_name": "Stale User", "division": "N/A"}]

    send_disable_notifications(mock_config, disabled_user_details, [])

    mock_send_disabled_user_email.assert_called_once()
    mock_send_admin_summary_email.assert_not_called()


def test_send_disable_notifications_sends_admin_summary_before_individual_emails(mocker):
    call_order = []
    mock_send_admin_summary_email = mocker.patch(
        "data_tools.src.disable_users.disable_users.send_admin_summary_email",
        side_effect=lambda *args, **kwargs: call_order.append("admin_summary"),
    )
    mocker.patch(
        "data_tools.src.disable_users.disable_users.send_disabled_user_email",
        side_effect=lambda *args, **kwargs: call_order.append("user_email"),
    )
    mock_email_client_cls = mocker.patch("data_tools.src.disable_users.disable_users.EmailClient")
    mock_email_client = mock_email_client_cls.from_connection_string.return_value
    mock_config = MagicMock(
        acs_connection_string="fake-connection-string", email_sender_address="DoNotReply@example.com"
    )
    disabled_user_details = [
        {"email": "a@example.gov", "full_name": "A", "division": "N/A"},
        {"email": "b@example.gov", "full_name": "B", "division": "N/A"},
    ]
    admin_emails = ["admin@example.gov"]

    send_disable_notifications(mock_config, disabled_user_details, admin_emails)

    assert call_order == ["admin_summary", "user_email", "user_email"]
    # disabled_user_details is passed straight through to send_admin_summary_email untransformed
    # -- that hand-off is the whole point of removing the intermediate summary_rows/Session step.
    mock_send_admin_summary_email.assert_called_once_with(
        mock_email_client, "DoNotReply@example.com", admin_emails, disabled_user_details
    )


def test_send_disable_notifications_continues_to_individual_emails_after_admin_summary_fails(mocker):
    mocker.patch("data_tools.src.disable_users.disable_users.EmailClient")
    mocker.patch(
        "data_tools.src.disable_users.disable_users.send_admin_summary_email",
        side_effect=Exception("ACS rejected admin recipient"),
    )
    mock_send_disabled_user_email = mocker.patch("data_tools.src.disable_users.disable_users.send_disabled_user_email")
    mock_config = MagicMock(
        acs_connection_string="fake-connection-string", email_sender_address="DoNotReply@example.com"
    )
    disabled_user_details = [
        {"email": "a@example.gov", "full_name": "A", "division": "N/A"},
        {"email": "b@example.gov", "full_name": "B", "division": "N/A"},
    ]

    with pytest.raises(RuntimeError, match="admin summary"):
        send_disable_notifications(mock_config, disabled_user_details, ["admin@example.gov"])

    assert mock_send_disabled_user_email.call_count == 2


def test_send_disable_notifications_continues_after_one_individual_send_fails_then_raises(mocker):
    mocker.patch("data_tools.src.disable_users.disable_users.EmailClient")
    mocker.patch("data_tools.src.disable_users.disable_users.send_admin_summary_email")
    mock_send_disabled_user_email = mocker.patch(
        "data_tools.src.disable_users.disable_users.send_disabled_user_email",
        side_effect=[Exception("ACS rejected recipient"), None],
    )
    mock_config = MagicMock(
        acs_connection_string="fake-connection-string", email_sender_address="DoNotReply@example.com"
    )
    disabled_user_details = [
        {"email": "a@example.gov", "full_name": "A", "division": "N/A"},
        {"email": "b@example.gov", "full_name": "B", "division": "N/A"},
    ]

    with pytest.raises(RuntimeError, match="a@example.gov"):
        send_disable_notifications(mock_config, disabled_user_details, ["admin@example.gov"])

    assert mock_send_disabled_user_email.call_count == 2
