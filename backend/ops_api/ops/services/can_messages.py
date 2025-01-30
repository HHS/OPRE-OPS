from datetime import datetime, timezone

from loguru import logger
from sqlalchemy.orm import Session

from models import CANHistory, CANHistoryType, OpsEvent, OpsEventStatus, OpsEventType, Portfolio, User


def can_history_trigger(
    event: OpsEvent,
    session: Session,
):
    # Do not attempt to insert events into CAN History for failed or unknown status events
    if event.event_status == OpsEventStatus.FAILED or event.event_status == OpsEventStatus.UNKNOWN:
        return

    try:
        logger.debug(f"Handling event {event.event_type} with details: {event.event_details}")
        assert session is not None

        event_user = session.get(User, event.created_by)

        match event.event_type:
            case OpsEventType.CREATE_NEW_CAN:
                fiscal_year = format_fiscal_year(event.event_details["new_can"]["created_on"])
                history_event = CANHistory(
                    can_id=event.event_details["new_can"]["id"],
                    ops_event_id=event.id,
                    history_title=f"{fiscal_year} Data Import",
                    history_message=f"{fiscal_year} CAN Funding Information imported from CANBACs",
                    timestamp=event.created_on,
                    history_type=CANHistoryType.CAN_DATA_IMPORT,
                )
                session.add(history_event)
            case OpsEventType.UPDATE_CAN:
                change_dict = event.event_details["can_updates"]["changes"]
                for key in change_dict.keys():
                    history_event = create_can_update_history_event(
                        key,
                        change_dict[key]["old_value"],
                        change_dict[key]["new_value"],
                        event_user,
                        event.created_on,
                        event.event_details["can_updates"]["can_id"],
                        event.id,
                        session,
                    )
                    if history_event is not None:
                        session.add(history_event)
            case OpsEventType.CREATE_CAN_FUNDING_BUDGET:
                current_fiscal_year = format_fiscal_year(event.event_details["new_can_funding_budget"]["created_on"])
                budget = "${:,.2f}".format(event.event_details["new_can_funding_budget"]["budget"])
                creator_name = event.event_details["new_can_funding_budget"]["created_by_user"]["full_name"]
                history_event = CANHistory(
                    can_id=event.event_details["new_can_funding_budget"]["can"]["id"],
                    ops_event_id=event.id,
                    history_title=f"{current_fiscal_year} Budget Entered",
                    history_message=f"{creator_name} entered a {current_fiscal_year} budget of {budget}",
                    timestamp=event.created_on,
                    history_type=CANHistoryType.CAN_FUNDING_CREATED,
                )
                session.add(history_event)
            case OpsEventType.UPDATE_CAN_FUNDING_BUDGET:
                # fiscal year for edits will always be when the event was created. We're not importing old event history
                current_fiscal_year = format_fiscal_year(event.created_on)
                changes = event.event_details["funding_budget_updates"]["changes"]
                if "budget" in changes:
                    budget_changes = changes["budget"]
                    old_budget = "${:,.2f}".format(budget_changes["old_value"])
                    new_budget = "${:,.2f}".format(budget_changes["new_value"])
                    history_event = CANHistory(
                        can_id=event.event_details["funding_budget_updates"]["can_id"],
                        ops_event_id=event.id,
                        history_title=f"{current_fiscal_year} Budget Edited",
                        history_message=f"{event_user.first_name} {event_user.last_name} edited the {current_fiscal_year} budget from {old_budget} to {new_budget}",
                        timestamp=event.created_on,
                        history_type=CANHistoryType.CAN_FUNDING_EDITED,
                    )
                    session.add(history_event)
            case OpsEventType.CREATE_CAN_FUNDING_RECEIVED:
                funding = "${:,.2f}".format(event.event_details["new_can_funding_received"]["funding"])
                creator_name = f"{event_user.first_name} {event_user.last_name}"
                history_event = CANHistory(
                    can_id=event.event_details["new_can_funding_received"]["can_id"],
                    ops_event_id=event.id,
                    history_title="Funding Received Added",
                    history_message=f"{creator_name} added funding received to funding ID {event.event_details['new_can_funding_received']['id']} in the amount of {funding}",
                    timestamp=event.created_on,
                    history_type=CANHistoryType.CAN_RECEIVED_CREATED,
                )
                session.add(history_event)
            case OpsEventType.UPDATE_CAN_FUNDING_RECEIVED:
                changes = event.event_details["funding_received_updates"]["changes"]
                if "funding" in changes:
                    funding_changes = changes["funding"]
                    old_funding = "${:,.2f}".format(funding_changes["old_value"])
                    new_funding = "${:,.2f}".format(funding_changes["new_value"])
                    history_event = CANHistory(
                        can_id=event.event_details["funding_received_updates"]["can_id"],
                        ops_event_id=event.id,
                        history_title="Funding Received Edited",
                        history_message=f"{event_user.full_name} edited funding received for funding ID {event.event_details['funding_received_updates']['funding_id']} from {old_funding} to {new_funding}",
                        timestamp=event.created_on,
                        history_type=CANHistoryType.CAN_RECEIVED_EDITED,
                    )
                    session.add(history_event)
            case OpsEventType.DELETE_CAN_FUNDING_RECEIVED:
                funding = "${:,.2f}".format(event.event_details["deleted_can_funding_received"]["funding"])
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
    except Exception as e:
        logger.info(f"Some unexpected exception was thronw while trying to create a CANHistory message. {e}")
    session.commit()


