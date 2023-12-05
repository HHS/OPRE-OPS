"""CAN models."""
from enum import Enum
from typing import Any, List, Optional

import sqlalchemy as sa
from models.base import BaseModel
from models.portfolios import Portfolio
from models.users import User
from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Identity,
    Integer,
    Numeric,
    String,
    Table,
    Text,
    case,
    select,
)
from sqlalchemy.dialects.postgresql import ENUM
from sqlalchemy.orm import Mapped, column_property, mapped_column, object_session, relationship
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


class CANFundingSources(BaseModel):
    __tablename__ = "can_funding_sources"

    can_id: Mapped[int] = mapped_column(ForeignKey("can.id"), primary_key=True)
    funding_source_id: Mapped[int] = mapped_column(
        ForeignKey("funding_source.id"), primary_key=True
    )

    @BaseModel.display_name.getter
    def display_name(self):
        return f"can_id={self.can_id}:funding_source_id={self.funding_source_id}"


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

    cans: Mapped[List["CAN"]] = relationship(
        secondary="can_funding_sources", back_populates="funding_sources"
    )

    @BaseModel.display_name.getter
    def display_name(self):
        return self.name


class FundingPartner(BaseModel):
    """The Funding Partner (Agency) for the CAN.

    See docstring for FundingSource
    """

    __tablename__ = "funding_partner"
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    nickname = Column(String(100))

    @BaseModel.display_name.getter
    def display_name(self):
        return self.name


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


class AgreementTeamMembers(BaseModel):
    __tablename__ = "agreement_team_members"

    user_id: Mapped[int] = mapped_column(ForeignKey("user.id"), primary_key=True)
    agreement_id: Mapped[int] = mapped_column(
        ForeignKey("agreement.id"), primary_key=True
    )

    @BaseModel.display_name.getter
    def display_name(self):
        return f"user id: {self.user_id};agreement id:{self.agreement_id}"


class ProductServiceCode(BaseModel):
    """Product Service Code"""

    __tablename__ = "product_service_code"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    naics = Column(Integer, nullable=True)
    support_code = Column(String, nullable=True)
    description = Column(String)
    agreement = relationship("Agreement")

    @BaseModel.display_name.getter
    def display_name(self):
        return self.name


class Agreement(BaseModel):
    """Base Agreement Model"""

    __tablename__ = "agreement"

    id: Mapped[int] = mapped_column(Identity(), primary_key=True)
    agreement_type = mapped_column(ENUM(AgreementType), nullable=False)
    name: Mapped[str] = mapped_column(
        String, nullable=False, comment="In MAPS this was PROJECT.PROJECT_TITLE"
    )

    description: Mapped[str] = mapped_column(String, nullable=True)
    product_service_code_id: Mapped[int] = mapped_column(
        ForeignKey("product_service_code.id"),
        nullable=True,
    )
    product_service_code: Mapped[Optional[ProductServiceCode]] = relationship(
        back_populates="agreement"
    )
    agreement_reason = mapped_column(ENUM(AgreementReason))
    project_officer_id: Mapped[int] = mapped_column(
        ForeignKey("user.id"), nullable=True
    )
    project_officer: Mapped[Optional[User]] = relationship(
        User, foreign_keys=[project_officer_id]
    )

    team_members: Mapped[List["User"]] = relationship(
        "User",
        secondary="agreement_team_members",
        back_populates="agreements",
        primaryjoin="Agreement.id == AgreementTeamMembers.agreement_id",
        secondaryjoin="User.id == AgreementTeamMembers.user_id",
    )

    research_project_id: Mapped[int] = mapped_column(
        ForeignKey("research_project.id"), nullable=True
    )
    research_project: Mapped[Optional["ResearchProject"]] = relationship(
        "ResearchProject", back_populates="agreements"
    )
    budget_line_items: Mapped[list["BudgetLineItem"]] = relationship(
        "BudgetLineItem",
        back_populates="agreement",
        lazy=True,
        cascade="all, delete",
    )
    procurement_shop_id: Mapped[int] = mapped_column(
        ForeignKey("procurement_shop.id"), nullable=True
    )
    procurement_shop = relationship("ProcurementShop", back_populates="agreements")
    notes: Mapped[str] = mapped_column(Text, default="")

    @BaseModel.display_name.getter
    def display_name(self):
        return self.name

    __mapper_args__: dict[str, str | AgreementType] = {
        "polymorphic_identity": "agreement",
        "polymorphic_on": "agreement_type",
    }

    # @override
    # def to_dict(self) -> dict[str, Any]:
    #     d: dict[str, Any] = super().to_dict()
    #
    #     if isinstance(self.agreement_type, str):
    #         self.agreement_type = AgreementType[self.agreement_type]
    #
    #     if isinstance(self.agreement_reason, str):
    #         self.agreement_reason = AgreementReason[self.agreement_reason]
    #
    #     d.update(
    #         agreement_type=self.agreement_type.name if self.agreement_type else None,
    #         agreement_reason=self.agreement_reason.name
    #         if self.agreement_reason
    #         else None,
    #         budget_line_items=[bli.to_dict() for bli in self.budget_line_items],
    #         team_members=[tm.to_dict() for tm in self.team_members],
    #         research_project=self.research_project.to_dict()
    #         if self.research_project
    #         else None,
    #         procurement_shop=self.procurement_shop.to_dict()
    #         if self.procurement_shop
    #         else None,
    #         product_service_code=self.product_service_code.to_dict()
    #         if self.product_service_code
    #         else None,
    #     )
    #
    #     return d


