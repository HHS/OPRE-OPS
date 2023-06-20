from models import User
from models.base import BaseModel
from sqlalchemy import Boolean, Column, Date, ForeignKey, Identity, Integer, String, Table
from sqlalchemy.orm import relationship

notification_recipients = Table(
    "notification_recipients",
    BaseModel.metadata,
    Column("notification_id", ForeignKey("notification.id"), primary_key=True),
    Column(
        "user_id",
        ForeignKey("users.id"),
        primary_key=True,
    ),
)


class Notification(BaseModel):
    __tablename__ = "notification"
    id = Column(Integer, Identity(), primary_key=True)
    title = Column(String)
    message = Column(String)
    status = Column(Boolean)
    recipients = relationship(
        User, secondary=notification_recipients, back_populates="notifications"
    )
    expires = Column(Date)
