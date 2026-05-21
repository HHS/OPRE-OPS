from flask import current_app
from sqlalchemy import func, select

from models import CANHistory


class CANHistoryService:
    def get(self, can_id, limit, offset, fiscal_year, sort_ascending=False) -> tuple[list[CANHistory], dict]:
        """
        Get a list of CAN History items for an individual can.
        """
        stmt = select(CANHistory).where(CANHistory.can_id == can_id)
        if fiscal_year > 0:
            stmt = stmt.where(CANHistory.fiscal_year == fiscal_year)

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_count = current_app.db_session.scalar(count_stmt) or 0

        if sort_ascending:
            stmt = stmt.order_by(CANHistory.timestamp)
        else:
            stmt = stmt.order_by(CANHistory.timestamp.desc())
        stmt = stmt.offset(offset).limit(limit)
        results = current_app.db_session.execute(stmt).all()
        items = [can_history for result in results for can_history in result]
        return items, {"count": total_count, "limit": limit, "offset": offset}