contract_support_contacts = Table(
    "contract_support_contacts",
    BaseModel.metadata,
    Column(
        "contract_id",
        ForeignKey("contract_agreement.id"),
        primary_key=True,
    ),
    Column("users_id", ForeignKey("user.id"), primary_key=True),
)


class AcquisitionType(Enum):
    """Acquisition Type"""

    GSA_SCHEDULE = 1
    TASK_ORDER = 2
    FULL_AND_OPEN = 3


class ContractType(Enum):
    RESEARCH = 0
    SERVICE = 1


class ContractAgreement(Agreement):
    """Contract Agreement Model"""

    __tablename__ = "contract_agreement"

    id: Mapped[int] = mapped_column(ForeignKey("agreement.id"), primary_key=True)
    contract_number: Mapped[str] = mapped_column(String, nullable=True)
    incumbent_id: Mapped[int] = mapped_column(ForeignKey("vendor.id"), nullable=True)
    incumbent = relationship("Vendor", foreign_keys=[incumbent_id])
    vendor_id: Mapped[int] = mapped_column(ForeignKey("vendor.id"), nullable=True)
    vendor = relationship("Vendor", foreign_keys=[vendor_id])
    task_order_number: Mapped[str] = mapped_column(
        String(),
        nullable=True,
    )
    po_number: Mapped[str] = mapped_column(String(), nullable=True)
    acquisition_type = mapped_column(
        ENUM(AcquisitionType),
        nullable=True,
    )
    delivered_status: Mapped[bool] = mapped_column(Boolean, default=False)
    contract_type = mapped_column(ENUM(ContractType))
    support_contacts: Mapped[list[User]] = relationship(
        User,
        secondary=contract_support_contacts,
        back_populates="contracts",
    )

    __mapper_args__ = {
        "polymorphic_identity": AgreementType.CONTRACT,
    }

    # @override
    # def to_dict(self) -> dict[str, Any]:
    #     d: dict[str, Any] = super().to_dict()
    #
    #     if isinstance(self.contract_type, str):
    #         self.contract_type = ContractType[self.contract_type]
    #
    #     d.update(
    #         {
    #             "contract_type": self.contract_type.name
    #             if self.contract_type
    #             else None,
    #             "support_contacts": [
    #                 contacts.to_dict() for contacts in self.support_contacts
    #             ],
    #             "vendor": self.vendor.name if self.vendor else None,
    #             "incumbent": self.incumbent.name if self.incumbent else None,
    #         }
    #     )
    #
    #     return d


# TODO: Skeleton, will need flushed out more when we know what all a Grant is.
class GrantAgreement(Agreement):
    """Grant Agreement Model"""

    __tablename__ = "grant_agreement"

    id: Mapped[int] = mapped_column(ForeignKey("agreement.id"), primary_key=True)
    foa: Mapped[str]

    __mapper_args__ = {
        "polymorphic_identity": AgreementType.GRANT,
    }

    # @override
    # def to_dict(self) -> dict[str, Any]:
    #     d: dict[str, Any] = super().to_dict()
    #     return d


# TODO: Skeleton, will need flushed out more when we know what all an IAA is.
### Inter-Agency-Agreement
class IaaAgreement(Agreement):
    """IAA Agreement Model"""

    __tablename__ = "iaa_agreement"

    id: Mapped[int] = mapped_column(ForeignKey("agreement.id"), primary_key=True)
    iaa: Mapped[str]

    __mapper_args__ = {
        "polymorphic_identity": AgreementType.IAA,
    }

    # @override
    # def to_dict(self) -> dict[str, Any]:
    #     d: dict[str, Any] = super().to_dict()
    #     return d


# TODO: Skeleton, will need flushed out more when we know what all an IAA-AA is. Inter-Agency-Agreement-Assisted-Aquisition
### Inter-Agency-Agreement-Assisted-Aquisition
class IaaAaAgreement(Agreement):
    """IAA-AA Agreement Model"""

    __tablename__ = "iaa_aa_agreement"

    id: Mapped[int] = mapped_column(ForeignKey("agreement.id"), primary_key=True)
    iaa_aa: Mapped[str]

    __mapper_args__ = {
        "polymorphic_identity": AgreementType.MISCELLANEOUS,
    }

    # @override
    # def to_dict(self) -> dict[str, Any]:
    #     d: dict[str, Any] = super().to_dict()
    #     return d


