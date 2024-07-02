"""CAN models."""

import decimal
from datetime import date, datetime
from enum import Enum, auto
from typing import List, Optional

import sqlalchemy as sa
from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    Sequence,
    String,
    Table,
    Text,
    and_,
    case,
    select,
)
from sqlalchemy.dialects.postgresql import ENUM
from sqlalchemy.orm import Mapped, column_property, mapped_column, object_session, relationship

from models.base import BaseModel
from models.portfolios import Portfolio
from models.users import User
from models.workflows import (
    BudgetLineItemChangeRequest,
    ChangeRequestStatus,
    Package,
    PackageSnapshot,
    WorkflowAction,
    WorkflowInstance,
    WorkflowStepInstance,
    WorkflowStepStatus,
    WorkflowTriggerType,
)


class BudgetLineItemStatus(Enum):
    DRAFT = auto()
    PLANNED = auto()
    IN_EXECUTION = auto()
    OBLIGATED = auto()


class CANArrangementType(Enum):
    OPRE_APPROPRIATION = auto()
    COST_SHARE = auto()
    IAA = auto()
    IDDA = auto()
    MOU = auto()


class CANType(Enum):
    OPRE = auto()
    NON_OPRE = auto()


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

    id: Mapped[int] = BaseModel.get_pk_column()
    name: Mapped[str] = mapped_column(String)
    nickname: Mapped[Optional[str]] = mapped_column(String)

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

    id: Mapped[int] = BaseModel.get_pk_column()
    name: Mapped[str] = mapped_column(String)
    nickname: Mapped[Optional[str]] = mapped_column(String)

    @BaseModel.display_name.getter
    def display_name(self):
        return self.name


class AgreementType(Enum):
    CONTRACT = auto()
    GRANT = auto()
    DIRECT_ALLOCATION = auto()
    IAA = auto()
    IAA_AA = auto()
    MISCELLANEOUS = auto()


class AgreementReason(Enum):
    NEW_REQ = auto()
    RECOMPETE = auto()  ## recompete is brand new contract related to same work
    LOGICAL_FOLLOW_ON = (
        auto()  ## Logical Follow On is more work added/extension of the original
    )


class AgreementTeamMembers(BaseModel):
    __tablename__ = "agreement_team_members"

    user_id: Mapped[int] = mapped_column(ForeignKey("ops_user.id"), primary_key=True)
    agreement_id: Mapped[int] = mapped_column(
        ForeignKey("agreement.id"), primary_key=True
    )

    @BaseModel.display_name.getter
    def display_name(self):
        return f"user id: {self.user_id};agreement id:{self.agreement_id}"


class ProductServiceCode(BaseModel):
    """Product Service Code"""

    __tablename__ = "product_service_code"

    id: Mapped[int] = BaseModel.get_pk_column()
    name: Mapped[str] = mapped_column(String)
    naics: Mapped[Optional[int]] = mapped_column(Integer)
    support_code: Mapped[Optional[str]] = mapped_column(String)
    description: Mapped[Optional[str]] = mapped_column(String)

    agreement: Mapped["Agreement"] = relationship("Agreement")

    @BaseModel.display_name.getter
    def display_name(self):
        return self.name


class Agreement(BaseModel):
    """Base Agreement Model"""

    __tablename__ = "agreement"

    id: Mapped[int] = BaseModel.get_pk_column()
    agreement_type: Mapped[AgreementType] = mapped_column(ENUM(AgreementType))
    name: Mapped[str] = mapped_column(String)

    description: Mapped[Optional[str]] = mapped_column(String)
    product_service_code_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("product_service_code.id"),
    )
    product_service_code: Mapped[Optional[ProductServiceCode]] = relationship(
        back_populates="agreement"
    )
    agreement_reason: Mapped[Optional[AgreementReason]] = mapped_column(
        ENUM(AgreementReason)
    )
    project_officer_id: Mapped[Optional[int]] = mapped_column(ForeignKey("ops_user.id"))
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

    project_id: Mapped[Optional[int]] = mapped_column(ForeignKey("project.id"))
    project: Mapped[Optional["Project"]] = relationship(
        "Project", back_populates="agreements"
    )

    budget_line_items: Mapped[list["BudgetLineItem"]] = relationship(
        "BudgetLineItem",
        back_populates="agreement",
        lazy=True,
        cascade="all, delete",
    )

    procurement_shop_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("procurement_shop.id")
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

    @property
    def procurement_tracker_workflow_id(self):
        if object_session(self) is None:
            return False
        workflow_id = object_session(self).scalar(
            select(WorkflowInstance.id).where(
                and_(
                    WorkflowInstance.workflow_action
                    == WorkflowAction.PROCUREMENT_TRACKING,
                    WorkflowInstance.associated_type == WorkflowTriggerType.AGREEMENT,
                    WorkflowInstance.associated_id == self.id,
                )
            )
        )
        return workflow_id


