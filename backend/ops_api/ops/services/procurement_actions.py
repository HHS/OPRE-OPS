"""Service for procurement action operations."""

from typing import Optional

from flask import current_app
from loguru import logger
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from models import BudgetLineItem, ProcurementAction
from models.procurement_action import AwardType, ProcurementActionStatus
from ops_api.ops.services.ops_service import ResourceNotFoundError


class ProcurementActionService:
    """Service for procurement action operations."""

    def __init__(self, db_session=None):
        """
        Initialize ProcurementActionService with a database session.

        Args:
            db_session: SQLAlchemy session. If None, uses current_app.db_session
        """
        self.db_session = db_session or current_app.db_session

    def get(self, id: int) -> ProcurementAction:
        """
        Get an individual procurement action by id.

        Args:
            id: The procurement action ID

        Returns:
            ProcurementAction object

        Raises:
            NotFound: If procurement action doesn't exist
        """
        stmt = (
            select(ProcurementAction)
            .where(ProcurementAction.id == id)
            .options(
                selectinload(ProcurementAction.agreement),
                selectinload(ProcurementAction.agreement_mod),
                selectinload(ProcurementAction.procurement_shop),
                selectinload(ProcurementAction.budget_line_items),
                selectinload(ProcurementAction.requisitions),
            )
        )
        procurement_action = self.db_session.scalar(stmt)

        if procurement_action:
            return procurement_action
        else:
            raise ResourceNotFoundError("ProcurementAction", id)

    def _apply_agreement_filter(self, stmt, agreement_id):
        """Apply agreement_id filter to the query."""
        if agreement_id:
            agreement_ids = agreement_id if isinstance(agreement_id, list) else [agreement_id]
            stmt = stmt.where(ProcurementAction.agreement_id.in_(agreement_ids))
        return stmt

    def _apply_budget_line_item_filter(self, stmt, budget_line_item_id):
        """Apply budget_line_item_id filter to the query."""
        needs_bli_join = False
        if budget_line_item_id:
            bli_ids = budget_line_item_id if isinstance(budget_line_item_id, list) else [budget_line_item_id]
            stmt = stmt.join(BudgetLineItem, ProcurementAction.id == BudgetLineItem.procurement_action_id).where(
                BudgetLineItem.id.in_(bli_ids)
            )
            needs_bli_join = True
        return stmt, needs_bli_join

    def _apply_status_filter(self, stmt, status):
        """Apply status filter to the query. Returns None if invalid status provided."""
        if status:
            status_list = status if isinstance(status, list) else [status]
            try:
                status_enums = [ProcurementActionStatus[s] for s in status_list]
                stmt = stmt.where(ProcurementAction.status.in_(status_enums))
            except KeyError as e:
                logger.warning(f"Invalid status value: {e}")
                return None  # Signal to return empty result
        return stmt

    def _apply_award_type_filter(self, stmt, award_type):
        """Apply award_type filter to the query. Returns None if invalid award_type provided."""
        if award_type:
            award_type_list = award_type if isinstance(award_type, list) else [award_type]
            try:
                award_type_enums = [AwardType[at] for at in award_type_list]
                stmt = stmt.where(ProcurementAction.award_type.in_(award_type_enums))
            except KeyError as e:
                logger.warning(f"Invalid award_type value: {e}")
                return None  # Signal to return empty result
        return stmt

    def _apply_procurement_shop_filter(self, stmt, procurement_shop_id):
        """Apply procurement_shop_id filter to the query."""
        if procurement_shop_id:
            shop_ids = procurement_shop_id if isinstance(procurement_shop_id, list) else [procurement_shop_id]
            stmt = stmt.where(ProcurementAction.procurement_shop_id.in_(shop_ids))
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
        budget_line_item_id: Optional[list[int]] = None,
        status: Optional[list[str]] = None,
        award_type: Optional[list[str]] = None,
        procurement_shop_id: Optional[list[int]] = None,
        limit: Optional[int] = None,
        offset: Optional[int] = None,
    ) -> tuple[list[ProcurementAction], dict[str, int]]:
        """
        Get a list of procurement actions with optional filtering and pagination.

        Args:
            agreement_id: Filter by agreement IDs
            budget_line_item_id: Filter by budget line item IDs
            status: Filter by status values
            award_type: Filter by award type values
            procurement_shop_id: Filter by procurement shop IDs
            limit: Maximum number of results
            offset: Number of results to skip

        Returns:
            Tuple of (list of ProcurementAction objects, metadata dict with total count)
        """
        # Build base query
        stmt = select(ProcurementAction).options(
            selectinload(ProcurementAction.agreement),
            selectinload(ProcurementAction.agreement_mod),
            selectinload(ProcurementAction.procurement_shop),
            selectinload(ProcurementAction.budget_line_items),
        )

        # Apply filters
        stmt = self._apply_agreement_filter(stmt, agreement_id)

        stmt, needs_bli_join = self._apply_budget_line_item_filter(stmt, budget_line_item_id)

        stmt = self._apply_status_filter(stmt, status)
        if stmt is None:
            return [], {"total_count": 0}

        stmt = self._apply_award_type_filter(stmt, award_type)
        if stmt is None:
            return [], {"total_count": 0}

        stmt = self._apply_procurement_shop_filter(stmt, procurement_shop_id)

        # Get total count before pagination
        if needs_bli_join:
            count_stmt = select(func.count(func.distinct(ProcurementAction.id))).select_from(stmt.subquery())
        else:
            count_stmt = select(func.count()).select_from(stmt.subquery())

        total_count = self.db_session.scalar(count_stmt) or 0

        # Apply pagination
        stmt = self._apply_pagination(stmt, limit, offset)

        # If we joined with BudgetLineItem, ensure distinct results
        if needs_bli_join:
            stmt = stmt.distinct()

        # Execute query
        results = self.db_session.execute(stmt).scalars().all()

        return list(results), {"total_count": total_count}
