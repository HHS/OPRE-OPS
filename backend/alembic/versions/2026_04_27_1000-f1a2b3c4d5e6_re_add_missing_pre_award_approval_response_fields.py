"""Re-add missing pre_award approval response fields to procurement tracker step

The original migration d6e7f8a9b0c1 was marked as applied in production
but the DDL never executed, leaving 4 columns missing from the
procurement_tracker_step table. This migration is idempotent — it skips
columns that already exist (dev/staging) and adds them where missing (prod).

Revision ID: f1a2b3c4d5e6
Revises: ae2ee26e19d5
Create Date: 2026-04-27 10:00:00.000000+00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f1a2b3c4d5e6'
down_revision: Union[str, None] = 'ae2ee26e19d5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _column_exists(table: str, column: str) -> bool:
    conn = op.get_bind()
    result = conn.execute(
        sa.text(
            "SELECT 1 FROM information_schema.columns "
            "WHERE table_name = :table AND column_name = :column"
        ),
        {"table": table, "column": column},
    )
    return result.scalar() is not None


def upgrade() -> None:
    # procurement_tracker_step columns
    if not _column_exists("procurement_tracker_step", "pre_award_approval_status"):
        op.add_column('procurement_tracker_step', sa.Column('pre_award_approval_status', sa.String(length=20), nullable=True))
    if not _column_exists("procurement_tracker_step", "pre_award_approval_responded_by"):
        op.add_column('procurement_tracker_step', sa.Column('pre_award_approval_responded_by', sa.Integer(), nullable=True))
        op.create_foreign_key(
            'fk_pre_award_responded_by',
            'procurement_tracker_step', 'ops_user',
            ['pre_award_approval_responded_by'], ['id']
        )
    if not _column_exists("procurement_tracker_step", "pre_award_approval_responded_date"):
        op.add_column('procurement_tracker_step', sa.Column('pre_award_approval_responded_date', sa.Date(), nullable=True))
    if not _column_exists("procurement_tracker_step", "pre_award_approval_reviewer_notes"):
        op.add_column('procurement_tracker_step', sa.Column('pre_award_approval_reviewer_notes', sa.Text(), nullable=True))

    # procurement_tracker_step_version columns
    if not _column_exists("procurement_tracker_step_version", "pre_award_approval_status"):
        op.add_column('procurement_tracker_step_version', sa.Column('pre_award_approval_status', sa.String(length=20), autoincrement=False, nullable=True))
    if not _column_exists("procurement_tracker_step_version", "pre_award_approval_responded_by"):
        op.add_column('procurement_tracker_step_version', sa.Column('pre_award_approval_responded_by', sa.Integer(), autoincrement=False, nullable=True))
    if not _column_exists("procurement_tracker_step_version", "pre_award_approval_responded_date"):
        op.add_column('procurement_tracker_step_version', sa.Column('pre_award_approval_responded_date', sa.Date(), autoincrement=False, nullable=True))
    if not _column_exists("procurement_tracker_step_version", "pre_award_approval_reviewer_notes"):
        op.add_column('procurement_tracker_step_version', sa.Column('pre_award_approval_reviewer_notes', sa.Text(), autoincrement=False, nullable=True))


def downgrade() -> None:
    # This is a repair migration whose upgrade() is intentionally idempotent:
    # in some environments these columns/constraints already existed from the
    # earlier migration history, and this revision simply backfills missing DDL
    # where needed. Dropping them here would be destructive on rollback because
    # it could remove schema objects that pre-dated this revision.
    #
    # Keep downgrade non-destructive so rolling back this repair revision does
    # not leave dev/staging environments inconsistent with earlier applied
    # revisions.
    pass
