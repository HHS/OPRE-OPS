"""ServicesComponents models."""

from datetime import date
from typing import Optional

from sqlalchemy import (
    Boolean,
    Date,
    ForeignKey,
    Index,
    Integer,
    Sequence,
    String,
    UniqueConstraint,
    event,
    exists,
    select,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, object_session, relationship

from models import BudgetLineItem, BudgetLineItemStatus, ContractAgreement, ServiceRequirementType
from models.base import BaseModel
from models.change_requests import ServicesComponentChangeRequest


class ServicesComponent(BaseModel):
    """
    A Services Component (SC) is the "what" when referring to an Agreement.
    It outlines what work is occurring under a given Agreement.
    """

    __tablename__ = "services_component"
    __table_args__ = (
        # Unique constraint for when sub_component IS NULL
        Index(
            "ix_services_component_unique_null_subcomponent",
            "agreement_id",
            "number",
            "optional",
            unique=True,
            postgresql_where=text("sub_component IS NULL"),
        ),
        # Unique constraint for when sub_component IS NOT NULL
        Index(
            "ix_services_component_unique_with_subcomponent",
            "agreement_id",
            "number",
            "sub_component",
            "optional",
            unique=True,
            postgresql_where=text("sub_component IS NOT NULL"),
        ),
    )

    id: Mapped[int] = BaseModel.get_pk_column()
    number: Mapped[int] = mapped_column(Integer)
    optional: Mapped[bool] = mapped_column(Boolean, default=False)

    description: Mapped[Optional[str]] = mapped_column(String)
    period_start: Mapped[Optional[date]] = mapped_column(Date)
    period_end: Mapped[Optional[date]] = mapped_column(Date)

    sub_component: Mapped[Optional[str]] = mapped_column(String)

    agreement_id: Mapped[int] = mapped_column(Integer, ForeignKey("agreement.id", ondelete="CASCADE"))
    agreement: Mapped["Agreement"] = relationship(
        "Agreement",
        back_populates="services_components",
        passive_deletes=True,
    )

    display_name_for_sort: Mapped[Optional[str]] = mapped_column(String)

    # True while an SC added on an Awarded agreement hasn't had its addition approved (OPS-6440).
    # The add change request is only created once the SC has a non-Draft budget line.
    awaiting_add_approval: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")

    @property
    def change_requests_in_review(self):
        session = object_session(self)
        if session is None or self.id is None:
            return None
        change_requests = session.scalars(
            select(ServicesComponentChangeRequest).where(
                ServicesComponentChangeRequest.in_review_filter(),
                ServicesComponentChangeRequest.services_component_id == self.id,
            )
        ).all()
        return change_requests if change_requests else None

    @property
    def in_review(self) -> bool:
        return self.change_requests_in_review is not None

    @property
    def has_non_draft_budget_lines(self) -> bool:
        """Only non-Draft budget lines gate an SC on an Awarded agreement: an add needs approval
        and a delete is blocked. Draft lines come into play when they become Planned (OPS-6440).

        Queried rather than read from ``budget_line_items`` so links flushed in the current
        transaction (set via ``services_component_id``) are seen."""
        session = object_session(self)
        if session is None or self.id is None:
            return False
        return bool(
            session.scalar(
                select(
                    exists().where(
                        BudgetLineItem.services_component_id == self.id,
                        BudgetLineItem.status != BudgetLineItemStatus.DRAFT,
                    )
                )
            )
        )

    def severable(self):
        return self.agreement and self.agreement.service_requirement_type == ServiceRequirementType.SEVERABLE

    @property
    def display_title(self):
        if self.severable():
            pre = "Base" if self.number == 1 else "Optional"
            return f"{pre} Period {self.number}"
        optional = "Optional " if self.optional else ""
        return f"{optional}Services Component {self.number}"

    @property
    def period_duration(self):
        if self.period_start and self.period_end:
            return abs(self.period_end - self.period_start)
        return None

    @BaseModel.display_name.getter
    def display_name(self):
        return ServicesComponent.get_display_name(self.number, self.optional, self.severable())

    @staticmethod
    def get_display_name(number, optional, is_severable):
        if is_severable:
            pre = "Base" if number == 1 else "Optional"
            return f"{pre} Period {number}"
        optional = "O" if optional else ""
        return f"{optional}SC{number}"


@event.listens_for(ServicesComponent, "before_insert")
@event.listens_for(ServicesComponent, "before_update")
def update_sc_before_upsert(mapper, connection, target):
    if target.agreement_id:
        requirement_type = connection.scalar(
            select(ContractAgreement.service_requirement_type).where(ContractAgreement.id == target.agreement_id)
        )
        display_name = ServicesComponent.get_display_name(
            target.number,
            target.optional,
            requirement_type == ServiceRequirementType.SEVERABLE,
        )
        target.display_name_for_sort = display_name


class CLIN(BaseModel):
    """
    Contract Line Item Number (CLIN) is a unique identifier for a contract line item,
    """

    __tablename__ = "clin"
    __table_args__ = (UniqueConstraint("number", "agreement_id"),)

    id: Mapped[int] = BaseModel.get_pk_column(sequence=Sequence("clin_id_seq", start=5000, increment=1))
    number: Mapped[Optional[int]] = mapped_column(Integer)
    name: Mapped[Optional[str]] = mapped_column(String)
    pop_start_date: Mapped[Optional[date]] = mapped_column(Date)
    pop_end_date: Mapped[Optional[date]] = mapped_column(Date)

    agreement_id: Mapped[int] = mapped_column(Integer, ForeignKey("agreement.id", ondelete="CASCADE"), nullable=False)
    agreement: Mapped["Agreement"] = relationship(
        "Agreement",
        passive_deletes=True,
    )
