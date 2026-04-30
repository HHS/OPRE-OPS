"""Add pre_award requisition fields for budget team approval

Adds four new fields to support budget team requisition approval workflow (OPS-1639):
- pre_award_requisition_number: Requisition number entered by budget team
- pre_award_requisition_date: Date of requisition
- pre_award_requisition_approved_by: FK to user who approved requisition
- pre_award_requisition_approved_date: Date of requisition approval

Revision ID: b9c8d7e6f5a4
Revises: f1a2b3c4d5e6
Create Date: 2026-04-30 15:43:00.000000+00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b9c8d7e6f5a4'
down_revision: Union[str, None] = 'f1a2b3c4d5e6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add columns to main table
    op.add_column('procurement_tracker_step',
                  sa.Column('pre_award_requisition_number', sa.String(100), nullable=True))
    op.add_column('procurement_tracker_step',
                  sa.Column('pre_award_requisition_date', sa.Date(), nullable=True))
    op.add_column('procurement_tracker_step',
                  sa.Column('pre_award_requisition_approved_by', sa.Integer(), nullable=True))
    op.add_column('procurement_tracker_step',
                  sa.Column('pre_award_requisition_approved_date', sa.Date(), nullable=True))

    # Create foreign key constraint
    op.create_foreign_key(
        'fk_procurement_tracker_step_requisition_approved_by',
        'procurement_tracker_step',
        'ops_user',
        ['pre_award_requisition_approved_by'],
        ['id']
    )

    # Add columns to version table (audit history)
    op.add_column('procurement_tracker_step_version',
                  sa.Column('pre_award_requisition_number', sa.String(100),
                            autoincrement=False, nullable=True))
    op.add_column('procurement_tracker_step_version',
                  sa.Column('pre_award_requisition_date', sa.Date(),
                            autoincrement=False, nullable=True))
    op.add_column('procurement_tracker_step_version',
                  sa.Column('pre_award_requisition_approved_by', sa.Integer(),
                            autoincrement=False, nullable=True))
    op.add_column('procurement_tracker_step_version',
                  sa.Column('pre_award_requisition_approved_date', sa.Date(),
                            autoincrement=False, nullable=True))


def downgrade() -> None:
    # Drop from version table first
    op.drop_column('procurement_tracker_step_version', 'pre_award_requisition_approved_date')
    op.drop_column('procurement_tracker_step_version', 'pre_award_requisition_approved_by')
    op.drop_column('procurement_tracker_step_version', 'pre_award_requisition_date')
    op.drop_column('procurement_tracker_step_version', 'pre_award_requisition_number')

    # Drop foreign key constraint
    op.drop_constraint('fk_procurement_tracker_step_requisition_approved_by',
                       'procurement_tracker_step', type_='foreignkey')

    # Drop from main table
    op.drop_column('procurement_tracker_step', 'pre_award_requisition_approved_date')
    op.drop_column('procurement_tracker_step', 'pre_award_requisition_approved_by')
    op.drop_column('procurement_tracker_step', 'pre_award_requisition_date')
    op.drop_column('procurement_tracker_step', 'pre_award_requisition_number')
