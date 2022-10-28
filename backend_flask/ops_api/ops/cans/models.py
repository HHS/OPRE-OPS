from decimal import Decimal
from typing import Optional

from flask_sqlalchemy import SQLAlchemy
from ops_api.ops.models import Person
from ops_api.ops.portfolios.models import Portfolio

db = SQLAlchemy()


class CANArrangementType(db.MappedAsDataclass, db.Model):
    __tablename__ = "can_arrangement_type"
    id: db.Mapped[int] = db.mapped_column(primary_key=True, init=False)
    name: db.Mapped[str] = db.mapped_column(unique=True)


class FundingSource(db.MappedAsDataclass, db.Model):
    """The Funding Source (Source) for the CAN.

    From: https://docs.google.com/spreadsheets/d/18FP-ZDnvjtKakj0DDGL9lLXPry8xkqNt/

    > Instead of ""Source,"" consider ""Funding Source""
        Instead of ""Agency,"" consider ""Funding Partner""
    """

    __tablename__ = "ops_funding_source"
    id: db.Mapped[int] = db.mapped_column(primary_key=True, init=False)
    name: db.Mapped[str] = db.mapped_column(db.String(100))
    nickname: db.Mapped[Optional[str]] = db.mapped_column(db.String(100))


class FundingPartner(db.MappedAsDataclass, db.Model):
    """The Funding Partner (Agency) for the CAN.

    See docstring for FundingSource
    """

    __tablename__ = "ops_funding_partner"
    id: db.Mapped[int] = db.mapped_column(primary_key=True, init=False)
    name: db.Mapped[str] = db.mapped_column(db.String(100))
    nickname: db.Mapped[Optional[str]] = db.mapped_column(db.String(100))


class CANFiscalYear(db.MappedAsDataclass, db.Model):
    """Contains the relevant financial info by fiscal year for a given CAN."""

    __tablename__ = "ops_can_fiscal_year"
    id: db.Mapped[int] = db.mapped_column(primary_key=True, init=False)
    can_id: db.Mapped[int] = db.mapped_column(db.ForeignKey("can.id"))
    can: db.Mapped["CAN"] = db.relationship(back_populates="fiscal_years")
    fiscal_year: db.Mapped[int]
    total_fiscal_year_funding: db.Mapped[Decimal] = db.mapped_column(
        db.Numeric(12, 2),
    )
    potential_additional_funding: db.Mapped[Decimal] = db.mapped_column(
        db.Numeric(12, 2),
    )
    can_lead_id: db.Mapped[int] = db.mapped_column(db.ForeignKey("person.id"))
    can_lead: db.Mapped["Person"] = db.relationship(back_populates="fiscal_years")
    notes: db.Mapped[str] = db.mapped_column(insert_default="", default="")


class AgreementTypeChoice(db.MappedAsDataclass, db.Model):
    __tablename__ = "ops_agreement_type"
    id: db.Mapped[int] = db.mapped_column(primary_key=True, init=False)
    name: db.Mapped[str]


agreement_cans = db.Table(
    "agreement_cans",
    db.Model.metadata,
    db.Column(
        "agreement_id",
        db.ForeignKey("ops_agreement.id"),
        primary_key=True,
    ),
    db.Column("can_id", db.ForeignKey("can.id"), primary_key=True),
)


class Agreement(db.MappedAsDataclass, db.Model):
    __tablename__ = "ops_agreement"
    id: db.Mapped[int] = db.mapped_column(primary_key=True, init=False)
    name: db.Mapped[str]
    agreement_type_id: db.Mapped[int] = db.mapped_column(
        db.ForeignKey("ops_agreement_type.id"),
    )
    cans: db.Mapped[list["CAN"]] = db.relationship(
        secondary=agreement_cans,
        back_populates="agreements",
    )


class BudgetLineItem(db.MappedAsDataclass, db.Model):
    __tablename__ = "ops_budget_line_item"
    id: db.Mapped[int] = db.mapped_column(primary_key=True, init=False)
    name: db.Mapped[str]
    fiscal_year: db.Mapped[int]
    agreement_id: db.Mapped[int] = db.mapped_column(db.ForeignKey("ops_agreement.id"))
    agreement: db.Mapped["Agreement"] = db.relationship(
        back_populates="budget_line_items",
    )
    can_id: db.Mapped[int] = db.mapped_column(db.ForeignKey("can.id"))
    can: db.Mapped["CAN"] = db.relationship(back_populates="budget_line_items")
    funding: db.Mapped[Decimal] = db.mapped_column(db.Numeric(12, 2))


can_funding_sources = db.Table(
    "can_funding_sources",
    db.Model.metadata,
    db.Column("can_id", db.ForeignKey("can.id"), primary_key=True),
    db.Column(
        "funding_source_id",
        db.ForeignKey("ops_funding_source.id"),
        primary_key=True,
    ),
)


class CAN(db.MappedAsDataclass, db.Model):
    """
    A CAN is a Common Accounting Number, which is
    used to track money coming into OPRE

    This model contains all the relevant
    descriptive information about a given CAN
    """

    __tablename__ = "can"
    id: db.Mapped[int] = db.mapped_column(primary_key=True, init=False)
    number: db.Mapped[str] = db.mapped_column(db.String(30))
    description: db.Mapped[Optional[str]]
    purpose: db.Mapped[str] = db.mapped_column(insert_default="", default="")
    nickname: db.Mapped[Optional[str]] = db.mapped_column(db.String(30))
    arrangement_type_id: db.Mapped[int] = db.mapped_column(
        db.ForeignKey("can_arrangement_type.id"),
    )
    arrangement_type: db.Mapped["CANArrangementType"] = db.relationship(
        back_populates="cans"
    )
    funding_source: db.Mapped[list["FundingSource"]] = db.relationship(
        secondary=can_funding_sources,
        back_populates="cans",
    )
    authorizer_id: db.Mapped[int] = db.mapped_column(
        db.ForeignKey("ops_funding_partner.id")
    )
    authorizer: db.Mapped["FundingPartner"] = db.relationship(back_populates="cans")
    portfolio_id: db.Mapped[int] = db.mapped_column(db.ForeignKey("portfolio.id"))
    portfolio: db.Mapped["Portfolio"] = db.relationship
