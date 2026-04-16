"""Procurement Action models (similar to MAPS AAP - Acquisition Action Plan)."""

from datetime import date
from decimal import Decimal
from enum import Enum, auto
from typing import TYPE_CHECKING, Optional

from loguru import logger
from sqlalchemy import Date, ForeignKey, Integer, Numeric, String, Text, Index, select
from sqlalchemy.dialects.postgresql import ENUM
from sqlalchemy.orm import Mapped, Session, mapped_column, relationship

from models.base import BaseModel

if TYPE_CHECKING:
    from models.agreements import Agreement, AgreementMod
    from models.budget_line_items import BudgetLineItem, Requisition
    from models.procurement_shops import ProcurementShop


class AwardType(Enum):
    """Type of award for the procurement action."""

    NEW_AWARD = auto()
    MODIFICATION = auto()
    NEW_TASK_ORDER = auto()
    EXERCISE_OPTION_AS_IS = auto()
    FOLLOW_ON = auto()
    SIMPLIFIED_ACQUISITION = auto()
    MICRO_PURCHASE = auto()
    ADMINISTRATIVE = auto()

    def __str__(self):
        return self.name.replace("_", " ").title()


class ProcurementActionStatus(Enum):
    """Status of the procurement action."""

    PLANNED = auto()
    REQUISITION_SUBMITTED = auto()
    IN_PROCESS = auto()
    AWARDED = auto()
    CERTIFIED = auto()
    CANCELLED = auto()

    def __str__(self):
        return self.name.replace("_", " ").title()


class ProcurementAction(BaseModel):
    """
    Represents a procurement action (acquisition action plan).

    Similar to MAPS AAP table. Tracks the procurement process for either:
    - Initial award of an agreement (award_type set, mod_type null)
    - Modification to an existing agreement (mod_type set, agreement_mod_id set)

    Each procurement action may have its own requisition number from the
    procurement office.

    Corresponds to MAPS AAP table fields:
    - award_type → MAPS.AAP.SYS_AWARD_TYPE_ID
    - mod_type → MAPS.AAP.SYS_CONTRACT_MOD_TYPE_ID
    """

    __tablename__ = "procurement_action"

    __table_args__ = (
        Index("ix_procurement_action_agreement_id_award_type_status", "agreement_id", "award_type", "status"),
    )

    id: Mapped[int] = BaseModel.get_pk_column()

    # Core relationships
    agreement_id: Mapped[int] = mapped_column(ForeignKey("agreement.id"), index=True)
    agreement: Mapped["Agreement"] = relationship("Agreement", back_populates="procurement_actions")

    # Optional link to modification (null for initial awards)
    agreement_mod_id: Mapped[Optional[int]] = mapped_column(ForeignKey("agreement_mod.id"), nullable=True)
    agreement_mod: Mapped[Optional["AgreementMod"]] = relationship("AgreementMod")

    # Budget line items associated with this procurement action
    budget_line_items: Mapped[list["BudgetLineItem"]] = relationship(
        "BudgetLineItem",
        back_populates="procurement_action",
        lazy=True,
    )

    # Requisitions associated with this procurement action (tracks workflow: Initial → Final)
    requisitions: Mapped[list["Requisition"]] = relationship(
        "Requisition",
        lazy=True,
        back_populates="procurement_action",
    )

    # Award type and modification type (similar to MAPS AAP.SYS_AWARD_TYPE_ID and SYS_CONTRACT_MOD_TYPE_ID)
    award_type: Mapped[Optional[AwardType]] = mapped_column(ENUM(AwardType), nullable=True, index=True)

    # Procurement action status
    status: Mapped[Optional[ProcurementActionStatus]] = mapped_column(
        ENUM(ProcurementActionStatus), nullable=True, index=True
    )

    # Procurement shop details
    procurement_shop_id: Mapped[Optional[int]] = mapped_column(ForeignKey("procurement_shop.id"), nullable=True)
    procurement_shop: Mapped[Optional["ProcurementShop"]] = relationship("ProcurementShop")

    # PSC (Procurement Shop) tracking number
    psc_action_number: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    # Timing information
    need_by_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    requisition_deadline: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    date_awarded_obligated: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    # Desired days for solicitation to be on the street
    desired_days_on_street: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Description and comments
    action_description: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    comments: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # PSC fee for this specific action (can override default)
    psc_fee_percentage: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 5), nullable=True)

    # Award and contract totals
    award_total: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(12, 2), nullable=True, comment="Official award amount for this procurement action"
    )
    agreement_total: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(12, 2), nullable=True, comment="Cumulative agreement total after this action"
    )

    @classmethod
    def get_or_create_for_agreement(
        cls,
        session: Session,
        agreement: "Agreement",
        award_type: "AwardType",
        status: "ProcurementActionStatus" = ProcurementActionStatus.PLANNED,
        date_awarded_obligated: Optional[date] = None,
        created_by: Optional[int] = None,
    ) -> tuple["ProcurementAction", bool]:
        """
        Find an existing ProcurementAction for the agreement + award_type,
        or create one.

        Returns (action, was_created).
        """
        existing = session.execute(
            select(cls).where(
                cls.agreement_id == agreement.id,
                cls.award_type == award_type,
            )
        ).scalar_one_or_none()

        if existing:
            return existing, False

        action = cls(
            agreement_id=agreement.id,
            award_type=award_type,
            status=status,
            procurement_shop_id=agreement.awarding_entity_id,
            date_awarded_obligated=date_awarded_obligated,
            created_by=created_by,
        )
        session.add(action)
        session.flush()
        logger.info(
            f"Created ProcurementAction ({award_type.name}) for Agreement {agreement.id} "
            f"('{agreement.name}') with procurement_shop_id={agreement.awarding_entity_id}"
        )
        return action, True

    @BaseModel.display_name.getter
    def display_name(self):
        # Determine if this is an award or modification based on agreement_mod_id
        action = "Mod" if self.agreement_mod_id else "Award"
        mod_num = f" {self.agreement_mod.number}" if self.agreement_mod else ""
        return f"{action}{mod_num} - {self.agreement.name if self.agreement else 'Unknown'}"

    @property
    def mod_number(self) -> Optional[str]:
        """Get the modification number if this is for a modification."""
        return self.agreement_mod.number if self.agreement_mod else None

    @property
    def is_modification(self) -> bool:
        """Check if this procurement action is for a modification."""
        return self.agreement_mod_id is not None

    @property
    def award_date(self) -> Optional[date]:
        """Award date (alias for date_awarded_obligated)."""
        return self.date_awarded_obligated

    @property
    def budget_lines_total(self) -> Decimal:
        """Sum of budget line amounts (for validation against award_total)."""
        if not self.budget_line_items:
            return Decimal("0")
        return sum(Decimal(str(bli.amount or 0)) for bli in self.budget_line_items)

    @property
    def totals_match(self) -> bool:
        """Check if award_total matches budget lines total."""
        if not self.award_total:
            return True
        return abs(self.award_total - self.budget_lines_total) < Decimal("0.01")
