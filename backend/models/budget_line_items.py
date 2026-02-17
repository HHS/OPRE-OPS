"""BudgetLineItem models."""

import decimal
from datetime import date
from decimal import Decimal
from enum import Enum, auto
from typing import Optional

from sqlalchemy import (
    Boolean,
    Date,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    Sequence,
    String,
    Text,
    case,
    event,
    extract,
    select,
)
from sqlalchemy.dialects.postgresql import ENUM
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    object_session,
    relationship,
    sessionmaker,
)
from typing_extensions import Any, override

from models import CAN, Agreement, AgreementType
from models.base import BaseModel
from models.change_requests import (
    AgreementChangeRequest,
    BudgetLineItemChangeRequest,
    ChangeRequestStatus,
    ChangeRequestType,
)


class BudgetLineItemStatus(Enum):
    def __str__(self):
        return str(self.value)

    DRAFT = "Draft"
    PLANNED = "Planned"
    IN_EXECUTION = "In Execution"
    OBLIGATED = "Obligated"


class BudgetLineSortCondition(Enum):
    def __str__(self):
        return str(self.value)

    ID_NUMBER = "ID_NUMBER"
    AGREEMENT_NAME = "AGREEMENT_NAME"
    AGREEMENT_TYPE = "AGREEMENT_TYPE"
    SERVICE_COMPONENT = "SERVICE_COMPONENT"
    OBLIGATE_BY = "OBLIGATE_BY"
    FISCAL_YEAR = "FISCAL_YEAR"
    CAN_NUMBER = "CAN_NUMBER"
    PORTFOLIO = "PORTFOLIO"
    TOTAL = "TOTAL"
    FEE = "FEE"
    STATUS = "STATUS"


