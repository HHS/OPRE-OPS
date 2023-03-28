import traceback

import pytest
from models.events import OpsEventStatus, OpsEventType
from ops_api.ops.utils.events import OpsEventHandler


def test_ops_event_handler_init():
    oeh = OpsEventHandler(OpsEventType.LOGIN_ATTEMPT)
    assert oeh.metadata == {}
    assert oeh.event_type == OpsEventType.LOGIN_ATTEMPT


@pytest.mark.usefixtures("app_ctx")
def test_ops_event_handler_enter(mocker):
    mocker.patch("ops_api.ops.utils.events.request")
    oeh = OpsEventHandler(OpsEventType.LOGIN_ATTEMPT)
    oeh_enter = oeh.__enter__()
    assert isinstance(oeh_enter, OpsEventHandler)
    assert "request.json" in oeh.metadata


@pytest.mark.usefixtures("app_ctx")
def test_ops_event_handler_exit_fail(loaded_db, mocker):
    mocker.patch("ops_api.ops.utils.events.request")
    m1 = mocker.patch("ops_api.ops.utils.events.current_app")
    oeh = OpsEventHandler(OpsEventType.LOGIN_ATTEMPT)
    oeh.__exit__(Exception, Exception("blah blah"), traceback)

    event = m1.db_session.add.call_args[0][0]
    assert event.event_status == OpsEventStatus.FAILED
    assert event.event_details["error_message"] == "blah blah"
    assert event.event_details["error_type"] == "<class 'Exception'>"


@pytest.mark.usefixtures("app_ctx")
def test_ops_event_handler_exit_success(loaded_db, mocker):
    mocker.patch("ops_api.ops.utils.events.request")
    m1 = mocker.patch("ops_api.ops.utils.events.current_app")
    oeh = OpsEventHandler(OpsEventType.LOGIN_ATTEMPT)
    oeh.__exit__(None, None, None)

    event = m1.db_session.add.call_args[0][0]
    assert event.event_status == OpsEventStatus.SUCCESS