contract_support_contacts = Table(
    "contract_support_contacts",
    BaseModel.metadata,
    Column(
        "contract_id",
        ForeignKey("contract_agreement.id"),
        primary_key=True,
    ),
    Column("users_id", ForeignKey("ops_user.id"), primary_key=True),
)


class AcquisitionType(Enum):
    """Acquisition Type"""

    GSA_SCHEDULE = auto()
    TASK_ORDER = auto()
    FULL_AND_OPEN = auto()


class ContractType(Enum):
    FIRM_FIXED_PRICE = auto()
    TIME_AND_MATERIALS = auto()
    LABOR_HOUR = auto()
    COST_PLUS_FIXED_FEE = auto()
    COST_PLUS_AWARD_FEE = auto()
    HYBRID = auto()


class ServiceRequirementType(Enum):
    SEVERABLE = auto()
    NON_SEVERABLE = auto()


class ContractAgreement(Agreement):
    """Contract Agreement Model"""

    __tablename__ = "contract_agreement"

    id: Mapped[int] = mapped_column(ForeignKey("agreement.id"), primary_key=True)
    contract_number: Mapped[Optional[str]] = mapped_column(String)
    incumbent_id: Mapped[Optional[int]] = mapped_column(ForeignKey("vendor.id"))
    incumbent: Mapped[Optional["Vendor"]] = relationship(
        "Vendor", foreign_keys=[incumbent_id]
    )
    vendor_id: Mapped[Optional[int]] = mapped_column(ForeignKey("vendor.id"))
    vendor: Mapped[Optional["Vendor"]] = relationship(
        "Vendor", foreign_keys=[vendor_id]
    )
    task_order_number: Mapped[Optional[str]] = mapped_column(String())
    po_number: Mapped[Optional[str]] = mapped_column(String())
    acquisition_type: Mapped[Optional[AcquisitionType]] = mapped_column(
        ENUM(AcquisitionType)
    )
    delivered_status: Mapped[bool] = mapped_column(Boolean, default=False)
    contract_type: Mapped[Optional[ContractType]] = mapped_column(ENUM(ContractType))
    support_contacts: Mapped[list[User]] = relationship(
        User,
        secondary=contract_support_contacts,
        back_populates="contracts",
    )
    service_requirement_type: Mapped[Optional[ServiceRequirementType]] = mapped_column(
        ENUM(ServiceRequirementType)
    )

    __mapper_args__ = {
        "polymorphic_identity": AgreementType.CONTRACT,
    }


# TODO: Skeleton, will need flushed out more when we know what all a Grant is.
class GrantAgreement(Agreement):
    """Grant Agreement Model"""

    __tablename__ = "grant_agreement"

    id: Mapped[int] = mapped_column(ForeignKey("agreement.id"), primary_key=True)
    foa: Mapped[str]

    __mapper_args__ = {
        "polymorphic_identity": AgreementType.GRANT,
    }


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


class DirectAgreement(Agreement):
    """Direct Obligation Agreement Model"""

    __tablename__ = "direct_agreement"

    id: Mapped[int] = mapped_column(ForeignKey("agreement.id"), primary_key=True)
    payee: Mapped[str] = mapped_column(String)

    __mapper_args__ = {
        "polymorphic_identity": AgreementType.DIRECT_ALLOCATION,
    }


