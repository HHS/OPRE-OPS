import locale

from loguru import logger
from sqlalchemy.orm import Session

from models import CANHistory, CANHistoryType, OpsEvent, OpsEventStatus, OpsEventType, User


def can_history_trigger(
    event: OpsEvent,
    session: Session,
):
    locale.setlocale(locale.LC_ALL, "en_US.UTF-8")
    # Do not attempt to insert events into CAN History for failed or unknown status events
    if event.event_status == OpsEventStatus.FAILED or event.event_status == OpsEventStatus.UNKNOWN:
        return

    logger.debug(f"Handling event {event.event_type} with details: {event.event_details}")
    assert session is not None
    current_fiscal_year = event.created_on.year

    if event.created_on.month >= 10:
        current_fiscal_year = current_fiscal_year + 1  # If we are in October, this event is the new fiscal year.

    event_user = session.get(User, event.created_by)

    match event.event_type:
        case OpsEventType.CREATE_NEW_CAN:
            history_event = CANHistory(
                can_id=event.event_details["new_can"]["id"],
                ops_event_id=event.id,
                history_title=f"FY {current_fiscal_year} Data Import",
                history_message=f"FY {current_fiscal_year} CAN Funding Information imported from CANBACs",
                timestamp=event.created_on,
                history_type=CANHistoryType.CAN_DATA_IMPORT,
            )
            session.add(history_event)
        case OpsEventType.CREATE_CAN_FUNDING_BUDGET:
            budget = "${:,.2f}".format(event.event_details["new_can_funding_budget"]["budget"])
            creator_name = event.event_details["new_can_funding_budget"]["created_by_user"]["full_name"]
            history_event = CANHistory(
                can_id=event.event_details["new_can_funding_budget"]["can"]["id"],
                ops_event_id=event.id,
                history_title=f"FY {current_fiscal_year} Budget Entered",
                history_message=f"{creator_name} entered a FY {current_fiscal_year} budget of {budget}",
                timestamp=event.created_on,
                history_type=CANHistoryType.CAN_FUNDING_CREATED,
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
    session.commit()
