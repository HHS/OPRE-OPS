"""CAN models."""

import decimal
from datetime import date
from enum import Enum, auto
from typing import Any, List, Optional, override

from sqlalchemy import ForeignKey, Integer, Sequence, UniqueConstraint
from sqlalchemy.dialects.postgresql import ENUM
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import BaseModel
from models.portfolios import Portfolio


class CANMethodOfTransfer(Enum):
    DIRECT = auto()
    COST_SHARE = auto()
    IAA = auto()
    IDDA = auto()


class CANStatus(Enum):
    ACTIVE = auto()
    INACTIVE = auto()


class CANFundingSource(Enum):
    """The Funding Source for the CAN.

    This is the source of the money that is being allocated to the CAN.
    """

    OPRE = auto()
    ACF = auto()
    HHS = auto()


class CAN(BaseModel):
    """
    A CAN is a Common Accounting Number, which is
    used to track money coming into OPRE

    This model contains all the relevant
    descriptive information about a given CAN
    """

    __tablename__ = "can"

    id: Mapped[int] = BaseModel.get_pk_column(
        sequence=Sequence("can_id_seq", start=500, increment=1)
    )
    number: Mapped[str] = mapped_column(unique=True, nullable=False)

    description: Mapped[Optional[str]]
    nick_name: Mapped[Optional[str]]

    funding_details_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("can_funding_details.id"), nullable=True
    )
    funding_details: Mapped[Optional["CANFundingDetails"]] = relationship(
        "CANFundingDetails"
    )

    portfolio_id: Mapped[int] = mapped_column(Integer, ForeignKey("portfolio.id"))
    portfolio: Mapped[Portfolio] = relationship(Portfolio, back_populates="cans")

    funding_budgets: Mapped[List["CANFundingBudget"]] = relationship(
        "CANFundingBudget", back_populates="can"
    )

    funding_received: Mapped[List["CANFundingReceived"]] = relationship(
        "CANFundingReceived", back_populates="can"
    )

    budget_line_items: Mapped[List["BudgetLineItem"]] = relationship(
        "BudgetLineItem", back_populates="can"
    )

    @property
    def is_expired(self):
        today = date.today()
        current_fy = today.year if today.month <= 9 else today.year + 1
        is_expired = (
            self.funding_details is None
            or self.funding_details.obligate_by <= current_fy
        )
        return is_expired

    @property
    def status(self):
        total_funding = sum([b.budget for b in self.funding_budgets]) or 0
        total_spent = (
            sum([b.amount for b in self.budget_line_items if b.status.name != "DRAFT"])
            or 0
        )
        available_funding = total_funding - total_spent

        can_status = (
            CANStatus.INACTIVE
            if available_funding <= 0 and self.is_expired
            else CANStatus.ACTIVE
        )
        return can_status

    @property
    def active_period(self):
        if self.funding_details is None:
            return None
        return self.funding_details.active_period

    @property
    def funding_method(self):
        if self.funding_details is None:
            return None
        return self.funding_details.funding_method

    @property
    def funding_release_method(self):
        if self.funding_details is None:
            return None
        return self.funding_details.funding_method

    @property
    def funding_type(self):
        if self.funding_details is None:
            return None
        return self.funding_details.funding_type


    @property
    def obligate_by(self):
        if self.funding_details is None:
            return None
        return self.funding_details.obligate_by

    @property
    def projects(self) -> set["Project"]:
        return set([bli.project for bli in self.budget_line_items if bli.project])

    @BaseModel.display_name.getter
    def display_name(self):
        return self.number

    @override
    def to_dict(self) -> dict[str, Any]:  # type: ignore[override]
        d: dict[str, Any] = super().to_dict()  # type: ignore[no-untyped-call]

        d.update(
            {
                "display_name": self.display_name,
                "funding_details": (
                    self.funding_details.to_dict() if self.funding_details else None
                ),
                "funding_budgets": [fb.to_dict() for fb in self.funding_budgets],
                "funding_received": [fr.to_dict() for fr in self.funding_received],
                "active_period": self.active_period,
                "expiration_date": self.obligate_by,
                "appropriation_date": (
                    self.funding_details.fiscal_year if self.funding_details else None
                ),
                "projects": [p.id for p in self.projects],
            }
        )

        return d


class CANFundingDetails(BaseModel):
    """
    The details of funding for a given fiscal year for a CAN.
    """

    __tablename__ = "can_funding_details"

    id: Mapped[int] = BaseModel.get_pk_column()
    fiscal_year: Mapped[int]
    fund_code: Mapped[str]
    allowance: Mapped[Optional[str]]
    sub_allowance: Mapped[Optional[str]]
    allotment: Mapped[Optional[str]]
    appropriation: Mapped[Optional[str]]
    method_of_transfer: Mapped[CANMethodOfTransfer] = mapped_column(
        ENUM(CANMethodOfTransfer), nullable=True
    )
    funding_source: Mapped[CANFundingSource] = mapped_column(
        ENUM(CANFundingSource), nullable=True
    )
    funding_partner: Mapped[Optional[str]]

    @property
    def active_period(self) -> Optional[int]:
        """The number of years the funds are active for"""
        if len(self.fund_code) != 14:
            return None
        return int(self.fund_code[10:11])

    @property
    def funding_method(self) -> Optional[str]:
        """The way the funds are transferred by"""
        if len(self.fund_code) == 14:
            method = self.fund_code[11].upper()
            return {"D": "Direct", "M": "Reimbursable"}.get(method)
        return None

    @property
    def funding_received(self) -> Optional[str]:
        """When the funds are received"""
        if len(self.fund_code) == 14:
            method = self.fund_code[12].upper()
            return {"A": "Quarterly", "B": "FY Start"}.get(method)
        return None

    @property
    def funding_type(self) -> Optional[str]:
        """The type of funding"""
        if len(self.fund_code) == 14:
            funding_type = self.fund_code[13].upper()
            return {"D": "Discretionary", "M": "Mandatory"}.get(funding_type)
        return None

    @property
    def obligate_by(self) -> Optional[int]:
        """The fiscal year in which the funds must be obligated by"""
        return self.fiscal_year + self.active_period


class CANFundingReceived(BaseModel):
    """
    The details of funding received for a given fiscal year for a CAN.
    """

    __tablename__ = "can_funding_received"

    id: Mapped[int] = BaseModel.get_pk_column(
        sequence=Sequence("can_funding_received_id_seq", start=5000, increment=1)
    )
    fiscal_year: Mapped[int]
    can_id: Mapped[int] = mapped_column(Integer, ForeignKey("can.id"))
    funding: Mapped[Optional[decimal.Decimal]]
    notes: Mapped[Optional[str]]

    can: Mapped[CAN] = relationship(CAN, back_populates="funding_received")


class CANFundingBudget(BaseModel):
    """
    The details of funding budgeted for a given fiscal year for a CAN.
    """

    __tablename__ = "can_funding_budget"

    __table_args__ = (UniqueConstraint("fiscal_year", "can_id"),)

    id: Mapped[int] = BaseModel.get_pk_column()
    fiscal_year: Mapped[int]
    can_id: Mapped[int] = mapped_column(Integer, ForeignKey("can.id"))
    budget: Mapped[Optional[decimal.Decimal]]
    notes: Mapped[Optional[str]]

    can: Mapped[CAN] = relationship(CAN, back_populates="funding_budgets")

    @property
    def is_carry_forward(self) -> Optional[bool]:
        """If this is a carry forward budget then return True else it is new money return False"""
        return (
            self.fiscal_year != self.can.funding_details.fiscal_year
            if self.can.funding_details
            else None
        )
