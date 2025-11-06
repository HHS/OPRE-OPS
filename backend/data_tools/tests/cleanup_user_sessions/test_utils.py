from datetime import datetime, timedelta
from unittest.mock import MagicMock, patch

import pytest
from sqlalchemy.orm import Session

from data_tools.src.cleanup_user_sessions.utils import parse_cutoff_days
from models import OpsEventStatus, OpsEventType, UserSession


@pytest.fixture
def mock_user_session():
    """Mock UserSession."""
    session = MagicMock(spec=UserSession)
    session.id = 123
    session.user_id = 456
    session.is_active = False
    session.last_active_at = datetime.now() - timedelta(days=31)
    return session


@pytest.fixture
def mock_session():
    """Mock SQLAlchemy session."""
    return MagicMock(spec=Session)


@patch("data_tools.src.cleanup_user_sessions.utils.get_or_create_sys_user")
@patch("data_tools.src.cleanup_user_sessions.utils.setup_triggers")
def test_get_system_admin_id_existing_user(mock_setup_triggers, mock_get_sys_user, mock_session):
    # Simulate system admin with id already assigned
    mock_user = MagicMock()
    mock_user.id = 999
    mock_get_sys_user.return_value = mock_user

    from data_tools.src.cleanup_user_sessions.utils import get_system_admin_id

    system_admin_id = get_system_admin_id(mock_session)

    assert system_admin_id == 999
    mock_get_sys_user.assert_called_once_with(mock_session)
    mock_setup_triggers.assert_called_once_with(mock_session, mock_user)
    mock_session.commit.assert_called()


@patch("data_tools.src.cleanup_user_sessions.utils.get_or_create_sys_user")
@patch("data_tools.src.cleanup_user_sessions.utils.setup_triggers")
def test_get_system_admin_id_new_user(mock_setup_triggers, mock_get_sys_user, mock_session):
    # Simulate new system admin with no ID, requiring add + commit
    mock_user = MagicMock()
    mock_user.id = None
    mock_get_sys_user.return_value = mock_user

    from data_tools.src.cleanup_user_sessions.utils import get_system_admin_id

    system_admin_id = get_system_admin_id(mock_session)

    assert system_admin_id is None or isinstance(system_admin_id, int)
    mock_session.add.assert_called_once_with(mock_user)
    mock_session.commit.assert_called()
    mock_setup_triggers.assert_called_once_with(mock_session, mock_user)


def test_fetch_sessions_to_delete_returns_correct_sessions(mock_session, mock_user_session):
    from data_tools.src.cleanup_user_sessions.utils import fetch_sessions_to_delete

    # Prepare mock query result
    mock_session.execute.return_value.scalars.return_value.all.return_value = [mock_user_session]

    cutoff = datetime.now() - timedelta(days=30)
    sessions = fetch_sessions_to_delete(mock_session, cutoff)

    assert sessions == [mock_user_session]
    # Assert query built with UserSession.is_active == False or last_active_at < cutoff
    mock_session.execute.assert_called()
    called_stmt = mock_session.execute.call_args[0][0]
    assert "user_session" in str(called_stmt)  # crude check that the model/table is in the query


@patch("data_tools.src.cleanup_user_sessions.utils.logger")
def test_log_summary_logs_correctly(mock_logger, mock_user_session):
    from data_tools.src.cleanup_user_sessions.utils import log_summary
    cutoff = datetime.now() - timedelta(days=30)

    # Test with no sessions
    log_summary([], cutoff)
    mock_logger.info.assert_any_call(f"No inactive or old sessions found; nothing to delete. Cutoff date: {cutoff.isoformat()}")

    # Test with <=5 sessions
    log_summary([mock_user_session], cutoff)
    mock_logger.info.assert_any_call(f"Found 1 session(s) eligible for deletion.")
    mock_logger.info.assert_any_call(f"Cutoff date: {cutoff.isoformat()}")
    mock_logger.info.assert_any_call(
        f"Sample Session → id={mock_user_session.id}, user_id={mock_user_session.user_id}, "
        f"is_active={mock_user_session.is_active}, last_active_at={mock_user_session.last_active_at}"
    )

    # Test with >5 sessions
    sessions = [mock_user_session] * 7
    mock_logger.reset_mock()
    log_summary(sessions, cutoff)
    mock_logger.info.assert_any_call(f"...and 2 more sessions omitted from logs.")


