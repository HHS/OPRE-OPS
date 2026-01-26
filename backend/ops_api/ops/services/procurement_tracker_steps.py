"""Service for procurement tracker step operations."""

from typing import Any, Dict, Optional, Tuple

from flask import current_app
from loguru import logger
from sqlalchemy import Select, func, select
from sqlalchemy.orm import selectinload

from models import ProcurementTrackerStep, User
from ops_api.ops.services.ops_service import ResourceNotFoundError
from ops_api.ops.validation.procurement_tracker_steps_validator import ProcurementTrackerStepsValidator


class ProcurementTrackerStepService:
    """Service for procurement tracker step operations."""

    def __init__(self, db_session=None):
        """
        Initialize ProcurementTrackerStepService with a database session.

        Args:
            db_session: SQLAlchemy session. If None, uses current_app.db_session
        """
        self.db_session = db_session or current_app.db_session

    def get(self, id: int) -> ProcurementTrackerStep:
        """
        Get an individual procurement tracker step by id.

        Args:
            id: The procurement tracker step ID

        Returns:
            ProcurementTrackerStep object

        Raises:
            ResourceNotFoundError: If procurement tracker step doesn't exist
        """
        stmt = (
            select(ProcurementTrackerStep)
            .where(ProcurementTrackerStep.id == id)
            .options(
                selectinload(ProcurementTrackerStep.procurement_tracker),
            )
        )
        step = self.db_session.scalar(stmt)

        if step:
            return step
        else:
            raise ResourceNotFoundError("ProcurementTrackerStep", id)

    def update(self, id: int, data: Dict[str, Any], current_user: User) -> Tuple[ProcurementTrackerStep, int]:
        """
        Update a procurement tracker step.

        Args:
            id: The procurement tracker step ID
            data: Dictionary of fields to update

        Returns:
            Tuple of (updated ProcurementTrackerStep object, HTTP status code)

        Raises:
            ResourceNotFoundError: If procurement tracker step doesn't exist
        """
        logger.debug(f"Updating procurement tracker step {id} with data: {data}")

        step = self.get(id)
        validator = ProcurementTrackerStepsValidator()
        validator.validate_step(
            procurement_tracker=step,
            user=current_user,
            updated_fields=data,
            db_session=self.db_session,
        )
        # Map API field names to model field names for step-specific fields
        field_mapping = {
            "task_completed_by": "acquisition_planning_task_completed_by",
            "date_completed": "acquisition_planning_date_completed",
            "notes": "acquisition_planning_notes",
        }

        # Update fields
        for key, value in data.items():
            # Use mapped field name if it exists, otherwise use the original key
            model_field = field_mapping.get(key, key)

            if hasattr(step, model_field):
                setattr(step, model_field, value)
                logger.debug(f"Set {model_field} = {value}")
            else:
                logger.warning(f"Field {model_field} does not exist on ProcurementTrackerStep")

        # Commit changes
        self.db_session.commit()
        self.db_session.refresh(step)

        logger.debug(f"Successfully updated procurement tracker step {id}")

        return step, 200

    def _apply_agreement_filter(self, stmt: Select[tuple[ProcurementTrackerStep]], agreement_id: list[int] | int):
        """Apply agreement_id filter to the query."""
        if agreement_id:
            from models import ProcurementTracker

            agreement_ids = agreement_id if isinstance(agreement_id, list) else [agreement_id]
            # Use join and where clause to filter by agreement_id through the relationship
            stmt = stmt.join(ProcurementTrackerStep.procurement_tracker).where(
                ProcurementTracker.agreement_id.in_(agreement_ids)
            )
        return stmt

    def _apply_pagination(
        self, stmt: Select[tuple[ProcurementTrackerStep]], limit: list[int] | int, offset: list[int] | int
    ):
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
        limit: Optional[list[int] | int] = None,
        offset: Optional[list[int] | int] = None,
    ) -> tuple[list[ProcurementTrackerStep], dict[str, int]]:
        """
        Get a list of procurement tracker steps with optional filtering and pagination.

        Args:
            agreement_id: Filter by agreement IDs
            limit: Maximum number of results
            offset: Number of results to skip

        Returns:
            Tuple of (list of ProcurementTrackerStep objects, metadata dict with count/limit/offset)
        """
        # Build base query with eager loading
        stmt = select(ProcurementTrackerStep).options(
            selectinload(ProcurementTrackerStep.procurement_tracker),
        )

        # Extract pagination values
        limit_value = limit[0] if limit and isinstance(limit, list) else (limit or 10)
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
