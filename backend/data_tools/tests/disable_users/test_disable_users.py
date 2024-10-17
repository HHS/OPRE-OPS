from unittest.mock import MagicMock, patch

import pytest
from data_tools.src.disable_users.disable_users import (
    create_system_admin,
    disable_user,
    get_ids_from_oidc_ids,
    update_disabled_users_status,
)
from data_tools.src.disable_users.queries import SYSTEM_ADMIN_EMAIL, SYSTEM_ADMIN_OIDC_ID

from models import OpsDBHistoryType, OpsEventStatus, OpsEventType, UserStatus

system_admin_id = 111

@pytest.fixture
def mock_session():
    """Fixture for creating a mock SQLAlchemy session."""
    session = MagicMock()
    session.execute.return_value.fetchone.return_value = None
    return session

def test_create_system_admin(mock_session):
    create_system_admin(mock_session)

    se_add = mock_session.add.call_args[0][0]
    mock_session.execute.assert_called_once()
    mock_session.add.assert_called_once()
    mock_session.commit.assert_called_once()
    assert se_add.email == SYSTEM_ADMIN_EMAIL
    assert se_add.oidc_id == SYSTEM_ADMIN_OIDC_ID
    assert se_add.first_name is None
    assert se_add.last_name is None

def test_return_existing_system_admin(mock_session):
    mock_session.execute.return_value.fetchone.return_value = (system_admin_id,)

    result = create_system_admin(mock_session)

    assert result == system_admin_id
    mock_session.add.assert_not_called()
    mock_session.commit.assert_not_called()

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
    assert mock_session.add.call_count == 2

    user_call = mock_session.merge.call_args_list[0]
    assert user_call[0][0].id == user_id
    assert user_call[0][0].status == UserStatus.INACTIVE
    assert user_call[0][0].updated_by == system_admin_id

    user_session_call_1 = mock_session.merge.call_args_list[1]
    assert user_session_call_1[0][0].id == user_id
    assert user_session_call_1[0][0].is_active is False
    assert user_session_call_1[0][0].updated_by == system_admin_id

    ops_db_history_call = mock_session.add.call_args_list[0]
    assert ops_db_history_call[0][0].event_type == OpsDBHistoryType.UPDATED
    assert ops_db_history_call[0][0].created_by == system_admin_id
    assert ops_db_history_call[0][0].class_name == 'User'
    assert ops_db_history_call[0][0].row_key == str(user_id)
    assert ops_db_history_call[0][0].changes == db_history_changes

    ops_events_call = mock_session.add.call_args_list[1]
    assert ops_events_call[0][0].event_type == OpsEventType.UPDATE_USER
    assert ops_events_call[0][0].event_status == OpsEventStatus.SUCCESS
    assert ops_events_call[0][0].created_by == system_admin_id

@patch("data_tools.src.disable_users.disable_users.logger")
def test_no_inactive_users(mock_logger, mock_session):
    mock_session.execute.return_value.all.return_value = None
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
