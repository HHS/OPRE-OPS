"""Agreement models."""

import decimal
from datetime import date
from enum import Enum, auto
from typing import List, Optional

from sqlalchemy import Boolean, Column, Date, ForeignKey, Integer, Numeric, String, Table, Text, select
from sqlalchemy.dialects.postgresql import ENUM
from sqlalchemy.orm import Mapped, mapped_column, object_session, relationship

from models.base import BaseModel
from models.procurement_tracker import ProcurementTracker
from models.users import User


class ServiceRequirementType(Enum):
    SEVERABLE = auto()
    NON_SEVERABLE = auto()


class ContractCategory(Enum):
    RESEARCH = auto()
    SERVICE = auto()

class AgreementSortCondition(Enum):
    def __str__(self):
        return str(self.value)
    AGREEMENT = "AGREEMENT"
    PROJECT = "PROJECT"
    TYPE = "TYPE"
    AGREEMENT_TOTAL = "AGREEMENT_TOTAL"
    NEXT_BUDGET_LINE = "NEXT_BUDGET_LINE"
    NEXT_OBLIGATE_BY = "NEXT_OBLIGATE_BY"

class AgreementType(Enum):
    def __str__(self):
        match self:
            case AgreementType.CONTRACT:
                return "CONTRACT"
            case AgreementType.GRANT:
                return "GRANT"
            case AgreementType.DIRECT_OBLIGATION:
                return "DIRECT OBLIGATION"
            case AgreementType.IAA:
                return "IAA"
            case AgreementType.IAA_AA:
                return "IAA AA"
            case AgreementType.MISCELLANEOUS:
                return "MISCELLANEOUS"

    CONTRACT = auto()
    GRANT = auto()
    DIRECT_OBLIGATION = auto()
    IAA = auto()
    IAA_AA = auto()
    MISCELLANEOUS = auto()


class ModType(Enum):
    NEW = auto()
    ADMIN = auto()
    AMOUNT_TBD = auto()
    AS_IS = auto()
    REPLACEMENT_AMOUNT_FINAL = auto()


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
    alternate_project_officer_id: Mapped[Optional[int]] = mapped_column(ForeignKey("ops_user.id"))
    alternate_project_officer: Mapped[Optional[User]] = relationship(
        User, foreign_keys=[alternate_project_officer_id]
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

    awarding_entity_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("procurement_shop.id")
    )
    procurement_shop = relationship("ProcurementShop", back_populates="agreements")
    notes: Mapped[str] = mapped_column(Text, default="")

    start_date: Mapped[Optional[date]] = mapped_column(Date)
    end_date: Mapped[Optional[date]] = mapped_column(Date)
    maps_sys_id: Mapped[Optional[int]] = mapped_column(Integer)

    @BaseModel.display_name.getter
    def display_name(self):
        return self.name

    __mapper_args__: dict[str, str | AgreementType] = {
        "polymorphic_identity": "agreement",
        "polymorphic_on": "agreement_type",
    }

    @property
    def procurement_tracker_id(self):
        if object_session(self) is None:
            return False
        tracker_id = object_session(self).scalar(
            select(ProcurementTracker.id).where(
                ProcurementTracker.agreement_id == self.id
            )
        )
        return tracker_id

    @property
    def team_leaders(self):
        full_names = set()

        for bli in self.budget_line_items:
            can = getattr(bli, "can", None)
            portfolio = getattr(can, "portfolio", None)

            if portfolio and getattr(portfolio, "team_leaders", None):
                full_names.update(
                    leader.full_name for leader in portfolio.team_leaders if hasattr(leader, "full_name")
                )
        return sorted(full_names)

    @property
    def division_directors(self) -> list[str]:
        full_names = set()

        for bli in self.budget_line_items:
            if (
                bli.can
                and bli.can.portfolio
                and hasattr(bli.can.portfolio, "division")
                and bli.can.portfolio.division
                and hasattr(bli.can.portfolio.division, "division_directors")
            ):
                director = bli.can.portfolio.division.division_director_full_name
                full_names.add(director)

        return sorted(full_names)

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
    contract_category: Mapped[Optional[ContractCategory]] = mapped_column(
        ENUM(ContractCategory)
    )
    psc_contract_specialist: Mapped[Optional[str]] = mapped_column(String)
    cotr_id: Mapped[Optional[User]] = mapped_column(ForeignKey("ops_user.id"))

    __mapper_args__ = {
        "polymorphic_identity": AgreementType.CONTRACT,
    }


# TODO: Skeleton, will need flushed out more when we know what all a Grant is.
class GrantAgreement(Agreement):
    """Grant Agreement Model"""

    __tablename__ = "grant_agreement"

    id: Mapped[int] = mapped_column(ForeignKey("agreement.id"), primary_key=True)
    foa: Mapped[Optional[str]] = mapped_column(String)
    total_funding: Mapped[Optional[decimal]] = mapped_column(Numeric(12, 2))
    number_of_years: Mapped[Optional[int]] = mapped_column(Integer)
    number_of_grants: Mapped[Optional[int]] = mapped_column(Integer)

    __mapper_args__ = {
        "polymorphic_identity": AgreementType.GRANT,
    }


class IAADirectionType(Enum):
    INCOMING = auto()
    OUTGOING = auto()


class IaaAgreement(Agreement):
    """IAA Agreement Model"""

    __tablename__ = "iaa_agreement"

    id: Mapped[int] = mapped_column(ForeignKey("agreement.id"), primary_key=True)
    direction: Mapped[IAADirectionType] = mapped_column(ENUM(IAADirectionType))
    iaa_customer_agency_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("iaa_customer_agency.id")
    )
    iaa_customer_agency = relationship("IAACustomerAgency")
    opre_poc: Mapped[Optional[str]] = mapped_column(String)
    agency_poc: Mapped[Optional[str]] = mapped_column(String)

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

    __mapper_args__ = {
        "polymorphic_identity": AgreementType.DIRECT_OBLIGATION,
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


class AgreementMod(BaseModel):
    """Agreement Modification Model"""

    __tablename__ = "agreement_mod"

    id: Mapped[int] = BaseModel.get_pk_column()
    agreement_id: Mapped[int] = mapped_column(ForeignKey("agreement.id"))
    agreement: Mapped[Agreement] = relationship("Agreement")
    mod_type: Mapped[Optional[ModType]] = mapped_column(ENUM(ModType))
    number: Mapped[Optional[str]] = mapped_column(String)
    mod_date: Mapped[Optional[date]] = mapped_column(Date)
