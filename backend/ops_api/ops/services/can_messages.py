from loguru import logger
from sqlalchemy.orm import Session

from models import OpsEvent, can_history_trigger_func
from ops_api.ops.utils.users import get_sys_user


def can_history_trigger(
    event: OpsEvent,
    session: Session,
):
    try:
        sys_user = get_sys_user(session)
        can_history_trigger_func(event, session, sys_user)
    except Exception as e:
        logger.error(f"Error in can_history_trigger: {e}")
