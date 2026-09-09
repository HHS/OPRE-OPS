"""Add award agreement title, modification #, purchase order #, task order # to Step 6

Adds four fields to Step 6 (Award) of the procurement tracker workflow (OPS-5892):

- award_agreement_title: Proposed agreement title entered during the award request;
  applied to agreement.name on Budget Team approval.
- award_modification_number: Modification # label ("Base" for a new award, otherwise P00001..P00020).
- award_purchase_order_number: Purchase Order # (ODN to the Budget Team).
- award_task_order_number: Task Order #.

Revision ID: c4e7a9b1d2f3
Revises: b8c9d0e1f2a3
Create Date: 2026-09-09 12:00:00.000000+00:00

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "c4e7a9b1d2f3"
down_revision: Union[str, None] = "b8c9d0e1f2a3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add columns to main table
    op.add_column("procurement_tracker_step", sa.Column("award_agreement_title", sa.String(), nullable=True))
    op.add_column(
        "procurement_tracker_step", sa.Column("award_modification_number", sa.String(length=20), nullable=True)
    )
    op.add_column(
        "procurement_tracker_step", sa.Column("award_purchase_order_number", sa.String(length=100), nullable=True)
    )
    op.add_column(
        "procurement_tracker_step", sa.Column("award_task_order_number", sa.String(length=100), nullable=True)
    )

    # Add columns to version table (audit history tracking)
    op.add_column(
        "procurement_tracker_step_version",
        sa.Column("award_agreement_title", sa.String(), autoincrement=False, nullable=True),
    )
    op.add_column(
        "procurement_tracker_step_version",
        sa.Column("award_modification_number", sa.String(length=20), autoincrement=False, nullable=True),
    )
    op.add_column(
        "procurement_tracker_step_version",
        sa.Column("award_purchase_order_number", sa.String(length=100), autoincrement=False, nullable=True),
    )
    op.add_column(
        "procurement_tracker_step_version",
        sa.Column("award_task_order_number", sa.String(length=100), autoincrement=False, nullable=True),
    )


def downgrade() -> None:
    # Drop from version table first
    op.drop_column("procurement_tracker_step_version", "award_task_order_number")
    op.drop_column("procurement_tracker_step_version", "award_purchase_order_number")
    op.drop_column("procurement_tracker_step_version", "award_modification_number")
    op.drop_column("procurement_tracker_step_version", "award_agreement_title")

    # Drop from main table
    op.drop_column("procurement_tracker_step", "award_task_order_number")
    op.drop_column("procurement_tracker_step", "award_purchase_order_number")
    op.drop_column("procurement_tracker_step", "award_modification_number")
    op.drop_column("procurement_tracker_step", "award_agreement_title")
