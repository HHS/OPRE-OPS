from typing import Optional

from sqlalchemy import DateTime, ForeignKey, Integer, event
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, backref, mapped_column, relationship

from models.base import BaseModel


# ? use a generic reqeust with object_id and object_type or use a subclass for each type
class ChangeRequest(BaseModel):
    __tablename__ = "change_request"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    type: Mapped[str]
    requested_changes: Mapped[JSONB] = mapped_column(JSONB)
    requested_by_id: Mapped[Optional[int]] = mapped_column(ForeignKey("user.id"))
    approved_by_id: Mapped[Optional[int]] = mapped_column(ForeignKey("user.id"))
    approved_on: Mapped[Optional[DateTime]] = mapped_column(DateTime)

    __mapper_args__ = {
        "polymorphic_on": "type",
        "polymorphic_identity": "change_request",
    }


class AgreementChangeRequest(ChangeRequest):
    # if this isn't optional here, SQL will make the column non-nullable
    agreement_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("agreement.id", ondelete="CASCADE")
    )
    agreement = relationship(
        "Agreement",
        passive_deletes=True,
    )

    __mapper_args__ = {
        "polymorphic_identity": "agreement_change_request",
    }


# require agreement_id for Agreement changes.
# (It has to be Optional in the model to keep the column nullable for other types)
@event.listens_for(AgreementChangeRequest, "before_insert")
@event.listens_for(AgreementChangeRequest, "before_update")
def check_agreement_id(mapper, connection, target):
    if target.agreement_id is None:
        raise ValueError("agreement_id is required for AgreementChangeRequest")


# Should there be separate types of changes request for financial and status changes?
class BudgetLineItemChangeRequest(ChangeRequest):
    budget_line_item_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("budget_line_item.id", ondelete="CASCADE")
    )
    budget_line_item = relationship(
        "BudgetLineItem",
        passive_deletes=True,
    )

    __mapper_args__ = {
        "polymorphic_identity": "budget_line_item_change_request",
    }


class BudgetLineItemFinancialChangeRequest(BudgetLineItemChangeRequest):
    financial_field_names = ["amount", "can_id", "date_needed"]
    # should there be an event listener to make sure the requested changes are only financial changes?

    __mapper_args__ = {
        "polymorphic_identity": "budget_line_item_financial_change_request",
    }


class BudgetLineItemStatusChangeRequest(BudgetLineItemChangeRequest):
    # should this only allow a status change or could there be other changes included?
    # status_field_names = ["status"]
    __mapper_args__ = {
        "polymorphic_identity": "budget_line_item_status_change_request",
    }


# require budget_line_item_id for BLI changes.
# (It has to be Optional in the model to keep the column nullable for other types)
@event.listens_for(BudgetLineItemChangeRequest, "before_insert")
@event.listens_for(BudgetLineItemChangeRequest, "before_update")
@event.listens_for(BudgetLineItemFinancialChangeRequest, "before_insert")
@event.listens_for(BudgetLineItemFinancialChangeRequest, "before_update")
def check_agreement_id(mapper, connection, target):
    if target.budget_line_item_id is None:
        raise ValueError(
            "budget_line_item_id is required for BudgetLineItemChangeRequest"
        )
