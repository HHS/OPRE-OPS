from typing import Optional

from sqlalchemy import DateTime, ForeignKey, Integer, event
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

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
    agreement_id: Mapped[Optional[int]] = mapped_column(ForeignKey("agreement.id"))

    __mapper_args__ = {
        "polymorphic_identity": "agreement_change_request",
    }


@event.listens_for(AgreementChangeRequest, "before_insert")
@event.listens_for(AgreementChangeRequest, "before_update")
def check_agreement_id(mapper, connection, target):
    if target.agreement_id is None:
        raise ValueError("agreement_id is required for AgreementChangeRequest")


class BudgetLineItemChangeRequest(ChangeRequest):
    # if this isn't optional here, SQL will make the column non-nullable
    budget_line_item_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("budget_line_item.id")
    )

    __mapper_args__ = {
        "polymorphic_identity": "budget_line_item_change_request",
    }


@event.listens_for(BudgetLineItemChangeRequest, "before_insert")
@event.listens_for(BudgetLineItemChangeRequest, "before_update")
def check_agreement_id(mapper, connection, target):
    if target.budget_line_item_id is None:
        raise ValueError(
            "budget_line_item_id is required for BudgetLineItemChangeRequest"
        )
