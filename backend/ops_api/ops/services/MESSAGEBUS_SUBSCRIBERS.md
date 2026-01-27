# MessageBus Subscriber Guide

This guide explains how to create and register MessageBus subscribers in OPRE OPS.

## Overview

The MessageBus provides a decoupled way to handle domain events. When actions occur (like creating a CAN or updating an agreement), the system publishes events that subscribers can react to.

## Subscriber Protocol

All subscribers must follow the `MessageBusSubscriber` protocol defined in `subscriber_protocol.py`:

```python
def my_subscriber(event: OpsEvent, session: Session) -> None:
    """Handle an event."""
    try:
        # Your logic here
        pass
    except Exception as e:
        logger.error(f"Error in my_subscriber: {e}")
```

### Protocol Requirements

A valid subscriber must:
1. Accept exactly two parameters:
   - `event: OpsEvent` - The event being published
   - `session: Session` - Database session for queries/updates
2. Return `None`
3. Handle its own exceptions (the MessageBus provides isolation)
4. Log errors appropriately

## Creating a New Subscriber

### Step 1: Create the Subscriber Function

Create a new file in `ops/services/` (e.g., `my_feature_messages.py`):

```python
from loguru import logger
from sqlalchemy.orm import Session

from models import OpsEvent
from ops_api.ops.utils.users import get_sys_user


def my_feature_trigger(event: OpsEvent, session: Session) -> None:
    """
    Handle events related to my feature.

    Args:
        event: The OpsEvent containing event details
        session: SQLAlchemy session for database operations
    """
    try:
        sys_user = get_sys_user(session)

        # Your business logic here
        # For example, create a history record:
        # history_record = MyFeatureHistory(
        #     feature_id=event.event_details.get('feature_id'),
        #     event_type=event.event_type,
        #     created_by=sys_user.id
        # )
        # session.add(history_record)

        logger.debug(f"Processed {event.event_type.name} event")

    except Exception as e:
        logger.error(f"Error in my_feature_trigger: {e}", exc_info=True)
```

### Step 2: Register the Subscriber

In `ops/__init__.py`, import and register your subscriber in the `initialize_event_subscriptions()` function:

```python
# At the top of the file
from ops_api.ops.services.my_feature_messages import my_feature_trigger

# In the initialize_event_subscriptions() function
# This function is called once at app startup
def initialize_event_subscriptions():
    """Initialize all event subscriptions once at app startup."""
    # ... existing subscriptions ...

    # Register your subscriber for relevant events
    MessageBus.subscribe_globally(OpsEventType.CREATE_MY_FEATURE, my_feature_trigger)
    MessageBus.subscribe_globally(OpsEventType.UPDATE_MY_FEATURE, my_feature_trigger)
```

**Important Notes:**
- Subscriptions are set up **once at app initialization**, not per-request
- Use `MessageBus.subscribe_globally()` (class method), not `.subscribe()` (instance method)
- Subscriptions persist across all requests for the lifetime of the app process
- Each request gets its own `MessageBus()` instance to publish events, but shares the global subscriptions

## Current Subscribers

### CAN History Trigger (`can_messages.py`)
Handles CAN-related events and creates history records.

**Events subscribed to:**
- `CREATE_NEW_CAN`
- `UPDATE_CAN`
- `CREATE_CAN_FUNDING_BUDGET`
- `UPDATE_CAN_FUNDING_BUDGET`
- `CREATE_CAN_FUNDING_RECEIVED`
- `UPDATE_CAN_FUNDING_RECEIVED`
- `DELETE_CAN_FUNDING_RECEIVED`

### Agreement History Trigger (`agreement_messages.py`)
Handles agreement-related events and creates history records.

**Events subscribed to:**
- `UPDATE_AGREEMENT`
- `CREATE_BLI`
- `UPDATE_BLI`
- `DELETE_BLI`
- `CREATE_NEW_AGREEMENT`
- `CREATE_CHANGE_REQUEST`
- `UPDATE_CHANGE_REQUEST`
- `UPDATE_PROCUREMENT_SHOP`
- `CREATE_SERVICES_COMPONENT`
- `UPDATE_SERVICES_COMPONENT`
- `DELETE_SERVICES_COMPONENT`

### Change Request History Trigger (`change_request_messages.py`)
Template for handling change request events (TODO: implement).

## Best Practices

### 1. Error Handling
Always wrap your subscriber logic in try-except:

```python
def my_subscriber(event: OpsEvent, session: Session) -> None:
    try:
        # Your logic
        pass
    except Exception as e:
        logger.error(f"Error in my_subscriber: {e}", exc_info=True)
```

**Why?** The MessageBus provides error isolation, but you should still log errors for debugging.

### 2. Use the Provided Session
Always use the `session` parameter provided to the subscriber:

