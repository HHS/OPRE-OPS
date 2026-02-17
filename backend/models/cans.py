"""CAN models."""

from datetime import date
from decimal import Decimal
from enum import Enum, auto
from typing import Any, List, Optional, override

from sqlalchemy import ForeignKey, Index, Integer, Sequence, UniqueConstraint, case, func
from sqlalchemy.dialects.postgresql import ENUM
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import BaseModel
from models.portfolios import Portfolio


class CANMethodOfTransfer(Enum):
    DIRECT = auto()
    COST_SHARE = auto()
    IAA = auto()
    IDDA = auto()
    OTHER = auto()


class CANStatus(Enum):
    ACTIVE = auto()
    INACTIVE = auto()


class CANSortCondition(Enum):
    def __str__(self):
        return str(self.value)

    CAN_NAME = "CAN_NAME"
    PORTFOLIO = "PORTFOLIO"
    ACTIVE_PERIOD = "ACTIVE_PERIOD"
    OBLIGATE_BY = "OBLIGATE_BY"
    FY_BUDGET = "FY_BUDGET"
    FUNDING_RECEIVED = "FUNDING_RECEIVED"
    AVAILABLE_BUDGET = "AVAILABLE_BUDGET"


class CANFundingSource(Enum):
    """The Funding Source for the CAN.

    This is the source of the money that is being allocated to the CAN.
    """

    OPRE = auto()
    ACF = auto()
    ACF_MOU = auto()
    HHS = auto()
    OTHER = auto()


class CAN(BaseModel):
    """
    A CAN is a Common Accounting Number, which is
    used to track money coming into OPRE

    This model contains all the relevant
    descriptive information about a given CAN
    """

    __tablename__ = "can"

    id: Mapped[int] = BaseModel.get_pk_column(sequence=Sequence("can_id_seq", start=500, increment=1))
    number: Mapped[str] = mapped_column(unique=True, nullable=False)

    description: Mapped[Optional[str]]
    nick_name: Mapped[Optional[str]]

    funding_details_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("can_funding_details.id"), nullable=True
    )
    funding_details: Mapped[Optional["CANFundingDetails"]] = relationship("CANFundingDetails")

    portfolio_id: Mapped[int] = mapped_column(Integer, ForeignKey("portfolio.id"))
    portfolio: Mapped[Portfolio] = relationship(Portfolio, back_populates="cans")

    funding_budgets: Mapped[List["CANFundingBudget"]] = relationship("CANFundingBudget", back_populates="can")

    funding_received: Mapped[List["CANFundingReceived"]] = relationship("CANFundingReceived", back_populates="can")

    budget_line_items: Mapped[List["BudgetLineItem"]] = relationship("BudgetLineItem", back_populates="can")

    __table_args__ = (
        Index("ix_can_portfolio_id", "portfolio_id"),
        Index("ix_can_funding_details_id", "funding_details_id"),
    )

    @property
    def active_years(self):
        """
        Return a list of active fiscal years for this CAN based on its funding details
        appropriation fiscal year and active period.
        """
        if self.funding_details is None:
            return []

        return self.funding_details.active_years

    @property
    def is_expired(self):
        if self.funding_details is None:
            return True

        today = date.today()
        current_fy = today.year if today.month <= 9 else today.year + 1

        # For perpetual funds (active_period = 0), check if fiscal year has started
        if self.funding_details.active_period == 0:
            return self.funding_details.fiscal_year > current_fy

        # For time-limited funds, check if they've expired or haven't started yet
        expiration_fy = self.funding_details.fiscal_year + self.funding_details.active_period
        return expiration_fy <= current_fy or self.funding_details.fiscal_year > current_fy

    @property
    def status(self):
        total_funding = sum([b.budget for b in self.funding_budgets]) or 0
        total_spent = sum([b.amount for b in self.budget_line_items if not b.is_obe and (b.status != "DRAFT")]) or 0
        available_funding = total_funding - total_spent

        can_status = CANStatus.INACTIVE if available_funding <= 0 and self.is_expired else CANStatus.ACTIVE
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
    def funding_frequency(self):
        if self.funding_details is None:
            return None
        return self.funding_details.funding_received

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
                "funding_details": (self.funding_details.to_dict() if self.funding_details else None),
                "funding_budgets": [fb.to_dict() for fb in self.funding_budgets],
                "funding_received": [fr.to_dict() for fr in self.funding_received],
                "active_period": self.active_period,
                "expiration_date": self.obligate_by,
                "appropriation_date": (self.funding_details.fiscal_year if self.funding_details else None),
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
    method_of_transfer: Mapped[CANMethodOfTransfer] = mapped_column(ENUM(CANMethodOfTransfer), nullable=True)
    funding_source: Mapped[CANFundingSource] = mapped_column(ENUM(CANFundingSource), nullable=True)
    funding_partner: Mapped[Optional[str]]

    __table_args__ = (
        Index("ix_can_funding_details_fiscal_year", "fiscal_year"),
        Index("ix_can_funding_details_created_by", "created_by"),
        Index("ix_can_funding_details_updated_by", "updated_by"),
    )

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

    @hybrid_property
    def obligate_by(self) -> Optional[int]:
        """The fiscal year in which the funds must be obligated by"""
        if self.active_period is None:
            return None
        if self.active_period == 0:
            return int(9999)  # Perpetual funds
        return self.fiscal_year + self.active_period - 1

    @obligate_by.expression  # type: ignore[misc]
    def obligate_by(cls):
        active_period = func.substr(cls.fund_code, 11, 1).cast(Integer)
        return case((active_period == 0, 9999), else_=cls.fiscal_year + active_period - 1)

    @hybrid_property
    def active_years(self):
        """
        Return a list of active fiscal years for this funding details based on
        appropriation fiscal year and active period.
        """
        if self.active_period == 0:
            # For perpetual funds, return from fiscal year to current FY + 5 years
            today = date.today()
            current_fy = today.year if today.month <= 9 else today.year + 1
            end_year = current_fy + 5

            return [
                year
                for year in range(
                    self.fiscal_year,
                    end_year + 1,
                )
            ]

        return [
            year
            for year in range(
                self.fiscal_year,
                self.fiscal_year + self.active_period,
            )
        ]


class CANFundingReceived(BaseModel):
    """
    The details of funding received for a given fiscal year for a CAN.
    """

    __tablename__ = "can_funding_received"

    id: Mapped[int] = BaseModel.get_pk_column(sequence=Sequence("can_funding_received_id_seq", start=5000, increment=1))
    fiscal_year: Mapped[int]
    can_id: Mapped[int] = mapped_column(Integer, ForeignKey("can.id"))
    funding: Mapped[Optional[Decimal]]
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
    budget: Mapped[Optional[Decimal]]
    notes: Mapped[Optional[str]]

    can: Mapped[CAN] = relationship(CAN, back_populates="funding_budgets")

    @property
    def is_carry_forward(self) -> Optional[bool]:
        """If this is a carry forward budget then return True else it is new money return False"""
        return self.fiscal_year != self.can.funding_details.fiscal_year if self.can.funding_details else None
