from sqlalchemy.orm import Session

from models import OpsEvent, can_history_trigger_func


def can_history_trigger(
    event: OpsEvent,
    session: Session,
):
    can_history_trigger_func(event, session)
