import pytest
from sqlalchemy.orm import Session

from models import OpsEvent, OpsEventType
from ops_api.ops.services.message_bus import MessageBus
from ops_api.ops.utils.events import OpsEventHandler


@pytest.mark.usefixtures("app_ctx")
def test_message_bus_subscriptions(loaded_db, mocker):
    mock_callback_1 = mocker.MagicMock()
    mock_callback_2 = mocker.MagicMock()
    mock_callback_3 = mocker.MagicMock()

    message_bus = MessageBus()
    message_bus.subscribe(OpsEventType.CREATE_NEW_CAN.name, mock_callback_1)
    message_bus.subscribe(OpsEventType.CREATE_NEW_CAN.name, mock_callback_2)
    message_bus.subscribe(OpsEventType.CREATE_NEW_CAN.name, mock_callback_3)

    # patch the request object
    r_patch = mocker.patch("ops_api.ops.utils.events.request")
    r_patch.message_bus = message_bus

    oeh = OpsEventHandler(OpsEventType.CREATE_NEW_CAN)
    oeh.__exit__(None, None, None)

    assert mock_callback_1.call_count == 1
    assert mock_callback_2.call_count == 1
    assert mock_callback_3.call_count == 1


@pytest.mark.usefixtures("app_ctx")
def test_message_bus_db_session(loaded_db, mocker):
    def callback_1(event: OpsEvent, session: Session):
        assert event.event_type == OpsEventType.CREATE_NEW_CAN
        assert session is not None

    message_bus = MessageBus()
    message_bus.subscribe(OpsEventType.CREATE_NEW_CAN.name, callback_1)

    # patch the request object
    r_patch = mocker.patch("ops_api.ops.utils.events.request")
    r_patch.message_bus = message_bus

    oeh = OpsEventHandler(OpsEventType.CREATE_NEW_CAN)
    oeh.__exit__(None, None, None)
