from flask import current_app
from sqlalchemy import select

from models import CANHistory


class CANHistoryService:
    def get(self, can_id, limit, offset, fiscal_year, sort_ascending=False) -> list[CANHistory]:
        """
        Get a list of CAN History items for an individual can.
        """
        stmt = select(CANHistory).where(CANHistory.can_id == can_id)
        if fiscal_year > 0:
            stmt = stmt.where(CANHistory.fiscal_year == fiscal_year)
        if sort_ascending:
            stmt = stmt.order_by(CANHistory.timestamp)
        else:
            stmt = stmt.order_by(CANHistory.timestamp.desc())
        stmt = stmt.offset(offset).limit(limit)
        results = current_app.db_session.execute(stmt).all()
        return [can_history for result in results for can_history in result]