class AgreementOpsDbHistory(BaseModel):
    """Agreement X OpsDbHistory Model to cross-ref the history records related to an agreement"""

    __tablename__ = "agreement_ops_db_history"

    id: Mapped[int] = BaseModel.get_pk_column()
    agreement_id: Mapped[Optional[int]] = mapped_column(Integer)
    ops_db_history_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("ops_db_history.id", ondelete="CASCADE")
    )
    ops_db_history = relationship(
        "OpsDBHistory",
        passive_deletes=True,
    )


class CANFiscalYear(BaseModel):
    """Contains the relevant financial info by fiscal year for a given CAN."""

    __tablename__ = "can_fiscal_year"
    __table_args__ = (
        sa.UniqueConstraint(
            "can_id",
            "fiscal_year",
        ),
    )

    id: Mapped[int] = BaseModel.get_pk_column(
        sequence=Sequence("can_fiscal_year_id_seq", start=5000, increment=1)
    )
    can_id: Mapped[int] = mapped_column(ForeignKey("can.id"))
    fiscal_year: Mapped[int] = mapped_column(primary_key=True)
    can: Mapped["CAN"] = relationship("CAN", lazy="joined")
    received_funding: Mapped[Optional[decimal]] = mapped_column(
        Numeric(12, 2), default=0
    )
    expected_funding: Mapped[Optional[decimal]] = mapped_column(
        Numeric(12, 2), default=0
    )
    potential_additional_funding: Mapped[Optional[decimal]] = mapped_column(
        Numeric(12, 2), default=0
    )
    can_lead: Mapped[Optional[str]]
    notes: Mapped[Optional[str]] = mapped_column(default="")
    total_funding: Mapped[decimal] = column_property(
        received_funding + expected_funding
    )

    @BaseModel.display_name.getter
    def display_name(self):
        if self.can:
            return f"{self.can.display_name}:{self.fiscal_year}"
        return f"CAN#{self.can_id}:{self.fiscal_year}"


class CANFiscalYearCarryForward(BaseModel):
    """Contains the relevant financial info by fiscal year for a given CAN carried over from a previous fiscal year."""

    __tablename__ = "can_fiscal_year_carry_forward"

    id: Mapped[int] = BaseModel.get_pk_column()
    can_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("can.id"))
    can: Mapped["CAN"] = relationship("CAN", lazy="joined")
    from_fiscal_year: Mapped[Optional[int]] = mapped_column(Integer)
    to_fiscal_year: Mapped[Optional[int]] = mapped_column(Integer)
    received_amount: Mapped[decimal] = mapped_column(Numeric(12, 2), default=0)
    expected_amount: Mapped[decimal] = mapped_column(Numeric(12, 2), default=0)
    notes: Mapped[Optional[str]] = mapped_column(String, default="")
    total_amount: Mapped[decimal] = column_property(received_amount + expected_amount)


