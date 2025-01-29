from datetime import datetime, timezone

from loguru import logger
from sqlalchemy.orm import Session

from models import CANHistory, CANHistoryType, OpsEvent, OpsEventStatus, OpsEventType, User


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

    parsed_timestamp = datetime.fromisoformat(timestamp[:-1]).astimezone(timezone.utc)
    current_fiscal_year = f"FY {parsed_timestamp.year}"
    if parsed_timestamp.month >= 10:
        current_fiscal_year = f"FY {parsed_timestamp.year + 1}"

    return current_fiscal_year
