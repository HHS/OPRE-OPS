from typing import Any

from sqlalchemy import func, select

from models import AgreementHistory


class AgreementHistoryService:
    def __init__(self, db_session):
        """
        Initialize the AgreementHistoryService.

        :param db_session:  The SQLAlchemy session to use for database operations.
        """
        self.db_session = db_session

    def get(self, agreement_id, limit, offset, sort_ascending=False) -> tuple[list[AgreementHistory], dict]:
        """
        Get a list of Agreement History items for an individual agreement.
        """
        stmt = select(AgreementHistory).where(AgreementHistory.agreement_id_record == agreement_id)

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_count = self.db_session.scalar(count_stmt) or 0

        if sort_ascending:
            stmt = stmt.order_by(AgreementHistory.timestamp)
        else:
            stmt = stmt.order_by(AgreementHistory.timestamp.desc())
        stmt = stmt.offset(offset).limit(limit)
        results = self.db_session.execute(stmt).all()
        items = [agreement_history for result in results for agreement_history in result]
        return items, {"count": total_count, "limit": limit, "offset": offset}

    def create(self, create_request: dict[str, Any]) -> AgreementHistory:
        """Required by OpsService protocol but not implemented yet."""
        raise NotImplementedError("Method not implemented")

    def update(self, id: int, updated_fields: dict[str, Any]) -> tuple[AgreementHistory, int]:
        """Required by OpsService protocol but not implemented yet."""
        raise NotImplementedError("Method not implemented")

    def delete(self, id: int) -> None:
        """Required by OpsService protocol but not implemented yet."""
        raise NotImplementedError("Method not implemented")
