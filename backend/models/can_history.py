from datetime import datetime, timezone
from enum import Enum, auto
from typing import List

from loguru import logger
from sqlalchemy import ForeignKey, Integer, Text
from sqlalchemy.dialects.postgresql import ENUM
from sqlalchemy.orm import Mapped, Session, mapped_column

from models import OpsEvent, OpsEventStatus, OpsEventType, Portfolio, User
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
    fiscal_year: Mapped[int]


def can_history_trigger_func(
    event: OpsEvent,
    session: Session,
    system_user: User,
    dry_run: bool = False,
):
    # Do not attempt to insert events into CAN History for failed or unknown status events
    if event.event_status == OpsEventStatus.FAILED or event.event_status == OpsEventStatus.UNKNOWN:
        return

    logger.debug(f"Handling event {event.event_type} with details: {event.event_details}")
    assert session is not None

    event_user = session.get(User, event.created_by)
    history_events = []
    match event.event_type:
        case OpsEventType.CREATE_NEW_CAN:
            current_fiscal_year = format_fiscal_year(event.event_details["new_can"]["created_on"])
            history_event = CANHistory(
                can_id=event.event_details["new_can"]["id"],
                ops_event_id=event.id,
                history_title=f"FY {current_fiscal_year} Data Import",
                history_message=f"FY {current_fiscal_year} CAN Funding Information imported from CANBACs",
                timestamp=event.created_on.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
                history_type=CANHistoryType.CAN_DATA_IMPORT,
                fiscal_year = current_fiscal_year
            )
            history_events.append(history_event)
        case OpsEventType.UPDATE_CAN:
            # Handle CAN Updates
            change_dict = event.event_details["can_updates"]["changes"]
            for key in change_dict.keys():
                history_items = create_can_update_history_event(
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
        case OpsEventType.CREATE_CAN_FUNDING_BUDGET:
            current_fiscal_year = format_fiscal_year(event.event_details["new_can_funding_budget"]["created_on"])
            budget = "${:,.2f}".format(event.event_details["new_can_funding_budget"]["budget"])
            creator_name = event.event_details["new_can_funding_budget"]["created_by_user"]["full_name"]
            history_event = CANHistory(
                can_id=event.event_details["new_can_funding_budget"]["can"]["id"],
                ops_event_id=event.id,
                history_title=f"FY {current_fiscal_year} Budget Entered",
                history_message=f"{creator_name} entered a FY {current_fiscal_year} budget of {budget}",
                timestamp=event.created_on.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
                history_type=CANHistoryType.CAN_FUNDING_CREATED,
                fiscal_year=current_fiscal_year
            )
            history_events.append(history_event)
        case OpsEventType.UPDATE_CAN_FUNDING_BUDGET:
            # fiscal year for edits will always be when the event was created. We're not importing old event history
            current_fiscal_year = format_fiscal_year(event.created_on)
            changes = event.event_details["funding_budget_updates"]["changes"]
            if "budget" in changes:
                budget_changes = changes["budget"]
                old_budget = "${:,.2f}".format(budget_changes["old_value"])
                new_budget = "${:,.2f}".format(budget_changes["new_value"])
                history_event = CANHistory(
                    can_id=event.event_details["funding_budget_updates"]["owner_id"],
                    ops_event_id=event.id,
                    history_title=f"FY {current_fiscal_year} Budget Edited",
                    history_message=f"{event_user.full_name} edited the FY {current_fiscal_year} budget from {old_budget} to {new_budget}",
                    timestamp=event.created_on.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
                    history_type=CANHistoryType.CAN_FUNDING_EDITED,
                    fiscal_year=current_fiscal_year
                )
                history_events.append(history_event)
        case OpsEventType.CREATE_CAN_FUNDING_RECEIVED:
            funding = "${:,.2f}".format(event.event_details["new_can_funding_received"]["funding"])
            current_fiscal_year = format_fiscal_year(event.event_details["new_can_funding_received"]["created_on"])
            creator_name = f"{event_user.full_name}"
            history_event = CANHistory(
                can_id=event.event_details["new_can_funding_received"]["can_id"],
                ops_event_id=event.id,
                history_title="Funding Received Added",
                history_message=f"{creator_name} added funding received to funding ID {event.event_details['new_can_funding_received']['id']} in the amount of {funding}",
                timestamp=event.created_on.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
                history_type=CANHistoryType.CAN_RECEIVED_CREATED,
                fiscal_year=current_fiscal_year
            )
            history_events.append(history_event)
        case OpsEventType.UPDATE_CAN_FUNDING_RECEIVED:
            changes = event.event_details["funding_received_updates"]["changes"]
            current_fiscal_year = format_fiscal_year(event.created_on)
            if "funding" in changes:
                funding_changes = changes["funding"]
                old_funding = "${:,.2f}".format(funding_changes["old_value"])
                new_funding = "${:,.2f}".format(funding_changes["new_value"])
                history_event = CANHistory(
                    can_id=event.event_details["funding_received_updates"]["owner_id"],
                    ops_event_id=event.id,
                    history_title="Funding Received Edited",
                    history_message=f"{event_user.full_name} edited funding received for funding ID {event.event_details['funding_received_updates']['funding_id']} from {old_funding} to {new_funding}",
                    timestamp=event.created_on.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
                    history_type=CANHistoryType.CAN_RECEIVED_EDITED,
                    fiscal_year=current_fiscal_year
                )
                history_events.append(history_event)
        case OpsEventType.DELETE_CAN_FUNDING_RECEIVED:
            funding = "${:,.2f}".format(event.event_details["deleted_can_funding_received"]["funding"])
            current_fiscal_year = format_fiscal_year(event.event_details["deleted_can_funding_received"]["created_on"])
            creator_name = f"{event_user.full_name}"
            history_event = CANHistory(
                can_id=event.event_details["deleted_can_funding_received"]["id"],
                ops_event_id=event.id,
                history_title="Funding Received Deleted",
                history_message=f"{creator_name} deleted funding received for funding ID {event.event_details['deleted_can_funding_received']['id']} in the amount of {funding}",
                timestamp=event.created_on.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
                history_type=CANHistoryType.CAN_RECEIVED_DELETED,
                fiscal_year=current_fiscal_year
            )
            history_events.append(history_event)
    add_history_events(history_events, session)
    if not dry_run:
        session.commit()


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


def create_can_update_history_event(
    property_name, old_value, new_value, updated_by_user, updated_on, can_id, ops_event_id, session, sys_user
):
    """A method that generates a CANHistory event for an updated property. In the case where the updated property is not one
    that has been designed for, it will instead be logged and None will be returned from the method."""

    updated_by_sys_user = sys_user.id == updated_by_user.id

    current_fiscal_year = format_fiscal_year(updated_on)
    event_history = []
    match property_name:
        case "nick_name":
            event_history.append(CANHistory(
                can_id=can_id,
                ops_event_id=ops_event_id,
                history_title="Nickname Edited",
                history_message=f"Nickname changed from {old_value} to {new_value} during FY {current_fiscal_year} data import" if updated_by_sys_user else f"{updated_by_user.full_name} edited the nickname from {old_value} to {new_value}",
                timestamp=updated_on,
                history_type=CANHistoryType.CAN_NICKNAME_EDITED,
                fiscal_year=current_fiscal_year
            ))
        case "description":
            event_history.append(CANHistory(
                can_id=can_id,
                ops_event_id=ops_event_id,
                history_title="Description Edited",
                history_message=f"{updated_by_user.full_name} edited the description",
                timestamp=updated_on,
                history_type=CANHistoryType.CAN_DESCRIPTION_EDITED,
                fiscal_year=current_fiscal_year
            ))
        case "portfolio_id":
            old_portfolio = session.get(Portfolio, old_value)
            new_portfolio = session.get(Portfolio, new_value)
            event_history.append(CANHistory(
                can_id=can_id,
                ops_event_id=ops_event_id,
                history_title="CAN Portfolio Edited",
                history_message=f"CAN portfolio changed from {old_portfolio.name} to {new_portfolio.name} during FY {current_fiscal_year} data import" if updated_by_sys_user else f"{updated_by_user.full_name} changed the portfolio from {old_portfolio.name} to {new_portfolio.name}",
                timestamp=updated_on,
                history_type=CANHistoryType.CAN_PORTFOLIO_EDITED,
                fiscal_year=current_fiscal_year
            ))
            if old_portfolio.division_id != new_portfolio.division_id:
                event_history.append(CANHistory(
                can_id=can_id,
                ops_event_id=ops_event_id,
                history_title="CAN Division Edited",
                history_message=f"CAN division changed from {old_portfolio.division.name} to {new_portfolio.division.name} during FY {current_fiscal_year} data import" if updated_by_sys_user else f"{updated_by_user.full_name} changed the division from {old_portfolio.division.name} to {new_portfolio.division.name}",
                timestamp=updated_on,
                history_type=CANHistoryType.CAN_DIVISION_EDITED,
                fiscal_year=current_fiscal_year
            ))
        case _:
            logger.info(f"{property_name} edited by {updated_by_user.full_name} from {old_value} to {new_value}")

    return event_history

def add_history_events(events: List[CANHistory], session):
    '''Add a list of CANHistory events to the database session. First check that there are not any matching events already in the database to prevent duplicates.'''
    for event in events:
        # Query the database for existing events
        can_history_items = session.query(CANHistory).where(CANHistory.ops_event_id == event.ops_event_id).all()

        # Also check pending objects in the session that haven't been flushed yet
        pending_items = [obj for obj in session.new if isinstance(obj, CANHistory) and obj.ops_event_id == event.ops_event_id]

        # Combine both database and pending items
        all_items = can_history_items + pending_items

        duplicate_found = False
        for item in all_items:
            if item.timestamp == event.timestamp and item.history_type == event.history_type and item.history_message == event.history_message and item.fiscal_year == event.fiscal_year:
                # enough fields match that we're willing to say this is a duplicate.
                duplicate_found = True
                break

        # If no duplicate of the event was found, add it to the database session.
        if not duplicate_found:
            session.add(event)
