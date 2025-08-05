"""BudgetLineItem models."""

import decimal
from datetime import date
from enum import Enum
from typing import Optional

from sqlalchemy import (
    Boolean,
    Date,
    ForeignKey,
    Integer,
    Numeric,
    Sequence,
    String,
    Text,
    and_,
    case,
    event,
    extract,
    or_,
    select,
    text,
)
from sqlalchemy.dialects.postgresql import ENUM
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import Mapped, mapped_column, object_session, relationship
from typing_extensions import Any, override

# from backend.ops_api.ops.schemas import services_component
from models import CAN, Agreement, AgreementType
from models.base import BaseModel
from models.change_requests import (
    AgreementChangeRequest,
    BudgetLineItemChangeRequest,
    ChangeRequest,
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
    SERVICE_COMPONENT = "SERVICE_COMPONENT"
    OBLIGATE_BY = "OBLIGATE_BY"
    FISCAL_YEAR = "FISCAL_YEAR"
    CAN_NUMBER = "CAN_NUMBER"
    TOTAL = "TOTAL"
    FEE = "FEE"
    STATUS = "STATUS"


class BudgetLineItem(BaseModel):
    """
    Budget Line Item model.
    """

    __tablename__ = "budget_line_item"

    id: Mapped[int] = BaseModel.get_pk_column(
        sequence=Sequence("budget_line_item_id_seq", start=15000, increment=1)
    )
    budget_line_item_type: Mapped[AgreementType] = mapped_column(
        ENUM(AgreementType), default=AgreementType.CONTRACT
    )

    service_component_name_for_sort: Mapped[Optional[str]] = mapped_column(String)

    line_description: Mapped[Optional[str]] = mapped_column(String)
    comments: Mapped[Optional[str]] = mapped_column(Text)

    agreement_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("agreement.id")
    )
    agreement: Mapped[Optional["Agreement"]] = relationship(
        "Agreement", back_populates="budget_line_items"
    )

    can_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("can.id"))
    can: Mapped[Optional[CAN]] = relationship(CAN, back_populates="budget_line_items")

    amount: Mapped[Optional[decimal]] = mapped_column(Numeric(12, 2))

    status: Mapped[Optional[BudgetLineItemStatus]] = mapped_column(
        ENUM(BudgetLineItemStatus)
    )
    is_obe: Mapped[Optional[bool]] = mapped_column(Boolean, default=False)
    on_hold: Mapped[bool] = mapped_column(Boolean, default=False)
    certified: Mapped[bool] = mapped_column(Boolean, default=False)

    closed: Mapped[bool] = mapped_column(Boolean, default=False)
    closed_by: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("ops_user.id"))
    closed_by_user: Mapped[Optional["User"]] = relationship(
        "User", foreign_keys=[closed_by]
    )
    closed_date: Mapped[Optional[date]] = mapped_column(Date)

    is_under_current_resolution: Mapped[Optional[bool]] = mapped_column(
        Boolean, default=False
    )

    date_needed: Mapped[Optional[date]] = mapped_column(Date)
    extend_pop_to: Mapped[Optional[date]] = mapped_column(Date)
    start_date: Mapped[Optional[date]] = mapped_column(Date)
    end_date: Mapped[Optional[date]] = mapped_column(Date)

    requisition: Mapped[Optional["Requisition"]] = relationship("Requisition")
    object_class_code_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("object_class_code.id")
    )
    object_class_code: Mapped[Optional["ObjectClassCode"]] = relationship(
        "ObjectClassCode"
    )
    doc_received: Mapped[Optional[bool]] = mapped_column(Boolean, default=False)
    obligation_date: Mapped[Optional[date]] = mapped_column(Date)

    # deprecated: we should be using procurement shop fee
    proc_shop_fee_percentage: Mapped[Optional[decimal]] = mapped_column(Numeric(12, 5))

    procurement_shop_fee_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("procurement_shop_fee.id")
    )
    procurement_shop_fee: Mapped[Optional["ProcurementShopFee"]] = relationship(
        "ProcurementShopFee", back_populates="budget_line_items"
    )

    __mapper_args__: dict[str, str | AgreementType] = {
        "polymorphic_identity": "budget_line_item",
        "polymorphic_on": "budget_line_item_type",
    }

    @BaseModel.display_name.getter
    def display_name(self):
        return f"BL {self.id}"

    @hybrid_property
    def fees(self):
        return (
            self.proc_shop_fee_percentage * self.amount
            if self.proc_shop_fee_percentage and self.amount
            else 0
        )

    @fees.expression
    def fees(cls):
        # This provides the SQL expression equivalent
        return case(
            (
                and_(cls.proc_shop_fee_percentage.isnot(None), cls.amount.isnot(None)),
                (cls.proc_shop_fee_percentage * cls.amount),
            ),
            else_=0,
        )

    @hybrid_property
    def total(self):
        return self.amount + self.fees

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

        agreement_id = self.agreement_id if hasattr(self, 'agreement_id') else None

        bli_stmt = select(BudgetLineItemChangeRequest).where(
            BudgetLineItemChangeRequest.status == ChangeRequestStatus.IN_REVIEW,
            BudgetLineItemChangeRequest.change_request_type == ChangeRequestType.BUDGET_LINE_ITEM_CHANGE_REQUEST,
            BudgetLineItemChangeRequest.budget_line_item_id == self.id,
        )

        agreement_stmt = select(AgreementChangeRequest).where(
            AgreementChangeRequest.status == ChangeRequestStatus.IN_REVIEW,
            AgreementChangeRequest.change_request_type == ChangeRequestType.AGREEMENT_CHANGE_REQUEST,
            AgreementChangeRequest.agreement_id == agreement_id,
            # ~AgreementChangeRequest.id.in_(
            #     select(BudgetLineItemChangeRequest.id).where(
            #         BudgetLineItemChangeRequest.budget_line_item_id == self.id
            #     )
            # ),
        ) if agreement_id else None

        results = session.execute(bli_stmt).all()

        if agreement_stmt is not None:
            agreement_stmt_results = session.execute(agreement_stmt).all()
            results.extend(agreement_stmt_results)

        change_requests = [row[0] for row in results] if results else None
        return change_requests

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


