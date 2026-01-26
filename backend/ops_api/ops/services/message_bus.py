from typing import List

from blinker import signal
from flask import current_app
from loguru import logger

from models import OpsEvent, OpsEventType
from ops_api.ops.services.subscriber_protocol import MessageBusSubscriber


class MessageBus:
    """
    A simple message bus implementation that allows for publishing and subscribing to events.

    This message bus implementation uses the Blinker library to handle event signals.

    This message bus assumes it exists in a single thread and is meant to be used within the context of a single request.

    Published events are stored in a list and are handled when the handle method is called (usually at the end of a request).
    """

    def __init__(self):
        """Initialize instance variables to avoid sharing state between requests."""
        self.published_events: List[OpsEvent] = []
        self.known_callbacks = []

    def handle(self) -> None:
        """
        Handle all published events by calling the appropriate handlers for each event type.

        Manually calls each subscriber with error handling to ensure all subscribers are called
        even if some fail. Errors in individual subscribers are caught and logged but do not
        prevent other subscribers from running. This ensures system resilience.
        """
        for event in self.published_events:
            ops_signal = signal(event.event_type.name)

            # Manually iterate through receivers to ensure error isolation
            # This ensures all subscribers are called even if some raise exceptions
            # Blinker's receivers_for returns actual receiver functions
            for receiver in ops_signal.receivers_for(event):
                try:
                    receiver(event, session=current_app.db_session)
                    logger.debug(f"Successfully called subscriber {receiver} for event {event}")
                except Exception as e:
                    logger.error(
                        f"Error in subscriber {receiver} for event {event.event_type.name} (id={event.id}): {e}",
                        exc_info=True,
                    )
                    # Continue processing other subscribers despite this failure

        self.published_events.clear()

    @classmethod
    def subscribe_globally(cls, event_type: OpsEventType, callback: MessageBusSubscriber):
        """
        Subscribe to an event type globally (process-level) with a callback function.

        This method is used for one-time subscription setup during app initialization.
        Subscriptions persist across all requests.

        :param event_type: The event type to subscribe to.
        :param callback: The callback function to call when the event is published.
                        Must follow the MessageBusSubscriber protocol (accept event and session).
        """
        logger.debug(f"Globally subscribing to {event_type} with callback {callback}")
        ops_signal = signal(event_type.name)
        ops_signal.connect(callback)

    def subscribe(self, event_type: OpsEventType, callback: MessageBusSubscriber):
        """
        Subscribe to an event type with a callback function.

        Note: This is a legacy instance method. For app initialization, use subscribe_globally() instead.

        :param event_type: The event type to subscribe to.
        :param callback: The callback function to call when the event is published.
                        Must follow the MessageBusSubscriber protocol (accept event and session).
        """
        logger.debug(f"Subscribing to {event_type} with callback {callback}")
        ops_signal = signal(event_type.name)
        ops_signal.connect(callback)
        self.known_callbacks.append({"event_name": event_type.name, "callback": callback})

    def publish(self, event_type: OpsEventType, event: OpsEvent):
        """
        Publish an event with the given event type and details.

        N.B. This method does not handle the event immediately. The event will be handled when the handle method is called.

        :param event_type: The event type to publish.
        :param event: The event details to publish.
        """
        logger.debug(f"Publishing event {event_type} with details {event}")
        self.published_events.append(event)

    def cleanup(self) -> None:
        """
        Clean up request-specific state without affecting process-level signal subscriptions.

        Note: We do NOT disconnect Blinker signals because:
        1. Signals are process-level, not request-level
        2. They're set up once at app initialization using MessageBus.subscribe_globally()
           (see initialize_event_subscriptions in ops/__init__.py)
        3. Disconnecting would break all subsequent requests

        This method only clears the request-specific published_events list.
        """
        # Only clear the published events list
        self.published_events.clear()
        # Clear tracking list (but signals remain connected)
        self.known_callbacks.clear()