class ServicesComponent(BaseModel):
    """
    A Services Component (SC) is the "what" when referring to an Agreement.
    It outlines what work is occuring under a given Agreement.

    This model contains all the relevant
    descriptive information about a given Services Component

    contract_agreement_id - The ID of the Contract Agreement the Services Component is associated with
    number - The index number of the Services Component
    optional - Whether the Services Component is optional or not (OSC or 'Option Period')
    description - The description of the Services Component (not sure if needed)
    period_start - The start date of the Services Component
    period_end - The end date of the Services Component
    budget_line_items - The Budget Line Items associated with the Services Component
    period_duration - The duration of the Services Component (derived from period_start and period_end)
    display_title - The long name of the Services Component (e.g. "Optional Services Component 1")
    display_name - The short name of the Services Component (e.g. "OSC1")
    """

    __tablename__ = "services_component"
    __table_args__ = (
        sa.UniqueConstraint(
            "number", "sub_component", "optional", "contract_agreement_id"
        ),
    )

    # start Identity at 4 to allow for the records load with IDs
    # in agreements_and_blin_data.json5
    id: Mapped[int] = BaseModel.get_pk_column()
    number: Mapped[int] = mapped_column(Integer)
    optional: Mapped[bool] = mapped_column(Boolean, default=False)

    description: Mapped[Optional[str]] = mapped_column(String)
    period_start: Mapped[Optional[date]] = mapped_column(Date)
    period_end: Mapped[Optional[date]] = mapped_column(Date)

    sub_component: Mapped[str] = mapped_column(String, nullable=True, default=None)

    contract_agreement_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("contract_agreement.id", ondelete="CASCADE")
    )
    contract_agreement: Mapped["ContractAgreement"] = relationship(
        "ContractAgreement",
        passive_deletes=True,
    )

    def severable(self):
        return (
            self.contract_agreement
            and self.contract_agreement.service_requirement_type
            == ServiceRequirementType.SEVERABLE
        )

    @property
    def display_title(self):
        if self.severable():
            pre = "Base" if self.number == 1 else "Optional"
            return f"{pre} Period {self.number}"
        optional = "Optional " if self.optional else ""
        return f"{optional}Services Component {self.number}"

    @property
    def period_duration(self):
        if self.period_start and self.period_end:
            return abs(self.period_end - self.period_start)
        return None

    @BaseModel.display_name.getter
    def display_name(self):
        if self.severable():
            pre = "Base" if self.number == 1 else "Optional"
            return f"{pre} Period {self.number}"
        optional = "O" if self.optional else ""
        return f"{optional}SC{self.number}"


class CLIN(BaseModel):
    """
    Contract Line Item Number (CLIN) is a unique identifier for a contract line item,
    """

    __tablename__ = "clin"
    __table_args__ = (sa.UniqueConstraint("number", "contract_agreement_id"),)

    id: Mapped[int] = BaseModel.get_pk_column(
        sequence=Sequence("clin_id_seq", start=5000, increment=1)
    )
    number: Mapped[int] = mapped_column(Integer)
    name: Mapped[Optional[str]] = mapped_column(String)
    pop_start_date: Mapped[Optional[date]] = mapped_column(Date)
    pop_end_date: Mapped[Optional[date]] = mapped_column(Date)

    contract_agreement_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("contract_agreement.id", ondelete="CASCADE"), nullable=False
    )
    contract_agreement: Mapped["ContractAgreement"] = relationship(
        "ContractAgreement",
        passive_deletes=True,
    )