def format_fiscal_year(timestamp):
    """Convert the timestamp to FY {Fiscal Year}. The fiscal year is calendar year + 1 if the timestamp is october or later.
    This method can take either an iso format timestamp string or a datetime object"""
    current_fiscal_year = "FY"
    if isinstance(timestamp, str):
        parsed_timestamp = datetime.fromisoformat(timestamp[:-1]).astimezone(timezone.utc)
        current_fiscal_year = f"FY {parsed_timestamp.year}"
        if parsed_timestamp.month >= 10:
            current_fiscal_year = f"FY {parsed_timestamp.year + 1}"
    elif isinstance(timestamp, datetime):
        if timestamp.month >= 10:
            current_fiscal_year = f"FY {timestamp.year + 1}"
        else:
            current_fiscal_year = f"FY {timestamp.year}"

    return current_fiscal_year


def create_can_update_history_event(
    property_name, old_value, new_value, updated_by_user, updated_on, can_id, ops_event_id, session
):
    """A method that generates a CANHistory event for an updated property. In the case where the updated property is not one
    that has been designed for, it will instead be logged and None will be returned from the method."""
    match property_name:
        case "nick_name":
            return CANHistory(
                can_id=can_id,
                ops_event_id=ops_event_id,
                history_title="Nickname Edited",
                history_message=f"{updated_by_user.first_name} {updated_by_user.last_name} edited the nickname from {old_value} to {new_value}",
                timestamp=updated_on,
                history_type=CANHistoryType.CAN_NICKNAME_EDITED,
            )
        case "description":
            return CANHistory(
                can_id=can_id,
                ops_event_id=ops_event_id,
                history_title="Description Edited",
                history_message=f"{updated_by_user.first_name} {updated_by_user.last_name} edited the description",
                timestamp=updated_on,
                history_type=CANHistoryType.CAN_DESCRIPTION_EDITED,
            )
        case "portfolio_id":
            old_portfolio = session.get(Portfolio, old_value)
            new_portfolio = session.get(Portfolio, new_value)
            current_fiscal_year = format_fiscal_year(updated_on)
            return CANHistory(
                can_id=can_id,
                ops_event_id=ops_event_id,
                history_title="CAN Portfolio Edited",
                history_message=f"CAN portfolio changed from {old_portfolio.name} to {new_portfolio.name} during {current_fiscal_year} data import",
                timestamp=updated_on,
                history_type=CANHistoryType.CAN_PORTFOLIO_EDITED,
            )
        case _:
            logger.info(
                f"{property_name} edited by {updated_by_user.first_name} {updated_by_user.last_name} from {old_value} to {new_value}"
            )
            return None
