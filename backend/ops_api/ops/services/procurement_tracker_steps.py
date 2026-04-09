"""Service for procurement tracker step operations."""

from datetime import date
from typing import Any, Dict, Optional, Tuple

from flask import current_app
from loguru import logger
from sqlalchemy import Select, func, select
from sqlalchemy.orm import selectinload

from models import (
    AwardType,
    OpsEvent,
    OpsEventStatus,
    OpsEventType,
    ProcurementAction,
    ProcurementActionStatus,
    ProcurementTrackerStatus,
    ProcurementTrackerStep,
    ProcurementTrackerStepStatus,
    ProcurementTrackerStepType,
    User,
)
from models.utils import generate_events_update
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

    def update(  # noqa: C901
        self, id: int, data: Dict[str, Any], current_user: User
    ) -> Tuple[ProcurementTrackerStep, int]:
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
        validator.update_validators_for_step(step, data)
        validator.validate_step(
            procurement_tracker_step=step,
            user=current_user,
            updated_fields=data,
            db_session=self.db_session,
        )
        # Capture old state of approval fields before any modifications
        # Used to detect state transitions for notification logic
        old_approval_requested = step.pre_award_approval_requested
        old_approval_status = step.pre_award_approval_status
        # Map API field names to model field names for step-specific fields
        field_mapping = {
            "acquisition_planning": {
                "task_completed_by": "acquisition_planning_task_completed_by",
                "date_completed": "acquisition_planning_date_completed",
                "notes": "acquisition_planning_notes",
            },
            "pre_solicitation": {
                "task_completed_by": "pre_solicitation_task_completed_by",
                "date_completed": "pre_solicitation_date_completed",
                "notes": "pre_solicitation_notes",
                "target_completion_date": "pre_solicitation_target_completion_date",
                "draft_solicitation_date": "pre_solicitation_draft_solicitation_date",
            },
            "solicitation": {
                "task_completed_by": "solicitation_task_completed_by",
                "date_completed": "solicitation_date_completed",
                "notes": "solicitation_notes",
                "solicitation_period_start_date": "solicitation_period_start_date",
                "solicitation_period_end_date": "solicitation_period_end_date",
            },
            "evaluation": {
                "task_completed_by": "evaluation_task_completed_by",
                "date_completed": "evaluation_date_completed",
                "notes": "evaluation_notes",
                "target_completion_date": "evaluation_target_completion_date",
            },
            "pre_award": {
                "task_completed_by": "pre_award_task_completed_by",
                "date_completed": "pre_award_date_completed",
                "notes": "pre_award_notes",
                "target_completion_date": "pre_award_target_completion_date",
                "approval_requested": "pre_award_approval_requested",
                "approval_requested_date": "pre_award_approval_requested_date",
                "approval_requested_by": "pre_award_approval_requested_by",
                "requestor_notes": "pre_award_requestor_notes",
                "approval_status": "pre_award_approval_status",
                "approval_responded_by": "pre_award_approval_responded_by",
                "approval_responded_date": "pre_award_approval_responded_date",
                "reviewer_notes": "pre_award_approval_reviewer_notes",
            },
        }

        if step.step_type == ProcurementTrackerStepType.ACQUISITION_PLANNING:
            active_mapping = field_mapping["acquisition_planning"]
        elif step.step_type == ProcurementTrackerStepType.PRE_SOLICITATION:
            active_mapping = field_mapping["pre_solicitation"]
        elif step.step_type == ProcurementTrackerStepType.SOLICITATION:
            active_mapping = field_mapping["solicitation"]
        elif step.step_type == ProcurementTrackerStepType.EVALUATION:
            active_mapping = field_mapping["evaluation"]
        elif step.step_type == ProcurementTrackerStepType.PRE_AWARD:
            active_mapping = field_mapping["pre_award"]
        else:
            active_mapping = {}

        # Update fields
        for key, value in data.items():
            # Use mapped field name if it exists, otherwise use the original key
            model_field = active_mapping.get(key, None)

            if model_field and hasattr(step, model_field):
                setattr(step, model_field, value)
                logger.debug(f"Set {model_field} = {value}")
            elif hasattr(step, key):
                # For fields that do not need to be mapped
                setattr(step, key, value)
            else:
                logger.warning(f"Field {model_field} does not exist on ProcurementTrackerStep")

        # Always set approval_requested_by to current user when approval is requested
        # This is server-controlled and never accepted from the client
        if data.get("approval_requested") is True:
            # Clear previous response fields to allow new review cycle (e.g., after decline)
            step.pre_award_approval_status = None
            step.pre_award_approval_responded_by = None
            step.pre_award_approval_responded_date = None
            step.pre_award_approval_reviewer_notes = None
            logger.debug("Cleared previous approval response fields for new request")

            step.pre_award_approval_requested_by = current_user.id
            logger.debug(f"Set pre_award_approval_requested_by = {current_user.id} (server-controlled)")

        # Always set approval_responded_by and date when approval_status is set
        # These are server-controlled and never accepted from the client
        if data.get("approval_status") in ["APPROVED", "DECLINED"]:
            step.pre_award_approval_responded_by = current_user.id
            step.pre_award_approval_responded_date = date.today()
            logger.debug(
                f"Set pre_award_approval_responded_by = {current_user.id}, "
                f"pre_award_approval_responded_date = {date.today()} (server-controlled)"
            )

        # Handle COMPLETED status
        self._advance_active_step_if_needed(step, data, current_user)

        # Commit changes
        self.db_session.commit()
        self.db_session.refresh(step)

        # Handle approval notifications after commit
        self._handle_approval_notifications(
            step,
            data,
            current_user,
            old_approval_requested=old_approval_requested,
            old_approval_status=old_approval_status,
        )

        logger.debug(f"Successfully updated procurement tracker step {id}")

        return step, 200

    def _advance_active_step_if_needed(self, step, data, current_user: User):
        if data.get("status") == ProcurementTrackerStepStatus.COMPLETED or (
            isinstance(data.get("status"), str) and data.get("status") == "COMPLETED"
        ):
            # Set step_completed_date to today
            step.step_completed_date = date.today()
            logger.debug(f"Set step_completed_date to {date.today()}")

            # Get the procurement tracker and all its steps
            procurement_tracker = step.procurement_tracker

            # Capture old state before making changes
            old_tracker_dict = procurement_tracker.to_dict()
            tracker_modified = False

            all_steps = sorted(procurement_tracker.steps, key=lambda s: s.step_number)
            total_steps = len(all_steps)

            # Check if this is not the final step
            if step.step_number < total_steps:
                # Increment active_step_number in the procurement tracker
                procurement_tracker.active_step_number = step.step_number + 1
                tracker_modified = True
                logger.debug(f"Incremented active_step_number to {procurement_tracker.active_step_number}")

                # Find the next step and set its step_start_date to today
                next_step = next((s for s in all_steps if s.step_number == step.step_number + 1), None)
                if next_step:
                    next_step.step_start_date = date.today()
                    logger.debug(f"Set next step (step {next_step.step_number}) step_start_date to {date.today()}")
            else:
                logger.debug("This is the final step; marking procurement tracker as completed.")
                procurement_tracker.status = ProcurementTrackerStatus.COMPLETED
                tracker_modified = True

                if procurement_tracker.procurement_action:
                    procurement_action = self.db_session.get(ProcurementAction, procurement_tracker.procurement_action)
                    if procurement_action and procurement_action.award_type == AwardType.NEW_AWARD:
                        procurement_action.status = ProcurementActionStatus.AWARDED
                        procurement_action.date_awarded_obligated = date.today()
                        logger.debug(f"Set procurement action status to AWARDED and award_date to {date.today()}")

            # Create UPDATE_PROCUREMENT_TRACKER event if tracker was modified
            if tracker_modified:
                self._create_update_procurement_tracker_event(procurement_tracker, old_tracker_dict, current_user)

    def _create_update_procurement_tracker_event(
        self, procurement_tracker, old_tracker_dict: dict, current_user: User
    ) -> None:
        """
        Create an UPDATE_PROCUREMENT_TRACKER event for tracker changes.

        Args:
            procurement_tracker: The updated ProcurementTracker instance
            old_tracker_dict: Dictionary of the tracker's state before update
            current_user: User making the update
        """
        # Generate event updates comparing old and new state
        events_update = generate_events_update(
            old_tracker_dict, procurement_tracker.to_dict(), procurement_tracker.agreement_id, current_user.id
        )

        # Create the event
        event = OpsEvent(
            event_type=OpsEventType.UPDATE_PROCUREMENT_TRACKER,
            event_status=OpsEventStatus.SUCCESS,
            created_by=current_user.id,
            event_details={
                "procurement_tracker_updates": events_update,
                "procurement_tracker": procurement_tracker.to_dict(),
            },
        )
        self.db_session.add(event)
        logger.debug(
            f"Created UPDATE_PROCUREMENT_TRACKER event for tracker {procurement_tracker.id} "
            f"(agreement {procurement_tracker.agreement_id})"
        )

    def _handle_approval_notifications(
        self,
        step: ProcurementTrackerStep,
        data: Dict[str, Any],
        current_user: User,
        old_approval_requested: Optional[bool] = None,
        old_approval_status: Optional[str] = None,
    ) -> None:
        """
        Send notifications when approval is requested or responded to.

        Only sends notifications when state TRANSITIONS occur:
        - Approval request: when pre_award_approval_requested changes from False/None → True
        - Approval response: when pre_award_approval_status changes to APPROVED/DECLINED for first time

        Args:
            step: The updated procurement tracker step
            data: The update data
            current_user: User making the update
            old_approval_requested: Previous value of pre_award_approval_requested before update
            old_approval_status: Previous value of pre_award_approval_status before update
        """
        from models import NotificationType
        from ops_api.ops.services.notifications import NotificationService

        notification_service = NotificationService(self.db_session)
        agreement = step.procurement_tracker.agreement

        # Case 1: Approval was just requested - notify reviewers
        # Only send if approval_requested changed from False/None → True
        new_approval_requested = data.get("approval_requested") is True and step.pre_award_approval_requested
        approval_request_transitioned = new_approval_requested and (
            old_approval_requested is None or old_approval_requested is False
        )

        if approval_request_transitioned:
            recipient_ids = self._get_approval_reviewers(agreement)

            fe_url = current_app.config.get("OPS_FRONTEND_URL", "http://localhost:3000")
            review_url = f"{fe_url}/agreements/{agreement.id}/review-pre-award"

            for recipient_id in recipient_ids:
                notification_service.create(
                    {
                        "title": "Pre-Award Approval Request",
                        "message": (
                            f"A pre-award approval has been requested for Agreement {agreement.display_name}. "
                            f"Please review and respond.\n\n[Review Request]({review_url})"
                        ),
                        "is_read": False,
                        "recipient_id": recipient_id,
                        "notification_type": NotificationType.NOTIFICATION,
                    }
                )
            logger.debug(f"Created {len(recipient_ids)} pre-award approval request notifications")

        # Case 2: Approval was approved/declined - notify submitter
        # Only send if approval_status changed from None → APPROVED/DECLINED
        new_approval_status = data.get("approval_status")
        approval_response_transitioned = new_approval_status in ["APPROVED", "DECLINED"] and old_approval_status is None

        if approval_response_transitioned:
            status_text = "approved" if new_approval_status == "APPROVED" else "declined"

            if step.pre_award_approval_requested_by:
                notification_service.create(
                    {
                        "title": f"Pre-Award Approval {status_text.capitalize()}",
                        "message": (
                            f"Your pre-award approval request for Agreement {agreement.display_name} "
                            f"has been {status_text} by {current_user.full_name}."
                        ),
                        "is_read": False,
                        "recipient_id": step.pre_award_approval_requested_by,
                        "notification_type": NotificationType.NOTIFICATION,
                    }
                )
                logger.debug(f"Created pre-award approval {status_text} notification for submitter")

    def _get_approval_reviewers(self, agreement) -> set[int]:
        """
        Get user IDs who can approve pre-award requests.

        Returns IDs of Division Directors, Deputy Division Directors,
        Budget Team, and System Owners.

        Args:
            agreement: The agreement to get reviewers for

        Returns:
            Set of user IDs authorized to review
        """
        from sqlalchemy import select

        from models import Role
        from ops_api.ops.utils.agreements_helpers import get_division_directors_for_agreement

        reviewer_ids = set()

        # Get division directors for the agreement
        directors, deputies = get_division_directors_for_agreement(agreement)
        reviewer_ids.update(directors)
        reviewer_ids.update(deputies)

        # Get BUDGET_TEAM and SYSTEM_OWNER users
        role_based_users = (
            self.db_session.execute(
                select(User.id).where(User.roles.any(Role.name.in_(["BUDGET_TEAM", "SYSTEM_OWNER"])))
            )
            .scalars()
            .all()
        )
        reviewer_ids.update(role_based_users)

        return reviewer_ids

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

    def get_pending_approvals_for_user(self, user_id: int) -> list[ProcurementTrackerStep]:
        """
        Get all pending pre-award approval requests that a user can review.

        Args:
            user_id: The user ID to check permissions for

        Returns:
            List of ProcurementTrackerStep objects with pending approvals
        """
        from sqlalchemy import and_, or_

        from models import (
            CAN,
            Agreement,
            BudgetLineItem,
            DefaultProcurementTrackerStep,
            Division,
            Portfolio,
            ProcurementTracker,
        )

        # Get user roles first
        user = self.db_session.get(User, user_id)
        if not user:
            return []

        user_role_names = [role.name for role in user.roles]

        # Build base query for steps with pending pre-award approvals
        # Use DefaultProcurementTrackerStep since pre_award_approval_requested is on the subclass
        stmt = (
            select(DefaultProcurementTrackerStep)
            .join(DefaultProcurementTrackerStep.procurement_tracker)
            .join(ProcurementTracker.agreement)
            .options(
                selectinload(DefaultProcurementTrackerStep.procurement_tracker).selectinload(
                    ProcurementTracker.agreement
                ),
            )
            .where(
                and_(
                    DefaultProcurementTrackerStep.step_type == ProcurementTrackerStepType.PRE_AWARD,
                    DefaultProcurementTrackerStep.pre_award_approval_requested.is_(True),
                    or_(
                        DefaultProcurementTrackerStep.pre_award_approval_status.is_(None),
                        DefaultProcurementTrackerStep.pre_award_approval_status == "PENDING",
                    ),
                )
            )
        )

        # If user is BUDGET_TEAM or SYSTEM_OWNER, they can see all pending approvals
        if "BUDGET_TEAM" in user_role_names or "SYSTEM_OWNER" in user_role_names:
            results = self.db_session.execute(stmt.distinct()).scalars().all()
            return list(results)

        # For REVIEWER_APPROVER role or division directors/deputies, filter by division
        if "REVIEWER_APPROVER" in user_role_names:
            # Add joins to reach division table
            stmt = (
                stmt.outerjoin(Agreement.budget_line_items)
                .outerjoin(BudgetLineItem.can)
                .outerjoin(CAN.portfolio)
                .outerjoin(Portfolio.division)
                .where(
                    or_(
                        Division.division_director_id == user_id,
                        Division.deputy_division_director_id == user_id,
                    )
                )
            )
            results = self.db_session.execute(stmt.distinct()).scalars().all()
            return list(results)

        # For all other users, allow access when they are the division director/deputy
        # for the related agreement. This keeps the pending approvals list aligned
        # with reviewer notification recipients.
        stmt = (
            stmt.outerjoin(Agreement.budget_line_items)
            .outerjoin(BudgetLineItem.can)
            .outerjoin(CAN.portfolio)
            .outerjoin(Portfolio.division)
            .where(
                or_(
                    Division.division_director_id == user_id,
                    Division.deputy_division_director_id == user_id,
                )
            )
        )
        results = self.db_session.execute(stmt.distinct()).scalars().all()
        return list(results)