@patch("data_tools.src.cleanup_user_sessions.utils.logger")
def test_delete_sessions_calls_delete_and_commit(mock_logger, mock_session, mock_user_session):
    from data_tools.src.cleanup_user_sessions.utils import delete_sessions

    sessions = [mock_user_session] * 3
    system_admin_id = 999

    with patch("data_tools.src.cleanup_user_sessions.utils.delete_session_and_log_event") as mock_delete_event:
        delete_sessions(mock_session, sessions, system_admin_id)

    assert mock_delete_event.call_count == 3
    mock_session.commit.assert_called_once()
    mock_logger.info.assert_called_with("Successfully deleted 3 user sessions.")


def test_delete_session_and_log_event_calls_delete_and_add(mock_session, mock_user_session):
    from data_tools.src.cleanup_user_sessions.utils import delete_session_and_log_event

    system_admin_id = 999
    delete_session_and_log_event(mock_session, mock_user_session, system_admin_id)

    mock_session.delete.assert_called_once_with(mock_user_session)
    added_event = mock_session.add.call_args[0][0]

    assert added_event.event_type == OpsEventType.DELETE_USER_SESSION
    assert added_event.event_status == OpsEventStatus.SUCCESS
    assert added_event.created_by == system_admin_id
    assert added_event.event_details["id"] == mock_user_session.id
    assert added_event.event_details["user_id"] == mock_user_session.user_id
    assert "automated process" in added_event.event_details["message"]


@patch("data_tools.src.cleanup_user_sessions.utils.get_system_admin_id")
@patch("data_tools.src.cleanup_user_sessions.utils.fetch_sessions_to_delete")
@patch("data_tools.src.cleanup_user_sessions.utils.log_summary")
@patch("data_tools.src.cleanup_user_sessions.utils.delete_sessions")
@patch("data_tools.src.cleanup_user_sessions.utils.Session")
@patch("data_tools.src.cleanup_user_sessions.utils.logger")
def test_cleanup_user_sessions_full_flow(
    mock_logger, mock_session_cls, mock_delete_sessions, mock_log_summary,
    mock_fetch_sessions, mock_get_admin_id, mock_user_session
):
    # Setup mocks
    mock_get_admin_id.return_value = 999
    mock_fetch_sessions.return_value = [mock_user_session]
    mock_se_instance = MagicMock()
    mock_session_cls.return_value.__enter__.return_value = mock_se_instance

    from data_tools.src.cleanup_user_sessions.utils import cleanup_user_sessions

    cleanup_user_sessions(conn=mock_session_cls, days="90")

    mock_logger.info.assert_any_call("Checking for System User...")
    mock_logger.info.assert_any_call("Fetching user sessions for cleanup...")
    mock_log_summary.assert_called_once()
    mock_delete_sessions.assert_called_once_with(mock_se_instance, [mock_user_session], 999)


@patch("data_tools.src.cleanup_user_sessions.utils.get_system_admin_id")
@patch("data_tools.src.cleanup_user_sessions.utils.fetch_sessions_to_delete")
@patch("data_tools.src.cleanup_user_sessions.utils.log_summary")
@patch("data_tools.src.cleanup_user_sessions.utils.delete_sessions")
@patch("data_tools.src.cleanup_user_sessions.utils.Session")
@patch("data_tools.src.cleanup_user_sessions.utils.logger")
def test_cleanup_user_sessions_no_sessions(
    mock_logger, mock_session_cls, mock_delete_sessions, mock_log_summary,
    mock_fetch_sessions, mock_get_admin_id
):
    mock_get_admin_id.return_value = 999
    mock_fetch_sessions.return_value = []

    mock_se_instance = MagicMock()
    mock_session_cls.return_value.__enter__.return_value = mock_se_instance

    from data_tools.src.cleanup_user_sessions.utils import cleanup_user_sessions
    cleanup_user_sessions(conn=mock_session_cls, days="90")

    mock_logger.info.assert_any_call("Checking for System User...")
    mock_logger.info.assert_any_call("Fetching user sessions for cleanup...")
    mock_log_summary.assert_called_once()
    mock_delete_sessions.assert_not_called()


def test_parse_cutoff_days_valid_int_string():
    assert parse_cutoff_days("30") == 30
    assert parse_cutoff_days("0") == 0
    assert parse_cutoff_days("100") == 100


def test_parse_cutoff_days_already_int():
    # Should still return the integer
    assert parse_cutoff_days(45) == 45


@pytest.mark.parametrize("invalid_value", ["abc", "12.5", "", None, [], {}])
def test_parse_cutoff_days_invalid_raises_value_error(invalid_value):
    with pytest.raises(ValueError) as exc:
        parse_cutoff_days(invalid_value)
    assert "Invalid CLEANUP_USER_SESSIONS_CUTOFF_DAYS value" in str(exc.value)