class Invoice(BaseModel):
    """Invoice model."""

    __tablename__ = "invoice"

    id: Mapped[int] = BaseModel.get_pk_column()
    budget_line_item_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("budget_line_item.id")
    )
    invoice_line_number: Mapped[Optional[int]] = mapped_column(Integer)


class Requisition(BaseModel):
    """Requisition model."""

    __tablename__ = "requisition"

    id: Mapped[int] = BaseModel.get_pk_column()
    budget_line_item_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("budget_line_item.id")
    )
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

    services_component_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("services_component.id")
    )
    services_component: Mapped[Optional["ServicesComponent"]] = relationship(
        "ServicesComponent", backref="budget_line_items"
    )

    clin_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("clin.id"))
    clin: Mapped[Optional["CLIN"]] = relationship("CLIN", backref="budget_line_items")
    mod_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("agreement_mod.id")
    )
    mod: Mapped[Optional["AgreementMod"]] = relationship("AgreementMod")
    psc_fee_doc_number: Mapped[Optional[str]] = mapped_column(String)
    psc_fee_pymt_ref_nbr: Mapped[Optional[str]] = mapped_column(String)
    invoice: Mapped[Optional["Invoice"]] = relationship("Invoice")
    # proc_shop_fee_percentage: Mapped[Optional[decimal]] = mapped_column(
    #     Numeric(12, 5)
    # )  # may need to be a different object, i.e. flat rate or percentage


class GrantBudgetLineItem(BudgetLineItem):
    """
    Contract Budget Line Item model.
    """

    __tablename__ = "grant_budget_line_item"

    __mapper_args__ = {
        "polymorphic_identity": AgreementType.GRANT,
    }
    id: Mapped[int] = mapped_column(ForeignKey("budget_line_item.id"), primary_key=True)

    details_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("grant_budget_line_item_detail.id")
    )
    details: Mapped[Optional[GrantBudgetLineItemDetail]] = relationship(
        "GrantBudgetLineItemDetail"
    )
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


@event.listens_for(ContractBudgetLineItem, "before_insert")
@event.listens_for(ContractBudgetLineItem, "before_update")
def update_bli_sc_name(mapper, connection, target):
    if target.services_component_id:
        from models import ServicesComponent

        result = connection.execute(
            select(ServicesComponent.display_name_for_sort).where(
                ServicesComponent.id == target.services_component_id
            )
        )
        for display_name_tuple in result:
            display_name = display_name_tuple[0]
            target.service_component_name_for_sort = display_name
