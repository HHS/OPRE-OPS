from flask import current_app
from sqlalchemy import select

from models import CANHistory


class CANHistoryService:
    def get(self, can_id, limit, offset) -> list[CANHistory]:
        """
        Get a list of CAN History items for an .
        """
        stmt = select(CANHistory).order_by(CANHistory.id)
        results = current_app.db_session.execute(stmt).limit(limit).offset(offset).all()
        return [can_history for result in results for can_history in result]
