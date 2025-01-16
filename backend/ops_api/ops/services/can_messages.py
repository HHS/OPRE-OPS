from loguru import logger
from sqlalchemy.orm import Session

from models import CANHistory, CANHistoryType, OpsEvent, OpsEventType


def can_history_trigger(
    event: OpsEvent,
    session: Session,
):
    logger.debug(f"Handling event {event.event_type} with details: {event.event_details}")
    assert session is not None
    current_fiscal_year = event.created_on.year

    if event.created_on.month >= 10:
        current_fiscal_year = current_fiscal_year + 1  # If we are in October, this event is the new fiscal year.

    match event.event_type:
        case OpsEventType.CREATE_NEW_CAN:
            history_event = CANHistory(
                can_id=event.event_details["new_can"]["id"],
                ops_event_id=event.id,
                history_title=f"**FY {current_fiscal_year} Data Import**",
                history_message=f"FY {current_fiscal_year} CAN Funding Information imported from CANBACs",
                timestamp=event.created_on,
                history_type=CANHistoryType.CAN_DATA_IMPORT,
            )
            session.add(history_event)
        case OpsEventType.CREATE_CAN_FUNDING_BUDGET:
            history_event = CANHistory(
                can_id=event.event_details["new_can_funding_budget"]["can"]["id"],
                ops_event_id=event.id,
                history_title=f"**FY {current_fiscal_year} Budget Entered**",
                history_message=f"System Owner entered a FY {current_fiscal_year} budget of $10,000.00",
                timestamp=event.created_on,
                history_type=CANHistoryType.CAN_FUNDING_CREATED,
            )
            session.add(history_event)
    session.commit()
