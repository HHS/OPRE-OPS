"""Procurement Tracker models."""

from datetime import date
from enum import Enum, auto
from typing import TYPE_CHECKING, List, Optional

from loguru import logger
from sqlalchemy import (
    Boolean,
    Date,
    ForeignKey,
    Integer,
    String,
    Text,
    Index,
    select,
)
from sqlalchemy.dialects.postgresql import ENUM
from sqlalchemy.orm import Mapped, Session, mapped_column, relationship

from models.base import BaseModel

__all__ = [
    "ProcurementTrackerStatus",
    "ProcurementTrackerType",
    "ProcurementTrackerStepType",
    "ProcurementTrackerStepStatus",
    "ProcurementTracker",
    "ProcurementTrackerStep",
    "DefaultProcurementTrackerStep",
    "DefaultProcurementTracker",
]

# ============================================================================
# ENUMS
# ============================================================================


class ProcurementTrackerStatus(Enum):
    """Status of the procurement tracker"""

    ACTIVE = auto()
    INACTIVE = auto()
    COMPLETED = auto()

    def __str__(self):
        return self.name


class ProcurementTrackerType(Enum):
    """Type of procurement tracker workflow"""

    DEFAULT = auto()

    def __str__(self):
        return self.name


class ProcurementTrackerStepType(Enum):
    """Type of procurement workflow step"""

    ACQUISITION_PLANNING = auto()
    PRE_SOLICITATION = auto()
    SOLICITATION = auto()
    EVALUATION = auto()
    PRE_AWARD = auto()
    AWARD = auto()

    def __str__(self):
        return self.name


class ProcurementTrackerStepStatus(Enum):
    """Status of an individual tracker step"""

    PENDING = auto()
    ACTIVE = auto()
    COMPLETED = auto()
    SKIPPED = auto()

    def __str__(self):
        return self.name


# ============================================================================
# BASE PROCUREMENT TRACKER MODEL
# ============================================================================


class ProcurementTracker(BaseModel):
    """
    Base procurement tracker model.

    Tracks procurement workflow progress for agreements.
    Uses polymorphic inheritance with tracker_type discriminator.
    """

    __tablename__ = "procurement_tracker"

    __table_args__ = (Index("idx_procurement_tracker_agreement_id_status", "agreement_id", "status"),)

    id: Mapped[int] = BaseModel.get_pk_column()

    agreement_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("agreement.id"),
        nullable=False,
        index=True,
    )

    status: Mapped[ProcurementTrackerStatus] = mapped_column(
        ENUM(ProcurementTrackerStatus),
        nullable=False,
        default=ProcurementTrackerStatus.ACTIVE,
        index=True,
    )

    procurement_action: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("procurement_action.id"),
        nullable=True,
    )

    tracker_type: Mapped[ProcurementTrackerType] = mapped_column(
        ENUM(ProcurementTrackerType),
        nullable=False,
        default=ProcurementTrackerType.DEFAULT,
    )

    active_step_number: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
    )

    # Relationships
    agreement: Mapped["Agreement"] = relationship(
        "Agreement",
        back_populates="procurement_trackers",
        foreign_keys=[agreement_id],
    )

    steps: Mapped[List["ProcurementTrackerStep"]] = relationship(
        "ProcurementTrackerStep",
        back_populates="procurement_tracker",
        cascade="all, delete-orphan",
        order_by="ProcurementTrackerStep.step_number",
    )

    # Polymorphic configuration
    __mapper_args__ = {
        "polymorphic_identity": "procurement_tracker",
        "polymorphic_on": "tracker_type",
    }

    @BaseModel.display_name.getter
    def display_name(self):
        return f"ProcurementTracker#{self.id}"

    def mark_completed(self, completed_date: Optional[date] = None) -> None:
        """
        Mark tracker and all steps as COMPLETED with the given date.
        Sets active_step_number to the final step.
        """
        completed_date = completed_date or date.today()
        self.status = ProcurementTrackerStatus.COMPLETED
        self.active_step_number = len(self.steps)
        for step in self.steps:
            step.status = ProcurementTrackerStepStatus.COMPLETED
            step.step_start_date = completed_date
            step.step_completed_date = completed_date

    def activate_first_step(self) -> None:
        """
        Set step 1 to ACTIVE with today's date.
        Useful when adopting an unlinked tracker whose steps may still be PENDING.
        """
        for step in self.steps:
            if step.step_number == 1:
                step.status = ProcurementTrackerStepStatus.ACTIVE
                step.step_start_date = date.today()
                break


