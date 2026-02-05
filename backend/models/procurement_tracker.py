"""Procurement Tracker models."""

from datetime import date
from enum import Enum, auto
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import (
    Date,
    ForeignKey,
    Integer,
    String,
    Text,
    Index,
)
from sqlalchemy.dialects.postgresql import ENUM
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import BaseModel

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
    - Step 3: SOLICITATION
    - Step 4: EVALUATION
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
