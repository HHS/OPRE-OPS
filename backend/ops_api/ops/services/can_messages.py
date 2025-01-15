from loguru import logger
from sqlalchemy.orm import Session

from models import CANHistory, CANHistoryType, OpsEvent


def can_history_trigger(
    event: OpsEvent,
    session: Session,
):
    logger.debug(f"Handling event {event.event_type} with details: {event.event_details}")
    assert session is not None
    history_event = CANHistory(
        can_id=event.event_details["new_can"]["id"],
        ops_event_id=event.id,
        history_title="**FY 2025 Data Import**",
        history_message="FY 2025 CAN Funding Information imported from CANBACs",
        timestamp=event.created_on,
        history_type=CANHistoryType.CAN_DATA_IMPORT,
    )
    session.add(history_event)
    session.commit()
