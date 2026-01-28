"""
Protocol definitions for MessageBus subscribers.

This module defines the interface that all MessageBus subscribers must follow,
providing type safety and documentation for subscriber implementations.
"""

from typing import Protocol

from sqlalchemy.orm import Session

from models import OpsEvent


class MessageBusSubscriber(Protocol):
    """
    Protocol defining the interface for MessageBus event subscribers.

    All subscribers must be callable functions/methods that accept:
    - event: OpsEvent - The event being published
    - session: Session - The database session for making queries/updates

    Subscribers should:
    1. Handle errors gracefully (the MessageBus provides error isolation)
    2. Not raise exceptions that would affect other subscribers
    3. Log any errors appropriately
    4. Use the provided session for database operations

    Example implementation:

        def my_subscriber(event: OpsEvent, session: Session) -> None:
            try:
                # Your subscriber logic here
                logger.debug(f"Handling event {event.event_type}")
                # ... process the event ...
            except Exception as e:
                logger.error(f"Error in my_subscriber: {e}")
    """

    def __call__(self, event: OpsEvent, session: Session) -> None:
        """
        Handle an event published to the MessageBus.

        Args:
            event: The OpsEvent being published
            session: SQLAlchemy session for database operations

        Returns:
            None

        Note:
            Subscribers should handle their own errors. The MessageBus provides
            error isolation, so exceptions won't affect other subscribers.
        """
        ...
