"""Edits made in OPS on an Awarded agreement that still require a Contract Modification."""

from datetime import datetime
from enum import Enum, auto
from typing import Any, Optional

from sqlalchemy import DateTime, ForeignKey, Index, Integer, String, text
from sqlalchemy.dialects.postgresql import ENUM, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import BaseModel


class ModificationEditType(Enum):
    MODIFIED_LOE = auto()
    # An administrative change, e.g. a COR change (OPS-3153). Recorded on save, with no
    # change request, and applied to the agreement once the contract modification is approved.
    ADMIN_CHANGE = auto()


# The field an ADMIN_CHANGE row records for a COR change (OPS-3153).
PROJECT_OFFICER_EDIT_FIELD = "project_officer_id"


class ContractModificationEdit(BaseModel):
    """One approved edit on an Awarded agreement, listed on the Award & Modifications tab
    under "Edits That Require a Contract Modification" (OPS-3072, AC9).

    A MODIFIED_LOE row is written when a Division Director approves a change request whose
    ``requires_contract_modification`` snapshot is true. That edit has already been applied in
    OPS; the row tracks that the actual contract still needs a modification.

    An ADMIN_CHANGE row (a COR change, OPS-3153) is written when the user saves the change,
    with no change request and no approval. The change is *not* applied in OPS yet: the COR
    keeps its current value until the contract modification is approved (#3269).

    Either way the row stays pending (``agreement_mod_id IS NULL``) until a modification takes it.

    Display values are snapshotted from the change request so the row survives the change
    request and the budget line being deleted (an approved delete-BL request removes both):
    ``change_request_id`` is ``SET NULL``, and ``budget_line_item_id`` and
    ``services_component_id`` deliberately have no FK.
    """

    __tablename__ = "contract_modification_edit"

    id: Mapped[int] = BaseModel.get_pk_column()
    agreement_id: Mapped[int] = mapped_column(
        ForeignKey("agreement.id", ondelete="CASCADE"), index=True, nullable=False
    )
    agreement = relationship("Agreement", passive_deletes=True)

    modification_type: Mapped[ModificationEditType] = mapped_column(ENUM(ModificationEditType), nullable=False)

    change_request_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("change_request.id", ondelete="SET NULL"), nullable=True
    )
    budget_line_item_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    # Set for Services Component add rows (OPS-6440). No FK, so the row survives the SC's deletion.
    services_component_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    field: Mapped[str] = mapped_column(String, nullable=False)
    old_value: Mapped[Optional[Any]] = mapped_column(JSONB, nullable=True)
    new_value: Mapped[Optional[Any]] = mapped_column(JSONB, nullable=True)

    # The original requestor, not this row's created_by (which is the approving Division Director).
    requested_by_id: Mapped[Optional[int]] = mapped_column(ForeignKey("ops_user.id"), nullable=True)
    requested_by = relationship("User", foreign_keys=[requested_by_id])
    requested_on: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    approved_by_id: Mapped[Optional[int]] = mapped_column(ForeignKey("ops_user.id"), nullable=True)
    approved_on: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # NULL = pending (shown on the list); set when the user starts the contract modification.
    agreement_mod_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("agreement_mod.id", ondelete="SET NULL"), index=True, nullable=True
    )
    agreement_mod = relationship("AgreementMod")


# At most one pending COR change per agreement: a new target replaces the pending row (OPS-3153),
# and this guards a double-submitted save from creating two.
Index(
    "ix_contract_modification_edit_one_pending_cor_change",
    ContractModificationEdit.__table__.c.agreement_id,
    unique=True,
    postgresql_where=text(
        "modification_type = 'ADMIN_CHANGE' AND field = 'project_officer_id' AND agreement_mod_id IS NULL"
    ),
)

# At most one pending direct edit per (budget line, field): guards a double-click/retry on a
# direct-apply edit (OPS-3268) from inserting two pending rows for the same field, one of which
# would otherwise be silently orphaned (see record_direct_edit).
Index(
    "ix_contract_modification_edit_one_pending_bli_field",
    ContractModificationEdit.__table__.c.budget_line_item_id,
    ContractModificationEdit.__table__.c.field,
    unique=True,
    postgresql_where=text("agreement_mod_id IS NULL AND budget_line_item_id IS NOT NULL"),
)
