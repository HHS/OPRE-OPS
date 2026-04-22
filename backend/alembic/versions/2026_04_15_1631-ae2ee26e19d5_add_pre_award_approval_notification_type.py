"""add pre award approval notification type

Revision ID: ae2ee26e19d5
Revises: c47768234303
Create Date: 2026-04-15 16:31:00.000000+00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ae2ee26e19d5'
down_revision: Union[str, None] = 'c47768234303'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add new notification type enum value
    op.execute("ALTER TYPE notificationtype ADD VALUE IF NOT EXISTS 'PRE_AWARD_APPROVAL_NOTIFICATION'")

    # Add procurement_tracker_step_id column to notification table
    op.add_column(
        'notification',
        sa.Column('procurement_tracker_step_id', sa.Integer(), nullable=True)
    )
    op.create_foreign_key(
        'fk_notification_procurement_tracker_step_id',
        'notification', 'procurement_tracker_step',
        ['procurement_tracker_step_id'], ['id'],
        ondelete='CASCADE'
    )
    # Create single-column index (matches pattern from change_request_id)
    op.create_index(
        op.f('ix_notification_procurement_tracker_step_id'),
        'notification',
        ['procurement_tracker_step_id'],
        unique=False
    )
    # Create composite index for common query pattern (filtering by step + read status)
    op.create_index(
        'idx_notification_procurement_tracker_step',
        'notification',
        ['procurement_tracker_step_id', 'is_read']
    )

    # Add procurement_tracker_step_id column to notification_version table (for audit history)
    op.add_column(
        'notification_version',
        sa.Column('procurement_tracker_step_id', sa.Integer(), nullable=True)
    )


def downgrade() -> None:
    op.drop_column('notification_version', 'procurement_tracker_step_id')
    op.drop_index('idx_notification_procurement_tracker_step', table_name='notification')
    op.drop_index(op.f('ix_notification_procurement_tracker_step_id'), table_name='notification')
    op.drop_constraint('fk_notification_procurement_tracker_step_id', 'notification', type_='foreignkey')
    op.drop_column('notification', 'procurement_tracker_step_id')
    # Note: Can't remove enum value in PostgreSQL without recreating the enum
