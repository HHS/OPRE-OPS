"""Service for procurement tracker step operations."""

from typing import Any, Dict, Tuple

from flask import current_app
from loguru import logger
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from models import ProcurementTrackerStep, User
from ops_api.ops.services.ops_service import ResourceNotFoundError
from ops_api.ops.validation.procurement_tracker_validator import ProcurementTrackerValidator


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
        validator = ProcurementTrackerValidator()
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