class BudgetLineItem(BaseModel):
    """
    Budget Line Item model.
    """

    __tablename__ = "budget_line_item"

    id: Mapped[int] = BaseModel.get_pk_column(sequence=Sequence("budget_line_item_id_seq", start=15000, increment=1))
    budget_line_item_type: Mapped[AgreementType] = mapped_column(ENUM(AgreementType), default=AgreementType.CONTRACT)

    service_component_name_for_sort: Mapped[Optional[str]] = mapped_column(String)

    services_component_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("services_component.id", ondelete="SET NULL"),
    )
    services_component: Mapped[Optional["ServicesComponent"]] = relationship(
        "ServicesComponent", backref="budget_line_items", passive_deletes=True
    )

    clin_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("clin.id"))
    clin: Mapped[Optional["CLIN"]] = relationship("CLIN", backref="budget_line_items")

    line_description: Mapped[Optional[str]] = mapped_column(String)
    comments: Mapped[Optional[str]] = mapped_column(Text)

    agreement_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("agreement.id"))
    agreement: Mapped[Optional["Agreement"]] = relationship("Agreement", back_populates="budget_line_items")

    procurement_action_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("procurement_action.id"), nullable=True
    )
    procurement_action: Mapped[Optional["ProcurementAction"]] = relationship(
        "ProcurementAction", back_populates="budget_line_items"
    )

    can_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("can.id"))
    can: Mapped[Optional[CAN]] = relationship(CAN, back_populates="budget_line_items")

    amount: Mapped[Optional[decimal]] = mapped_column(Numeric(12, 2))

    status: Mapped[Optional[BudgetLineItemStatus]] = mapped_column(
        ENUM(BudgetLineItemStatus), default=BudgetLineItemStatus.DRAFT
    )
    is_obe: Mapped[Optional[bool]] = mapped_column(Boolean, default=False)
    on_hold: Mapped[bool] = mapped_column(Boolean, default=False)
    certified: Mapped[bool] = mapped_column(Boolean, default=False)

    closed: Mapped[bool] = mapped_column(Boolean, default=False)
    closed_by: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("ops_user.id"))
    closed_by_user: Mapped[Optional["User"]] = relationship("User", foreign_keys=[closed_by])
    closed_date: Mapped[Optional[date]] = mapped_column(Date)

    is_under_current_resolution: Mapped[Optional[bool]] = mapped_column(Boolean, default=False)

    date_needed: Mapped[Optional[date]] = mapped_column(Date)
    extend_pop_to: Mapped[Optional[date]] = mapped_column(Date)
    start_date: Mapped[Optional[date]] = mapped_column(Date)
    end_date: Mapped[Optional[date]] = mapped_column(Date)

    object_class_code_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("object_class_code.id"))
    object_class_code: Mapped[Optional["ObjectClassCode"]] = relationship("ObjectClassCode")
    doc_received: Mapped[Optional[bool]] = mapped_column(Boolean, default=False)
    obligation_date: Mapped[Optional[date]] = mapped_column(Date)

    # deprecated: we should be using procurement shop fee
    proc_shop_fee_percentage: Mapped[Optional[decimal]] = mapped_column(Numeric(12, 5))

    procurement_shop_fee_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("procurement_shop_fee.id"))
    procurement_shop_fee: Mapped[Optional["ProcurementShopFee"]] = relationship(
        "ProcurementShopFee", back_populates="budget_line_items"
    )

    __mapper_args__: dict[str, str | AgreementType] = {
        "polymorphic_identity": "budget_line_item",
        "polymorphic_on": "budget_line_item_type",
    }

    __table_args__ = (
        Index("ix_budget_line_item_agreement_id", "agreement_id"),
        Index("ix_budget_line_item_can_id", "can_id"),
    )

    @BaseModel.display_name.getter
    def display_name(self):
        return f"BL {self.id}"

    @hybrid_property
    def fees(self):
        """
        Fee calculation rules:
          1) If procurement_shop_fee_id is set, use its fee as a locked-in rate.
          2) Otherwise, if the agreement has a procurement shop, use its current fee.
          3) If all BLIs on the agreement are DRAFT and there is no procurement shop yet, the fee is 0.
          4) Otherwise, 0.
        """
        try:
            amount = Decimal(self.amount or "0")
        except (ValueError, TypeError):
            amount = Decimal("0")

        # 1) Locked-in fee
        if self.procurement_shop_fee_id:
            raw_fee = self.procurement_shop_fee.fee or Decimal("0")
            fee_rate = Decimal(str(raw_fee))
            return (fee_rate / Decimal("100")) * amount

        agreement = self.agreement

        # 2) Use current procurement shop fee if available
        if agreement and agreement.procurement_shop:
            fee_obj = agreement.procurement_shop.current_fee
            fee_rate = fee_obj.fee if fee_obj else Decimal("0")
            return (fee_rate / Decimal("100")) * amount

        # 3) No procurement shop yet: 0 only if all BLIs are DRAFT
        if agreement and not agreement.procurement_shop:
            blis = getattr(agreement, "budget_line_items", [])
            if blis and all(bli.status == BudgetLineItemStatus.DRAFT for bli in blis):
                return Decimal("0")

        # 4) Default
        return Decimal("0")

    @fees.expression
    def fees(cls):
        # This provides the SQL expression equivalent
        from sqlalchemy import and_, case, func, literal, select
        from sqlalchemy.orm import aliased

        from models import Agreement, BudgetLineItemStatus, ProcurementShopFee

        amount = func.coalesce(cls.amount, 0)

        # 1) Locked-in procurement shop fee
        locked_fee_rate_subq = (
            select(ProcurementShopFee.fee).where(ProcurementShopFee.id == cls.procurement_shop_fee_id).scalar_subquery()
        )

        # 2) Current procurement shop fee from Agreement → ProcurementShop
        today = func.current_date()
        PSF = aliased(ProcurementShopFee)

        current_fee_rate_subq = (
            select(PSF.fee)
            .join_from(PSF, Agreement, PSF.procurement_shop_id == Agreement.awarding_entity_id)
            .where(
                Agreement.id == cls.agreement_id,
                (PSF.start_date.is_(None)) | (PSF.start_date <= today),
                (PSF.end_date.is_(None)) | (PSF.end_date >= today),
            )
            .order_by(PSF.start_date.desc().nullslast())
            .limit(1)
            .scalar_subquery()
        )

        # 3) Conditions for: no procurement shop AND all BLIs are DRAFT
        # a. Does agreement have a procurement shop?
        has_proc_shop = (
            select(literal(1))
            .where(
                Agreement.id == cls.agreement_id,
                Agreement.awarding_entity_id.isnot(None),
            )
            .exists()
        )

        # b. Are there any non-DRAFT BLIs?
        bli_alias = aliased(cls)
        has_non_draft_bli = (
            select(literal(1))
            .where(
                bli_alias.agreement_id == cls.agreement_id,
                bli_alias.status != BudgetLineItemStatus.DRAFT,
            )
            .exists()
        )

        # 4) Final expression
        return case(
            (
                cls.procurement_shop_fee_id.isnot(None),
                amount * (func.coalesce(locked_fee_rate_subq, 0) / 100),
            ),
            (
                has_proc_shop,
                amount * (func.coalesce(current_fee_rate_subq, 0) / 100),
            ),
            (
                and_(cls.agreement_id.isnot(None), ~has_proc_shop, ~has_non_draft_bli),
                literal(0),
            ),
            else_=literal(0),
        )

    @hybrid_property
    def total(self):
        amount = Decimal(self.amount or "0")
        fees = self.fees or Decimal("0")
        return amount + fees

    @total.expression
    def total(cls):
        return cls.amount + cls.fees

    @hybrid_property
    def portfolio_id(self):
        if not self.can_id:
            return None
        return self.can.portfolio_id

    @portfolio_id.expression
    def portfolio_id(cls):
        # This provides the SQL expression equivalent
        return select(CAN.portfolio_id).where(CAN.id == cls.can_id).scalar_subquery()

    @hybrid_property
    def fiscal_year(self):
        if not self.date_needed:
            return None

        fiscal_year = self.date_needed.year
        if self.date_needed.month >= 10:
            fiscal_year = fiscal_year + 1
        return fiscal_year

    @fiscal_year.expression
    def fiscal_year(cls):
        # This provides the SQL expression equivalent
        return case(
            (cls.date_needed.is_(None), None),
            else_=case(
                (
                    extract("month", cls.date_needed) >= 10,
                    extract("year", cls.date_needed) + 1,
                ),
                else_=extract("year", cls.date_needed),
            ),
        )

    @property
    def team_members(self):
        return self.agreement.team_members if self.agreement else []

    @property
    def portfolio_team_leaders(self):
        if not self.can:
            return []
        return self.can.portfolio.team_leaders if self.can.portfolio else []

    @property
    def change_requests_in_review(self):
        session = object_session(self)
        if session is None:
            return None

        queries = [
            select(BudgetLineItemChangeRequest).where(
                BudgetLineItemChangeRequest.status == ChangeRequestStatus.IN_REVIEW,
                BudgetLineItemChangeRequest.change_request_type == ChangeRequestType.BUDGET_LINE_ITEM_CHANGE_REQUEST,
                BudgetLineItemChangeRequest.budget_line_item_id == self.id,
            )
        ]

        agreement_id = getattr(self, "agreement_id", None)
        if agreement_id:
            queries.append(
                select(AgreementChangeRequest).where(
                    AgreementChangeRequest.status == ChangeRequestStatus.IN_REVIEW,
                    AgreementChangeRequest.change_request_type == ChangeRequestType.AGREEMENT_CHANGE_REQUEST,
                    AgreementChangeRequest.agreement_id == agreement_id,
                )
            )

        change_requests = []
        for query in queries:
            change_requests.extend(session.scalars(query).all())

        return change_requests if change_requests else None

    @property
    def in_review(self):
        return self.change_requests_in_review is not None

    @property
    def project(self) -> Optional["Project"]:
        return self.agreement.project if self.agreement else None

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
        Check if the budget line item that is not in DRAFT has all required fields filled.
        """
        required_fields = self.get_required_fields_for_status_change()
        return all(getattr(self, field) is not None for field in required_fields)

    @classmethod
    def get_required_fields_for_status_change(cls) -> list[str]:
        """
        Get the list of required fields for status change.
        """
        return [
            "date_needed",
            "can_id",
            "amount",
            "agreement_id",
            "services_component_id",
        ]


class Invoice(BaseModel):
    """Invoice model."""

    __tablename__ = "invoice"

    id: Mapped[int] = BaseModel.get_pk_column()
    budget_line_item_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("budget_line_item.id"))
    invoice_line_number: Mapped[Optional[int]] = mapped_column(Integer)


class RequisitionType(Enum):
    """Type of requisition for procurement action."""

    INITIAL = auto()
    FINAL = auto()

    def __str__(self):
        return self.name.replace("_", " ").title()


class Requisition(BaseModel):
    """Requisition model."""

    __tablename__ = "requisition"

    id: Mapped[int] = BaseModel.get_pk_column()

    procurement_action_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("procurement_action.id"))
    procurement_action: Mapped[Optional["ProcurementAction"]] = relationship(
        "ProcurementAction", back_populates="requisitions"
    )

    type: Mapped[Optional[RequisitionType]] = mapped_column(ENUM(RequisitionType), nullable=True)
    zero_number: Mapped[Optional[str]] = mapped_column(String)
    zero_date: Mapped[Optional[date]] = mapped_column(Date)
    number: Mapped[Optional[str]] = mapped_column(String)
    date: Mapped[Optional[date]] = mapped_column(Date)
    group: Mapped[Optional[int]] = mapped_column(Integer)
    check: Mapped[Optional[str]] = mapped_column(String)


class ObjectClassCode(BaseModel):
    """Object class code model."""

    __tablename__ = "object_class_code"

    id: Mapped[int] = BaseModel.get_pk_column()
    code: Mapped[Optional[int]] = mapped_column(Integer)
    description: Mapped[Optional[str]] = mapped_column(String)


class StateCode(Enum):
    AL = "Alabama"
    AK = "Alaska"
    AZ = "Arizona"
    AR = "Arkansas"
    CA = "California"
    CO = "Colorado"
    CT = "Connecticut"
    DE = "Delaware"
    FL = "Florida"
    GA = "Georgia"
    HI = "Hawaii"
    ID = "Idaho"
    IL = "Illinois"
    IN = "Indiana"
    IA = "Iowa"
    KS = "Kansas"
    KY = "Kentucky"
    LA = "Louisiana"
    ME = "Maine"
    MD = "Maryland"
    MA = "Massachusetts"
    MI = "Michigan"
    MN = "Minnesota"
    MS = "Mississippi"
    MO = "Missouri"
    MT = "Montana"
    NE = "Nebraska"
    NV = "Nevada"
    NH = "New Hampshire"
    NJ = "New Jersey"
    NM = "New Mexico"
    NY = "New York"
    NC = "North Carolina"
    ND = "North Dakota"
    OH = "Ohio"
    OK = "Oklahoma"
    OR = "Oregon"
    PA = "Pennsylvania"
    RI = "Rhode Island"
    SC = "South Carolina"
    SD = "South Dakota"
    TN = "Tennessee"
    TX = "Texas"
    VT = "Vermont"
    VA = "Virginia"
    WA = "Washington"
    WV = "West Virginia"
    WI = "Wisconsin"
    WY = "Wyoming"
    DC = "District of Columbia"
    AS = "American Samoa"
    GU = "Guam"
    MP = "Northern Mariana Islands"
    PR = "Puerto Rico"
    VI = "U.S. Virgin Islands"


class GrantBudgetLineItemDetail(BaseModel):
    """
    Grant Budget Line Item Detail model.
    """

    __tablename__ = "grant_budget_line_item_detail"

    id: Mapped[int] = BaseModel.get_pk_column()

    grants_number: Mapped[Optional[str]] = mapped_column(String)
    grantee_name: Mapped[Optional[str]] = mapped_column(String)
    educational_institution: Mapped[Optional[bool]] = mapped_column(Boolean)
    state_code: Mapped[Optional[StateCode]] = mapped_column(ENUM(StateCode))


class ContractBudgetLineItem(BudgetLineItem):
    """
    Contract Budget Line Item model.
    """

    __tablename__ = "contract_budget_line_item"

    __mapper_args__ = {
        "polymorphic_identity": AgreementType.CONTRACT,
    }
    id: Mapped[int] = mapped_column(ForeignKey("budget_line_item.id"), primary_key=True)

    mod_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("agreement_mod.id"))
    mod: Mapped[Optional["AgreementMod"]] = relationship("AgreementMod")
    psc_fee_doc_number: Mapped[Optional[str]] = mapped_column(String)
    psc_fee_pymt_ref_nbr: Mapped[Optional[str]] = mapped_column(String)
    invoice: Mapped[Optional["Invoice"]] = relationship("Invoice")


class GrantBudgetLineItem(BudgetLineItem):
    """
    Contract Budget Line Item model.
    """

    __tablename__ = "grant_budget_line_item"

    __mapper_args__ = {
        "polymorphic_identity": AgreementType.GRANT,
    }
    id: Mapped[int] = mapped_column(ForeignKey("budget_line_item.id"), primary_key=True)

    details_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("grant_budget_line_item_detail.id"))
    details: Mapped[Optional[GrantBudgetLineItemDetail]] = relationship("GrantBudgetLineItemDetail")
    grant_year_number: Mapped[Optional[int]] = mapped_column(Integer)
    bns_number: Mapped[Optional[str]] = mapped_column(String)
    committed_date: Mapped[Optional[date]] = mapped_column(Date)
    fa_signed_date: Mapped[Optional[date]] = mapped_column(Date)


class DirectObligationBudgetLineItem(BudgetLineItem):
    """
    Direct Obligation Budget Line Item model.
    """

    __tablename__ = "direct_obligation_budget_line_item"

    __mapper_args__ = {
        "polymorphic_identity": AgreementType.DIRECT_OBLIGATION,
    }
    id: Mapped[int] = mapped_column(ForeignKey("budget_line_item.id"), primary_key=True)
    receiving_agency: Mapped[Optional[str]] = mapped_column(String)
    ip_nbr: Mapped[Optional[str]] = mapped_column(String)


class IAABudgetLineItem(BudgetLineItem):
    """
    IAA Budget Line Item model.
    """

    __tablename__ = "iaa_budget_line_item"

    __mapper_args__ = {"polymorphic_identity": AgreementType.IAA}
    id: Mapped[int] = mapped_column(ForeignKey("budget_line_item.id"), primary_key=True)
    ip_nbr: Mapped[Optional[str]] = mapped_column(String)


class AABudgetLineItem(BudgetLineItem):
    """
    AA Budget Line Item model.
    """

    __tablename__ = "aa_budget_line_item"

    __mapper_args__ = {"polymorphic_identity": AgreementType.AA}
    id: Mapped[int] = mapped_column(ForeignKey("budget_line_item.id"), primary_key=True)

    mod_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("agreement_mod.id"))
    mod: Mapped[Optional["AgreementMod"]] = relationship("AgreementMod")
    psc_fee_doc_number: Mapped[Optional[str]] = mapped_column(String)
    psc_fee_pymt_ref_nbr: Mapped[Optional[str]] = mapped_column(String)
    invoice: Mapped[Optional["Invoice"]] = relationship("Invoice")


@event.listens_for(ContractBudgetLineItem, "before_insert")
@event.listens_for(ContractBudgetLineItem, "before_update")
def update_bli_sc_name(mapper, connection, target):
    if target.services_component_id:
        from models import ServicesComponent

        Session = sessionmaker(bind=connection)
        session = Session()

        try:
            sc = session.get(ServicesComponent, target.services_component_id)
            if sc:
                target.service_component_name_for_sort = sc.display_name_for_sort
        finally:
            session.close()
