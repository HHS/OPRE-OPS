from unittest.mock import MagicMock, patch

import pytest
from data_tools.src.disable_users.disable_users import disable_user, get_ids_from_oidc_ids, update_disabled_users_status

from models import OpsEventStatus, OpsEventType, User, UserStatus

system_admin_id = 111

@pytest.fixture
def mock_session():
    """Fixture for creating a mock SQLAlchemy session."""
    session = MagicMock()
    session.execute.return_value.fetchone.return_value = None
    return session

def test_deactivate_user(mock_session):
    user_id = 1
    db_history_changes = {
        "id": {"new": user_id, "old": None},
        "status": {"new": "INACTIVE", "old": None},
        "updated_by": {"new": system_admin_id, "old": None}
    }

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
    mocker.patch("data_tools.src.disable_users.disable_users.get_or_create_sys_user", return_value=User(id=system_admin_id))
    mocker.patch("data_tools.src.disable_users.disable_users.get_latest_user_session", return_value=[])
    mocker.patch("data_tools.src.disable_users.disable_users.setup_triggers")

    update_disabled_users_status(mock_session)

    mock_logger.info.assert_any_call("Checking for System User.")
    mock_logger.info.assert_any_call("Fetching inactive users.")
    mock_logger.info.assert_any_call("No inactive users found.")

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
