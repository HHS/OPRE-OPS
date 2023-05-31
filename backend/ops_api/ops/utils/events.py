from types import TracebackType
from typing import Optional, Type

from flask import current_app, request
from flask_jwt_extended import verify_jwt_in_request
from flask_jwt_extended.exceptions import NoAuthorizationError
from models import User
from models.events import OpsEvent, OpsEventStatus, OpsEventType
from sqlalchemy.orm import Session

from ops_api.ops.utils.user import get_user_from_token


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
        if exc_val or not current_app.db_session.is_active:
            event_status = OpsEventStatus.FAILED
            self.metadata.update({"error_message": f"{exc_val}", "error_type": f"{exc_type}"})
        else:
            event_status = OpsEventStatus.SUCCESS

        user: User = None
        try:
            token = verify_jwt_in_request()
            user = get_user_from_token(token[1] if token else None)
        except NoAuthorizationError:
            current_app.logger.warning("JWT is invalid")

        event = OpsEvent(
            event_type=self.event_type,
            event_status=event_status,
            event_details=self.metadata,
            created_by=user.id if user else None,
        )

        with Session(current_app.engine) as session:
            session.add(event)
            session.commit()
            current_app.logger.info(f"EVENT: {event.to_dict()}")

        if isinstance(exc_val, Exception):
            current_app.logger.error(f"EVENT ({exc_type}): {exc_val}")

        if not current_app.db_session.is_active:
            current_app.logger.error("Session is not active. It has likely been rolled back.")
