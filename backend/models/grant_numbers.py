"""GrantNumber models."""

from datetime import date
from typing import Optional

from sqlalchemy import Date, ForeignKey, Index, Integer, String
from sqlalchemy.orm import (
    Mapped,
    foreign,
    mapped_column,
    relationship,
)  # noqa: F401 (foreign used in primaryjoin string)

from models import GrantAgreement
from models.base import BaseModel


class GrantNumber(BaseModel):
    """
    A Grant Number is a repeatable placeholder identifier for a Grant agreement,
    analogous to a Services Component for a Contract, but without any contract-specific
    baggage (no severable logic, no sub-component, no display-name-for-sort listener).
    """

    __tablename__ = "grant_number"
    __table_args__ = (Index("ix_grant_number_unique", "agreement_id", "number", unique=True),)

    id: Mapped[int] = BaseModel.get_pk_column()
    number: Mapped[int] = mapped_column(Integer, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String)
    period_start: Mapped[Optional[date]] = mapped_column(Date)
    period_end: Mapped[Optional[date]] = mapped_column(Date)

    # The FK targets the base `agreement` table (matching the ServicesComponent pattern), but the
    # relationship target below is the `GrantAgreement` subclass so grant_numbers is only ever
    # reachable from a Grant agreement, not every agreement type. SQLAlchemy can't auto-derive the
    # join in that case (there's no FK from grant_number -> grant_agreement), so primaryjoin is
    # explicit on both this side and GrantAgreement.grant_numbers.
    agreement_id: Mapped[int] = mapped_column(Integer, ForeignKey("agreement.id", ondelete="CASCADE"))
    agreement: Mapped["GrantAgreement"] = relationship(
        GrantAgreement,
        primaryjoin="foreign(GrantNumber.agreement_id) == GrantAgreement.id",
        back_populates="grant_numbers",
        passive_deletes=True,
    )

    @property
    def display_title(self):
        return f"Grant {self.number}"

    @property
    def period_duration(self):
        if self.period_start and self.period_end:
            return abs(self.period_end - self.period_start)
        return None

    @BaseModel.display_name.getter
    def display_name(self):
        return f"Grant {self.number}"
