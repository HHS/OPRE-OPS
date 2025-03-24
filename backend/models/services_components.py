"""ServicesComponents models."""

from datetime import date
from typing import Optional

from sqlalchemy import Boolean, Date, ForeignKey, Integer, Sequence, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models import ServiceRequirementType
from models.base import BaseModel


class ServicesComponent(BaseModel):
    """
    A Services Component (SC) is the "what" when referring to an Agreement.
    It outlines what work is occuring under a given Agreement.

    This model contains all the relevant
    descriptive information about a given Services Component

    contract_agreement_id - The ID of the Contract Agreement the Services Component is associated with
    number - The index number of the Services Component
    optional - Whether the Services Component is optional or not (OSC or 'Option Period')
    description - The description of the Services Component (not sure if needed)
    period_start - The start date of the Services Component
    period_end - The end date of the Services Component
    budget_line_items - The Budget Line Items associated with the Services Component
    period_duration - The duration of the Services Component (derived from period_start and period_end)
    display_title - The long name of the Services Component (e.g. "Optional Services Component 1")
    display_name - The short name of the Services Component (e.g. "OSC1")
    sub_component - The sub-component of old MAPS Services Components (child of the number).
    """

    __tablename__ = "services_component"
    __table_args__ = (
        UniqueConstraint(
            "number", "sub_component", "optional", "contract_agreement_id"
        ),
    )

    id: Mapped[int] = BaseModel.get_pk_column()
    number: Mapped[int] = mapped_column(Integer)
    optional: Mapped[bool] = mapped_column(Boolean, default=False)

    description: Mapped[Optional[str]] = mapped_column(String)
    period_start: Mapped[Optional[date]] = mapped_column(Date)
    period_end: Mapped[Optional[date]] = mapped_column(Date)

    sub_component: Mapped[Optional[str]] = mapped_column(String)

    contract_agreement_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("contract_agreement.id", ondelete="CASCADE")
    )
    contract_agreement: Mapped["ContractAgreement"] = relationship(
        "ContractAgreement",
        passive_deletes=True,
    )

    def severable(self):
        return (
            self.contract_agreement
            and self.contract_agreement.service_requirement_type
            == ServiceRequirementType.SEVERABLE
        )

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
        if self.severable():
            pre = "Base" if self.number == 1 else "Optional"
            return f"{pre} Period {self.number}"
        optional = "O" if self.optional else ""
        return f"{optional}SC{self.number}"


class CLIN(BaseModel):
    """
    Contract Line Item Number (CLIN) is a unique identifier for a contract line item,
    """

    __tablename__ = "clin"
    __table_args__ = (UniqueConstraint("number", "contract_agreement_id"),)

    id: Mapped[int] = BaseModel.get_pk_column(
        sequence=Sequence("clin_id_seq", start=5000, increment=1)
    )
    number: Mapped[Optional[int]] = mapped_column(Integer)
    name: Mapped[Optional[str]] = mapped_column(String)
    pop_start_date: Mapped[Optional[date]] = mapped_column(Date)
    pop_end_date: Mapped[Optional[date]] = mapped_column(Date)

    contract_agreement_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("contract_agreement.id", ondelete="CASCADE"), nullable=False
    )
    contract_agreement: Mapped["ContractAgreement"] = relationship(
        "ContractAgreement",
        passive_deletes=True,
    )
