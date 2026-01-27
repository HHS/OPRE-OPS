from loguru import logger
from sqlalchemy.orm import Session

from models import OpsEvent, agreement_history_trigger_func
from ops_api.ops.utils.users import get_sys_user


def agreement_history_trigger(
    event: OpsEvent,
    session: Session,
):
    try:
        sys_user = get_sys_user(session)
        # Pass dry_run=True to prevent subscriber from committing
        # The outer transaction will handle the commit
        agreement_history_trigger_func(event, session, sys_user, dry_run=True)
    except Exception as e:
        logger.error(f"Error in agreement_history_trigger: {e}")
