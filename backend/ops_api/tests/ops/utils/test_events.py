import traceback

from models.events import OpsEventStatus, OpsEventType
from models.utils import generate_events_update
from ops_api.ops.utils.events import OpsEventHandler


def test_ops_event_handler_init():
    oeh = OpsEventHandler(OpsEventType.LOGIN_ATTEMPT)
    assert oeh.metadata == {}
    assert oeh.event_type == OpsEventType.LOGIN_ATTEMPT


def test_ops_event_handler_enter(mocker, app_ctx):
    mocker.patch("ops_api.ops.utils.events.request")
    oeh = OpsEventHandler(OpsEventType.LOGIN_ATTEMPT)
    oeh_enter = oeh.__enter__()
    assert isinstance(oeh_enter, OpsEventHandler)
    assert "request.json" in oeh.metadata


def test_ops_event_handler_exit_fail(loaded_db, mocker, app_ctx):
    mocker.patch("ops_api.ops.utils.events.request")
    mock_cm = mocker.patch("ops_api.ops.utils.events.Session")
    mock_session = mocker.MagicMock()
    mock_cm.return_value.__enter__.return_value = mock_session

    oeh = OpsEventHandler(OpsEventType.LOGIN_ATTEMPT)
    oeh.__exit__(Exception, Exception("blah blah"), traceback)

    event = mock_session.add.call_args[0][0]
    assert event.event_status == OpsEventStatus.FAILED
    assert event.event_details["error_message"] == "blah blah"
    assert event.event_details["error_type"] == "<class 'Exception'>"


def test_ops_event_handler_exit_success(loaded_db, mocker, app_ctx):
    # setup mocks
    mocker.patch("ops_api.ops.utils.events.request")
    mock_cm = mocker.patch("ops_api.ops.utils.events.Session")
    mock_session = mocker.MagicMock()
    mock_cm.return_value.__enter__.return_value = mock_session

    oeh = OpsEventHandler(OpsEventType.LOGIN_ATTEMPT)
    oeh.__exit__(None, None, None)

    event = mock_session.add.call_args[0][0]
    assert event.event_status == OpsEventStatus.SUCCESS


def test_generate_events_update_no_updates(loaded_db, app_ctx):
    """Test that when there are no changes between the old and new funding budget"""
    can_id = 500
    user_id = 516
    can_funding_budget = {"can_id": can_id, "budget": 100000}
    same_funding_budget = {"can_id": can_id, "budget": 100000}
    events_update = generate_events_update(can_funding_budget, same_funding_budget, can_id, user_id)
    # the empty list evaluates to false, so we are asserting changes should be empty
    assert not events_update["changes"]
    assert events_update["updated_by"] == user_id
    assert events_update["owner_id"] == can_id
