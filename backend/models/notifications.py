from models import User
from models.base import BaseModel
from sqlalchemy import Boolean, Column, Date, ForeignKey, Identity, Integer, String
from sqlalchemy.orm import relationship


class Notification(BaseModel):
    __tablename__ = "notification"
    id = Column(Integer, Identity(), primary_key=True)
    title = Column(String)
    message = Column(String)
    is_read = Column(Boolean, default=False)
    expires = Column(Date)

    recipient_id = Column(Integer, ForeignKey("users.id"))
    recipient = relationship(
        "User", back_populates="notifications", foreign_keys=[recipient_id]
    )
