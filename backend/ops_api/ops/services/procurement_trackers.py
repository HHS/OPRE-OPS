"""Service for procurement tracker operations."""

from typing import Optional

from flask import current_app
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from models import ProcurementTracker
from ops_api.ops.services.ops_service import ResourceNotFoundError


class ProcurementTrackerService:
    """Service for procurement tracker operations."""

    def __init__(self, db_session=None):
        """
        Initialize ProcurementTrackerService with a database session.

        Args:
            db_session: SQLAlchemy session. If None, uses current_app.db_session
        """
        self.db_session = db_session or current_app.db_session

    def get(self, id: int) -> ProcurementTracker:
        """
        Get an individual procurement tracker by id.

        Args:
            id: The procurement tracker ID

        Returns:
            ProcurementTracker object with eagerly loaded steps

        Raises:
            ResourceNotFoundError: If procurement tracker doesn't exist
        """
        stmt = (
            select(ProcurementTracker)
            .where(ProcurementTracker.id == id)
            .options(
                selectinload(ProcurementTracker.steps),
            )
        )
        procurement_tracker = self.db_session.scalar(stmt)

        if procurement_tracker:
            return procurement_tracker
        else:
            raise ResourceNotFoundError("ProcurementTracker", id)

    def _apply_agreement_filter(self, stmt, agreement_id):
        """Apply agreement_id filter to the query."""
        if agreement_id:
            agreement_ids = agreement_id if isinstance(agreement_id, list) else [agreement_id]
            stmt = stmt.where(ProcurementTracker.agreement_id.in_(agreement_ids))
        return stmt

    def _apply_pagination(self, stmt, limit, offset):
        """Apply pagination to the query."""
        if limit is not None:
            limit_value = limit[0] if isinstance(limit, list) else limit
            stmt = stmt.limit(limit_value)

        if offset is not None:
            offset_value = offset[0] if isinstance(offset, list) else offset
            stmt = stmt.offset(offset_value)

        return stmt

    def get_list(
        self,
        agreement_id: Optional[list[int]] = None,
        limit: Optional[int] = None,
        offset: Optional[int] = None,
    ) -> tuple[list[ProcurementTracker], dict[str, int]]:
        """
        Get a list of procurement trackers with optional filtering and pagination.

        Args:
            agreement_id: Filter by agreement IDs
            limit: Maximum number of results
            offset: Number of results to skip

        Returns:
            Tuple of (list of ProcurementTracker objects, metadata dict with count/limit/offset)
        """
        # Build base query with eager loading
        stmt = select(ProcurementTracker).options(
            selectinload(ProcurementTracker.steps),
        )

        # Extract pagination values
        limit_value = limit[0] if limit and isinstance(limit, list) else (limit or 0)
        offset_value = offset[0] if offset and isinstance(offset, list) else (offset or 0)

        # Apply filters
        stmt = self._apply_agreement_filter(stmt, agreement_id)

        # Get total count before pagination
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_count = self.db_session.scalar(count_stmt) or 0

        # Apply pagination
        stmt = self._apply_pagination(stmt, limit, offset)

        # Execute query
        results = self.db_session.execute(stmt).scalars().all()

        metadata = {
            "count": total_count,
            "limit": limit_value,
            "offset": offset_value,
        }

        return list(results), metadata
