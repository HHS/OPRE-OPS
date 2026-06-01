from typing import Any

from flask import current_app
from sqlalchemy import func, select

from models import ProjectHistory


class ProjectHistoryService:
    def get(self, project_id, limit, offset, sort_ascending: bool = False) -> tuple[list[ProjectHistory], dict]:
        """Get a paginated list of Project History items for a single project."""
        stmt = select(ProjectHistory).where(ProjectHistory.project_id_record == project_id)

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_count = current_app.db_session.scalar(count_stmt) or 0

        if sort_ascending:
            stmt = stmt.order_by(ProjectHistory.timestamp)
        else:
            stmt = stmt.order_by(ProjectHistory.timestamp.desc())
        stmt = stmt.offset(offset).limit(limit)
        results = current_app.db_session.execute(stmt).all()
        items = [project_history for result in results for project_history in result]
        return items, {"count": total_count, "limit": limit, "offset": offset}

    def create(self, create_request: dict[str, Any]) -> ProjectHistory:
        """Required by OpsService protocol but not implemented yet."""
        raise NotImplementedError("Method not implemented")

    def update(self, id: int, updated_fields: dict[str, Any]) -> tuple[ProjectHistory, int]:
        """Required by OpsService protocol but not implemented yet."""
        raise NotImplementedError("Method not implemented")

    def delete(self, id: int) -> None:
        """Required by OpsService protocol but not implemented yet."""
        raise NotImplementedError("Method not implemented")