class DirectAgreement(Agreement):
    """Direct Obligation Agreement Model"""

    __tablename__ = "direct_agreement"

    id: Mapped[int] = mapped_column(ForeignKey("agreement.id"), primary_key=True)
    payee: Mapped[str] = mapped_column(String, nullable=False)

    __mapper_args__ = {
        "polymorphic_identity": AgreementType.DIRECT_ALLOCATION,
    }

    # @override
    # def to_dict(self) -> dict[str, Any]:
    #     d: dict[str, Any] = super().to_dict()
    #     return d


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

    @BaseModel.display_name.getter
    def display_name(self):
        if self.can:
            return f"{self.can.display_name}:{self.fiscal_year}"
        return f"CAN#{self.can_id}:{self.fiscal_year}"

    @override
    def to_dict(self):
        # d = super().to_dict()

        d = {}
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
    id = Column(Integer, Identity(), primary_key=True)
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
        # d = super().to_dict()

        d = {}
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
    proc_shop_fee_percentage = Column(
        Numeric(12, 5)
    )  # may need to be a different object, i.e. flat rate or percentage

    @BaseModel.display_name.getter
    def display_name(self):
        return self.line_description if self.line_description else super().display_name

    @property
    def portfolio_id(self):
        return object_session(self).scalar(
            select(Portfolio.id)
            .join(CAN, Portfolio.id == CAN.managing_portfolio_id)
            .join(self.__class__, self.can_id == CAN.id)
            .where(self.__class__.id == self.id)
        )

    @property
    def fiscal_year(self):
        date_needed = self.date_needed or None
        month = date_needed.month if date_needed else -1
        year = date_needed.year if date_needed else -1
        return object_session(self).scalar(
            select(
                case(
                    (month >= 10, year + 1),
                    (month >= 0 and month < 10, year),
                    else_=None,
                )
            )
        )

    @property
    def team_members(self):
        return self.agreement.team_members if self.agreement else []

    # @override
    # def to_dict(self):
    #     d = super().to_dict()
    #
    #     if isinstance(self.status, str):
    #         self.status = BudgetLineItemStatus[self.status]
    #
    #     d.update(
    #         status=self.status.name if self.status else None,
    #         amount=float(self.amount) if self.amount else None,
    #         proc_shop_fee_percentage=float(self.proc_shop_fee_percentage)
    #         if self.proc_shop_fee_percentage
    #         else None,
    #         date_needed=self.date_needed.isoformat() if self.date_needed else None,
    #         can=self.can.to_dict() if self.can else None,
    #     )
    #
    #     return d


class CAN(BaseModel):
    """
    A CAN is a Common Accounting Number, which is
    used to track money coming into OPRE

    This model contains all the relevant
    descriptive information about a given CAN
    """

    __tablename__ = "can"

    id = Column(Integer, Identity(), primary_key=True)
    number = Column(String(30), nullable=False)
    description = Column(String)
    purpose = Column(String, default="")
    nickname = Column(String(30))
    expiration_date = Column(DateTime)
    appropriation_date = Column(DateTime)
    appropriation_term = Column(Integer, default="1")
    arrangement_type = Column(sa.Enum(CANArrangementType))

    funding_sources: Mapped[List["FundingSource"]] = relationship(
        secondary="can_funding_sources", back_populates="cans"
    )

    authorizer_id = Column(Integer, ForeignKey("funding_partner.id"))
    authorizer = relationship(FundingPartner)
    managing_portfolio_id = Column(Integer, ForeignKey("portfolio.id"))
    managing_portfolio = relationship(Portfolio, back_populates="cans")

    shared_portfolios: Mapped[List["Portfolio"]] = relationship(
        secondary="shared_portfolio_cans", back_populates="shared_cans"
    )

    budget_line_items = relationship("BudgetLineItem", back_populates="can")

    research_projects: Mapped[List["ResearchProject"]] = relationship(
        "ResearchProject", secondary="research_project_cans", back_populates="cans"
    )

    @BaseModel.display_name.getter
    def display_name(self):
        return self.number

    # @override
    # def to_dict(self) -> dict[str, Any]:
    #     d: dict[str, Any] = super().to_dict()
    #
    #     if isinstance(self.arrangement_type, str):
    #         self.arrangement_type = CANArrangementType[self.arrangement_type]
    #
    #     d.update(
    #         appropriation_date=self.appropriation_date.strftime("%d/%m/%Y")
    #         if self.appropriation_date
    #         else None,
    #         expiration_date=self.expiration_date.strftime("%d/%m/%Y")
    #         if self.expiration_date
    #         else None,
    #         arrangement_type=self.arrangement_type.name
    #         if self.arrangement_type
    #         else None,
    #     )
    #
    #     return d
