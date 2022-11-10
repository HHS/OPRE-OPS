from datetime import datetime

from sqlalchemy.engine import Connection

from environment.dev import DATABASE_URL
from sqlalchemy import create_engine, Column, Integer, String, Text, ForeignKey, DateTime, func, Table, Numeric
from sqlalchemy.orm import declarative_base, relationship

# Models here are for testing/development purposes while backend is being
# ported to SQLAlchemy

Base = declarative_base()

engine = create_engine(DATABASE_URL, echo=True, future=True)


class PortfolioStatus(Base):
    __tablename__ = "portfolio_status"
    id = Column(Integer, primary_key=True)
    name = Column(String(30), unique=True)


class Division(Base):
    __tablename__ = "division"
    id = Column(Integer, primary_key=True)
    name = Column(String(100), unique=True)
    abbreviation = Column(String(10), unique=True)


class Portfolios(Base):
    __tablename__ = "portfolio"
    id = Column(Integer, primary_key=True)
    name = Column(String(50), unique=True)
    abbreviation = Column(String(10), unique=True)
    division_id = Column(Integer, ForeignKey("division.id"))
    division = relationship(
        "Division", back_populates="divisions", cascade="all, delete-orphan"
    )
    description = Column(Text, default="")
    status_id = Column(Integer, ForeignKey("portfolio_status.id"))
    status = relationship("PortfolioStatus", back_populates="portfolios")
    url = relationship("PortfolioUrl", back_populates="portfolio")


class PortfolioUrl(Base):
    __tablename__ = "portfolio_url"
    id = Column(Integer, primary_key=True)
    portfolio_id = Column(Integer, ForeignKey("portfolio.id"))
    portfolio = relationship("Portfolio", back_populates="links")
    url = Column(String)


class FundingPartner(Base):
    __tablename__ = "funding_partner"
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    nickname = Column(String(100))


class FundingSource(Base):
    __tablename__ = "funding_source"
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    nickname = Column(String(100))
    cans = relationship(
        "CAN",
        back_populates="funding_sources",
    )


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    oidc_id = Column(String(128), unique=True, index=True)
    email = Column(String, index=True, nullable=False)
    first_name = Column(String)
    last_name = Column(String)
    date_joined = Column(DateTime, server_default=func.now())
    updated = Column(DateTime, onupdate=func.now())
    role = Column(String(255), index=True)
    division = Column(Integer, ForeignKey("division.id"))


class CANArrangementType(Base):
    __tablename__ = "can_arrangement_type"
    id = Column(Integer, primary_key=True)
    name = Column(String(), nullable=False, unique=True)

    @staticmethod
    def initial_data(
        target: Table,
        connection: Connection,
        **kwargs: dict,
    ) -> None:
        connection.execute(
            target.insert(),
            {"id": 1, "name": "OPRE Appropriation"},
            {"id": 2, "name": "Cost Share"},
            {"id": 3, "name": "IAA"},
            {"id": 4, "name": "IDDA"},
            {"id": 5, "name": "MOU"},
        )


can_funding_sources = Table(
    "can_funding_sources",
    Base.metadata,
    Column("can_id", ForeignKey("cans.id"), primary_key=True),
    Column(
        "funding_source_id",
        ForeignKey("funding_source.id"),
        primary_key=True,
    ),
)


class CAN(Base):
    __tablename__ = "cans"
    id = Column(Integer, primary_key=True)
    number = Column(String(30), nullable=False)
    description = Column(String)
    purpose = Column(String)
    nickname = Column(String(30))
    arrangement_type_id = Column(Integer, ForeignKey("can_arrangement_type.id"))
    arrangement_type = relationship(CANArrangementType)
    funding_sources = relationship(FundingSource, secondary=can_funding_sources, back_populates="cans")
    authorizer_id = Column(Integer, ForeignKey("funding_partner.id"))
    authorizer = relationship(FundingPartner)
    managing_portfolio_id = Column(Integer, ForeignKey("portfolio.id"))
    managing_portfolio = relationship("Portfolio", back_populates="internal_can")
    shared_portfolios = relationship("Portfolio", back_populates="external_cans")
    budget_line_items = relationship("BudgetLineItem", back_populates="can")


class CANFiscalYear(Base):
    __tablename__ = "can_fiscal_year"
    id = Column(Integer, primary_key=True)
    can_id = Column(Integer, ForeignKey("cans.id"))
    fiscal_year = Column(Integer)
    total_fiscal_year_funding = Column(Numeric)
    potential_additional_funding = Column(Numeric)
    notes = Column(Text)


class AgreementType(Base):
    __tablename__ = "agreement_type"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)


class Agreement(Base):
    __tablename__ = "agreement"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    agreement_type_id = Column(Integer, ForeignKey("agreement_type.id"))
    agreement_type = relationship("AgreementType")
    owning_portfolio_id = managing_portfolio_id = Column(Integer, ForeignKey("portfolio.id"))


class BudgetLineItem(Base):
    __tablename__ = "budget_line_item"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    fiscal_year = Column(Integer)
    agreement_id = Column(Integer, ForeignKey("agreement.id"))
    agreement = relationship(Agreement)
    can_id = Column(Integer, ForeignKey("cans.id"))
    can = relationship("CAN", back_populates="budget_line_items")
    funding = Column(Numeric(12, 2))
    status_id = Column(Integer, ForeignKey("budget_line_item_status.id"))


class BudgetLineItemStatus(Base):
    __tablename__ = "budget_line_item_status"
    id = Column(Integer, primary_key=True)
    status = Column(String, nullable=False)


Base.metadata.create_all(engine)
