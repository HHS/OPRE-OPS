from flask import current_app, request
from models.events import OpsEvent, OpsEventStatus, OpsEventType
from ops_api.ops import db


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

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_val:
            event_status = OpsEventStatus.FAILED
            self.metadata.update({"error_message": exc_val.error, "error_type": str(exc_type)})
        else:
            event_status = OpsEventStatus.SUCCESS

        event = OpsEvent(
            event_type=self.event_type,
            event_status=event_status,
            event_details=self.metadata,
        )
        db.session.add(event)
        db.session.commit()
        current_app.logger.info(f"EVENT: {event.to_dict()}")

        if isinstance(exc_val, Exception):
            current_app.logger.error(f"EVENT ({exc_type}): {exc_val.error}")
