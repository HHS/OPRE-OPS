"""BudgetLineItem models."""

import decimal
from datetime import date
from enum import Enum, auto
from typing import Optional

from sqlalchemy import Boolean, Date, ForeignKey, Integer, Numeric, Sequence, String, Text, case, select
from sqlalchemy.dialects.postgresql import ENUM
from sqlalchemy.orm import Mapped, mapped_column, object_session, relationship
from typing_extensions import Any, override

from models import CAN
from models.base import BaseModel
from models.change_requests import BudgetLineItemChangeRequest, ChangeRequestStatus
from models.portfolios import Portfolio


class ModType(Enum):
    ADMIN = auto()
    AMOUNT_TBD = auto()
    AS_IS = auto()
    REPLACEMENT_AMOUNT_FINAL = auto()


class BudgetLineItemStatus(Enum):
    def __str__(self):
        return str(self.value)

    DRAFT = "Draft"
    PLANNED = "Planned"
    IN_EXECUTION = "In Execution"
    OBLIGATED = "Obligated"


class BudgetLineItem(BaseModel):
    __tablename__ = "budget_line_item"

    id: Mapped[int] = BaseModel.get_pk_column(
        sequence=Sequence("budget_line_item_id_seq", start=15000, increment=1)
    )
    line_description: Mapped[Optional[str]] = mapped_column(String)
    comments: Mapped[Optional[str]] = mapped_column(Text)

    agreement_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("agreement.id")
    )
    agreement: Mapped[Optional["Agreement"]] = relationship(
        "Agreement", back_populates="budget_line_items"
    )

    can_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("can.id"))
    can: Mapped[Optional[CAN]] = relationship(CAN, back_populates="budget_line_items")

    services_component_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("services_component.id")
    )
    services_component: Mapped[Optional["ServicesComponent"]] = relationship(
        "ServicesComponent", backref="budget_line_items"
    )

    clin_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("clin.id"))
    clin: Mapped[Optional["CLIN"]] = relationship("CLIN", backref="budget_line_items")

    amount: Mapped[Optional[decimal]] = mapped_column(Numeric(12, 2))
    mod_type: Mapped[Optional[ModType]] = mapped_column(ENUM(ModType))

    status: Mapped[Optional[BudgetLineItemStatus]] = mapped_column(
        ENUM(BudgetLineItemStatus)
    )

    on_hold: Mapped[bool] = mapped_column(Boolean, default=False)
    certified: Mapped[bool] = mapped_column(Boolean, default=False)
    closed: Mapped[bool] = mapped_column(Boolean, default=False)

    requisition_number: Mapped[Optional[int]] = mapped_column(Integer)
    requisition_date: Mapped[Optional[date]] = mapped_column(Date)

    is_under_current_resolution: Mapped[Optional[bool]] = mapped_column(
        Boolean, default=False
    )

    date_needed: Mapped[Optional[date]] = mapped_column(Date)

    proc_shop_fee_percentage: Mapped[Optional[decimal]] = mapped_column(
        Numeric(12, 5)
    )  # may need to be a different object, i.e. flat rate or percentage

    @BaseModel.display_name.getter
    def display_name(self):
        return f"BL {self.id}"

    @property
    def portfolio_id(self):
        return object_session(self).scalar(
            select(Portfolio.id)
            .join(CAN, Portfolio.id == CAN.portfolio_id)
            .join(self.__class__, self.can_id == CAN.id)
            .where(self.__class__.id == self.id)
        )

    @property
    def fiscal_year(self):
        date_needed = self.date_needed or None
        month = date_needed.month if date_needed else -1
        year = date_needed.year if date_needed else -1
        return object_session(self).scalar(
            select(
                case(
                    (month >= 10, year + 1),
                    (month >= 0 and month < 10, year),
                    else_=None,
                )
            )
        )

    @property
    def team_members(self):
        return self.agreement.team_members if self.agreement else []

    @property
    def change_requests_in_review(self):
        if object_session(self) is None:
            return None
        results = (
            object_session(self)
            .execute(
                select(BudgetLineItemChangeRequest)
                .where(BudgetLineItemChangeRequest.budget_line_item_id == self.id)
                .where(
                    BudgetLineItemChangeRequest.status == ChangeRequestStatus.IN_REVIEW
                )
            )
            .all()
        )
        change_requests = [row[0] for row in results] if results else None
        return change_requests

    @property
    def in_review(self):
        return self.change_requests_in_review is not None

    @property
    def project(self) -> Optional["Project"]:
        return self.agreement.project if self.agreement else None

    @override
    def to_dict(self) -> dict[str, Any]:  # type: ignore[override]
        d: dict[str, Any] = super().to_dict()  # type: ignore[no-untyped-call]
        # add the transient attribute that tracks the change request responsible for changes (if it exists)
        # so that it's added to the history event details
        if hasattr(self, "acting_change_request_id"):
            d.update(
                acting_change_request_id=self.acting_change_request_id,
            )
        return d
