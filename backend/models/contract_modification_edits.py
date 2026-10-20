"""Edits made in OPS on an Awarded agreement that still require a Contract Modification."""

from datetime import datetime
from enum import Enum, auto
from typing import Any, Optional

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import ENUM, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import BaseModel


class ModificationEditType(Enum):
    MODIFIED_LOE = auto()


class ContractModificationEdit(BaseModel):
    """One approved edit on an Awarded agreement, listed on the Award & Modifications tab
    under "Edits That Require a Contract Modification" (OPS-3072, AC9).

    Written when a Division Director approves a change request whose
    ``requires_contract_modification`` snapshot is true. The edit itself has already been
    applied in OPS; this row tracks that the actual contract still needs a modification.
    It stays pending (``agreement_mod_id IS NULL``) until the user starts the modification.

    Display values are snapshotted from the change request so the row survives the change
    request and the budget line being deleted (an approved delete-BL request removes both):
    ``change_request_id`` is ``SET NULL`` and ``budget_line_item_id`` deliberately has no FK.
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
