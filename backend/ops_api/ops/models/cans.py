from typing import Any
from ops.models.portfolios import Portfolio
from ops.models.portfolios import portfolio_cans
from ops.models.base import BaseModel
from sqlalchemy import (
    Column,
    Date,
    DateTime,
    Integer,
    String,
    Numeric,
    ForeignKey,
    DateTime,
    Table,
    event,
)
from sqlalchemy.orm import relationship
from sqlalchemy.engine import Connection
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import column_property

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


class AgreementType(BaseModel):
    __tablename__ = "agreement_type"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)

    @staticmethod
    def initial_data(
        target: Table,
        connection: Connection,
        **kwargs: dict[str, Any],
    ) -> None:
        connection.execute(
            target.insert(),
            {"id": 1, "name": "Contract"},
            {"id": 2, "name": "Grant"},
            {"id": 3, "name": "Direct Allocation"},
            {"id": 4, "name": "IAA"},
            {"id": 5, "name": "Miscellaneous"},
        )


event.listen(
    AgreementType.__table__,
    "after_create",
    AgreementType.initial_data,
)


agreement_cans = Table(
    "agreement_cans",
    BaseModel.metadata,
    Column(
        "agreement_id",
        ForeignKey("agreement.id"),
        primary_key=True,
    ),
    Column("can_id", ForeignKey("can.id"), primary_key=True),
)


class CANFiscalYear(BaseModel):
    """Contains the relevant financial info by fiscal year for a given CAN."""

    __tablename__ = "can_fiscal_year"
    can_id = Column(Integer, ForeignKey("can.id"), primary_key=True)
    fiscal_year = Column(Integer, primary_key=True)
    can = relationship("CAN", lazy="joined")
    total_fiscal_year_funding = Column(Numeric(12, 2))
    current_funding = Column(Numeric(12, 2))
    expected_funding = Column(Numeric(12, 2))
    potential_additional_funding = Column(Numeric(12, 2))
    can_lead = Column(String)
    notes = Column(String, default="")
    total_funding = column_property(current_funding + expected_funding)


class CANFiscalYearCarryOver(BaseModel):
    """Contains the relevant financial info by fiscal year for a given CAN carried over from a previous fiscal year."""

    __tablename__ = "can_fiscal_year_carry_over"
    id = Column(Integer, primary_key=True)
    can_id = Column(Integer, ForeignKey("can.id"))
    can = relationship("CAN", lazy="joined")
    from_fiscal_year = Column(Integer)
    to_fiscal_year = Column(Integer)
    amount = Column(Numeric(12, 2))
    notes = Column(String, default="")


class Agreement(BaseModel):
    __tablename__ = "agreement"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    agreement_type_id = Column(
        Integer,
        ForeignKey("agreement_type.id"),
    )
    agreement_type = relationship("AgreementType")
    cans = relationship("CAN", secondary=agreement_cans, back_populates="agreements")


class BudgetLineItem(BaseModel):
    __tablename__ = "budget_line_item"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    fiscal_year = Column(Integer)
    agreement_id = Column(Integer, ForeignKey("agreement.id"))
    agreement = relationship(Agreement)
    can_id = Column(Integer, ForeignKey("can.id"))
    can = relationship("CAN", back_populates="budget_line_items")
    funding = Column(Numeric(12, 2))
    status_id = Column(Integer, ForeignKey("budget_line_item_status.id"))
    status = relationship("BudgetLineItemStatus", back_populates="budget_line_item")


class BudgetLineItemStatus(BaseModel):
    __tablename__ = "budget_line_item_status"
    id = Column(Integer, primary_key=True)
    status = Column(String, nullable=False, unique=True)
    budget_line_item = relationship("BudgetLineItem")

    @staticmethod
    def initial_data(
        target: Table,
        connection: Connection,
        **kwargs: dict[str, Any],
    ) -> None:
        connection.execute(
            target.insert(),
            {"id": 1, "status": "Planned"},
            {"id": 2, "status": "In Execution"},
            {"id": 3, "status": "Obligated"},
        )

    @hybrid_property
    def Planned(self) -> bool:
        return self.id == 1  # Planned

    @hybrid_property
    def In_Execution(self) -> bool:
        return self.id == 2  # In Execution

    @hybrid_property
    def Obligated(self) -> bool:
        return self.id == 3  # Obligated


class CANArrangementType(BaseModel):
    __tablename__ = "can_arrangement_type"
    id = Column(Integer, primary_key=True)
    name = Column(String(), nullable=False, unique=True)

    @staticmethod
    def initial_data(
        target: Table,
        connection: Connection,
        **kwargs: dict[str, Any],
    ) -> None:
        connection.execute(
            target.insert(),
            {"id": 1, "name": "OPRE Appropriation"},
            {"id": 2, "name": "Cost Share"},
            {"id": 3, "name": "IAA"},
            {"id": 4, "name": "IDDA"},
            {"id": 5, "name": "MOU"},
        )


event.listen(
    CANArrangementType.__table__,
    "after_create",
    CANArrangementType.initial_data,
)


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
    expiration_date = Column(DateTime, default="1/1/1972")
    appropriation_term = Column(Integer, default="1")
    arrangement_type_id = Column(
        Integer,
        ForeignKey("can_arrangement_type.id"),
    )
    arrangement_type = relationship(CANArrangementType)
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
        Portfolio, secondary=portfolio_cans, back_populates="cans"
    )
    budget_line_items = relationship("BudgetLineItem", back_populates="can")
    agreements = relationship(
        Agreement, secondary=agreement_cans, back_populates="cans"
    )

    @hybrid_property
    def arrangementType(self) -> str:
        return self.arrangement_type.name