class BudgetLineItem(BaseModel):
    __tablename__ = "budget_line_item"

    id: Mapped[int] = BaseModel.get_pk_column()
    line_description: Mapped[Optional[str]] = mapped_column(String)
    comments: Mapped[Optional[str]] = mapped_column(Text)

    agreement_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("agreement.id")
    )
    agreement: Mapped[Optional[Agreement]] = relationship(
        Agreement, back_populates="budget_line_items"
    )

    can_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("can.id"))
    can: Mapped[Optional["CAN"]] = relationship(
        "CAN", back_populates="budget_line_items"
    )

    services_component_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("services_component.id")
    )
    services_component: Mapped[Optional[ServicesComponent]] = relationship(
        ServicesComponent, backref="budget_line_items"
    )

    clin_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("clin.id"))
    clin: Mapped[Optional[CLIN]] = relationship(CLIN, backref="budget_line_items")

    amount: Mapped[Optional[decimal]] = mapped_column(Numeric(12, 2))

    status: Mapped[Optional[BudgetLineItemStatus]] = mapped_column(
        sa.Enum(BudgetLineItemStatus)
    )

    date_needed: Mapped[Optional[date]] = mapped_column(Date)

    proc_shop_fee_percentage: Mapped[Optional[decimal]] = mapped_column(
        Numeric(12, 5)
    )  # may need to be a different object, i.e. flat rate or percentage

    @BaseModel.display_name.getter
    def display_name(self):
        return f"BL {self.id}"

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

    @property
    def has_active_workflow(self):
        if object_session(self) is None:
            return False
        package = object_session(self).scalar(
            select(Package)
            .join(PackageSnapshot, Package.id == PackageSnapshot.package_id)
            .join(self.__class__, self.id == PackageSnapshot.bli_id)
            .join(WorkflowInstance, Package.workflow_instance_id == WorkflowInstance.id)
            .join(
                WorkflowStepInstance,
                WorkflowInstance.id == WorkflowStepInstance.workflow_instance_id,
            )
            .where(WorkflowStepInstance.status == WorkflowStepStatus.REVIEW)
        )
        return package is not None

    @property
    def active_workflow_current_step_id(self):
        if object_session(self) is None:
            return None
        # This doesn't work with the bootstrap test data since current_workflow_step_instance_id isn't set
        # current_workflow_step_instance_id = object_session(self).scalar(
        #     select(WorkflowInstance.current_workflow_step_instance_id)
        #     .join(
        #         WorkflowStepInstance,
        #         WorkflowInstance.id == WorkflowStepInstance.workflow_instance_id,
        #     )
        #     .join(Package, WorkflowInstance.id == Package.workflow_instance_id)
        #     .join(PackageSnapshot, Package.id == PackageSnapshot.package_id)
        #     .join(self.__class__, self.id == PackageSnapshot.bli_id)
        # )
        # not as good as the above, but works with the bootstrap test data
        current_workflow_step_instance_id = object_session(self).scalar(
            select(WorkflowStepInstance.id)
            .join(
                WorkflowInstance,
                WorkflowInstance.id == WorkflowStepInstance.workflow_instance_id,
            )
            .join(Package, WorkflowInstance.id == Package.workflow_instance_id)
            .join(PackageSnapshot, Package.id == PackageSnapshot.package_id)
            .join(self.__class__, self.id == PackageSnapshot.bli_id)
            .where(WorkflowStepInstance.status == WorkflowStepStatus.REVIEW)
        )
        return current_workflow_step_instance_id

    @property
    def change_requests_in_review(self):
        if object_session(self) is None:
            return None
        results = (
            object_session(self)
            .execute(
                select(BudgetLineItemChangeRequest)
                .where(BudgetLineItemChangeRequest.budget_line_item_id == self.id)
                .where(
                    BudgetLineItemChangeRequest.status == ChangeRequestStatus.IN_REVIEW
                )
            )
            .all()
        )
        change_requests = [row[0] for row in results] if results else None
        return change_requests

    @property
    def in_review(self):
        return self.change_requests_in_review is not None or self.has_active_workflow


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
    number: Mapped[str] = mapped_column(String(30), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String)
    purpose: Mapped[Optional[str]] = mapped_column(String, default="")
    nickname: Mapped[Optional[str]]
    expiration_date: Mapped[Optional[datetime]] = mapped_column(DateTime)
    appropriation_date: Mapped[Optional[datetime]] = mapped_column(DateTime)
    appropriation_term: Mapped[Optional[int]] = mapped_column(Integer, default="1")
    arrangement_type: Mapped[Optional[CANArrangementType]] = mapped_column(
        sa.Enum(CANArrangementType)
    )
    can_type: Mapped[Optional[CANType]] = mapped_column(sa.Enum(CANType))
    division_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("division.id")
    )

    funding_sources: Mapped[List["FundingSource"]] = relationship(
        secondary="can_funding_sources", back_populates="cans"
    )

    authorizer_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("funding_partner.id")
    )
    authorizer: Mapped[Optional[FundingPartner]] = relationship(FundingPartner)

    managing_portfolio_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("portfolio.id")
    )
    managing_portfolio: Mapped[Portfolio] = relationship(
        Portfolio, back_populates="cans"
    )

    shared_portfolios: Mapped[List["Portfolio"]] = relationship(
        secondary="shared_portfolio_cans", back_populates="shared_cans"
    )

    budget_line_items: Mapped[List["BudgetLineItem"]] = relationship(
        "BudgetLineItem", back_populates="can"
    )

    projects: Mapped[List["Project"]] = relationship(
        "Project", secondary="project_cans", back_populates="cans"
    )

    @BaseModel.display_name.getter
    def display_name(self):
        return self.number
