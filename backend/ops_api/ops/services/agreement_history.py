from flask import current_app
from sqlalchemy import select

from models import AgreementHistory


class AgreementHistoryService:
    def get(self, agreement_id, limit, offset, sort_ascending=False) -> list[AgreementHistory]:
        """
        Get a list of Agreement History items for an individual agreement.
        """
        stmt = select(AgreementHistory).where(AgreementHistory.agreement_id_record == agreement_id)
        if sort_ascending:
            stmt = stmt.order_by(AgreementHistory.timestamp)
        else:
            stmt = stmt.order_by(AgreementHistory.timestamp.desc())
        stmt = stmt.offset(offset).limit(limit)
        results = current_app.db_session.execute(stmt).all()
        return [agreement_history for result in results for agreement_history in result]
