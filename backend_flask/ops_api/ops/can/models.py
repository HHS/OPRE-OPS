from ops.portfolio.models import Portfolio
from ops.portfolio.models import portfolio_cans
from ops.utils import db
from sqlalchemy.engine import Connection

can_funding_sources = db.Table(
    "can_funding_sources",
    db.Model.metadata,
    db.Column("can_id", db.ForeignKey("can.id"), primary_key=True),
    db.Column(
        "funding_source_id",
        db.ForeignKey("funding_source.id"),
        primary_key=True,
    ),
)


class FundingSource(db.Model):
    """The Funding Source (Source) for the CAN.

    From: https://docs.google.com/spreadsheets/d/18FP-ZDnvjtKakj0DDGL9lLXPry8xkqNt/

    > Instead of ""Source,"" consider ""Funding Source""
        Instead of ""Agency,"" consider ""Funding Partner""
    """

    __tablename__ = "funding_source"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    nickname = db.Column(db.String(100))
    cans = db.relationship(
        "CAN",
        secondary=can_funding_sources,
        back_populates="funding_sources",
    )


class FundingPartner(db.Model):
    """The Funding Partner (Agency) for the CAN.

    See docstring for FundingSource
    """

    __tablename__ = "funding_partner"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    nickname = db.Column(db.String(100))


class AgreementType(db.Model):
    __tablename__ = "agreement_type"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)

    @staticmethod
    def initial_data(
        target: db.Table,
        connection: Connection,
        **kwargs: dict,
    ) -> None:
        connection.execute(
            target.insert(),
            {"id": 1, "name": "Contract"},
            {"id": 2, "name": "Grant"},
            {"id": 3, "name": "Direct Allocation"},
            {"id": 4, "name": "IAA"},
            {"id": 5, "name": "Miscellaneous"},
        )


db.event.listen(
    AgreementType.__table__,
    "after_create",
    AgreementType.initial_data,
)


agreement_cans = db.Table(
    "agreement_cans",
    db.Model.metadata,
    db.Column(
        "agreement_id",
        db.ForeignKey("agreement.id"),
        primary_key=True,
    ),
    db.Column("can_id", db.ForeignKey("can.id"), primary_key=True),
)


class CANFiscalYear(db.Model):
    """Contains the relevant financial info by fiscal year for a given CAN."""

    __tablename__ = "can_fiscal_year"
    id = db.Column(db.Integer, primary_key=True)
    can_id = db.Column(db.Integer, db.ForeignKey("can.id"))
    can = db.relationship("CAN", lazy="joined")
    fiscal_year = db.Column(db.Integer)
    total_fiscal_year_funding = db.Column(db.Numeric(12, 2))
    potential_additional_funding = db.Column(db.Numeric(12, 2))
    can_lead = db.Column(db.String)
    notes = db.Column(db.String, default="")


class Agreement(db.Model):
    __tablename__ = "agreement"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
    agreement_type_id = db.Column(
        db.Integer,
        db.ForeignKey("agreement_type.id"),
    )
    agreement_type = db.relationship("AgreementType")
    cans = db.relationship("CAN", secondary=agreement_cans, back_populates="agreements")


class BudgetLineItem(db.Model):
    __tablename__ = "budget_line_item"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
    fiscal_year = db.Column(db.Integer)
    agreement_id = db.Column(db.Integer, db.ForeignKey("agreement.id"))
    agreement = db.relationship(Agreement)
    can_id = db.Column(db.Integer, db.ForeignKey("can.id"))
    can = db.relationship("CAN", back_populates="budget_line_items")
    funding = db.Column(db.Numeric(12, 2))
    status_id = db.Column(db.Integer, db.ForeignKey("status.id"))
    status = db.relationship(
        "BudgetLineItemStatus", back_pupulates="budget_line_item_status"
    )


class BudgetLineItemStatus(db.Model):
    __tablename__ = "budget_line_item_status"
    id = db.Column(db.Integer, primary_key=True)
    status = db.Column(db.String, nullable=False, unique=True)
    budget_line_item = db.relationship("BudgetLineItem")

    @staticmethod
    def initial_data(
        target: db.Table,
        connection: Connection,
        **kwargs: dict,
    ) -> None:
        connection.execute(
            target.insert(),
            {"id": 1, "status": "Planned"},
            {"id": 2, "status": "In Execution"},
            {"id": 3, "status": "Obligated"},
        )


class CANArrangementType(db.Model):
    __tablename__ = "can_arrangement_type"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(), nullable=False, unique=True)

    @staticmethod
    def initial_data(
        target: db.Table,
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


db.event.listen(
    CANArrangementType.__table__,
    "after_create",
    CANArrangementType.initial_data,
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
    purpose = db.Column(db.String, default="")
    nickname = db.Column(db.String(30))
    arrangement_type_id = db.Column(
        db.Integer,
        db.ForeignKey("can_arrangement_type.id"),
    )
    arrangement_type = db.relationship(CANArrangementType)
    funding_sources = db.relationship(
        FundingSource,
        secondary=can_funding_sources,
        back_populates="cans",
    )
    authorizer_id = db.Column(db.Integer, db.ForeignKey("funding_partner.id"))
    authorizer = db.relationship(FundingPartner)
    managing_portfolio_id = db.Column(db.Integer, db.ForeignKey("portfolio.id"))
    managing_portfolios = db.relationship(Portfolio, back_populates="cans")
    shared_portfolios = db.relationship(
        Portfolio, secondary=portfolio_cans, back_populates="cans"
    )
    budget_line_items = db.relationship("BudgetLineItem", back_populates="can")
    agreements = db.relationship(
        Agreement, secondary=agreement_cans, back_populates="cans"
    )
    fiscal_years = db.relationship("CANFiscalYear", back_populates="can")
