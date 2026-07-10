"""Add AWARD_APPROVAL_NOTIFICATION to notificationtype enum (OPS-2280)

Adds a dedicated notification type for award approval workflow notifications,
distinct from PRE_AWARD_APPROVAL_NOTIFICATION.

Revision ID: b2c3d4e5f6a7
Revises: a8b9c1d2e3f4
Create Date: 2026-07-09 10:00:00.000000+00:00

"""

from typing import Sequence, Union

from alembic import op

revision: str = "b2c3d4e5f6a7"
down_revision: Union[str, None] = "a8b9c1d2e3f4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE notificationtype ADD VALUE IF NOT EXISTS 'AWARD_APPROVAL_NOTIFICATION'")


def downgrade() -> None:
    # Enum values cannot be removed in PostgreSQL without recreating the type.
    pass
