from enum import Enum, auto
from typing import Optional

from sqlalchemy import Boolean, Date, ForeignKey, String, Index, text
from sqlalchemy.dialects.postgresql import ENUM
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import BaseModel


class NotificationType(Enum):
    NOTIFICATION = auto()
    CHANGE_REQUEST_NOTIFICATION = auto()


class Notification(BaseModel):
    __tablename__ = "notification"
    id: Mapped[int] = BaseModel.get_pk_column()
    notification_type: Mapped[NotificationType] = mapped_column(
        ENUM(NotificationType), default=NotificationType.NOTIFICATION, nullable=False
    )
    title: Mapped[Optional[str]] = mapped_column(String)
    message: Mapped[Optional[str]] = mapped_column(String)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    expires: Mapped[Optional[Date]] = mapped_column(Date)

    recipient_id: Mapped[Optional[int]] = mapped_column(ForeignKey("ops_user.id"))
    recipient = relationship("User", back_populates="notifications", foreign_keys=[recipient_id])

    __table_args__ = (
        Index("idx_notification_recipient_created", "recipient_id", text("created_on DESC")),  # Change this line
    )

    __mapper_args__ = {
        "polymorphic_on": "notification_type",
        "polymorphic_identity": NotificationType.NOTIFICATION,
    }


class ChangeRequestNotification(Notification):
    change_request_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("change_request.id", ondelete="CASCADE"),
        index=True,
        nullable=True
    )
    change_request = relationship(
        "ChangeRequest",
        passive_deletes=True,
    )

    __mapper_args__ = {
        "polymorphic_identity": NotificationType.CHANGE_REQUEST_NOTIFICATION,
    }
