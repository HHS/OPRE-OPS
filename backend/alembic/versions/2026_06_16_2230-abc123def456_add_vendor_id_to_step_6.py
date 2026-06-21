"""Add vendor_id FK and award contract/amount/date to Step 6

Adds vendor information and award contract details to Step 6 (Award) of the procurement
tracker workflow. This complements the approval workflow fields added in 318743cad509.

New fields:
- award_vendor_id: FK to vendor table (replaces text-based vendor field)
- award_contract_number: Contract number from signed award
- award_amount: Total award amount
- award_date: Award signature date

Revision ID: abc123def456
Revises: merge_heads_001
Create Date: 2026-06-16 22:30:00.000000+00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'abc123def456'
down_revision: Union[str, None] = 'merge_heads_001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add vendor FK to main table
    op.add_column('procurement_tracker_step',
                  sa.Column('award_vendor_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_award_vendor_id', 'procurement_tracker_step', 'vendor',
                         ['award_vendor_id'], ['id'], ondelete='SET NULL')

    # Add award information columns to main table
    op.add_column('procurement_tracker_step',
                  sa.Column('award_contract_number', sa.String(length=100), nullable=True))
    op.add_column('procurement_tracker_step',
                  sa.Column('award_amount', sa.Numeric(precision=12, scale=2), nullable=True))
    op.add_column('procurement_tracker_step',
                  sa.Column('award_date', sa.Date(), nullable=True))

    # Add columns to version table (audit history tracking)
    op.add_column('procurement_tracker_step_version',
                  sa.Column('award_vendor_id', sa.Integer(), autoincrement=False, nullable=True))
    op.add_column('procurement_tracker_step_version',
                  sa.Column('award_contract_number', sa.String(length=100), autoincrement=False, nullable=True))
    op.add_column('procurement_tracker_step_version',
                  sa.Column('award_amount', sa.Numeric(precision=12, scale=2), autoincrement=False, nullable=True))
    op.add_column('procurement_tracker_step_version',
                  sa.Column('award_date', sa.Date(), autoincrement=False, nullable=True))


def downgrade() -> None:
    # Drop from version table first
    op.drop_column('procurement_tracker_step_version', 'award_date')
    op.drop_column('procurement_tracker_step_version', 'award_amount')
    op.drop_column('procurement_tracker_step_version', 'award_contract_number')
    op.drop_column('procurement_tracker_step_version', 'award_vendor_id')

    # Remove award information columns from main table
    op.drop_column('procurement_tracker_step', 'award_date')
    op.drop_column('procurement_tracker_step', 'award_amount')
    op.drop_column('procurement_tracker_step', 'award_contract_number')

    # Remove vendor FK from main table
    op.drop_constraint('fk_award_vendor_id', 'procurement_tracker_step', type_='foreignkey')
    op.drop_column('procurement_tracker_step', 'award_vendor_id')
