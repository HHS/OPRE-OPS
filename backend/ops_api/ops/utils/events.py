from types import TracebackType
from typing import Optional, Type

from flask import current_app, request
from flask_jwt_extended import current_user
from loguru import logger
from sqlalchemy.orm import Session
from werkzeug.exceptions import UnsupportedMediaType

from models.events import OpsEvent, OpsEventStatus, OpsEventType
from ops_api.ops.auth.utils import get_request_ip_address


class OpsEventHandler:
    def __init__(self, event_type: OpsEventType):
        self.metadata = {}
        self.event_type = event_type

    def __enter__(self):
        self.metadata.update(
            {
                "request.values": request.values,
                "request.headers": {k: v for k, v in request.headers},
                "request.remote_addr": get_request_ip_address(),
                "request.remote_user": request.remote_user,
            }
        )

        try:
            self.metadata["request.json"] = request.json
        except UnsupportedMediaType:
            if request.data:
                self.metadata["request.data"] = request.data

        return self

    def __exit__(
        self,
        exc_type: Optional[Type[BaseException]],
        exc_val: Optional[BaseException],
        exc_tb: Optional[TracebackType],
    ) -> None:
        if exc_val or not current_app.db_session.is_active:
            event_status = OpsEventStatus.FAILED
            self.metadata.update({"error_message": f"{exc_val}", "error_type": f"{exc_type}"})
        else:
            event_status = OpsEventStatus.SUCCESS

        current_user_id = None
        try:
            current_user_id = current_user.id if current_user else None
        except Exception as e:
            print(e)

        event = OpsEvent(
            event_type=self.event_type,
            event_status=event_status,
            event_details=self.metadata,
            created_by=current_user_id,
        )

        with Session(current_app.engine) as session:
            session.add(event)
            session.commit()
            logger.info(f"EVENT: {event.to_dict()}")

        if isinstance(exc_val, Exception):
            logger.error(f"EVENT ({exc_type}): {exc_val}")

        if not current_app.db_session.is_active:
            logger.error("Session is not active. It has likely been rolled back.")

        if hasattr(request, "message_bus"):
            logger.info(f"Publishing event {self.event_type.name}")
            request.message_bus.publish(self.event_type, event)
