from flask import current_app
from sqlalchemy import select

from models import CANHistory


class CANHistoryService:
    def get(self, can_id, limit, offset) -> list[CANHistory]:
        """
        Get a list of CAN History items for an individual can.
        """
        stmt = select(CANHistory).where(CANHistory.can_id == can_id).order_by(CANHistory.id).offset(offset).limit(limit)
        results = current_app.db_session.execute(stmt).all()
        return [can_history for result in results for can_history in result]
