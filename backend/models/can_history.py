from enum import Enum, auto
from typing import Optional

from sqlalchemy import ForeignKey, Integer
from sqlalchemy.dialects.postgresql import ENUM
from sqlalchemy.orm import Mapped, mapped_column

from models.base import BaseModel


class CANHistoryType(Enum):
    """The type of history event being described by a CANHistoryModel
    """

    CAN_DATA_IMPORT = auto()
    CAN_NICKNAME_EDITED = auto()
    CAN_DESCRIPTION_EDITED = auto()
    CAN_FUNDING_CREATED = auto()
    CAN_RECEIVED_CREATED = auto()
    CAN_FUNDING_EDITED = auto()
    CAN_RECEIVED_EDITED = auto()
    CAN_FUNDING_DELETED = auto()
    CAN_RECEIVED_DELETED = auto()
    CAN_PORTFOLIO_CREATED = auto()
    CAN_PORTFOLIO_DELETED = auto()
    CAN_PORTFOLIO_EDITED = auto()
    CAN_DIVISION_CREATED = auto()
    CAN_DIVISION_DELETED = auto()
    CAN_DIVISION_EDITED = auto()
    CAN_CARRY_FORWARD_CALCULATED = auto()

class CANHistoryModel(BaseModel):
    __tablename__ = "can_history"

    id: Mapped[int] = BaseModel.get_pk_column()
    can_id = Mapped[int] = mapped_column(
        Integer, ForeignKey("cans.id")
    )
    ops_event_id = Mapped[int] # Foreign Key
    history_title = Mapped[Optional[str]]
    history_message = Mapped[Optional[str]]
    timestamp = Mapped[Optional[str]]
    history_type = Mapped[CANHistoryType] = mapped_column(
        ENUM(CANHistoryType), nullable=True
    )
