from datetime import datetime, timezone
from enum import Enum, auto
from typing import List, Optional

from loguru import logger
from sqlalchemy import ForeignKey, Integer, Text
from sqlalchemy.dialects.postgresql import ENUM
from sqlalchemy.orm import Mapped, Session, mapped_column

from models import Agreement, OpsEvent, OpsEventStatus, OpsEventType, User
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

def format_fiscal_year(timestamp) -> int:
    """Convert the timestamp to {Fiscal Year}. The fiscal year is calendar year + 1 if the timestamp is october or later.
    This method can take either an iso format timestamp string or a datetime object"""
    current_fiscal_year = 0
    if isinstance(timestamp, str):
        parsed_timestamp = datetime.fromisoformat(timestamp[:-1]).astimezone(timezone.utc)
        current_fiscal_year = parsed_timestamp.year
        if parsed_timestamp.month >= 10:
            current_fiscal_year = parsed_timestamp.year + 1
    elif isinstance(timestamp, datetime):
        if timestamp.month >= 10:
            current_fiscal_year = timestamp.year + 1
        else:
            current_fiscal_year = timestamp.year

    return current_fiscal_year

def agreement_history_trigger_func(
    event: OpsEvent,
    session: Session,
    system_user: User,
):
    # Do not attempt to insert events into CAN History for failed or unknown status events
    if event.event_status == OpsEventStatus.FAILED or event.event_status == OpsEventStatus.UNKNOWN:
        return

    logger.debug(f"Handling event {event.event_type} with details: {event.event_details}")
    assert session is not None

    event_user = session.get(User, event.created_by)
    history_events = []
    match event.event_type:
        case OpsEventType.UPDATE_AGREEMENT:
            # Handle CAN Updates
            change_dict = event.event_details["can_updates"]["changes"]
            for key in change_dict.keys():
                history_items = create_agreement_update_history_event(
                    key,
                    change_dict[key]["old_value"],
                    change_dict[key]["new_value"],
                    event_user,
                    event.created_on.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
                    event.event_details["can_updates"]["owner_id"],
                    event.id,
                    session,
                    system_user
                )
                history_events.extend(history_items)

    add_history_events(history_events, session)
    session.commit()

def create_agreement_update_history_event(
    property_name, old_value, new_value, updated_by_user, updated_on, can_id, ops_event_id, session, sys_user
):
    """A method that generates a CANHistory event for an updated property. In the case where the updated property is not one
    that has been designed for, it will instead be logged and None will be returned from the method."""

    updated_by_sys_user = sys_user.id == updated_by_user.id

    current_fiscal_year = format_fiscal_year(updated_on)
    event_history = []
    match property_name:
        case "name":
            event_history.append(AgreementHistory(
                can_id=can_id,
                ops_event_id=ops_event_id,
                history_title="Name Edited",
                history_message=f"{updated_by_user.full_name} edited the name from {old_value} to {new_value}",
                timestamp=updated_on,
                history_type=AgreementHistoryType.AGREEMENT_UPDATED,
            ))
        case "description":
            event_history.append(AgreementHistory(
                can_id=can_id,
                ops_event_id=ops_event_id,
                history_title="Description Edited",
                history_message=f"{updated_by_user.full_name} edited the description",
                timestamp=updated_on,
                history_type=AgreementHistoryType.AGREEMENT_UPDATED,
            ))
        case _:
            logger.info(f"{property_name} edited by {updated_by_user.full_name} from {old_value} to {new_value}")

    return event_history

def add_history_events(events: List[AgreementHistory], session):
    '''Add a list of AgreementHistory events to the database session. First check that there are not any matching events already in the database to prevent duplicates.'''
    for event in events:
        agreement_history_items = session.query(AgreementHistory).where(AgreementHistory.ops_event_id == event.ops_event_id).all()
        duplicate_found = False
        for item in agreement_history_items:
            if item.timestamp == event.timestamp and item.history_type == event.history_type and item.history_message == event.history_message and item.fiscal_year == event.fiscal_year:
                # enough fields match that we're willing to say this is a duplicate.
                duplicate_found = True
                break

        # If no duplicate of the event was found, add it to the database session.
        if not duplicate_found:
            session.add(event)
