"""Agreement models."""

import decimal
from datetime import date
from enum import Enum, auto
from typing import Any, List, Optional, override

from sqlalchemy import Boolean, Column, Date, ForeignKey, Integer, Numeric, String, Table, Text, select
from sqlalchemy.dialects.postgresql import ENUM
from sqlalchemy.orm import Mapped, mapped_column, object_session, relationship

from models.base import BaseModel
from models.change_requests import AgreementChangeRequest, ChangeRequestStatus
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
            case AgreementType.AA:
                return "AA"
        return None

    CONTRACT = auto()
    GRANT = auto()
    DIRECT_OBLIGATION = auto()
    IAA = auto()
    AA = auto()


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
        auto()
    )  ## Logical Follow On is more work added/extension of the original


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


class AgreementAgency(BaseModel):
    """
    Agreement Agency Model

    Represents an agency that can be involved in agreements, either as a requesting or servicing agency.

    If `requesting` is True, the agency can request agreements.
    If `servicing` is True, the agency can service agreements.
    """

    __tablename__ = "agreement_agency"

    id: Mapped[int] = BaseModel.get_pk_column()
    name: Mapped[str] = mapped_column(String, unique=True)
    abbreviation: Mapped[Optional[str]] = mapped_column(
        String, unique=True, nullable=True
    )
    requesting: Mapped[bool] = mapped_column(Boolean, default=False)
    servicing: Mapped[bool] = mapped_column(Boolean, default=False)


class Agreement(BaseModel):
    """Base Agreement Model"""

    __tablename__ = "agreement"

    id: Mapped[int] = BaseModel.get_pk_column()
    agreement_type: Mapped[AgreementType] = mapped_column(ENUM(AgreementType))
    name: Mapped[str] = mapped_column(String)
    nick_name: Mapped[Optional[str]] = mapped_column(String, unique=True, nullable=True)
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
    alternate_project_officer_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("ops_user.id")
    )
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

    service_requirement_type: Mapped[Optional[ServiceRequirementType]] = mapped_column(
        ENUM(ServiceRequirementType)
    )

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
                    leader.full_name
                    for leader in portfolio.team_leaders
                    if hasattr(leader, "full_name") and leader.full_name
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
                and hasattr(bli.can.portfolio.division, "division_director")
            ):
                director = bli.can.portfolio.division.division_director_full_name
                if director is not None:
                    full_names.add(director)

        return sorted(full_names)

    @property
    def change_requests_in_review(self):
        if object_session(self) is None:
            return None
        results = (
            object_session(self)
            .execute(
                select(AgreementChangeRequest)
                .where(AgreementChangeRequest.agreement_id == self.id)
                .where(AgreementChangeRequest.status == ChangeRequestStatus.IN_REVIEW)
            )
            .all()
        )
        change_requests = [row[0] for row in results] if results else None
        return change_requests

    @property
    def in_review(self) -> bool:
        return self.change_requests_in_review is not None

    @override
    def to_dict(self) -> dict[str, Any]:  # type: ignore[override]
        d: dict[str, Any] = super().to_dict()  # type: ignore[no-untyped-call]
        # add the transient attribute that tracks the change request responsible for changes (if it exists)
        # so that it's added to the history event details
        if hasattr(self, "acting_change_request_id"):
            d.update(
                acting_change_request_id=self.acting_change_request_id,
            )
        return d

    @property
    def has_required_fields_for_status_change(self) -> bool:
        """
        Check if the agreement has all required fields filled (when one of it's budget line items
        is in a status that requires these fields).
        """
        required_fields = self.get_required_fields_for_status_change()

        def is_valid_value(value):
            if value is not None and isinstance(value, str) and not value.strip():
                return False
            return value is not None

        return all(is_valid_value(getattr(self, field)) for field in required_fields)


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

aa_support_contacts = Table(
    "aa_support_contacts",
    BaseModel.metadata,
    Column(
        "aa_id",
        ForeignKey("aa_agreement.id"),
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
    COST_PLUS_FIXED_FEE = auto()
    COST_PLUS_AWARD_FEE = auto()
    HYBRID = auto()


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
    contract_category: Mapped[Optional[ContractCategory]] = mapped_column(
        ENUM(ContractCategory)
    )
    psc_contract_specialist: Mapped[Optional[str]] = mapped_column(String)
    cotr_id: Mapped[Optional[User]] = mapped_column(ForeignKey("ops_user.id"))

    __mapper_args__ = {
        "polymorphic_identity": AgreementType.CONTRACT,
    }

    @classmethod
    def get_required_fields_for_status_change(cls) -> List[str]:
        """
        Get the list of required fields for status change.
        """
        return [
            "project_id",
            "agreement_type",
            "description",
            "product_service_code_id",
            "awarding_entity_id",
            "agreement_reason",
            "project_officer_id",
        ]


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

    @classmethod
    def get_required_fields_for_status_change(cls) -> List[str]:
        """
        Get the list of required fields for status change.
        """
        return []


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

    @classmethod
    def get_required_fields_for_status_change(cls) -> List[str]:
        """
        Get the list of required fields for status change.
        """
        return []


class AaAgreement(Agreement):
    """Aa Agreement Model"""

    __tablename__ = "aa_agreement"

    id: Mapped[int] = mapped_column(ForeignKey("agreement.id"), primary_key=True)
    requesting_agency_id: Mapped[int] = mapped_column(ForeignKey("agreement_agency.id"))
    requesting_agency: Mapped["AgreementAgency"] = relationship(
        "AgreementAgency", foreign_keys=[requesting_agency_id]
    )
    servicing_agency_id: Mapped[int] = mapped_column(ForeignKey("agreement_agency.id"))
    servicing_agency: Mapped["AgreementAgency"] = relationship(
        "AgreementAgency", foreign_keys=[servicing_agency_id]
    )

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
        secondary=aa_support_contacts,
        back_populates="aas",
    )
    contract_category: Mapped[Optional[ContractCategory]] = mapped_column(
        ENUM(ContractCategory)
    )
    psc_contract_specialist: Mapped[Optional[str]] = mapped_column(String)
    cotr_id: Mapped[Optional[int]] = mapped_column(ForeignKey("ops_user.id"))

    __mapper_args__ = {
        "polymorphic_identity": AgreementType.AA,
    }

    @classmethod
    def get_required_fields_for_status_change(cls) -> List[str]:
        """
        Get the list of required fields for status change.
        """
        return []


class DirectAgreement(Agreement):
    """Direct Obligation Agreement Model"""

    __tablename__ = "direct_agreement"

    id: Mapped[int] = mapped_column(ForeignKey("agreement.id"), primary_key=True)

    __mapper_args__ = {
        "polymorphic_identity": AgreementType.DIRECT_OBLIGATION,
    }

    @classmethod
    def get_required_fields_for_status_change(cls) -> List[str]:
        """
        Get the list of required fields for status change.
        """
        return []


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
