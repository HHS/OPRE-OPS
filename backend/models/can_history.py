from enum import Enum, auto

from sqlalchemy import ForeignKey, Integer, Text
from sqlalchemy.dialects.postgresql import ENUM
from sqlalchemy.orm import Mapped, mapped_column

from models.base import BaseModel


class CANHistoryType(Enum):
    """The type of history event being described by a CANHistoryModel
    """

    CAN_DATA_IMPORT = auto()
    CAN_NICKNAME_EDITED = auto()
    CAN_DESCRIPTION_EDITED = auto()
    CAN_FUNDING_CREATED = auto() #CANFundingBudget
    CAN_RECEIVED_CREATED = auto()
    CAN_FUNDING_EDITED = auto() #CANFUndingBudget
    CAN_RECEIVED_EDITED = auto()
    CAN_FUNDING_DELETED = auto() #CANFundingBudget
    CAN_RECEIVED_DELETED = auto()
    CAN_PORTFOLIO_CREATED = auto()
    CAN_PORTFOLIO_DELETED = auto()
    CAN_PORTFOLIO_EDITED = auto()
    CAN_DIVISION_CREATED = auto()
    CAN_DIVISION_DELETED = auto()
    CAN_DIVISION_EDITED = auto()
    CAN_CARRY_FORWARD_CALCULATED = auto()

class CANHistory(BaseModel):
    __tablename__ = "can_history"

    id: Mapped[int] = BaseModel.get_pk_column()
    can_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("can.id")
    )
    ops_event_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("ops_event.id")
    )
    history_title: Mapped[str]
    history_message: Mapped[str] = mapped_column(Text)
    timestamp: Mapped[str]
    history_type: Mapped[CANHistoryType] = mapped_column(
        ENUM(CANHistoryType), nullable=True
    )
