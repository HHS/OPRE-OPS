from loguru import logger
from sqlalchemy.orm import Session

from models import OpsEvent


def can_history_trigger(
    event: OpsEvent,
    session: Session,
):
    logger.debug(f"Handling event {event.event_type} with details: {event.event_details}")
    assert session is not None
