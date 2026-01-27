"""Workflow models."""

from enum import Enum, auto
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, Integer, String, event
from sqlalchemy.dialects.postgresql import ENUM, JSONB
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models import BaseModel

# ---=== CHANGE REQUESTS ===---


class ChangeRequestStatus(Enum):
    IN_REVIEW = auto()
    APPROVED = auto()
    REJECTED = auto()


class ChangeRequestType(Enum):
    CHANGE_REQUEST = auto()
    AGREEMENT_CHANGE_REQUEST = auto()
    BUDGET_LINE_ITEM_CHANGE_REQUEST = auto()


class ChangeRequest(BaseModel):
    __tablename__ = "change_request"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    change_request_type: Mapped[ChangeRequestType] = mapped_column(ENUM(ChangeRequestType), index=True, nullable=False)

    # agreement_type: Mapped[AgreementType] = mapped_column(ENUM(AgreementType))
    status: Mapped[ChangeRequestStatus] = mapped_column(
        ENUM(ChangeRequestStatus), nullable=False, default=ChangeRequestStatus.IN_REVIEW
    )
    requested_change_data: Mapped[JSONB] = mapped_column(JSONB)
    requested_change_diff: Mapped[Optional[JSONB]] = mapped_column(JSONB)
    requested_change_info: Mapped[Optional[JSONB]] = mapped_column(JSONB)
    # BaseModel.created_by is the requestor, so there's no need for another column for that
    requestor_notes: Mapped[Optional[str]] = mapped_column(String)

    managing_division_id: Mapped[Optional[int]] = mapped_column(ForeignKey("division.id"))
    managing_division = relationship(
        "Division",
        passive_deletes=True,
    )

    reviewed_by_id: Mapped[Optional[int]] = mapped_column(ForeignKey("ops_user.id"))
    reviewed_on: Mapped[Optional[DateTime]] = mapped_column(DateTime)
    reviewer_notes: Mapped[Optional[str]] = mapped_column(String)

    __mapper_args__ = {
        "polymorphic_on": "change_request_type",
        "polymorphic_identity": ChangeRequestType.CHANGE_REQUEST,
    }


class AgreementChangeRequest(ChangeRequest):
    agreement_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("agreement.id", ondelete="CASCADE"),
        index=True,
        nullable=True,
    )
    agreement = relationship(
        "Agreement",
        passive_deletes=True,
    )

    __mapper_args__ = {
        "polymorphic_identity": ChangeRequestType.AGREEMENT_CHANGE_REQUEST,
    }

    proc_shop_field_names = ["awarding_entity_id"]

    @hybrid_property
    def has_proc_shop_change(self):
        return any(key in self.requested_change_data for key in self.proc_shop_field_names)

    @has_proc_shop_change.expression
    def has_proc_shop_change(cls):
        return cls.requested_change_data.has_any(cls.proc_shop_field_names)


class BudgetLineItemChangeRequest(AgreementChangeRequest):
    budget_line_item_id: Mapped[Optional[int]] = mapped_column(ForeignKey("budget_line_item.id", ondelete="CASCADE"))
    budget_line_item = relationship(
        "BudgetLineItem",
        passive_deletes=True,
    )

    __mapper_args__ = {
        "polymorphic_identity": ChangeRequestType.BUDGET_LINE_ITEM_CHANGE_REQUEST,
    }

    budget_field_names = ["amount", "can_id", "date_needed"]

    @hybrid_property
    def has_budget_change(self):
        return any(key in self.requested_change_data for key in self.budget_field_names)

    @has_budget_change.expression
    def has_budget_change(cls):
        return cls.requested_change_data.has_any(cls.budget_field_names)

    @hybrid_property
    def has_status_change(self):
        return "status" in self.requested_change_data

    @has_status_change.expression
    def has_status_change(cls):
        return cls.requested_change_data.has_key("status")

    def to_dict(self):
        """Override to_dict to include hybrid properties."""
        data = super().to_dict()
        data["has_budget_change"] = bool(self.has_budget_change)
        data["has_status_change"] = bool(self.has_status_change)
        return data


# require agreement_id for Agreement changes.
# (It has to be Optional in the model to keep the column nullable for other types)
@event.listens_for(AgreementChangeRequest, "before_insert")
@event.listens_for(AgreementChangeRequest, "before_update")
@event.listens_for(BudgetLineItemChangeRequest, "before_insert")
@event.listens_for(BudgetLineItemChangeRequest, "before_update")
def check_agreement_id(mapper, connection, target):
    if target.agreement_id is None:
        raise ValueError("agreement_id is required for AgreementChangeRequest")


# require budget_line_item_id for BLI changes.
# (It has to be Optional in the model to keep the column nullable for other types)
@event.listens_for(BudgetLineItemChangeRequest, "before_insert")
@event.listens_for(BudgetLineItemChangeRequest, "before_update")
def check_budget_line_id(mapper, connection, target):
    if target.budget_line_item_id is None:
        raise ValueError("budget_line_item_id is required for BudgetLineItemChangeRequest")
