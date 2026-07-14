"""Service for procurement tracker step operations."""

from datetime import date
from typing import Any, Dict, Optional, Tuple

from flask import current_app
from loguru import logger
from sqlalchemy import Select, and_, func, or_, select
from sqlalchemy.orm import selectinload

from models import (
    Agreement,
    AwardType,
    DefaultProcurementTrackerStep,
    OpsEvent,
    OpsEventStatus,
    OpsEventType,
    ProcurementAction,
    ProcurementActionStatus,
    ProcurementTracker,
    ProcurementTrackerStatus,
    ProcurementTrackerStep,
    ProcurementTrackerStepStatus,
    ProcurementTrackerStepType,
    User,
)
from models.budget_line_items import BudgetLineItemStatus
from models.utils import generate_events_update
from ops_api.ops.services.notification_constants import AwardNotificationTitle, PreAwardNotificationTitle
from ops_api.ops.services.ops_service import ResourceNotFoundError
from ops_api.ops.validation.procurement_tracker_steps_validator import ProcurementTrackerStepsValidator


def escape_markdown(text: str) -> str:
    """
    Escape Markdown metacharacters for safe plain-text display.

    Ensures user-supplied text is displayed literally in both plain-text
    and ReactMarkdown contexts, preventing unintended formatting or links.

    Args:
        text: The text to escape

    Returns:
        Text with Markdown metacharacters escaped
    """
    # Escape backslash first to prevent double-escaping
    text = text.replace("\\", "\\\\")
    # Escape Markdown syntax characters
    text = text.replace("*", "\\*")  # Bold/italic
    text = text.replace("_", "\\_")  # Italic/bold
    text = text.replace("[", "\\[")  # Links
    text = text.replace("]", "\\]")
    text = text.replace("`", "\\`")  # Code
    text = text.replace("#", "\\#")  # Headers
    text = text.replace("+", "\\+")  # Lists
    text = text.replace("-", "\\-")  # Lists
    text = text.replace("!", "\\!")  # Images
    return text


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
        # Use with_polymorphic to enable loading of subclass relationships
        from sqlalchemy.orm import with_polymorphic

        poly = with_polymorphic(ProcurementTrackerStep, [DefaultProcurementTrackerStep])

        stmt = (
            select(poly)
            .where(poly.id == id)
            .options(
                selectinload(poly.procurement_tracker),
                # Load all user relationships that may be serialized
                selectinload(poly.DefaultProcurementTrackerStep.acquisition_planning_completed_by_user),
                selectinload(poly.DefaultProcurementTrackerStep.pre_solicitation_completed_by_user),
                selectinload(poly.DefaultProcurementTrackerStep.solicitation_completed_by_user),
                selectinload(poly.DefaultProcurementTrackerStep.evaluation_completed_by_user),
                selectinload(poly.DefaultProcurementTrackerStep.pre_award_completed_by_user),
                selectinload(poly.DefaultProcurementTrackerStep.pre_award_requested_by_user),
                selectinload(poly.DefaultProcurementTrackerStep.pre_award_approval_responded_by_user),
                selectinload(poly.DefaultProcurementTrackerStep.pre_award_requisition_approved_by_user),
                selectinload(poly.DefaultProcurementTrackerStep.award_completed_by_user),
                selectinload(poly.DefaultProcurementTrackerStep.award_approval_requested_by_user),
                selectinload(poly.DefaultProcurementTrackerStep.award_approval_responded_by_user),
                selectinload(poly.DefaultProcurementTrackerStep.award_vendor),
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
        old_requisition_approved_by = step.pre_award_requisition_approved_by
        # AWARD step captures (OPS-2280)
        old_award_approval_requested = step.award_approval_requested
        old_award_approval_status = step.award_approval_status
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
                # Budget team requisition fields (user-provided only)
                "requisition_number": "pre_award_requisition_number",
                "requisition_date": "pre_award_requisition_date",
                # requisition_approved_by and requisition_approved_date are SERVER-CONTROLLED
            },
            "award": {
                "task_completed_by": "award_task_completed_by",
                "date_completed": "award_date_completed",
                "notes": "award_notes",
                "target_completion_date": "award_target_completion_date",
                "approval_requested": "award_approval_requested",
                "approval_requested_date": "award_approval_requested_date",
                "approval_requested_by": "award_approval_requested_by",
                "requestor_notes": "award_requestor_notes",
                "approval_status": "award_approval_status",
                "approval_responded_by": "award_approval_responded_by",
                "approval_responded_date": "award_approval_responded_date",
                "reviewer_notes": "award_approval_reviewer_notes",
                # OPS-1640: Award vendor and contract information fields
                "vendor_id": "award_vendor_id",
                "contract_number": "award_contract_number",
                "award_amount": "award_amount",
                "award_date": "award_date",
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
        elif step.step_type == ProcurementTrackerStepType.AWARD:
            active_mapping = field_mapping["award"]
        else:
            active_mapping = {}

        # Server-control requisition approval audit fields
        # Must be checked BEFORE field mapping, since we need to detect the transition
        if step.step_type == ProcurementTrackerStepType.PRE_AWARD:
            self._handle_requisition_approval(step, data, current_user)

        # Pop request-only fields before field update loop (not model fields)
        data.pop("is_draft", None)
        obligated_date = data.pop("obligated_date", None)

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
        # Determine field prefix based on step type
        approval_prefix = None
        if step.step_type == ProcurementTrackerStepType.PRE_AWARD:
            approval_prefix = "pre_award_"
        elif step.step_type == ProcurementTrackerStepType.AWARD:
            approval_prefix = "award_"

        if approval_prefix and data.get("approval_requested") is True:
            # Clear previous response fields to allow new review cycle (e.g., after decline)
            setattr(step, f"{approval_prefix}approval_status", None)
            setattr(step, f"{approval_prefix}approval_responded_by", None)
            setattr(step, f"{approval_prefix}approval_responded_date", None)
            setattr(step, f"{approval_prefix}approval_reviewer_notes", None)
            logger.debug(f"Cleared previous {approval_prefix}approval response fields for new request")

            setattr(step, f"{approval_prefix}approval_requested_by", current_user.id)
            logger.debug(f"Set {approval_prefix}approval_requested_by = {current_user.id} (server-controlled)")

        # Always set approval_responded_by and date when approval_status is set
        # These are server-controlled and never accepted from the client
        if approval_prefix and data.get("approval_status") in ["APPROVED", "DECLINED"]:
            setattr(step, f"{approval_prefix}approval_responded_by", current_user.id)
            setattr(step, f"{approval_prefix}approval_responded_date", date.today())
            logger.debug(
                f"Set {approval_prefix}approval_responded_by = {current_user.id}, "
                f"{approval_prefix}approval_responded_date = {date.today()} (server-controlled)"
            )

        # Handle COMPLETED status
        self._advance_active_step_if_needed(step, data, current_user)

        # Flush to get IDs without committing (keeps transaction open)
        self.db_session.flush()

        # Handle approval notifications in same transaction
        self._handle_approval_notifications(
            step,
            data,
            current_user,
            old_approval_requested=old_approval_requested,
            old_approval_status=old_approval_status,
            old_requisition_approved_by=old_requisition_approved_by,
        )

        # Handle award-specific side effects (OPS-2280)
        if step.step_type == ProcurementTrackerStepType.AWARD:
            new_award_status = data.get("approval_status")
            self._handle_award_approval(step, new_award_status, obligated_date, current_user)
            self._handle_award_approval_notifications(
                step=step,
                data=data,
                current_user=current_user,
                old_award_approval_requested=old_award_approval_requested,
                old_award_approval_status=old_award_approval_status,
            )

        # Commit once after all operations (atomic transaction)
        self.db_session.commit()

        # Re-fetch with all relationships loaded using with_polymorphic
        from sqlalchemy.orm import with_polymorphic

        poly = with_polymorphic(ProcurementTrackerStep, [DefaultProcurementTrackerStep])

        stmt_reload = (
            select(poly)
            .where(poly.id == step.id)
            .options(
                selectinload(poly.procurement_tracker),
                # Load all user relationships that may be serialized
                selectinload(poly.DefaultProcurementTrackerStep.acquisition_planning_completed_by_user),
                selectinload(poly.DefaultProcurementTrackerStep.pre_solicitation_completed_by_user),
                selectinload(poly.DefaultProcurementTrackerStep.solicitation_completed_by_user),
                selectinload(poly.DefaultProcurementTrackerStep.evaluation_completed_by_user),
                selectinload(poly.DefaultProcurementTrackerStep.pre_award_completed_by_user),
                selectinload(poly.DefaultProcurementTrackerStep.pre_award_requested_by_user),
                selectinload(poly.DefaultProcurementTrackerStep.pre_award_approval_responded_by_user),
                selectinload(poly.DefaultProcurementTrackerStep.pre_award_requisition_approved_by_user),
                selectinload(poly.DefaultProcurementTrackerStep.award_completed_by_user),
                selectinload(poly.DefaultProcurementTrackerStep.award_approval_requested_by_user),
                selectinload(poly.DefaultProcurementTrackerStep.award_approval_responded_by_user),
                selectinload(poly.DefaultProcurementTrackerStep.award_vendor),
            )
        )
        step = self.db_session.scalar(stmt_reload)

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

                # Find the next step and set its step_start_date and status
                next_step = next((s for s in all_steps if s.step_number == step.step_number + 1), None)
                if next_step:
                    next_step.step_start_date = date.today()
                    next_step.status = ProcurementTrackerStepStatus.ACTIVE
                    logger.debug(f"Set next step (step {next_step.step_number}) step_start_date to {date.today()}")
                    logger.debug(f"Set next step (step {next_step.step_number}) status to ACTIVE")
            else:
                logger.debug("This is the final step; marking procurement tracker as completed.")
                procurement_tracker.status = ProcurementTrackerStatus.COMPLETED
                tracker_modified = True

                if procurement_tracker.procurement_action:
                    procurement_action = self.db_session.get(ProcurementAction, procurement_tracker.procurement_action)
                    if procurement_action and procurement_action.award_type == AwardType.NEW_AWARD:
                        # Only mark AWARDED on step completion if Budget Team has already approved
                        # (award_approval_status == "APPROVED"). If approval is still pending,
                        # the agreement will be awarded when Budget Team approves via _handle_award_approval.
                        if procurement_action.status == ProcurementActionStatus.AWARDED:
                            logger.debug(
                                "Procurement action already AWARDED by budget team approval — skipping on step completion"
                            )
                        elif (
                            isinstance(step, DefaultProcurementTrackerStep) and step.award_approval_status == "APPROVED"
                        ):
                            procurement_action.status = ProcurementActionStatus.AWARDED
                            if procurement_action.date_awarded_obligated is None:
                                procurement_action.date_awarded_obligated = date.today()
                                logger.debug(
                                    f"Set procurement action status to AWARDED and award_date to {date.today()}"
                                )
                        else:
                            logger.debug(
                                "Skipping AWARDED status on step completion — award approval not yet granted by Budget Team"
                            )

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

    def _handle_requisition_approval(self, step, data, current_user):
        """
        Detect when requisition is being approved and auto-set audit fields.

        Budget team approves by providing requisition_number and requisition_date.
        Approval triggers when BOTH fields are present AND is_draft flag is not True.

        When is_draft=True, the update is treated as a partial save and approval logic is skipped.
        This allows users to save requisition # and date separately without triggering approval.

        Args:
            step: The ProcurementTrackerStep being updated
            data: The update data dictionary
            current_user: User making the update
        """
        # Check if requisition fields are being modified
        requisition_fields_present = "requisition_number" in data or "requisition_date" in data

        # Enforce BUDGET_TEAM authorization for any requisition field modification
        if requisition_fields_present:
            from ops_api.ops.services.ops_service import AuthorizationError

            user_role_names = [role.name for role in current_user.roles]
            if "BUDGET_TEAM" not in user_role_names and "SYSTEM_OWNER" not in user_role_names:
                raise AuthorizationError(
                    f"User {current_user.id} does not have BUDGET_TEAM or SYSTEM_OWNER role required for requisition entry",
                    "ProcurementTrackerStep",
                )

        # Skip approval logic for draft saves
        is_draft_save = data.get("is_draft", False)
        if is_draft_save:
            logger.debug("Draft save detected (is_draft=True), skipping approval logic")
            return

        # Check if not already approved
        if step.pre_award_requisition_approved_by is not None:
            return  # Already approved, nothing to do

        # Get field values from update data or existing step
        new_requisition_number = data.get("requisition_number")
        new_requisition_date = data.get("requisition_date")

        # Determine if both fields will be present after this update
        requisition_number_present = new_requisition_number is not None or step.pre_award_requisition_number is not None
        requisition_date_present = new_requisition_date is not None or step.pre_award_requisition_date is not None

        # Trigger approval if EITHER field is being set in this update AND both fields will be present
        requisition_being_approved = (
            (new_requisition_number is not None or new_requisition_date is not None)  # Either field being set
            and requisition_number_present
            and requisition_date_present
        )

        if requisition_being_approved:
            # Verify BUDGET_TEAM or SYSTEM_OWNER role authorization
            from ops_api.ops.services.ops_service import AuthorizationError

            user_role_names = [role.name for role in current_user.roles]
            if "BUDGET_TEAM" not in user_role_names and "SYSTEM_OWNER" not in user_role_names:
                raise AuthorizationError(
                    f"User {current_user.id} does not have BUDGET_TEAM or SYSTEM_OWNER role required for requisition approval",
                    "ProcurementTrackerStep",
                )

            # Server-control: Set approval audit trail
            step.pre_award_requisition_approved_by = current_user.id
            step.pre_award_requisition_approved_date = date.today()
            logger.debug(
                f"Auto-set requisition approval audit: approved_by={current_user.id}, approved_date={date.today()}"
            )

    def _handle_approval_notifications(
        self,
        step: ProcurementTrackerStep,
        data: Dict[str, Any],
        current_user: User,
        old_approval_requested: Optional[bool] = None,
        old_approval_status: Optional[str] = None,
        old_requisition_approved_by: Optional[int] = None,
    ) -> None:
        """
        Send notifications when approval is requested or responded to.

        Only sends notifications when state TRANSITIONS occur:
        - Approval request: when pre_award_approval_requested changes from False/None → True
        - Approval response: when pre_award_approval_status changes to APPROVED/DECLINED for first time
        - Budget team requisition: when pre_award_requisition_approved_by changes from None → user_id

        Args:
            step: The updated procurement tracker step
            data: The update data
            current_user: User making the update
            old_approval_requested: Previous value of pre_award_approval_requested before update
            old_approval_status: Previous value of pre_award_approval_status before update
            old_requisition_approved_by: Previous value of pre_award_requisition_approved_by before update
        """
        # AWARD steps have their own notification handler (_handle_award_approval_notifications)
        if step.step_type == ProcurementTrackerStepType.AWARD:
            return

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
                        "title": PreAwardNotificationTitle.APPROVAL_REQUEST,
                        "message": (
                            f"A pre-award approval has been requested for Agreement {agreement.display_name}. "
                            f"Please review and respond.\n\n[Review Request]({review_url})"
                        ),
                        "is_read": False,
                        "recipient_id": recipient_id,
                        "notification_type": NotificationType.PRE_AWARD_APPROVAL_NOTIFICATION,
                        "procurement_tracker_step_id": step.id,
                    },
                    commit=False,
                )
            logger.debug(f"Created {len(recipient_ids)} pre-award approval request notifications")

        # Case 2: Approval was approved/declined
        # Only send if approval_status changed from None → APPROVED/DECLINED
        new_approval_status = data.get("approval_status")
        approval_response_transitioned = new_approval_status in ["APPROVED", "DECLINED"] and old_approval_status is None

        if approval_response_transitioned:
            if new_approval_status == "APPROVED":
                # DD approved - notify BUDGET_TEAM members (not requester)
                self._notify_budget_team_for_requisition_review(step, agreement, current_user, notification_service)

            elif new_approval_status == "DECLINED":
                # DD declined - notify requester (existing behavior)
                self._notify_requester_of_decline(step, agreement, current_user, notification_service)

                # Only dismiss "in review" notification when DD declines (requester needs to see it until budget team approves)
                self._dismiss_notifications_by_title(
                    PreAwardNotificationTitle.APPROVAL_REQUEST, step.id, "'in review' notifications after decline"
                )

        # Case 3: Budget Team Requisition Approval
        # Only send if requisition_approved_by changed from None → {user_id}
        new_requisition_approved_by = step.pre_award_requisition_approved_by
        requisition_approval_transitioned = (
            new_requisition_approved_by is not None and old_requisition_approved_by is None
        )

        if requisition_approval_transitioned:
            # Budget team approved requisition - notify original requester
            if step.pre_award_approval_requested_by:
                message = (
                    "This agreement has been approved for Pre-Award. The Division Director has approved and the "
                    "Budget Team has submitted the requisition. Please upload the Final Consensus Memo to the HHS "
                    "Consolidated Acquisition Solution (HCAS), and continue your progress in the Procurement Tracker."
                )

                # Include Director's approval notes if they exist
                if step.pre_award_approval_reviewer_notes and step.pre_award_approval_reviewer_notes.strip():
                    reviewer_notes_text = step.pre_award_approval_reviewer_notes.strip()
                    # Escape Markdown metacharacters to ensure notes display literally
                    reviewer_notes_text = escape_markdown(reviewer_notes_text)
                    message += f"\n\nNotes: {reviewer_notes_text}"

                notification_service.create(
                    {
                        "title": PreAwardNotificationTitle.REQUISITION_APPROVED,
                        "message": message,
                        "is_read": False,
                        "recipient_id": step.pre_award_approval_requested_by,
                        "notification_type": NotificationType.PRE_AWARD_APPROVAL_NOTIFICATION,
                        "procurement_tracker_step_id": step.id,
                    },
                    commit=False,
                )
                logger.debug("Created pre-award requisition approved notification for original requester")

            # Auto-dismiss budget team requisition review notifications
            self._dismiss_notifications_by_title(
                PreAwardNotificationTitle.BUDGET_TEAM_REVIEW_REQUIRED,
                step.id,
                "budget team requisition review notifications",
            )

            # Also dismiss the original "in review" notification for requester (workflow complete)
            self._dismiss_notifications_by_title(
                PreAwardNotificationTitle.APPROVAL_REQUEST,
                step.id,
                "'in review' notification for requester after budget team approval",
            )

    def _notify_budget_team_for_requisition_review(self, step, agreement, current_user, notification_service):
        """Notify budget team members that DD has approved and requisition review is required."""
        from sqlalchemy import select

        from models import NotificationType, User
        from models.users import Role

        # Get all budget team members
        budget_team_query = select(User.id).join(User.roles).where(Role.name == "BUDGET_TEAM")
        budget_team_ids = self.db_session.execute(budget_team_query).scalars().all()

        fe_url = current_app.config.get("OPS_FRONTEND_URL", "http://localhost:3000")
        # TODO (PR3/PR4): This URL points to budget requisition review page to be implemented
        review_url = f"{fe_url}/agreements/{agreement.id}/review-budget-requisition"

        # Fetch requester user object to include their name in the notification
        requester = self.db_session.get(User, step.pre_award_approval_requested_by)
        requester_name = requester.full_name if requester else "Unknown User"

        message = (
            f"{current_user.full_name} approved the agreement for pre-award as requested by {requester_name} "
            f"and it is now ready for the Budget Team to submit the requisition.\n\n[Review Agreement]({review_url})"
        )

        # Send notification to each budget team member
        for budget_team_id in budget_team_ids:
            notification_service.create(
                {
                    "title": PreAwardNotificationTitle.BUDGET_TEAM_REVIEW_REQUIRED,
                    "message": message,
                    "is_read": False,
                    "recipient_id": budget_team_id,
                    "notification_type": NotificationType.PRE_AWARD_APPROVAL_NOTIFICATION,
                    "procurement_tracker_step_id": step.id,
                },
                commit=False,
            )
        logger.debug(f"Created budget team requisition review notifications for {len(budget_team_ids)} members")

    def _notify_requester_of_decline(self, step, agreement, current_user, notification_service):
        """Notify requester that their pre-award approval request was declined."""
        from models import NotificationType

        if step.pre_award_approval_requested_by:
            message = (
                "This agreement has been declined for Pre-Award. "
                "Please do not upload the Final Consensus Memo to the HHS Consolidated Acquisition Solution (HCAS) "
                "until changes have been made and re-submitted for approval."
            )
            if step.pre_award_approval_reviewer_notes and step.pre_award_approval_reviewer_notes.strip():
                reviewer_notes_text = step.pre_award_approval_reviewer_notes.strip()
                # Escape Markdown metacharacters to ensure notes display literally in both
                # SimpleAlert (plain text) and NotificationCenter/LogItem (ReactMarkdown).
                # Prevents user-supplied markdown from rendering as formatting or clickable links.
                reviewer_notes_text = escape_markdown(reviewer_notes_text)
                message += f"\n\nNotes:\n{reviewer_notes_text}"

            notification_service.create(
                {
                    "title": PreAwardNotificationTitle.APPROVAL_DECLINED,
                    "message": message,
                    "is_read": False,
                    "recipient_id": step.pre_award_approval_requested_by,
                    "notification_type": NotificationType.PRE_AWARD_APPROVAL_NOTIFICATION,
                    "procurement_tracker_step_id": step.id,
                },
                commit=False,
            )
            logger.debug("Created pre-award approval declined notification for submitter")

    def _get_approval_reviewers(self, agreement) -> set[int]:
        """
        Get user IDs who can approve pre-award requests.

        Returns IDs of Division Directors, Deputy Division Directors, and System Owners.
        NOTE: BUDGET_TEAM is explicitly excluded here - they are notified separately
        AFTER director approval (see _notify_budget_team_for_requisition_review).

        Args:
            agreement: The agreement to get reviewers for

        Returns:
            Set of user IDs authorized to review
        """
        from models import Role
        from ops_api.ops.utils.agreements_helpers import get_division_directors_for_agreement

        reviewer_ids = set()

        # Get division directors for the agreement
        directors, deputies = get_division_directors_for_agreement(agreement)
        reviewer_ids.update(directors)
        reviewer_ids.update(deputies)

        # Get SYSTEM_OWNER users (BUDGET_TEAM excluded - they are notified after DD approval)
        role_based_users = (
            self.db_session.execute(select(User.id).where(User.roles.any(Role.name == "SYSTEM_OWNER"))).scalars().all()
        )
        reviewer_ids.update(role_based_users)

        return reviewer_ids

    def _dismiss_notifications_by_title(self, title: str, step_id: int, log_message: str) -> None:
        """
        Dismiss all unread notifications with given title for a step.

        Args:
            title: Notification title to match
            step_id: Procurement tracker step ID
            log_message: Descriptive message for logging
        """
        from sqlalchemy import and_, update

        from models import AwardApprovalNotification, PreAwardApprovalNotification

        # Dismiss from whichever notification table holds records with this title + step
        for notification_model in (PreAwardApprovalNotification, AwardApprovalNotification):
            dismiss_result = self.db_session.execute(
                update(notification_model)
                .where(
                    and_(
                        notification_model.title == title,
                        notification_model.is_read.is_(False),
                        notification_model.procurement_tracker_step_id == step_id,
                    )
                )
                .values(is_read=True)
            )
            if dismiss_result.rowcount:
                logger.debug(
                    f"Auto-dismissed {dismiss_result.rowcount} {log_message} from {notification_model.__name__}"
                )

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

        # If user is SYSTEM_OWNER, they can see all pending approvals
        # NOTE: BUDGET_TEAM is excluded here - they use get_pending_requisitions_for_user() instead
        if "SYSTEM_OWNER" in user_role_names:
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

    def get_pending_requisitions_for_user(self, user_id: int) -> list[ProcurementTrackerStep]:
        """
        Get all pending budget team requisition reviews for a user.

        Returns steps where:
        - DD has approved (approval_status = 'APPROVED')
        - Budget team hasn't approved requisition yet (requisition_approved_by IS NULL)
        - User has BUDGET_TEAM role

        Args:
            user_id: The user ID to check permissions for

        Returns:
            List of ProcurementTrackerStep objects with pending requisitions
        """
        # Get user roles
        user = self.db_session.get(User, user_id)
        if not user:
            return []

        user_role_names = [role.name for role in user.roles]

        # Only BUDGET_TEAM members see these
        if "BUDGET_TEAM" not in user_role_names:
            return []

        # Query for steps awaiting budget team requisition entry
        # Check approval status, not field emptiness (supports draft saves)
        stmt = (
            select(DefaultProcurementTrackerStep)
            .join(DefaultProcurementTrackerStep.procurement_tracker)
            .join(ProcurementTracker.agreement)
            .options(
                selectinload(DefaultProcurementTrackerStep.procurement_tracker)
                .selectinload(ProcurementTracker.agreement)
                .selectinload(Agreement.budget_line_items),
            )
            .where(
                and_(
                    DefaultProcurementTrackerStep.step_type == ProcurementTrackerStepType.PRE_AWARD,
                    DefaultProcurementTrackerStep.pre_award_approval_status == "APPROVED",
                    DefaultProcurementTrackerStep.pre_award_requisition_approved_by.is_(None),
                )
            )
            .order_by(DefaultProcurementTrackerStep.pre_award_approval_responded_date.desc())
        )

        return list(self.db_session.scalars(stmt).all())

    def _handle_award_approval(self, step, approval_status, obligated_date, current_user):
        """
        Apply BLI transitions and mark procurement action AWARDED when award is approved.

        When approval_status == "APPROVED":
        - IN_EXECUTION BLIs → OBLIGATED (and set date_needed to obligated_date if provided)
        - PLANNED BLIs → PLANNED_MOD
        - Sets procurement_action.date_awarded_obligated if not already set
        - Marks procurement_action status as AWARDED

        Args:
            step: The ProcurementTrackerStep being updated
            approval_status: The new award approval status string
            obligated_date: Optional date to set on IN_EXECUTION BLIs
            current_user: User making the update
        """
        if approval_status != "APPROVED":
            return

        agreement = step.procurement_tracker.agreement
        for bli in agreement.budget_line_items:
            if bli.status == BudgetLineItemStatus.IN_EXECUTION:
                bli.status = BudgetLineItemStatus.OBLIGATED
                if obligated_date is not None:
                    bli.date_needed = obligated_date
                logger.debug(f"Transitioned BLI {bli.id} IN_EXECUTION → OBLIGATED")
            elif bli.status == BudgetLineItemStatus.PLANNED:
                bli.status = BudgetLineItemStatus.PLANNED_MOD
                logger.debug(f"Transitioned BLI {bli.id} PLANNED → PLANNED_MOD")

        # Set procurement action date and status if applicable
        if step.procurement_tracker.procurement_action:
            procurement_action = self.db_session.get(ProcurementAction, step.procurement_tracker.procurement_action)
            if procurement_action:
                if procurement_action.date_awarded_obligated is None:
                    procurement_action.date_awarded_obligated = obligated_date or date.today()
                    logger.debug(
                        f"Set date_awarded_obligated to {procurement_action.date_awarded_obligated} via award approval"
                    )
                procurement_action.status = ProcurementActionStatus.AWARDED
                logger.debug("Marked procurement action as AWARDED via award approval")

    def _handle_award_approval_notifications(
        self,
        step,
        data,
        current_user,
        old_award_approval_requested=None,
        old_award_approval_status=None,
    ):
        """
        Send notifications when award approval is requested or approved.

        Case 1 (approval requested): sends notification to BT users.
        Case 2 (approved): sends notification to broader team (requester + POs + team members + BT).

        Args:
            step: The updated procurement tracker step
            data: The update data
            current_user: User making the update
            old_award_approval_requested: Previous value of award_approval_requested before update
            old_award_approval_status: Previous value of award_approval_status before update
        """
        from models import NotificationType
        from ops_api.ops.services.notifications import NotificationService

        notification_service = NotificationService(self.db_session)
        agreement = step.procurement_tracker.agreement

        # Case 1: Award approval was just requested — notify Budget Team
        new_award_approval_requested = data.get("approval_requested") is True and step.award_approval_requested
        award_request_transitioned = new_award_approval_requested and (
            old_award_approval_requested is None or old_award_approval_requested is False
        )

        if award_request_transitioned:
            budget_team_ids = self._get_budget_team_user_ids()

            fe_url = current_app.config.get("OPS_FRONTEND_URL", "http://localhost:3000")
            review_url = f"{fe_url}/agreements/{agreement.id}/review-award"

            for recipient_id in budget_team_ids:
                notification_service.create(
                    {
                        "title": AwardNotificationTitle.APPROVAL_REQUEST,
                        "message": (
                            f"An award approval has been requested for Agreement {agreement.display_name}. "
                            f"Please review and respond.\n\n[Review Request]({review_url})"
                        ),
                        "is_read": False,
                        "recipient_id": recipient_id,
                        "notification_type": NotificationType.AWARD_APPROVAL_NOTIFICATION,
                        "procurement_tracker_step_id": step.id,
                    },
                    commit=False,
                )
            logger.debug(f"Created {len(budget_team_ids)} award approval request notifications for Budget Team")

        # Case 2: Award was approved — notify requester + broader team
        new_award_status = data.get("approval_status")
        award_approved_transitioned = new_award_status == "APPROVED" and old_award_approval_status in (
            None,
            "PENDING",
        )

        if award_approved_transitioned:
            recipient_ids = self._get_award_approval_notification_recipients(agreement, step)

            for recipient_id in recipient_ids:
                notification_service.create(
                    {
                        "title": AwardNotificationTitle.APPROVED,
                        "message": (
                            f"The award for Agreement {agreement.display_name} has been approved by "
                            f"{current_user.full_name}."
                        ),
                        "is_read": False,
                        "recipient_id": recipient_id,
                        "notification_type": NotificationType.AWARD_APPROVAL_NOTIFICATION,
                        "procurement_tracker_step_id": step.id,
                    },
                    commit=False,
                )
            logger.debug(f"Created {len(recipient_ids)} award approved notifications")

    def _get_budget_team_user_ids(self) -> list[int]:
        """
        Get user IDs of all BUDGET_TEAM members.

        Returns:
            List of user IDs with the BUDGET_TEAM role
        """
        from models.users import Role

        budget_team_query = select(User.id).join(User.roles).where(Role.name == "BUDGET_TEAM")
        return list(self.db_session.execute(budget_team_query).scalars().all())

    def _get_award_approval_notification_recipients(self, agreement, step) -> set[int]:
        """
        Build recipient set from requester + project officers + team members + Budget Team.

        Args:
            agreement: The agreement associated with the step
            step: The ProcurementTrackerStep

        Returns:
            Set of user IDs to notify
        """
        recipient_ids = set()

        # Include the original requester
        if step.award_approval_requested_by:
            recipient_ids.add(step.award_approval_requested_by)

        # Include project officers
        if agreement.project_officer_id:
            recipient_ids.add(agreement.project_officer_id)
        if agreement.alternate_project_officer_id:
            recipient_ids.add(agreement.alternate_project_officer_id)

        # Include team members
        for member in agreement.team_members or []:
            recipient_ids.add(member.id)

        # Include all Budget Team members
        budget_team_ids = self._get_budget_team_user_ids()
        recipient_ids.update(budget_team_ids)

        return recipient_ids

    def get_pending_award_approvals_for_user(self, user_id: int) -> list[ProcurementTrackerStep]:
        """
        Get all pending award approval requests that a user can review.

        Returns steps where:
        - award_approval_requested = True
        - award_approval_status is None or PENDING
        - User has BUDGET_TEAM or SYSTEM_OWNER role

        Args:
            user_id: The user ID to check permissions for

        Returns:
            List of ProcurementTrackerStep objects with pending award approvals
        """
        user = self.db_session.get(User, user_id)
        if not user:
            return []

        user_role_names = [role.name for role in user.roles]

        # Only BUDGET_TEAM and SYSTEM_OWNER members see these
        if "BUDGET_TEAM" not in user_role_names and "SYSTEM_OWNER" not in user_role_names:
            return []

        from models import ProcurementTracker

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
                    DefaultProcurementTrackerStep.step_type == ProcurementTrackerStepType.AWARD,
                    DefaultProcurementTrackerStep.award_approval_requested.is_(True),
                    or_(
                        DefaultProcurementTrackerStep.award_approval_status.is_(None),
                        DefaultProcurementTrackerStep.award_approval_status == "PENDING",
                    ),
                )
            )
        )

        return list(self.db_session.scalars(stmt).all())
