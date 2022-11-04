from ops.utils import db


class CANArrangementType(db.Model):
    __tablename__ = "can_arrangement_type"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(), nullable=False, unique=True)


class FundingSource(db.Model):
    """The Funding Source (Source) for the CAN.

    From: https://docs.google.com/spreadsheets/d/18FP-ZDnvjtKakj0DDGL9lLXPry8xkqNt/

    > Instead of ""Source,"" consider ""Funding Source""
        Instead of ""Agency,"" consider ""Funding Partner""
    """

    __tablename__ = "ops_funding_source"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    nickname = db.Column(db.String(100))


class FundingPartner(db.Model):
    """The Funding Partner (Agency) for the CAN.

    See docstring for FundingSource
    """

    __tablename__ = "ops_funding_partner"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    nickname = db.Column(db.String(100))


class CANFiscalYear(db.Model):
    """Contains the relevant financial info by fiscal year for a given CAN."""

    __tablename__ = "ops_can_fiscal_year"
    id = db.Column(db.Integer, primary_key=True)
    can_id = db.Column(db.Integer, db.ForeignKey("can.id"))
    can = db.relationship("CAN", back_populates="fiscal_years")
    fiscal_year = db.Column(db.Integer)
    total_fiscal_year_funding = db.Column(db.Numeric(12, 2))
    potential_additional_funding = db.Column(db.Numeric(12, 2))
    can_lead_id = db.Column(db.Integer, db.ForeignKey("person.id"))
    can_lead = db.relationship("Person", back_populates="fiscal_years")
    notes = db.Column(db.String, default="")


class AgreementTypeChoice(db.Model):
    __tablename__ = "ops_agreement_type"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)


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


class Agreement(db.Model):
    __tablename__ = "ops_agreement"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
    agreement_type_id = db.Column(
        db.Integer,
        db.ForeignKey("ops_agreement_type.id"),
    )
    cans = db.relationship(
        "CAN",
        secondary=agreement_cans,
        back_populates="agreements",
    )


class BudgetLineItem(db.Model):
    __tablename__ = "ops_budget_line_item"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
    fiscal_year = db.Column(db.Integer)
    agreement_id = db.Column(db.Integer, db.ForeignKey("ops_agreement.id"))
    agreement = db.relationship("Agreement", back_populates="budget_line_items")
    can_id = db.Column(db.Integer, db.ForeignKey("can.id"))
    can = db.relationship("CAN", back_populates="budget_line_items")
    funding = db.Column(db.Numeric(12, 2))


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


class CAN(db.Model):
    """
    A CAN is a Common Accounting Number, which is
    used to track money coming into OPRE

    This model contains all the relevant
    descriptive information about a given CAN
    """

    __tablename__ = "can"
    id = db.Column(db.Integer, primary_key=True)
    number = db.Column(db.String(30), nullable=False)
    description = db.Column(db.String)
    purpose = db.Column(default="")
    nickname = db.Column(db.String(30))
    arrangement_type_id = db.Column(
        db.Integer,
        db.ForeignKey("can_arrangement_type.id"),
    )
    arrangement_type = db.relationship(
        "CANArrangementType",
        back_populates="cans",
    )
    funding_source = db.relationship(
        "FundingSource",
        secondary=can_funding_sources,
        back_populates="cans",
    )
    authorizer_id = db.Column(db.Integer, db.ForeignKey("ops_funding_partner.id"))
    authorizer = db.relationship("FundingPartner", back_populates="cans")
    portfolio_id = db.Column(db.Integer, db.ForeignKey("portfolio.id"))
    portfolio = db.relationship("Portfolio", back_populates="cans")
