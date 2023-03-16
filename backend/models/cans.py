"""CAN models."""
from enum import Enum
from typing import Any

import sqlalchemy as sa
from models.base import BaseModel
from models.portfolios import Portfolio, shared_portfolio_cans
from models.research_projects import ResearchProject
from sqlalchemy import Column, Date, DateTime, ForeignKey, Identity, Integer, Numeric, String, Table, Text
from sqlalchemy.orm import column_property, relationship
from typing_extensions import override


class BudgetLineItemStatus(Enum):
    DRAFT = 1
    PLANNED = 2
    IN_EXECUTION = 3
    OBLIGATED = 4


class CANArrangementType(Enum):
    OPRE_APPROPRIATION = 1
    COST_SHARE = 2
    IAA = 3
    IDDA = 4
    MOU = 5


can_funding_sources = Table(
    "can_funding_sources",
    BaseModel.metadata,
    Column("can_id", ForeignKey("can.id"), primary_key=True),
    Column(
        "funding_source_id",
        ForeignKey("funding_source.id"),
        primary_key=True,
    ),
)


class FundingSource(BaseModel):
    """The Funding Source (Source) for the CAN.

    From: https://docs.google.com/spreadsheets/d/18FP-ZDnvjtKakj0DDGL9lLXPry8xkqNt/

    > Instead of ""Source,"" consider ""Funding Source""
        Instead of ""Agency,"" consider ""Funding Partner""
    """

    __tablename__ = "funding_source"
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    nickname = Column(String(100))
    cans = relationship(
        "CAN",
        secondary=can_funding_sources,
        back_populates="funding_sources",
    )


class FundingPartner(BaseModel):
    """The Funding Partner (Agency) for the CAN.

    See docstring for FundingSource
    """

    __tablename__ = "funding_partner"
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    nickname = Column(String(100))


class AgreementType(Enum):
    CONTRACT = 1
    GRANT = 2
    DIRECT_ALLOCATION = 3
    IAA = 4
    MISCELLANEOUS = 5


class Agreement(BaseModel):
    __tablename__ = "agreement"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    agreement_type = Column(sa.Enum(AgreementType))
    research_project_id = Column(Integer, ForeignKey("research_project.id"))
    research_project = relationship(ResearchProject, back_populates="agreements")

    @override
    def to_dict(self) -> dict[str, Any]:  # type: ignore [override]
        d: dict[str, Any] = super().to_dict()  # type: ignore [no-untyped-call]

        d.update(
            {
                "agreement_type": self.agreement_type.name
                if self.agreement_type
                else None
            }
        )

        return d


class CANFiscalYear(BaseModel):
    """Contains the relevant financial info by fiscal year for a given CAN."""

    __tablename__ = "can_fiscal_year"
    can_id = Column(Integer, ForeignKey("can.id"), primary_key=True)
    fiscal_year = Column(Integer, primary_key=True)
    can = relationship("CAN", lazy="joined")
    total_fiscal_year_funding = Column(Numeric(12, 2))
    received_funding = Column(Numeric(12, 2))
    expected_funding = Column(Numeric(12, 2))
    potential_additional_funding = Column(Numeric(12, 2))
    can_lead = Column(String)
    notes = Column(String, default="")
    total_funding = column_property(received_funding + expected_funding)


class CANFiscalYearCarryForward(BaseModel):
    """Contains the relevant financial info by fiscal year for a given CAN carried over from a previous fiscal year."""

    __tablename__ = "can_fiscal_year_carry_forward"
    id = Column(Integer, primary_key=True)
    can_id = Column(Integer, ForeignKey("can.id"))
    can = relationship("CAN", lazy="joined")
    from_fiscal_year = Column(Integer)
    to_fiscal_year = Column(Integer)
    received_amount = Column(Numeric(12, 2), default=0, nullable=False)
    expected_amount = Column(Numeric(12, 2), default=0, nullable=False)
    notes = Column(String, default="")
    total_amount = column_property(received_amount + expected_amount)


class BudgetLineItem(BaseModel):
    __tablename__ = "budget_line_item"

    id = Column(Integer, Identity(), primary_key=True)
    line_description = Column(String)
    comments = Column(Text)

    agreement_id = Column(Integer, ForeignKey("agreement.id"))
    agreement = relationship(Agreement)

    can_id = Column(Integer, ForeignKey("can.id"))
    can = relationship("CAN", back_populates="budget_line_items")

    amount = Column(Numeric(12, 2))

    status = Column(sa.Enum(BudgetLineItemStatus))

    date_needed = Column(Date)
    psc_fee_amount = Column(
        Numeric(12, 2)
    )  # may need to be a different object, i.e. flat rate or percentage

    @override
    def to_dict(self):
        d = super().to_dict()

        d.update(status=self.status.name if self.status else None)

        return d


class CAN(BaseModel):
    """
    A CAN is a Common Accounting Number, which is
    used to track money coming into OPRE

    This model contains all the relevant
    descriptive information about a given CAN
    """

    __tablename__ = "can"
    id = Column(Integer, primary_key=True)
    number = Column(String(30), nullable=False)
    description = Column(String)
    purpose = Column(String, default="")
    nickname = Column(String(30))
    expiration_date = Column(DateTime)
    appropriation_date = Column(DateTime)
    appropriation_term = Column(Integer, default="1")
    arrangement_type = Column(sa.Enum(CANArrangementType))
    funding_sources = relationship(
        FundingSource,
        secondary=can_funding_sources,
        back_populates="cans",
    )
    authorizer_id = Column(Integer, ForeignKey("funding_partner.id"))
    authorizer = relationship(FundingPartner)
    managing_portfolio_id = Column(Integer, ForeignKey("portfolio.id"))
    managing_portfolio = relationship(Portfolio, back_populates="cans")
    shared_portfolios = relationship(
        Portfolio, secondary=shared_portfolio_cans, back_populates="shared_cans"
    )
    managing_research_project_id = Column(Integer, ForeignKey("research_project.id"))
    managing_research_project = relationship(ResearchProject, back_populates="cans")

    budget_line_items = relationship("BudgetLineItem", back_populates="can")

    @override
    def to_dict(self) -> dict[str, Any]:  # type: ignore [override]
        d: dict[str, Any] = super().to_dict()  # type: ignore [no-untyped-call]

        d.update(
            appropriation_date=self.appropriation_date.strftime("%d/%m/%Y")
            if self.appropriation_date
            else None,
            expiration_date=self.expiration_date.strftime("%d/%m/%Y")
            if self.expiration_date
            else None,
            arrangement_type=self.arrangement_type.name,
        )

        return d
