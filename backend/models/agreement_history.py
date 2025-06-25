from datetime import datetime, timezone
from enum import Enum, auto
from typing import Optional

from loguru import logger
from sqlalchemy import ForeignKey, Integer, Text
from sqlalchemy.dialects.postgresql import ENUM
from sqlalchemy.orm import Mapped, mapped_column

from models import OpsEvent, OpsEventStatus, OpsEventType, Portfolio, User
from models.base import BaseModel


class AgreementHistoryType(Enum):
    AGREEMENT_UPDATED = auto()
    BUDGET_LINE_ITEM_CREATED = auto()
    BUDGET_LINE_ITEM_UPDATED = auto()
    BUDGET_LINE_ITEM_DELETED = auto()
    CHANGE_REQUEST_CREATED = auto()
    CHANGE_REQUEST_UPDATED = auto()

class AgreementHistory(BaseModel):
    __tablename__ = "agreement_history"

    id: Mapped[int] = BaseModel.get_pk_column()
    agreement_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("agreement.id"))
    budget_line_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("budget_line_item.id"))
    ops_event_id: Mapped[int] = mapped_column(Integer, ForeignKey("ops_event.id"))
    history_title: Mapped[str]
    history_message: Mapped[str] = mapped_column(Text)
    timestamp: Mapped[str]
    history_type: Mapped[AgreementHistoryType] = mapped_column(
        ENUM(AgreementHistoryType), nullable=True
    )
