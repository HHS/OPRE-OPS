"""CAN models."""
from dataclasses import dataclass
from enum import Enum, IntEnum
from typing import Any, ClassVar, Optional

import sqlalchemy as sa
from models.base import BaseModel, currency, intpk, optional_str, reg, required_str
from models.portfolios import Portfolio, shared_portfolio_cans
from models.users import User
from sqlalchemy import Boolean, Column, Date, DateTime, ForeignKey, Identity, Integer, Numeric, String, Table, Text
from sqlalchemy.orm import column_property, relationship, with_polymorphic, InstrumentedAttribute
from typing_extensions import override


class BudgetLineItemStatus(Enum):
    DRAFT = 1
    UNDER_REVIEW = 2
    PLANNED = 3
    IN_EXECUTION = 4
    OBLIGATED = 5


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
    IAA_AA = 5
    MISCELLANEOUS = 6


class AgreementReason(Enum):
    NEW_REQ = 1
    RECOMPETE = 2  ## recompete is brand new contract related to same work
    LOGICAL_FOLLOW_ON = (
        3  ## Logical Follow On is more work added/extension of the original
    )


agreement_team_members = Table(
    "agreement_team_members",
    BaseModel.metadata,
    Column("agreement_id", ForeignKey("agreement.id"), primary_key=True),
    Column("users_id", ForeignKey("users.id"), primary_key=True),
)


class ProductServiceCode(BaseModel):
    """Product Service Code"""

    __tablename__ = "product_service_code"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    naics = Column(Integer, nullable=True)
    support_code = Column(String, nullable=True)
    description = Column(String)
    agreement = relationship("Agreement")


class Agreement(BaseModel):
    """Base Agreement Model"""

    _subclasses: ClassVar[dict[Optional[AgreementType], type["Agreement"]]] = {}

    __tablename__ = "agreement"

    id = Column(Integer, Identity(), primary_key=True)
    name = Column(String, nullable=False)
    number = Column(String, nullable=False)
    description = Column(String, nullable=True)

    product_service_code_id = Column(Integer, ForeignKey("product_service_code.id"))
    product_service_code = relationship(
        "ProductServiceCode", back_populates="agreement"
    )

    agreement_reason = Column(sa.Enum(AgreementReason))
    incumbent = Column(String, nullable=True)
    project_officer = Column(
        Integer, ForeignKey("users.id", name="fk_user_project_officer"), nullable=True
    )
    team_members = relationship(
        User,
        secondary=agreement_team_members,
        back_populates="agreements",
    )
    agreement_type = Column(sa.Enum(AgreementType))

    research_project_id = Column(Integer, ForeignKey("research_project.id"))
    research_project = relationship("ResearchProject", back_populates="agreements")

    budget_line_items = relationship(
        "BudgetLineItem", back_populates="agreement", lazy=True
    )
    procurement_shop_id = Column(Integer, ForeignKey("procurement_shop.id"))
    procurement_shop = relationship("ProcurementShop", back_populates="agreements")

    notes = Column(Text, nullable=True)

    __mapper_args__: dict[str, str | AgreementType] = {
        "polymorphic_identity": "agreement",
        "polymorphic_on": "agreement_type",
    }

    def __init_subclass__(cls, agreement_type: AgreementType, **kwargs):
        cls._subclasses[agreement_type] = cls  # type: ignore [assignment]
        super().__init_subclass__(**kwargs)

    @classmethod
    def get_polymorphic(cls) -> "Agreement":
        return with_polymorphic(Agreement, list(cls._subclasses.values()))

    @classmethod
    def get_class_field(cls, field_name: str) -> InstrumentedAttribute:
        if field_name in set(Agreement.columns):
            table_class = Agreement
        else:
            for subclass in cls._subclasses.values():
                if field_name in set(subclass.columns):
                    table_class = subclass
                    break
            else:
                raise ValueError(f"Column name does not exist for agreements: {field_name}")
        return getattr(table_class, field_name)


    @override
    def to_dict(self) -> dict[str, Any]:  # type: ignore [override]
        d: dict[str, Any] = super().to_dict()  # type: ignore [no-untyped-call]

        d.update(
            agreement_type=self.agreement_type.name if self.agreement_type else None,
            agreement_reason=self.agreement_reason.name
            if self.agreement_reason
            else None,
            budget_line_items=[bli.to_dict() for bli in self.budget_line_items],
            team_members=[tm.to_dict() for tm in self.team_members],
            research_project=self.research_project.to_dict()
            if self.research_project
            else None,
            procurement_shop=self.procurement_shop.to_dict()
            if self.procurement_shop
            else None,
            product_service_code=self.product_service_code.to_dict()
            if self.product_service_code
            else None,
        )

        return d


contract_support_contacts = Table(
    "contract_support_contacts",
    BaseModel.metadata,
    Column(
        "contract_id",
        ForeignKey("contract_agreement.id"),
        primary_key=True,
    ),
    Column("users_id", ForeignKey("users.id"), primary_key=True),
)


class ContractType(Enum):
    RESEARCH = 0
    SERVICE = 1


