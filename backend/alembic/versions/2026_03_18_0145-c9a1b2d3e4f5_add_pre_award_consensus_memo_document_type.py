"""Add PRE_AWARD_CONSENSUS_MEMO document type

Revision ID: c9a1b2d3e4f5
Revises: b5f3e9a8c4d1
Create Date: 2026-03-18 01:45:00.000000+00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c9a1b2d3e4f5'
down_revision: Union[str, None] = 'b5f3e9a8c4d1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add the new enum value to the documenttype enum
    # Note: ALTER TYPE ... ADD VALUE cannot be run inside a transaction block
    # We need to commit the current transaction first
    connection = op.get_bind()

    # Check if the enum value already exists to make migration idempotent
    result = connection.execute(
        sa.text(
            "SELECT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'PRE_AWARD_CONSENSUS_MEMO' "
            "AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'documenttype'))"
        )
    ).scalar()

    if not result:
        # Execute outside of a transaction by committing first
        connection.execute(sa.text("COMMIT"))
        connection.execute(
            sa.text(
                "ALTER TYPE documenttype ADD VALUE 'PRE_AWARD_CONSENSUS_MEMO' BEFORE 'ADDITIONAL_DOCUMENT'"
            )
        )


def downgrade() -> None:
    # Note: PostgreSQL does not support removing enum values
    # To downgrade, you would need to:
    # 1. Create a new enum type without the value
    # 2. Update all columns using the old enum to use the new enum
    # 3. Drop the old enum type
    # 4. Rename the new enum type to the old name
    # This is complex and risky, so we leave it as a no-op
    pass