# ============================================================================
# PROCUREMENT TRACKER STEP MODEL
# ============================================================================


class ProcurementTrackerStep(BaseModel):
    """
    Base procurement tracker workflow step.

    Each step is a separate row with a real database ID.
    Uses single-table inheritance with step_class discriminator.

    Subclasses (DefaultProcurementTrackerStep, etc.) define step-type-specific fields
    using prefixed column names in the shared table.
    """

    __tablename__ = "procurement_tracker_step"

    id: Mapped[int] = BaseModel.get_pk_column()

    procurement_tracker_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("procurement_tracker.id"),
        nullable=False,
    )

    step_number: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    step_class: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    step_type: Mapped[ProcurementTrackerStepType] = mapped_column(
        ENUM(ProcurementTrackerStepType),
        nullable=False,
    )

    status: Mapped[ProcurementTrackerStepStatus] = mapped_column(
        ENUM(ProcurementTrackerStepStatus),
        nullable=False,
        default=ProcurementTrackerStepStatus.PENDING,
    )

    step_start_date: Mapped[Optional[date]] = mapped_column(
        Date,
        nullable=True,
    )

    step_completed_date: Mapped[Optional[date]] = mapped_column(
        Date,
        nullable=True,
    )

    # Relationships
    procurement_tracker: Mapped["ProcurementTracker"] = relationship(
        "ProcurementTracker",
        back_populates="steps",
    )

    # Polymorphic configuration
    __mapper_args__ = {
        "polymorphic_identity": "base_step",
        "polymorphic_on": "step_class",
    }

    @BaseModel.display_name.getter
    def display_name(self):
        return f"Step {self.step_number}: {self.step_type.name}"


# ============================================================================
# DEFAULT PROCUREMENT TRACKER STEP
# ============================================================================


