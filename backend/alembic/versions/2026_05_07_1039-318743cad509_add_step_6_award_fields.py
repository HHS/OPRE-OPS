"""Add step 6 award fields to procurement tracker

Adds fields for Step 6 (Award) of the procurement tracker workflow (OPS-1640):

Standard step completion fields:
- award_target_completion_date: Target date for receiving signed award
- award_task_completed_by: FK to user who completed the step
- award_date_completed: Date when step was completed
- award_notes: Optional notes (Text field, unlimited length)

Award approval request fields (requester side):
- award_approval_requested: Boolean flag indicating approval was requested
- award_approval_requested_date: Date when approval was requested
- award_approval_requested_by: FK to user who requested approval
- award_requestor_notes: Notes from requester (Text field, unlimited length)

Award approval response fields (reviewer side - out of scope for OPS-1640):
- award_approval_status: Status enum (PENDING, REQUESTED, APPROVED, DECLINED, CANCELLED)
- award_approval_responded_by: FK to user who responded to approval request
- award_approval_responded_date: Date when approval was responded to
- award_approval_reviewer_notes: Notes from reviewer (Text field, unlimited length)

Revision ID: 318743cad509
Revises: b9c8d7e6f5a4
Create Date: 2026-05-07 10:39:00.000000+00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '318743cad509'
down_revision: Union[str, None] = 'b9c8d7e6f5a4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add standard step completion columns
    op.add_column('procurement_tracker_step',
                  sa.Column('award_target_completion_date', sa.Date(), nullable=True))
    op.add_column('procurement_tracker_step',
                  sa.Column('award_task_completed_by', sa.Integer(), nullable=True))
    op.add_column('procurement_tracker_step',
                  sa.Column('award_date_completed', sa.Date(), nullable=True))
    op.add_column('procurement_tracker_step',
                  sa.Column('award_notes', sa.Text(), nullable=True))

    # Add approval request columns (requester side)
    op.add_column('procurement_tracker_step',
                  sa.Column('award_approval_requested', sa.Boolean(), nullable=True))
    op.add_column('procurement_tracker_step',
                  sa.Column('award_approval_requested_date', sa.Date(), nullable=True))
    op.add_column('procurement_tracker_step',
                  sa.Column('award_approval_requested_by', sa.Integer(), nullable=True))
    op.add_column('procurement_tracker_step',
                  sa.Column('award_requestor_notes', sa.Text(), nullable=True))

    # Add approval response columns (reviewer side - out of scope for now)
    op.add_column('procurement_tracker_step',
                  sa.Column('award_approval_status', sa.String(20), nullable=True))
    op.add_column('procurement_tracker_step',
                  sa.Column('award_approval_responded_by', sa.Integer(), nullable=True))
    op.add_column('procurement_tracker_step',
                  sa.Column('award_approval_responded_date', sa.Date(), nullable=True))
    op.add_column('procurement_tracker_step',
                  sa.Column('award_approval_reviewer_notes', sa.Text(), nullable=True))

    # Create foreign key constraints for user references
    op.create_foreign_key(
        'fk_procurement_tracker_step_award_completed_by',
        'procurement_tracker_step',
        'ops_user',
        ['award_task_completed_by'],
        ['id'],
        ondelete='SET NULL'
    )

    op.create_foreign_key(
        'fk_procurement_tracker_step_award_approval_requested_by',
        'procurement_tracker_step',
        'ops_user',
        ['award_approval_requested_by'],
        ['id'],
        ondelete='SET NULL'
    )

    op.create_foreign_key(
        'fk_procurement_tracker_step_award_approval_responded_by',
        'procurement_tracker_step',
        'ops_user',
        ['award_approval_responded_by'],
        ['id'],
        ondelete='SET NULL'
    )

    # Add columns to version table (audit history tracking)
    op.add_column('procurement_tracker_step_version',
                  sa.Column('award_target_completion_date', sa.Date(),
                            autoincrement=False, nullable=True))
    op.add_column('procurement_tracker_step_version',
                  sa.Column('award_task_completed_by', sa.Integer(),
                            autoincrement=False, nullable=True))
    op.add_column('procurement_tracker_step_version',
                  sa.Column('award_date_completed', sa.Date(),
                            autoincrement=False, nullable=True))
    op.add_column('procurement_tracker_step_version',
                  sa.Column('award_notes', sa.Text(),
                            autoincrement=False, nullable=True))

    op.add_column('procurement_tracker_step_version',
                  sa.Column('award_approval_requested', sa.Boolean(),
                            autoincrement=False, nullable=True))
    op.add_column('procurement_tracker_step_version',
                  sa.Column('award_approval_requested_date', sa.Date(),
                            autoincrement=False, nullable=True))
    op.add_column('procurement_tracker_step_version',
                  sa.Column('award_approval_requested_by', sa.Integer(),
                            autoincrement=False, nullable=True))
    op.add_column('procurement_tracker_step_version',
                  sa.Column('award_requestor_notes', sa.Text(),
                            autoincrement=False, nullable=True))

    op.add_column('procurement_tracker_step_version',
                  sa.Column('award_approval_status', sa.String(20),
                            autoincrement=False, nullable=True))
    op.add_column('procurement_tracker_step_version',
                  sa.Column('award_approval_responded_by', sa.Integer(),
                            autoincrement=False, nullable=True))
    op.add_column('procurement_tracker_step_version',
                  sa.Column('award_approval_responded_date', sa.Date(),
                            autoincrement=False, nullable=True))
    op.add_column('procurement_tracker_step_version',
                  sa.Column('award_approval_reviewer_notes', sa.Text(),
                            autoincrement=False, nullable=True))


def downgrade() -> None:
    # Drop from version table first
    op.drop_column('procurement_tracker_step_version', 'award_approval_reviewer_notes')
    op.drop_column('procurement_tracker_step_version', 'award_approval_responded_date')
    op.drop_column('procurement_tracker_step_version', 'award_approval_responded_by')
    op.drop_column('procurement_tracker_step_version', 'award_approval_status')
    op.drop_column('procurement_tracker_step_version', 'award_requestor_notes')
    op.drop_column('procurement_tracker_step_version', 'award_approval_requested_by')
    op.drop_column('procurement_tracker_step_version', 'award_approval_requested_date')
    op.drop_column('procurement_tracker_step_version', 'award_approval_requested')
    op.drop_column('procurement_tracker_step_version', 'award_notes')
    op.drop_column('procurement_tracker_step_version', 'award_date_completed')
    op.drop_column('procurement_tracker_step_version', 'award_task_completed_by')
    op.drop_column('procurement_tracker_step_version', 'award_target_completion_date')

    # Drop foreign key constraints
    op.drop_constraint('fk_procurement_tracker_step_award_approval_responded_by',
                       'procurement_tracker_step', type_='foreignkey')
    op.drop_constraint('fk_procurement_tracker_step_award_approval_requested_by',
                       'procurement_tracker_step', type_='foreignkey')
    op.drop_constraint('fk_procurement_tracker_step_award_completed_by',
                       'procurement_tracker_step', type_='foreignkey')

    # Drop from main table
    op.drop_column('procurement_tracker_step', 'award_approval_reviewer_notes')
    op.drop_column('procurement_tracker_step', 'award_approval_responded_date')
    op.drop_column('procurement_tracker_step', 'award_approval_responded_by')
    op.drop_column('procurement_tracker_step', 'award_approval_status')
    op.drop_column('procurement_tracker_step', 'award_requestor_notes')
    op.drop_column('procurement_tracker_step', 'award_approval_requested_by')
    op.drop_column('procurement_tracker_step', 'award_approval_requested_date')
    op.drop_column('procurement_tracker_step', 'award_approval_requested')
    op.drop_column('procurement_tracker_step', 'award_notes')
    op.drop_column('procurement_tracker_step', 'award_date_completed')
    op.drop_column('procurement_tracker_step', 'award_task_completed_by')
    op.drop_column('procurement_tracker_step', 'award_target_completion_date')