class ContractAgreement(Agreement, agreement_type=AgreementType.CONTRACT):
    """Contract Agreement Model"""

    __tablename__ = "contract_agreement"

    id = Column(Integer, ForeignKey("agreement.id"), primary_key=True)
    contract_number = Column(String)
    vendor = Column(String)
    delivered_status = Column(Boolean, default=False)
    contract_type = Column(sa.Enum(ContractType))
    support_contacts = relationship(
        User,
        secondary=contract_support_contacts,
        back_populates="contracts",
    )

    __mapper_args__ = {
        "polymorphic_identity": AgreementType.CONTRACT,
    }

    @override
    def to_dict(self) -> dict[str, Any]:  # type: ignore [override]
        d: dict[str, Any] = super().to_dict()  # type: ignore [no-untyped-call]

        d.update(
            {
                "contract_type": self.contract_type.name
                if self.contract_type
                else None,
                "support_contacts": [
                    contacts.to_dict() for contacts in self.support_contacts
                ],
            }
        )

        return d


# TODO: Skeleton, will need flushed out more when we know what all a Grant is.
class GrantAgreement(Agreement, agreement_type=AgreementType.GRANT):
    """Grant Agreement Model"""

    __tablename__ = "grant_agreement"

    id = Column(Integer, ForeignKey("agreement.id"), primary_key=True)
    foa = Column(String)

    __mapper_args__ = {
        "polymorphic_identity": AgreementType.GRANT,
    }


# TODO: Skeleton, will need flushed out more when we know what all an IAA is.
### Inter-Agency-Agreement
class IaaAgreement(Agreement, agreement_type=AgreementType.IAA):
    """IAA Agreement Model"""

    __tablename__ = "iaa_agreement"

    id = Column(Integer, ForeignKey("agreement.id"), primary_key=True)
    iaa = Column(String)

    __mapper_args__ = {
        "polymorphic_identity": AgreementType.IAA,
    }


# TODO: Skeleton, will need flushed out more when we know what all an IAA-AA is. Inter-Agency-Agreement-Assisted-Aquisition
### Inter-Agency-Agreement-Assisted-Aquisition
class IaaAaAgreement(Agreement, agreement_type=AgreementType.IAA_AA):
    """IAA-AA Agreement Model"""

    __tablename__ = "iaa_aa_agreement"

    id = Column(Integer, ForeignKey("agreement.id"), primary_key=True)
    iaa_aa = Column(String)

    __mapper_args__ = {
        "polymorphic_identity": AgreementType.MISCELLANEOUS,
    }


class DirectAgreement(Agreement, agreement_type=AgreementType.DIRECT_ALLOCATION):
    """Direct Obligation Agreement Model"""

    __tablename__ = "direct_agreement"

    id = Column(Integer, ForeignKey("agreement.id"), primary_key=True)
    payee = Column(String, nullable=False)

    __mapper_args__ = {
        "polymorphic_identity": AgreementType.DIRECT_ALLOCATION,
    }


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

    @override
    def to_dict(self):
        d = super().to_dict()

        d.update(
            total_fiscal_year_funding=float(self.total_fiscal_year_funding)
            if self.total_fiscal_year_funding
            else None,
            received_funding=float(self.received_funding)
            if self.received_funding
            else None,
            expected_funding=float(self.expected_funding)
            if self.expected_funding
            else None,
            potential_additional_funding=float(self.potential_additional_funding)
            if self.potential_additional_funding
            else None,
            total_funding=float(self.total_funding) if self.total_funding else None,
        )

        return d


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

    @override
    def to_dict(self):
        d = super().to_dict()

        d.update(
            received_amount=float(self.received_amount)
            if self.received_amount
            else None,
            expected_amount=float(self.expected_amount)
            if self.expected_amount
            else None,
            total_amount=float(self.total_amount) if self.total_amount else None,
        )

        return d


class BudgetLineItem(BaseModel):
    __tablename__ = "budget_line_item"

    id = Column(Integer, Identity(), primary_key=True)
    line_description = Column(String)
    comments = Column(Text)

    agreement_id = Column(Integer, ForeignKey("agreement.id"))
    agreement = relationship(Agreement, back_populates="budget_line_items")

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

        d.update(
            status=self.status.name if self.status else None,
            amount=float(self.amount) if self.amount else None,
            psc_fee_amount=float(self.psc_fee_amount) if self.psc_fee_amount else None,
            date_needed=self.date_needed.isoformat() if self.date_needed else None,
            can=self.can.to_dict() if self.can else None,
        )

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
    budget_line_items = relationship("BudgetLineItem", back_populates="can")

    @override
    def to_dict(self) -> dict[str, Any]:  # type: ignore [override]
        d: dict[str, Any] = super().to_dict()

        d.update(
            appropriation_date=self.appropriation_date.strftime("%d/%m/%Y")
            if self.appropriation_date
            else None,
            expiration_date=self.expiration_date.strftime("%d/%m/%Y")
            if self.expiration_date
            else None,
            arrangement_type=self.arrangement_type.name
            if self.arrangement_type
            else None,
        )

        return d
