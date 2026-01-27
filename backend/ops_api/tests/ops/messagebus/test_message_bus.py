import pytest
from blinker import signal

from models import OpsEvent, OpsEventType
from ops_api.ops.services.message_bus import MessageBus
from ops_api.ops.utils.events import OpsEventHandler


@pytest.fixture(autouse=True)
def cleanup_signals():
    """Clean up all Blinker signals before and after each test to prevent cross-test contamination."""
    # Clean up before test
    for event_type in OpsEventType:
        ops_signal = signal(event_type.name)
        ops_signal.receivers.clear()

    yield

    # Clean up after test
    for event_type in OpsEventType:
        ops_signal = signal(event_type.name)
        ops_signal.receivers.clear()


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

    # Cleanup to avoid affecting other tests
    message_bus.cleanup()


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

    # Cleanup to avoid affecting other tests
    message_bus.cleanup()


def test_message_bus_error_isolation(loaded_db, mocker, app_ctx):
    """Test that one failing subscriber doesn't prevent others from running."""
    mock_callback_1 = mocker.MagicMock()
    mock_callback_2 = mocker.MagicMock(side_effect=Exception("Subscriber 2 failed"))
    mock_callback_3 = mocker.MagicMock()

    message_bus = MessageBus()
    message_bus.subscribe(OpsEventType.CREATE_NEW_CAN, mock_callback_1)
    message_bus.subscribe(OpsEventType.CREATE_NEW_CAN, mock_callback_2)
    message_bus.subscribe(OpsEventType.CREATE_NEW_CAN, mock_callback_3)

    message_bus.publish(OpsEventType.CREATE_NEW_CAN, OpsEvent(event_type=OpsEventType.CREATE_NEW_CAN))

    # Should not raise exception
    message_bus.handle()

    # All callbacks should be attempted, even though callback_2 failed
    mock_callback_1.assert_called_once()
    mock_callback_2.assert_called_once()
    mock_callback_3.assert_called_once()

    # Cleanup to avoid affecting other tests
    message_bus.cleanup()


def test_message_bus_resubscribing_same_callback_is_idempotent(loaded_db, mocker, app_ctx):
    """Test that cleanup properly disconnects signals to prevent duplicate execution."""
    mock_callback = mocker.MagicMock()

    # First request cycle
    message_bus_1 = MessageBus()
    message_bus_1.subscribe(OpsEventType.CREATE_NEW_CAN, mock_callback)
    message_bus_1.publish(OpsEventType.CREATE_NEW_CAN, OpsEvent(event_type=OpsEventType.CREATE_NEW_CAN))
    message_bus_1.handle()
    message_bus_1.cleanup()

    # Second request cycle with same callback
    message_bus_2 = MessageBus()
    message_bus_2.subscribe(OpsEventType.CREATE_NEW_CAN, mock_callback)
    message_bus_2.publish(OpsEventType.CREATE_NEW_CAN, OpsEvent(event_type=OpsEventType.CREATE_NEW_CAN))
    message_bus_2.handle()
    message_bus_2.cleanup()

    # Callback should only be called twice total (once per request), not three times
    assert mock_callback.call_count == 2


def test_message_bus_multiple_event_types(loaded_db, mocker, app_ctx):
    """Test handling multiple different event types in same message bus."""
    mock_can_callback = mocker.MagicMock()
    mock_agreement_callback = mocker.MagicMock()

    message_bus = MessageBus()
    message_bus.subscribe(OpsEventType.CREATE_NEW_CAN, mock_can_callback)
    message_bus.subscribe(OpsEventType.CREATE_NEW_AGREEMENT, mock_agreement_callback)

    message_bus.publish(OpsEventType.CREATE_NEW_CAN, OpsEvent(event_type=OpsEventType.CREATE_NEW_CAN))
    message_bus.publish(OpsEventType.CREATE_NEW_AGREEMENT, OpsEvent(event_type=OpsEventType.CREATE_NEW_AGREEMENT))

    message_bus.handle()

    # Each callback should only be called for its event type
    mock_can_callback.assert_called_once()
    mock_agreement_callback.assert_called_once()

    # Cleanup to avoid affecting other tests
    message_bus.cleanup()


def test_message_bus_logs_subscriber_exceptions(loaded_db, mocker, app_ctx):
    """Test that subscriber exceptions are properly logged with details."""
    mock_callback = mocker.MagicMock(side_effect=ValueError("Test error message"))
    mock_logger = mocker.patch("ops_api.ops.services.message_bus.logger")

    message_bus = MessageBus()
    message_bus.subscribe(OpsEventType.CREATE_NEW_CAN, mock_callback)
    message_bus.publish(OpsEventType.CREATE_NEW_CAN, OpsEvent(event_type=OpsEventType.CREATE_NEW_CAN))

    message_bus.handle()

    # Verify error was logged
    mock_logger.error.assert_called()
    error_log_call = mock_logger.error.call_args
    assert "CREATE_NEW_CAN" in str(error_log_call)
    assert "Test error message" in str(error_log_call)

    # Cleanup to avoid affecting other tests
    message_bus.cleanup()


def test_message_bus_cleanup_clears_lists_but_keeps_signals(loaded_db, mocker, app_ctx):
    """Test that cleanup clears tracking lists but leaves signals connected.

    Blinker signals are process-level, not request-level, so they should remain
    connected across requests. Cleanup only clears the published_events and
    known_callbacks lists.
    """
    mock_callback_1 = mocker.MagicMock()
    mock_callback_2 = mocker.MagicMock()

    message_bus = MessageBus()
    message_bus.subscribe(OpsEventType.CREATE_NEW_CAN, mock_callback_1)
    message_bus.subscribe(OpsEventType.UPDATE_CAN, mock_callback_2)

    message_bus.cleanup()

    # Verify tracking lists are cleared
    assert len(message_bus.known_callbacks) == 0
    assert len(message_bus.published_events) == 0

    # Verify signals are still connected by publishing an event
    # and confirming the callback is still invoked
    message_bus_2 = MessageBus()
    message_bus_2.publish(OpsEventType.CREATE_NEW_CAN, OpsEvent(event_type=OpsEventType.CREATE_NEW_CAN))
    message_bus_2.handle()

    # Callback should still be called because signal connection persists
    mock_callback_1.assert_called()
