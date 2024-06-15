from datetime import datetime
from typing import Optional

from sqlalchemy import ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import BaseModel


class UserSession(BaseModel):
    __tablename__ = "user_session"

    id: Mapped[int] = BaseModel.get_pk_column()

    user_id: Mapped[int] = mapped_column(ForeignKey("ops_user.id"), nullable=False)
    user: Mapped["User"] = relationship(
        "User", back_populates="sessions", foreign_keys=[user_id]
    )

    is_active: Mapped[Optional[bool]]
    ip_address: Mapped[str]
    access_token: Mapped[str] = mapped_column(Text, nullable=False)
    refresh_token: Mapped[str] = mapped_column(Text, nullable=False)
    last_active_at: Mapped[datetime]