```python
def my_subscriber(event: OpsEvent, session: Session) -> None:
    # Good - uses provided session
    user = session.query(User).filter_by(id=user_id).first()

    # Bad - creates new session (breaks transaction context)
    # with Session(engine) as new_session:
    #     user = new_session.query(User)...
```

**Why?** The session is part of the request's transaction context.

### 3. Keep Subscribers Focused
Each subscriber should have a single responsibility:

```python
# Good - focused on history
def can_history_trigger(event, session):
    create_can_history_record(event, session)

# Good - focused on notifications
def can_notification_trigger(event, session):
    send_can_update_notification(event, session)

# Bad - doing too much
def can_everything_trigger(event, session):
    create_can_history_record(event, session)
    send_can_update_notification(event, session)
    update_can_statistics(event, session)
    sync_to_external_system(event, session)
```

**Why?** Single responsibility makes code easier to test, debug, and maintain.

### 4. Make Subscribers Idempotent
Design subscribers to handle duplicate events gracefully:

```python
def my_subscriber(event: OpsEvent, session: Session) -> None:
    try:
        # Check if already processed
        existing = session.query(MyHistory).filter_by(
            ops_event_id=event.id
        ).first()

        if existing:
            logger.debug(f"Event {event.id} already processed")
            return

        # Process the event
        create_history_record(event, session)

    except Exception as e:
        logger.error(f"Error: {e}")
```

**Why?** Protects against accidental duplicate processing.

### 5. Log Appropriately
Use structured logging with context:

```python
def my_subscriber(event: OpsEvent, session: Session) -> None:
    logger.debug(
        f"Processing {event.event_type.name} event",
        extra={
            "event_id": event.id,
            "event_type": event.event_type.name,
            "created_by": event.created_by
        }
    )
```

## Type Safety

The `MessageBusSubscriber` protocol provides type checking. IDEs and type checkers (mypy) will verify:

- Subscribers have the correct signature
- Parameters are properly typed
- The MessageBus only accepts valid subscribers

Example type checking:

```python
# This will pass type checking
def valid_subscriber(event: OpsEvent, session: Session) -> None:
    pass

# This will fail type checking
def invalid_subscriber(event: OpsEvent) -> None:  # Missing session parameter
    pass

message_bus.subscribe(OpsEventType.CREATE_CAN, valid_subscriber)  # OK
message_bus.subscribe(OpsEventType.CREATE_CAN, invalid_subscriber)  # Type error
```

## Testing Subscribers

### Unit Testing Example

```python
import pytest
from unittest.mock import MagicMock

from models import OpsEvent, OpsEventType
from ops_api.ops.services.my_feature_messages import my_feature_trigger


def test_my_feature_trigger(mocker):
    # Arrange
    event = OpsEvent(event_type=OpsEventType.CREATE_MY_FEATURE)
    mock_session = MagicMock()
    mock_sys_user = mocker.patch('ops_api.ops.services.my_feature_messages.get_sys_user')

    # Act
    my_feature_trigger(event, mock_session)

    # Assert
    mock_sys_user.assert_called_once_with(mock_session)
    # Add more assertions for your logic
```

### Integration Testing with MessageBus

```python
def test_messagebus_calls_subscriber(mocker):
    # Arrange
    mock_subscriber = mocker.MagicMock()
    message_bus = MessageBus()
    message_bus.subscribe(OpsEventType.CREATE_CAN, mock_subscriber)

    event = OpsEvent(event_type=OpsEventType.CREATE_CAN)
    message_bus.publish(OpsEventType.CREATE_CAN, event)

    # Act
    message_bus.handle()

    # Assert
    mock_subscriber.assert_called_once()
```

## Troubleshooting

### Subscriber Not Being Called

1. **Check registration**: Ensure your subscriber is registered in `initialize_event_subscriptions()` in `ops/__init__.py` using `MessageBus.subscribe_globally()`
2. **Check event type**: Verify you're publishing the correct event type
3. **Check timing**: Subscribers are only called when `message_bus.handle()` is invoked (typically in the teardown_request hook)

### Type Errors

If you get type errors about `MessageBusSubscriber`:

```python
# Make sure your function signature matches exactly:
def my_subscriber(
    event: OpsEvent,  # Must be named 'event'
    session: Session,  # Must be named 'session'
) -> None:  # Must return None
    pass
```

### Errors in Subscribers

If a subscriber raises an exception:
- The error is logged by the MessageBus
- Other subscribers continue to run (error isolation)
- The exception does NOT propagate to the caller

Check logs for error messages like:
```
Error in subscriber <function my_subscriber> for event CREATE_CAN (id=123): ...
```

## Summary

1. **Create** a subscriber function following the `MessageBusSubscriber` protocol
2. **Handle** errors with try-except and logging
3. **Register** the subscriber in `ops/__init__.py`
4. **Test** your subscriber with unit and integration tests
5. **Monitor** logs for any errors

The protocol ensures type safety and consistent behavior across all subscribers!
