import locale
from datetime import datetime, timezone
from enum import Enum, auto

from loguru import logger
from sqlalchemy import ForeignKey, Integer, Text
from sqlalchemy.dialects.postgresql import ENUM
from sqlalchemy.orm import Mapped, Session, mapped_column

from models import OpsEvent, OpsEventStatus, OpsEventType, User
from models.base import BaseModel


class CANHistoryType(Enum):
    """The type of history event being described by a CANHistoryModel"""

    CAN_DATA_IMPORT = auto()
    CAN_NICKNAME_EDITED = auto()
    CAN_DESCRIPTION_EDITED = auto()
    CAN_FUNDING_CREATED = auto()  # CANFundingBudget
    CAN_RECEIVED_CREATED = auto()
    CAN_FUNDING_EDITED = auto()  # CANFUndingBudget
    CAN_RECEIVED_EDITED = auto()
    CAN_FUNDING_DELETED = auto()  # CANFundingBudget
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
    can_id: Mapped[int] = mapped_column(Integer, ForeignKey("can.id"))
    ops_event_id: Mapped[int] = mapped_column(Integer, ForeignKey("ops_event.id"))
    history_title: Mapped[str]
    history_message: Mapped[str] = mapped_column(Text)
    timestamp: Mapped[str]
    history_type: Mapped[CANHistoryType] = mapped_column(
        ENUM(CANHistoryType), nullable=True
    )


def can_history_trigger_func(
    event: OpsEvent,
    session: Session,
):
    locale.setlocale(locale.LC_ALL, "en_US.UTF-8")
    # Do not attempt to insert events into CAN History for failed or unknown status events
    if (
        event.event_status == OpsEventStatus.FAILED
        or event.event_status == OpsEventStatus.UNKNOWN
    ):
        return

    logger.debug(
        f"Handling event {event.event_type} with details: {event.event_details}"
    )
    assert session is not None

    event_user = session.get(User, event.created_by)

    match event.event_type:
        case OpsEventType.CREATE_NEW_CAN:
            fiscal_year = format_fiscal_year(
                event.event_details["new_can"]["created_on"]
            )
            history_event = CANHistory(
                can_id=event.event_details["new_can"]["id"],
                ops_event_id=event.id,
                history_title=f"{fiscal_year} Data Import",
                history_message=f"{fiscal_year} CAN Funding Information imported from CANBACs",
                timestamp=event.created_on,
                history_type=CANHistoryType.CAN_DATA_IMPORT,
            )
            session.add(history_event)
        case OpsEventType.CREATE_CAN_FUNDING_BUDGET:
            current_fiscal_year = format_fiscal_year(
                event.event_details["new_can_funding_budget"]["created_on"]
            )
            budget = "${:,.2f}".format(
                event.event_details["new_can_funding_budget"]["budget"]
            )
            creator_name = event.event_details["new_can_funding_budget"][
                "created_by_user"
            ]["full_name"]
            history_event = CANHistory(
                can_id=event.event_details["new_can_funding_budget"]["can"]["id"],
                ops_event_id=event.id,
                history_title=f"{current_fiscal_year} Budget Entered",
                history_message=f"{creator_name} entered a {current_fiscal_year} budget of {budget}",
                timestamp=event.created_on,
                history_type=CANHistoryType.CAN_FUNDING_CREATED,
            )
            session.add(history_event)
        case OpsEventType.DELETE_CAN_FUNDING_RECEIVED:
            funding = "${:,.2f}".format(
                event.event_details["deleted_can_funding_received"]["funding"]
            )
            creator_name = f"{event_user.first_name} {event_user.last_name}"
            history_event = CANHistory(
                can_id=event.event_details["deleted_can_funding_received"]["can_id"],
                ops_event_id=event.id,
                history_title="Funding Received Deleted",
                history_message=f"{creator_name} deleted funding received for funding ID {event.event_details['deleted_can_funding_received']['id']} in the amount of {funding}",
                timestamp=event.created_on,
                history_type=CANHistoryType.CAN_RECEIVED_DELETED,
            )
            session.add(history_event)

    session.commit()


def format_fiscal_year(timestamp):

    parsed_timestamp = datetime.fromisoformat(timestamp[:-1]).astimezone(timezone.utc)
    current_fiscal_year = f"FY {parsed_timestamp.year}"
    if parsed_timestamp.month >= 10:
        current_fiscal_year = f"FY {parsed_timestamp.year + 1}"

    return current_fiscal_year
