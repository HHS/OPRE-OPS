from models import OpsEvent, OpsEventType
from ops_api.ops.services.message_bus import MessageBus
from ops_api.ops.utils.events import OpsEventHandler


def test_message_bus_handle(loaded_db, mocker, app_ctx):
    mock_callback_1 = mocker.MagicMock()
    mock_callback_2 = mocker.MagicMock()
    mock_callback_3 = mocker.MagicMock()

    message_bus = MessageBus()
    message_bus.subscribe(OpsEventType.CREATE_NEW_CAN, mock_callback_1)
    message_bus.subscribe(OpsEventType.CREATE_NEW_CAN, mock_callback_2)
    message_bus.subscribe(OpsEventType.CREATE_NEW_CAN, mock_callback_3)

    message_bus.publish(OpsEventType.CREATE_NEW_CAN, OpsEvent(event_type=OpsEventType.CREATE_NEW_CAN))

    message_bus.handle()

    mock_callback_1.assert_called()
    mock_callback_2.assert_called()
    mock_callback_3.assert_called()


def test_message_bus_create_cans(loaded_db, mocker, app_ctx):
    mock_callback_1 = mocker.MagicMock()
    mock_callback_2 = mocker.MagicMock()
    mock_callback_3 = mocker.MagicMock()

    message_bus = MessageBus()

    # patch the request object
    r_patch = mocker.patch("ops_api.ops.utils.events.request")
    r_patch.message_bus = message_bus
    r_patch.message_bus.subscribe(OpsEventType.CREATE_NEW_CAN, mock_callback_1)
    r_patch.message_bus.subscribe(OpsEventType.CREATE_NEW_CAN, mock_callback_2)
    r_patch.message_bus.subscribe(OpsEventType.CREATE_NEW_CAN, mock_callback_3)

    oeh = OpsEventHandler(OpsEventType.CREATE_NEW_CAN)
    oeh.__exit__(None, None, None)

    message_bus.handle()

    mock_callback_1.assert_called()
    mock_callback_2.assert_called()
    mock_callback_3.assert_called()