class DefaultProcurementTrackerStep(ProcurementTrackerStep):
    """
    Step subclass for DefaultProcurementTracker.

    Uses single-table inheritance - no separate table created.
    All step instances for default trackers use this class.

    Step specific fields are prefixed for clarity since they're
    stored in the shared procurement_tracker_step table.
    """

    # ACQUISITION_PLANNING-specific fields (prefixed for clarity in shared table)
    acquisition_planning_task_completed_by: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("ops_user.id"),
        nullable=True,
    )

    acquisition_planning_date_completed: Mapped[Optional[date]] = mapped_column(
        Date,
        nullable=True,
    )

    acquisition_planning_notes: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )

    # Relationships
    acquisition_planning_completed_by_user: Mapped[Optional["User"]] = relationship(
        "User",
        foreign_keys=[acquisition_planning_task_completed_by],
        viewonly=True,
    )

    # PRE_SOLICITATION-specific fields can be added here with appropriate prefixes
    # target_completion_date is strongly recommended but not required, per OPRE first week of Feb 2026
    pre_solicitation_target_completion_date: Mapped[Optional[date]] = mapped_column(
        Date,
        nullable=True,
    )

    pre_solicitation_task_completed_by: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("ops_user.id"),
        nullable=True,
    )

    pre_solicitation_date_completed: Mapped[Optional[date]] = mapped_column(
        Date,
        nullable=True,
    )

    pre_solicitation_notes: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )

    pre_solicitation_draft_solicitation_date: Mapped[Optional[date]] = mapped_column(
        Date,
        nullable=True,
    )

    # Relationships
    pre_solicitation_completed_by_user: Mapped[Optional["User"]] = relationship(
        "User",
        foreign_keys=[pre_solicitation_task_completed_by],
        viewonly=True,
    )

    # SOLICITATION-specific fields
    solicitation_task_completed_by: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("ops_user.id"),
        nullable=True,
    )

    solicitation_date_completed: Mapped[Optional[date]] = mapped_column(
        Date,
        nullable=True,
    )

    solicitation_notes: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )

    solicitation_period_start_date: Mapped[Optional[date]] = mapped_column(
        Date,
        nullable=True,
    )

    solicitation_period_end_date: Mapped[Optional[date]] = mapped_column(
        Date,
        nullable=True,
    )

    # Relationships
    solicitation_completed_by_user: Mapped[Optional["User"]] = relationship(
        "User",
        foreign_keys=[solicitation_task_completed_by],
        viewonly=True,
    )

    # EVALUATION step fields (Step 4 - follows Step 2 pattern with target completion date)
    evaluation_target_completion_date: Mapped[Optional[date]] = mapped_column(
        Date,
        nullable=True,
    )
    evaluation_task_completed_by: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("ops_user.id"),
        nullable=True,
    )
    evaluation_date_completed: Mapped[Optional[date]] = mapped_column(
        Date,
        nullable=True,
    )
    evaluation_notes: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )

    # Relationship for evaluation completed by user
    evaluation_completed_by_user: Mapped[Optional["User"]] = relationship(
        "User",
        foreign_keys=[evaluation_task_completed_by],
        viewonly=True,
    )

    # PRE_AWARD step fields (Step 5)
    pre_award_target_completion_date: Mapped[Optional[date]] = mapped_column(
        Date,
        nullable=True,
    )
    pre_award_task_completed_by: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("ops_user.id"),
        nullable=True,
    )
    pre_award_date_completed: Mapped[Optional[date]] = mapped_column(
        Date,
        nullable=True,
    )
    pre_award_notes: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )

    # PRE_AWARD approval request fields
    pre_award_approval_requested: Mapped[Optional[bool]] = mapped_column(
        Boolean,
        nullable=True,
        default=False,
    )
    pre_award_approval_requested_date: Mapped[Optional[date]] = mapped_column(
        Date,
        nullable=True,
    )
    pre_award_approval_requested_by: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("ops_user.id"),
        nullable=True,
    )
    pre_award_requestor_notes: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )

    # PRE_AWARD approval response fields
    pre_award_approval_status: Mapped[Optional[str]] = mapped_column(
        String(20),
        nullable=True,
    )
    pre_award_approval_responded_by: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("ops_user.id"),
        nullable=True,
    )
    pre_award_approval_responded_date: Mapped[Optional[date]] = mapped_column(
        Date,
        nullable=True,
    )
    pre_award_approval_reviewer_notes: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )

    # Relationship for pre_award completed by user
    pre_award_completed_by_user: Mapped[Optional["User"]] = relationship(
        "User",
        foreign_keys=[pre_award_task_completed_by],
        viewonly=True,
    )

    # Relationship for pre_award requested by user
    pre_award_requested_by_user: Mapped[Optional["User"]] = relationship(
        "User",
        foreign_keys=[pre_award_approval_requested_by],
        viewonly=True,
    )

    # Relationship for pre_award approval responded by user
    pre_award_approval_responded_by_user: Mapped[Optional["User"]] = relationship(
        "User",
        foreign_keys=[pre_award_approval_responded_by],
        viewonly=True,
    )

    # Polymorphic configuration
    __mapper_args__ = {
        "polymorphic_identity": "default_step",
    }

    def to_dict(self):
        """
        Override to_dict to map prefixed columns to API field names and conditionally include them.

        For ACQUISITION_PLANNING steps:
        - Maps acquisition_planning_task_completed_by → task_completed_by
        - Maps acquisition_planning_date_completed → date_completed
        - Maps acquisition_planning_notes → notes

        For PRE_SOLICITATION steps:
        - Maps pre_solicitation_target_completion_date → target_completion_date
        - Maps pre_solicitation_task_completed_by → task_completed_by
        - Maps pre_solicitation_date_completed → date_completed
        - Maps pre_solicitation_notes → notes
        - Maps pre_solicitation_draft_solicitation_date → draft_solicitation_date

        For SOLICITATION steps:
        - Maps solicitation_task_completed_by → task_completed_by
        - Maps solicitation_date_completed → date_completed
        - Maps solicitation_notes → notes
        - Maps solicitation_period_start_date → solicitation_period_start_date
        - Maps solicitation_period_end_date → solicitation_period_end_date

        For EVALUATION steps:
        - Maps evaluation_target_completion_date → target_completion_date
        - Maps evaluation_task_completed_by → task_completed_by
        - Maps evaluation_date_completed → date_completed
        - Maps evaluation_notes → notes

        For other step types, these fields are excluded from the output.
        """
        data = super().to_dict()

        # Handle ACQUISITION_PLANNING-specific fields
        if self.step_type == ProcurementTrackerStepType.ACQUISITION_PLANNING:
            # Map prefixed columns to API field names
            data["task_completed_by"] = data.pop("acquisition_planning_task_completed_by", None)
            data["date_completed"] = data.pop("acquisition_planning_date_completed", None)
            data["notes"] = data.pop("acquisition_planning_notes", None)

            # Map the relationship
            if "acquisition_planning_completed_by_user" in data:
                data["completed_by_user"] = data.pop("acquisition_planning_completed_by_user", None)

            # Remove PRE_SOLICITATION-specific fields
            data.pop("pre_solicitation_target_completion_date", None)
            data.pop("pre_solicitation_task_completed_by", None)
            data.pop("pre_solicitation_date_completed", None)
            data.pop("pre_solicitation_notes", None)
            data.pop("pre_solicitation_draft_solicitation_date", None)
            data.pop("pre_solicitation_completed_by_user", None)

            # Remove SOLICITATION-specific fields
            data.pop("solicitation_task_completed_by", None)
            data.pop("solicitation_date_completed", None)
            data.pop("solicitation_notes", None)
            data.pop("solicitation_period_start_date", None)
            data.pop("solicitation_period_end_date", None)
            data.pop("solicitation_completed_by_user", None)

            # Remove EVALUATION-specific fields
            data.pop("evaluation_target_completion_date", None)
            data.pop("evaluation_task_completed_by", None)
            data.pop("evaluation_date_completed", None)
            data.pop("evaluation_notes", None)
            data.pop("evaluation_completed_by_user", None)

            # Remove PRE_AWARD-specific fields
            data.pop("pre_award_target_completion_date", None)
            data.pop("pre_award_task_completed_by", None)
            data.pop("pre_award_date_completed", None)
            data.pop("pre_award_notes", None)
            data.pop("pre_award_approval_requested", None)
            data.pop("pre_award_approval_requested_date", None)
            data.pop("pre_award_approval_requested_by", None)
            data.pop("pre_award_requestor_notes", None)
            data.pop("pre_award_approval_status", None)
            data.pop("pre_award_approval_responded_by", None)
            data.pop("pre_award_approval_responded_date", None)
            data.pop("pre_award_approval_reviewer_notes", None)
            data.pop("pre_award_completed_by_user", None)
            data.pop("pre_award_requested_by_user", None)
            data.pop("pre_award_approval_responded_by_user", None)

        # Handle PRE_SOLICITATION-specific fields
        elif self.step_type == ProcurementTrackerStepType.PRE_SOLICITATION:
            # Map prefixed columns to API field names
            data["target_completion_date"] = data.pop("pre_solicitation_target_completion_date", None)
            data["task_completed_by"] = data.pop("pre_solicitation_task_completed_by", None)
            data["date_completed"] = data.pop("pre_solicitation_date_completed", None)
            data["notes"] = data.pop("pre_solicitation_notes", None)
            data["draft_solicitation_date"] = data.pop("pre_solicitation_draft_solicitation_date", None)

            # Map the relationship
            if "pre_solicitation_completed_by_user" in data:
                data["completed_by_user"] = data.pop("pre_solicitation_completed_by_user", None)

            # Remove ACQUISITION_PLANNING-specific fields
            data.pop("acquisition_planning_task_completed_by", None)
            data.pop("acquisition_planning_date_completed", None)
            data.pop("acquisition_planning_notes", None)
            data.pop("acquisition_planning_completed_by_user", None)

            # Remove SOLICITATION-specific fields
            data.pop("solicitation_task_completed_by", None)
            data.pop("solicitation_date_completed", None)
            data.pop("solicitation_notes", None)
            data.pop("solicitation_period_start_date", None)
            data.pop("solicitation_period_end_date", None)
            data.pop("solicitation_completed_by_user", None)

            # Remove EVALUATION-specific fields
            data.pop("evaluation_target_completion_date", None)
            data.pop("evaluation_task_completed_by", None)
            data.pop("evaluation_date_completed", None)
            data.pop("evaluation_notes", None)
            data.pop("evaluation_completed_by_user", None)

            # Remove PRE_AWARD-specific fields
            data.pop("pre_award_target_completion_date", None)
            data.pop("pre_award_task_completed_by", None)
            data.pop("pre_award_date_completed", None)
            data.pop("pre_award_notes", None)
            data.pop("pre_award_approval_requested", None)
            data.pop("pre_award_approval_requested_date", None)
            data.pop("pre_award_approval_requested_by", None)
            data.pop("pre_award_requestor_notes", None)
            data.pop("pre_award_approval_status", None)
            data.pop("pre_award_approval_responded_by", None)
            data.pop("pre_award_approval_responded_date", None)
            data.pop("pre_award_approval_reviewer_notes", None)
            data.pop("pre_award_completed_by_user", None)
            data.pop("pre_award_requested_by_user", None)
            data.pop("pre_award_approval_responded_by_user", None)

        # Handle SOLICITATION-specific fields
        elif self.step_type == ProcurementTrackerStepType.SOLICITATION:
            # Map prefixed columns to API field names
            data["task_completed_by"] = data.pop("solicitation_task_completed_by", None)
            data["date_completed"] = data.pop("solicitation_date_completed", None)
            data["notes"] = data.pop("solicitation_notes", None)
            data["solicitation_period_start_date"] = data.pop("solicitation_period_start_date", None)
            data["solicitation_period_end_date"] = data.pop("solicitation_period_end_date", None)

            # Map the relationship
            if "solicitation_completed_by_user" in data:
                data["completed_by_user"] = data.pop("solicitation_completed_by_user", None)

            # Remove ACQUISITION_PLANNING-specific fields
            data.pop("acquisition_planning_task_completed_by", None)
            data.pop("acquisition_planning_date_completed", None)
            data.pop("acquisition_planning_notes", None)
            data.pop("acquisition_planning_completed_by_user", None)

            # Remove PRE_SOLICITATION-specific fields
            data.pop("pre_solicitation_target_completion_date", None)
            data.pop("pre_solicitation_task_completed_by", None)
            data.pop("pre_solicitation_date_completed", None)
            data.pop("pre_solicitation_notes", None)
            data.pop("pre_solicitation_draft_solicitation_date", None)
            data.pop("pre_solicitation_completed_by_user", None)

            # Remove EVALUATION-specific fields
            data.pop("evaluation_target_completion_date", None)
            data.pop("evaluation_task_completed_by", None)
            data.pop("evaluation_date_completed", None)
            data.pop("evaluation_notes", None)
            data.pop("evaluation_completed_by_user", None)

            # Remove PRE_AWARD-specific fields
            data.pop("pre_award_target_completion_date", None)
            data.pop("pre_award_task_completed_by", None)
            data.pop("pre_award_date_completed", None)
            data.pop("pre_award_notes", None)
            data.pop("pre_award_approval_requested", None)
            data.pop("pre_award_approval_requested_date", None)
            data.pop("pre_award_approval_requested_by", None)
            data.pop("pre_award_requestor_notes", None)
            data.pop("pre_award_approval_status", None)
            data.pop("pre_award_approval_responded_by", None)
            data.pop("pre_award_approval_responded_date", None)
            data.pop("pre_award_approval_reviewer_notes", None)
            data.pop("pre_award_completed_by_user", None)
            data.pop("pre_award_requested_by_user", None)
            data.pop("pre_award_approval_responded_by_user", None)

        # Handle EVALUATION-specific fields
        elif self.step_type == ProcurementTrackerStepType.EVALUATION:
            # Map prefixed columns to API field names
            data["target_completion_date"] = data.pop("evaluation_target_completion_date", None)
            data["task_completed_by"] = data.pop("evaluation_task_completed_by", None)
            data["date_completed"] = data.pop("evaluation_date_completed", None)
            data["notes"] = data.pop("evaluation_notes", None)

            # Map the relationship
            if "evaluation_completed_by_user" in data:
                data["completed_by_user"] = data.pop("evaluation_completed_by_user", None)

            # Remove ACQUISITION_PLANNING-specific fields
            data.pop("acquisition_planning_task_completed_by", None)
            data.pop("acquisition_planning_date_completed", None)
            data.pop("acquisition_planning_notes", None)
            data.pop("acquisition_planning_completed_by_user", None)

            # Remove PRE_SOLICITATION-specific fields
            data.pop("pre_solicitation_target_completion_date", None)
            data.pop("pre_solicitation_task_completed_by", None)
            data.pop("pre_solicitation_date_completed", None)
            data.pop("pre_solicitation_notes", None)
            data.pop("pre_solicitation_draft_solicitation_date", None)
            data.pop("pre_solicitation_completed_by_user", None)

            # Remove SOLICITATION-specific fields
            data.pop("solicitation_task_completed_by", None)
            data.pop("solicitation_date_completed", None)
            data.pop("solicitation_notes", None)
            data.pop("solicitation_period_start_date", None)
            data.pop("solicitation_period_end_date", None)
            data.pop("solicitation_completed_by_user", None)

            # Remove PRE_AWARD-specific fields
            data.pop("pre_award_target_completion_date", None)
            data.pop("pre_award_task_completed_by", None)
            data.pop("pre_award_date_completed", None)
            data.pop("pre_award_notes", None)
            data.pop("pre_award_approval_requested", None)
            data.pop("pre_award_approval_requested_date", None)
            data.pop("pre_award_approval_requested_by", None)
            data.pop("pre_award_requestor_notes", None)
            data.pop("pre_award_approval_status", None)
            data.pop("pre_award_approval_responded_by", None)
            data.pop("pre_award_approval_responded_date", None)
            data.pop("pre_award_approval_reviewer_notes", None)
            data.pop("pre_award_completed_by_user", None)
            data.pop("pre_award_requested_by_user", None)
            data.pop("pre_award_approval_responded_by_user", None)

        # Handle PRE_AWARD-specific fields
        elif self.step_type == ProcurementTrackerStepType.PRE_AWARD:
            # Map prefixed columns to API field names
            data["target_completion_date"] = data.pop("pre_award_target_completion_date", None)
            data["task_completed_by"] = data.pop("pre_award_task_completed_by", None)
            data["date_completed"] = data.pop("pre_award_date_completed", None)
            data["notes"] = data.pop("pre_award_notes", None)

            # Map approval request fields
            data["approval_requested"] = data.pop("pre_award_approval_requested", None)
            data["approval_requested_date"] = data.pop("pre_award_approval_requested_date", None)
            data["approval_requested_by"] = data.pop("pre_award_approval_requested_by", None)
            data["requestor_notes"] = data.pop("pre_award_requestor_notes", None)

            # Map approval response fields
            data["approval_status"] = data.pop("pre_award_approval_status", None)
            data["approval_responded_by"] = data.pop("pre_award_approval_responded_by", None)
            data["approval_responded_date"] = data.pop("pre_award_approval_responded_date", None)
            data["reviewer_notes"] = data.pop("pre_award_approval_reviewer_notes", None)

            # Map the relationship
            if "pre_award_completed_by_user" in data:
                data["completed_by_user"] = data.pop("pre_award_completed_by_user", None)

            # Map the approval requested by user relationship
            if "pre_award_requested_by_user" in data:
                data["requested_by_user"] = data.pop("pre_award_requested_by_user", None)

            # Map the approval responded by user relationship
            if "pre_award_approval_responded_by_user" in data:
                data["approval_responded_by_user"] = data.pop("pre_award_approval_responded_by_user", None)

            # Remove ACQUISITION_PLANNING-specific fields
            data.pop("acquisition_planning_task_completed_by", None)
            data.pop("acquisition_planning_date_completed", None)
            data.pop("acquisition_planning_notes", None)
            data.pop("acquisition_planning_completed_by_user", None)

            # Remove PRE_SOLICITATION-specific fields
            data.pop("pre_solicitation_target_completion_date", None)
            data.pop("pre_solicitation_task_completed_by", None)
            data.pop("pre_solicitation_date_completed", None)
            data.pop("pre_solicitation_notes", None)
            data.pop("pre_solicitation_draft_solicitation_date", None)
            data.pop("pre_solicitation_completed_by_user", None)

            # Remove SOLICITATION-specific fields
            data.pop("solicitation_task_completed_by", None)
            data.pop("solicitation_date_completed", None)
            data.pop("solicitation_notes", None)
            data.pop("solicitation_period_start_date", None)
            data.pop("solicitation_period_end_date", None)
            data.pop("solicitation_completed_by_user", None)

            # Remove EVALUATION-specific fields
            data.pop("evaluation_target_completion_date", None)
            data.pop("evaluation_task_completed_by", None)
            data.pop("evaluation_date_completed", None)
            data.pop("evaluation_notes", None)
            data.pop("evaluation_completed_by_user", None)

        else:
            # Remove all step-specific fields for other step types
            data.pop("acquisition_planning_task_completed_by", None)
            data.pop("acquisition_planning_date_completed", None)
            data.pop("acquisition_planning_notes", None)
            data.pop("acquisition_planning_completed_by_user", None)

            data.pop("pre_solicitation_target_completion_date", None)
            data.pop("pre_solicitation_task_completed_by", None)
            data.pop("pre_solicitation_date_completed", None)
            data.pop("pre_solicitation_notes", None)
            data.pop("pre_solicitation_draft_solicitation_date", None)
            data.pop("pre_solicitation_completed_by_user", None)

            data.pop("solicitation_task_completed_by", None)
            data.pop("solicitation_date_completed", None)
            data.pop("solicitation_notes", None)
            data.pop("solicitation_period_start_date", None)
            data.pop("solicitation_period_end_date", None)
            data.pop("solicitation_completed_by_user", None)

            data.pop("evaluation_target_completion_date", None)
            data.pop("evaluation_task_completed_by", None)
            data.pop("evaluation_date_completed", None)
            data.pop("evaluation_notes", None)
            data.pop("evaluation_completed_by_user", None)

            data.pop("pre_award_target_completion_date", None)
            data.pop("pre_award_task_completed_by", None)
            data.pop("pre_award_date_completed", None)
            data.pop("pre_award_notes", None)
            data.pop("pre_award_approval_requested", None)
            data.pop("pre_award_approval_requested_date", None)
            data.pop("pre_award_approval_requested_by", None)
            data.pop("pre_award_requestor_notes", None)
            data.pop("pre_award_approval_status", None)
            data.pop("pre_award_approval_responded_by", None)
            data.pop("pre_award_approval_responded_date", None)
            data.pop("pre_award_approval_reviewer_notes", None)
            data.pop("pre_award_completed_by_user", None)
            data.pop("pre_award_requested_by_user", None)
            data.pop("pre_award_approval_responded_by_user", None)

        return data


