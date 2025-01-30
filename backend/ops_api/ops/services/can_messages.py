from loguru import logger
from sqlalchemy.orm import Session

from models import OpsEvent, can_history_trigger_func


def can_history_trigger(
    event: OpsEvent,
    session: Session,
):
    try:
        can_history_trigger_func(event, session)
    except Exception as e:
        logger.error(f"Error in can_history_trigger: {e}")
