from unittest.mock import MagicMock, patch

from data_tools.src.disable_inactive_users.disable_inactive_users import (
    create_system_user,
    deactivate_user,
    update_disabled_users_status,
)
from data_tools.src.disable_inactive_users.queries import SYSTEM_USER_EMAIL, SYSTEM_USER_ID, SYSTEM_USER_OIDC_ID

from models import OpsDBHistoryType, OpsEventStatus, OpsEventType, UserStatus

system_user_id = 111

def test_create_system_user():
    mock_se = MagicMock()
    mock_se.execute.return_value.fetchone.return_value = None

    result = create_system_user(mock_se)

    se_add = mock_se.add.call_args[0][0]
    mock_se.execute.assert_called_once()
    mock_se.add.assert_called_once()
    mock_se.commit.assert_called_once()
    assert result == SYSTEM_USER_ID
    assert se_add.id == SYSTEM_USER_ID
    assert se_add.email == SYSTEM_USER_EMAIL
    assert se_add.oidc_id == SYSTEM_USER_OIDC_ID
    assert se_add.first_name is None
    assert se_add.last_name is None


def test_return_existing_system_user():
    mock_se = MagicMock()
    mock_se.execute.return_value.fetchone.return_value = (SYSTEM_USER_ID,)

    result = create_system_user(mock_se)

    assert result == SYSTEM_USER_ID
    mock_se.add.assert_not_called()
    mock_se.commit.assert_not_called()

def test_deactivate_user():
    user_id = 1
    db_history_changes = {
        "id": {
            "new": user_id,
            "old": None
        },
        "status": {
            "new": "INACTIVE",
            "old": None
        },
        "updated_by": {
            "new": system_user_id,
            "old": None}
    }

    mock_se = MagicMock()
    mock_se.execute.return_value = [(1,), (2,)]

    deactivate_user(mock_se, user_id, system_user_id)

    assert mock_se.merge.call_count == 3
    assert mock_se.add.call_count == 2

    user_call = mock_se.merge.call_args_list[0]
    assert user_call[0][0].id == user_id
    assert user_call[0][0].status == UserStatus.INACTIVE
    assert user_call[0][0].updated_by == system_user_id

    user_session_call_1 = mock_se.merge.call_args_list[1]
    assert user_session_call_1[0][0].id == user_id
    assert user_session_call_1[0][0].is_active == False
    assert user_session_call_1[0][0].updated_by == system_user_id

    user_session_call_2 = mock_se.merge.call_args_list[1]
    assert user_session_call_2[0][0].id == user_id
    assert user_session_call_2[0][0].is_active == False
    assert user_session_call_2[0][0].updated_by == system_user_id

    ops_db_history_call = mock_se.add.call_args_list[0]
    assert ops_db_history_call[0][0].event_type == OpsDBHistoryType.UPDATED
    assert ops_db_history_call[0][0].created_by == system_user_id
    assert ops_db_history_call[0][0].class_name == 'User'
    assert ops_db_history_call[0][0].row_key == str(user_id)
    assert ops_db_history_call[0][0].changes == db_history_changes

    ops_events_call = mock_se.add.call_args_list[1]
    assert ops_events_call[0][0].event_type == OpsEventType.UPDATE_USER
    assert ops_events_call[0][0].event_status == OpsEventStatus.SUCCESS
    assert ops_events_call[0][0].created_by == system_user_id

@patch("data_tools.src.disable_inactive_users.disable_inactive_users.logger")
def test_no_inactive_users(mock_logger):
    mock_conn = MagicMock()
    mock_se = MagicMock()
    mock_se.execute.return_value.all.return_value = None
    update_disabled_users_status(mock_conn)

    mock_logger.info.assert_any_call("Checking for System User.")
    mock_logger.info.assert_any_call("Fetching inactive users.")
    mock_logger.info.assert_any_call("No inactive users found.")
