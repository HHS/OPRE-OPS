from sqlalchemy import Boolean, Column, Date, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from models.base import BaseModel


class Notification(BaseModel):
    __tablename__ = "notification"
    id = BaseModel.get_pk_column()
    title = Column(String)
    message = Column(String)
    is_read = Column(Boolean, default=False)
    expires = Column(Date)

    recipient_id = Column(Integer, ForeignKey("ops_user.id"))
    recipient = relationship(
        "User", back_populates="notifications", foreign_keys=[recipient_id]
    )
