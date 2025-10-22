from typing import Any, Type

from models import ChangeRequestNotification, Notification, NotificationType
from ops_api.ops.services.ops_service import OpsService, ResourceNotFoundError


class NotificationService(OpsService[Notification]):
    def __init__(self, db_session):
        self.db_session = db_session

    def create(self, data: dict[str, Any]) -> Notification:
        """
        Create a new notification.
        """
        notification_type = data.get("notification_type", NotificationType.NOTIFICATION)

        # Choose the appropriate class based on the polymorphic identity
        cls: Type[Notification]
        if notification_type == NotificationType.CHANGE_REQUEST_NOTIFICATION:
            cls = ChangeRequestNotification
        else:
            cls = Notification

        notification = cls(**data)
        self.db_session.add(notification)
        self.db_session.commit()
        return notification

    def update(
        self, notification_id: int, updated_fields: dict[str, Any]
    ) -> tuple[Notification, int]:
        """
        Update an existing notification with the provided fields.
        """
        notification = self.db_session.get(Notification, notification_id)
        if not notification:
            raise ResourceNotFoundError("Notification", notification_id)

        for key, value in updated_fields.items():
            if hasattr(notification, key):
                setattr(notification, key, value)

        self.db_session.commit()
        return notification, 200

    def delete(self, notification_id: int) -> None:
        """
        Delete a notification by its ID.
        """
        notification = self.db_session.get(Notification, notification_id)
        if not notification:
            raise ResourceNotFoundError("Notification", notification_id)

        self.db_session.delete(notification)
        self.db_session.commit()

    def get(self, notification_id: int) -> Notification:
        """
        Retrieve a notification by its ID.
        """
        notification = self.db_session.get(Notification, notification_id)
        if not notification:
            raise ResourceNotFoundError("Notification", notification_id)
        return notification

    def get_list(
        self, filters: dict | None = None
    ) -> tuple[list[Notification], dict | None]:
        """
        List notifications, optionally filtered by the provided criteria.
        """
        query = self.db_session.query(Notification)
        results = query.all()
        return results, None
