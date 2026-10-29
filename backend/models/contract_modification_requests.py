"""A user's request to start a Contract Modification on an Awarded agreement (#3268)."""

from datetime import datetime
from enum import Enum, auto
from typing import Optional

from sqlalchemy import Column, DateTime, ForeignKey, Index, String, Table, text
from sqlalchemy.dialects.postgresql import ENUM
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import BaseModel


class ContractModificationRequestStatus(Enum):
    IN_REVIEW = auto()
    APPROVED = auto()
    DECLINED = auto()


contract_modification_request_edits = Table(
    "contract_mod_request_edits",
    BaseModel.metadata,
    Column(
        "contract_modification_request_id",
        ForeignKey("contract_modification_request.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "contract_modification_edit_id",
        ForeignKey("contract_modification_edit.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)

contract_modification_request_budget_line_items = Table(
    "contract_mod_request_budget_lines",
    BaseModel.metadata,
    Column(
        "contract_modification_request_id",
        ForeignKey("contract_modification_request.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "budget_line_item_id",
        ForeignKey("budget_line_item.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)

class ContractModificationRequest(BaseModel):
    """A Contract Modification sent to the Division Director for approval.

    Bundles the agreement's pending ``ContractModificationEdit`` rows with any Planned budget
    lines the user chose to execute. While IN_REVIEW the edits stay pending
    (``agreement_mod_id IS NULL``) and show as In Review on the Award & Modifications tab.
    Approval creates the ``AgreementMod``, attaches the edits to it, and moves the selected
    budget lines to Executing; a decline leaves the edits pending so the user can start again.

    Kept separate from ``ChangeRequest`` on purpose: an ``AgreementChangeRequest`` subtype would
    lock the whole agreement via ``Agreement.change_requests_in_review``.
    """

    __tablename__ = "contract_modification_request"

    id: Mapped[int] = BaseModel.get_pk_column()
    agreement_id: Mapped[int] = mapped_column(
        ForeignKey("agreement.id", ondelete="CASCADE"), index=True, nullable=False
    )
    agreement = relationship("Agreement", passive_deletes=True)

    status: Mapped[ContractModificationRequestStatus] = mapped_column(
        ENUM(ContractModificationRequestStatus),
        default=ContractModificationRequestStatus.IN_REVIEW,
        nullable=False,
    )

    requestor_notes: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    reviewed_by_id: Mapped[Optional[int]] = mapped_column(ForeignKey("ops_user.id"), nullable=True)
    reviewed_by = relationship("User", foreign_keys=[reviewed_by_id])
    reviewed_on: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    reviewer_notes: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    # Set on approval.
    agreement_mod_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("agreement_mod.id", ondelete="SET NULL"), nullable=True
    )
    agreement_mod = relationship("AgreementMod")

    edits = relationship("ContractModificationEdit", secondary=contract_modification_request_edits)
    budget_line_items = relationship("BudgetLineItem", secondary=contract_modification_request_budget_line_items)

    __table_args__ = (
        # Only one contract modification per agreement can be in review at a time.
        Index(
            "uq_contract_modification_request_one_in_review",
            "agreement_id",
            unique=True,
            postgresql_where=text("status = 'IN_REVIEW'"),
        ),
    )

    @BaseModel.display_name.getter
    def display_name(self):
        return f"Contract Modification Request #{self.id}"