# ============================================================================
# DEFAULT PROCUREMENT TRACKER
# ============================================================================


class DefaultProcurementTracker(ProcurementTracker):
    """
    Default procurement tracker with 6 workflow steps.

    Steps are stored as separate rows in procurement_tracker_step table:
    - Step 1: ACQUISITION_PLANNING (with extra fields: acquisition_planning_task_completed_by, acquisition_planning_date_completed, acquisition_planning_notes)
    - Step 2: PRE_SOLICITATION (with extra fields: pre_solicitation_target_completion_date, pre_solicitation_task_completed_by, pre_solicitation_date_completed, pre_solicitation_notes, pre_solicitation_draft_solicitation_date)
    - Step 3: SOLICITATION (with extra fields: solicitation_task_completed_by, solicitation_date_completed, solicitation_notes, solicitation_period_start_date, solicitation_period_end_date)
    - Step 4: EVALUATION (with extra fields: evaluation_target_completion_date, evaluation_task_completed_by, evaluation_date_completed, evaluation_notes)
    - Step 5: PRE_AWARD
    - Step 6: AWARD
    """

    __tablename__ = "default_procurement_tracker"

    # Primary key (FK to parent)
    id: Mapped[int] = mapped_column(
        ForeignKey("procurement_tracker.id"),
        primary_key=True,
    )

    if TYPE_CHECKING:
        # Type hint override for steps relationship (inherits relationship from parent)
        steps: Mapped[List[DefaultProcurementTrackerStep]]

    # Polymorphic configuration
    __mapper_args__ = {
        "polymorphic_identity": ProcurementTrackerType.DEFAULT,
    }

    @BaseModel.display_name.getter
    def display_name(self):
        return f"DefaultProcurementTracker#{self.id}"

    @classmethod
    def create_with_steps(cls, agreement_id: int, **kwargs) -> "DefaultProcurementTracker":
        """
        Factory method to create a DefaultProcurementTracker with all 6 steps.

        Args:
            agreement_id: The agreement ID to associate with this tracker
            **kwargs: Additional fields for the tracker (status, procurement_action, etc.)

        Returns:
            DefaultProcurementTracker instance with 6 steps attached
        """
        tracker = cls(agreement_id=agreement_id, active_step_number=1, **kwargs)

        # Define the 6 steps
        step_definitions = [
            (1, ProcurementTrackerStepType.ACQUISITION_PLANNING),
            (2, ProcurementTrackerStepType.PRE_SOLICITATION),
            (3, ProcurementTrackerStepType.SOLICITATION),
            (4, ProcurementTrackerStepType.EVALUATION),
            (5, ProcurementTrackerStepType.PRE_AWARD),
            (6, ProcurementTrackerStepType.AWARD),
        ]

        # Create step instances
        for step_number, step_type in step_definitions:
            # Step 1 starts as ACTIVE with current date, others are PENDING
            if step_number == 1:
                step = DefaultProcurementTrackerStep(
                    step_number=step_number,
                    step_type=step_type,
                    status=ProcurementTrackerStepStatus.ACTIVE,
                    step_start_date=date.today(),
                )
            else:
                step = DefaultProcurementTrackerStep(
                    step_number=step_number,
                    step_type=step_type,
                    status=ProcurementTrackerStepStatus.PENDING,
                )
            tracker.steps.append(step)

        return tracker

    @classmethod
    def get_or_create_for_action(
        cls,
        session: Session,
        agreement_id: int,
        procurement_action_id: int,
        status: ProcurementTrackerStatus = ProcurementTrackerStatus.ACTIVE,
        created_by: Optional[int] = None,
    ) -> tuple["DefaultProcurementTracker", bool]:
        """
        Find an existing tracker linked to this action, adopt an unlinked
        tracker for the agreement, or create a new one.

        Returns (tracker, was_created).
        """
        # Check for a tracker already linked to this action
        existing = session.execute(
            select(ProcurementTracker).where(
                ProcurementTracker.agreement_id == agreement_id,
                ProcurementTracker.procurement_action == procurement_action_id,
            )
        ).scalar_one_or_none()

        if existing:
            return existing, False

        # Adopt an unlinked tracker if one exists
        unlinked = (
            session.execute(
                select(ProcurementTracker).where(
                    ProcurementTracker.agreement_id == agreement_id,
                    ProcurementTracker.procurement_action.is_(None),
                )
            )
            .scalars()
            .first()
        )

        if unlinked:
            unlinked.procurement_action = procurement_action_id
            unlinked.status = status
            unlinked.activate_first_step()
            logger.info(
                f"Linked existing unlinked tracker {unlinked.id} to "
                f"ProcurementAction {procurement_action_id} "
                f"for Agreement {agreement_id}"
            )
            return unlinked, False

        # Create a new tracker
        tracker = cls.create_with_steps(
            agreement_id=agreement_id,
            procurement_action=procurement_action_id,
            status=status,
            created_by=created_by,
        )
        session.add(tracker)
        session.flush()
        logger.info(
            f"Created DefaultProcurementTracker for Agreement {agreement_id} "
            f"— linked to ProcurementAction {procurement_action_id} with {len(tracker.steps)} steps"
        )
        return tracker, True
