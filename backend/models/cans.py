"""CAN models."""

import decimal
from enum import Enum, auto
from typing import List, Optional

from sqlalchemy import ForeignKey, Integer, Sequence
from sqlalchemy.dialects.postgresql import ENUM
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import BaseModel
from models.portfolios import Portfolio


class CANMethodOfTransfer(Enum):
    DIRECT = auto()
    COST_SHARE = auto()
    IAA = auto()
    IDDA = auto()


# class CANType(Enum):
#     OPRE = auto()
#     NON_OPRE = auto()
#
#
# class CANStatus(Enum):
#     ACTIVE = auto()
#     INACTIVE = auto()


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

    budget_line_items: Mapped[List["BudgetLineItem"]] = relationship(
        "BudgetLineItem", back_populates="can"
    )

    projects: Mapped[List["Project"]] = relationship(
        "Project", secondary="project_cans", back_populates="cans"
    )
    #
    # @property
    # def status(self):
    #     current_year = date.today().year
    #     can_fiscal_year = object_session(self).scalar(
    #         select(CANFiscalYear).where(
    #             and_(
    #                 CANFiscalYear.can_id == self.id,
    #                 CANFiscalYear.fiscal_year == current_year,
    #             )
    #         )
    #     )
    #     if can_fiscal_year is None:
    #         return CANStatus.INACTIVE
    #     # Amount available to a Portfolio budget is the sum of the BLI minus the Portfolio total (above)
    #     budget_line_items = (
    #         object_session(self)
    #         .execute(select(BudgetLineItem).where(BudgetLineItem.can_id == self.id))
    #         .scalars()
    #         .all()
    #     )
    #
    #     planned_budget_line_items = [
    #         bli
    #         for bli in budget_line_items
    #         if bli.status == BudgetLineItemStatus.PLANNED
    #     ]
    #     planned_funding = sum([b.amount for b in planned_budget_line_items]) or 0
    #
    #     obligated_budget_line_items = [
    #         bli
    #         for bli in budget_line_items
    #         if bli.status == BudgetLineItemStatus.OBLIGATED
    #     ]
    #     obligated_funding = sum([b.amount for b in obligated_budget_line_items]) or 0
    #
    #     in_execution_budget_line_items = [
    #         bli
    #         for bli in budget_line_items
    #         if bli.status == BudgetLineItemStatus.IN_EXECUTION
    #     ]
    #     in_execution_funding = (
    #         sum([b.amount for b in in_execution_budget_line_items]) or 0
    #     )
    #     total_accounted_for = (
    #         sum((planned_funding, obligated_funding, in_execution_funding)) or 0
    #     )
    #     available_funding = can_fiscal_year.total_funding - total_accounted_for
    #
    #     is_expired = self.expiration_date.date() < date.today()
    #     can_status = (
    #         CANStatus.INACTIVE
    #         if available_funding <= 0 and is_expired
    #         else CANStatus.ACTIVE
    #     )
    #     return can_status
    #
    # @property
    # def appropriation_term(self):
    #     if self.expiration_date is None:
    #         return 0
    #     if self.appropriation_date is None:
    #         return None
    #     return self.expiration_date.year - self.appropriation_date.year

    @BaseModel.display_name.getter
    def display_name(self):
        return self.number

    # @override
    # def to_dict(self) -> dict[str, Any]:  # type: ignore[override]
    #     d: dict[str, Any] = super().to_dict()  # type: ignore[no-untyped-call]
    #     # add the appropriation_term calculated property to this dictionary
    #     d["appropriation_term"] = self.appropriation_term
    #     return d


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


class CANFundingReceived(BaseModel):
    """
    The details of funding received for a given fiscal year for a CAN.
    """

    __tablename__ = "can_funding_received"

    id: Mapped[int] = BaseModel.get_pk_column(
        sequence=Sequence("can_funding_received_id_seq", start=5000, increment=1)
    )
    fiscal_year: Mapped[int]
    fund_code: Mapped[str]
    funding: Mapped[Optional[decimal.Decimal]]
    notes: Mapped[Optional[str]]


class CANFundingBudget(BaseModel):
    """
    The details of funding budgeted for a given fiscal year for a CAN.
    """

    __tablename__ = "can_funding_budget"

    id: Mapped[int] = BaseModel.get_pk_column()
    fiscal_year: Mapped[int]
    fund_code: Mapped[str]
    budget: Mapped[Optional[decimal.Decimal]]
    notes: Mapped[Optional[str]]
