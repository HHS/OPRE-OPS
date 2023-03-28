from types import TracebackType
from typing import Optional, Type

from flask import current_app, request
from models.events import OpsEvent, OpsEventStatus, OpsEventType


class OpsEventHandler:
    def __init__(self, event_type: OpsEventType):
        self.metadata = {}
        self.event_type = event_type

    def __enter__(self):
        self.metadata.update(
            {
                "request.json": request.json,
                "request.values": request.values,
                "request.headers": {k: v for k, v in request.headers},
                "request.remote_addr": request.remote_addr,
                "request.remote_user": request.remote_user,
            }
        )

        return self

    def __exit__(
        self,
        exc_type: Optional[Type[BaseException]],
        exc_val: Optional[BaseException],
        exc_tb: Optional[TracebackType],
    ) -> None:
        if exc_val:
            event_status = OpsEventStatus.FAILED
            self.metadata.update({"error_message": f"{exc_val}", "error_type": f"{exc_type}"})
        else:
            event_status = OpsEventStatus.SUCCESS

        event = OpsEvent(
            event_type=self.event_type,
            event_status=event_status,
            event_details=self.metadata,
        )
        current_app.db_session.add(event)
        current_app.db_session.commit()
        current_app.logger.info(f"EVENT: {event.to_dict()}")

        if isinstance(exc_val, Exception):
            current_app.logger.error(f"EVENT ({exc_type}): {exc_val}")
