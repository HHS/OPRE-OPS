"""Workflow models."""

from enum import Enum, auto
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, Index, Integer, String, and_, event, text
from sqlalchemy.dialects.postgresql import ENUM, JSONB
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models import BaseModel

# ---=== CHANGE REQUESTS ===---


class ChangeRequestStatus(Enum):
    IN_REVIEW = auto()
    APPROVED = auto()
    REJECTED = auto()


class ChangeRequestType(Enum):
    CHANGE_REQUEST = auto()
    AGREEMENT_CHANGE_REQUEST = auto()
    BUDGET_LINE_ITEM_CHANGE_REQUEST = auto()
    SERVICES_COMPONENT_CHANGE_REQUEST = auto()


class ChangeRequest(BaseModel):
    __tablename__ = "change_request"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    change_request_type: Mapped[ChangeRequestType] = mapped_column(ENUM(ChangeRequestType), index=True, nullable=False)

    # agreement_type: Mapped[AgreementType] = mapped_column(ENUM(AgreementType))
    status: Mapped[ChangeRequestStatus] = mapped_column(
        ENUM(ChangeRequestStatus), nullable=False, default=ChangeRequestStatus.IN_REVIEW, index=True
    )
    requested_change_data: Mapped[JSONB] = mapped_column(JSONB)
    requested_change_diff: Mapped[Optional[JSONB]] = mapped_column(JSONB)
    requested_change_info: Mapped[Optional[JSONB]] = mapped_column(JSONB)
    # BaseModel.created_by is the requestor, so there's no need for another column for that
    requestor_notes: Mapped[Optional[str]] = mapped_column(String)

    managing_division_id: Mapped[Optional[int]] = mapped_column(ForeignKey("division.id"))
    managing_division = relationship(
        "Division",
        passive_deletes=True,
    )

    reviewed_by_id: Mapped[Optional[int]] = mapped_column(ForeignKey("ops_user.id"))
    reviewed_on: Mapped[Optional[DateTime]] = mapped_column(DateTime)
    reviewer_notes: Mapped[Optional[str]] = mapped_column(String)

    __mapper_args__ = {
        "polymorphic_on": "change_request_type",
        "polymorphic_identity": ChangeRequestType.CHANGE_REQUEST,
    }


class AgreementChangeRequest(ChangeRequest):
    agreement_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("agreement.id", ondelete="CASCADE"),
        index=True,
        nullable=True,
    )
    agreement = relationship(
        "Agreement",
        passive_deletes=True,
    )

    __mapper_args__ = {
        "polymorphic_identity": ChangeRequestType.AGREEMENT_CHANGE_REQUEST,
    }

    proc_shop_field_names = ["awarding_entity_id"]

    @classmethod
    def in_review_filter(cls):
        """Base filter matching AgreementChangeRequest rows currently in review.

        The single source of truth for what "in review" means for this change-request
        type — callers add their own id-matching condition (e.g. ``agreement_id.in_(...)``).
        """
        return and_(
            cls.status == ChangeRequestStatus.IN_REVIEW,
            cls.change_request_type == ChangeRequestType.AGREEMENT_CHANGE_REQUEST,
        )

    @hybrid_property
    def has_proc_shop_change(self):
        return any(key in self.requested_change_data for key in self.proc_shop_field_names)

    @has_proc_shop_change.expression
    def has_proc_shop_change(cls):
        return cls.requested_change_data.has_any(cls.proc_shop_field_names)


class BudgetLineItemChangeRequest(AgreementChangeRequest):
    budget_line_item_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("budget_line_item.id", ondelete="CASCADE"), index=True
    )
    budget_line_item = relationship(
        "BudgetLineItem",
        passive_deletes=True,
    )

    __mapper_args__ = {
        "polymorphic_identity": ChangeRequestType.BUDGET_LINE_ITEM_CHANGE_REQUEST,
    }

    @classmethod
    def in_review_filter(cls):
        """Base filter matching BudgetLineItemChangeRequest rows currently in review.

        The single source of truth for what "in review" means for this change-request
        type — callers add their own id-matching condition (e.g. ``budget_line_item_id.in_(...)``).
        """
        return and_(
            cls.status == ChangeRequestStatus.IN_REVIEW,
            cls.change_request_type == ChangeRequestType.BUDGET_LINE_ITEM_CHANGE_REQUEST,
        )

    budget_field_names = ["amount", "can_id", "date_needed"]

    @hybrid_property
    def has_budget_change(self):
        return any(key in self.requested_change_data for key in self.budget_field_names)

    @has_budget_change.expression
    def has_budget_change(cls):
        return cls.requested_change_data.has_any(cls.budget_field_names)

    @hybrid_property
    def has_status_change(self):
        return "status" in self.requested_change_data

    @has_status_change.expression
    def has_status_change(cls):
        return cls.requested_change_data.has_key("status")

    @hybrid_property
    def has_delete_change(self):
        return "delete" in self.requested_change_data

    @has_delete_change.expression
    def has_delete_change(cls):
        return cls.requested_change_data.has_key("delete")

    @hybrid_property
    def requires_contract_modification(self):
        """True when this budget/delete change request was submitted while its Agreement was
        already Awarded (OPS-3072) -- i.e. per the issue's own framing, "anything that changes
        money or time on the awarded contract." Deliberately agreement-scoped, not
        BLI-status-scoped (see Decision 1 in .claude/stories/3072-modified-loe-edit-budget-line.md).

        Snapshotted into ``requested_change_info`` at creation time rather than derived from
        ``agreement.is_awarded`` on read: a request submitted before the award must keep
        reading False after the agreement is awarded (Decision 2). Requests created before
        the snapshot existed have no key and read False.
        """
        return bool((self.requested_change_info or {}).get("requires_contract_modification"))

    @requires_contract_modification.expression
    def requires_contract_modification(cls):
        return cls.requested_change_info["requires_contract_modification"].as_boolean().is_(True)

    def to_dict(self):
        """Override to_dict to include hybrid properties."""
        data = super().to_dict()
        data["has_budget_change"] = bool(self.has_budget_change)
        data["has_status_change"] = bool(self.has_status_change)
        data["has_delete_change"] = bool(self.has_delete_change)
        data["requires_contract_modification"] = bool(self.requires_contract_modification)
        return data


class ServicesComponentChangeRequest(AgreementChangeRequest):
    """A request to add a Services Component on an Awarded agreement (OPS-6440).

    Only SCs with non-Draft budget lines need approval. ``services_component_id`` is
    ``SET NULL`` so the request keeps its history after a declined add (or a later delete)
    removes the SC; the display name is frozen in ``requested_change_diff``.
    """

    services_component_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("services_component.id", ondelete="SET NULL"), index=True
    )
    services_component = relationship(
        "ServicesComponent",
        passive_deletes=True,
    )

    __mapper_args__ = {
        "polymorphic_identity": ChangeRequestType.SERVICES_COMPONENT_CHANGE_REQUEST,
    }

    @classmethod
    def in_review_filter(cls):
        """Base filter matching ServicesComponentChangeRequest rows currently in review."""
        return and_(
            cls.status == ChangeRequestStatus.IN_REVIEW,
            cls.change_request_type == ChangeRequestType.SERVICES_COMPONENT_CHANGE_REQUEST,
        )

    create_field_name = "services_component_create"

    @hybrid_property
    def has_services_component_change(self):
        return self.create_field_name in self.requested_change_data

    @has_services_component_change.expression
    def has_services_component_change(cls):
        return cls.requested_change_data.has_key(cls.create_field_name)

    @hybrid_property
    def requires_contract_modification(self):
        """Snapshotted at creation, same as BudgetLineItemChangeRequest.requires_contract_modification."""
        return bool((self.requested_change_info or {}).get("requires_contract_modification"))

    @requires_contract_modification.expression
    def requires_contract_modification(cls):
        return cls.requested_change_info["requires_contract_modification"].as_boolean().is_(True)

    def to_dict(self):
        """Override to_dict to include hybrid properties."""
        data = super().to_dict()
        data["has_services_component_change"] = bool(self.has_services_component_change)
        data["requires_contract_modification"] = bool(self.requires_contract_modification)
        return data


# At most one SC change request in review per SC, so parallel requests can't create a duplicate
# (an in-review SC can't be edited or deleted).
Index(
    "ix_change_request_one_in_review_per_services_component",
    ServicesComponentChangeRequest.__table__.c.services_component_id,
    unique=True,
    postgresql_where=text("status = 'IN_REVIEW' AND change_request_type = 'SERVICES_COMPONENT_CHANGE_REQUEST'"),
)


# require agreement_id for Agreement changes.
# (It has to be Optional in the model to keep the column nullable for other types)
@event.listens_for(AgreementChangeRequest, "before_insert")
@event.listens_for(AgreementChangeRequest, "before_update")
@event.listens_for(BudgetLineItemChangeRequest, "before_insert")
@event.listens_for(BudgetLineItemChangeRequest, "before_update")
@event.listens_for(ServicesComponentChangeRequest, "before_insert")
@event.listens_for(ServicesComponentChangeRequest, "before_update")
def check_agreement_id(mapper, connection, target):
    if target.agreement_id is None:
        raise ValueError("agreement_id is required for AgreementChangeRequest")


# require budget_line_item_id for BLI changes.
# (It has to be Optional in the model to keep the column nullable for other types)
@event.listens_for(BudgetLineItemChangeRequest, "before_insert")
@event.listens_for(BudgetLineItemChangeRequest, "before_update")
def check_budget_line_id(mapper, connection, target):
    if target.budget_line_item_id is None:
        raise ValueError("budget_line_item_id is required for BudgetLineItemChangeRequest")


# require services_component_id when an SC change request is created.
# (It's SET NULL afterwards, when a declined add or a later delete removes the SC.)
@event.listens_for(ServicesComponentChangeRequest, "before_insert")
def check_services_component_id(mapper, connection, target):
    if target.services_component_id is None:
        raise ValueError("services_component_id is required for ServicesComponentChangeRequest")
