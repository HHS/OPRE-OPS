"""add indexes and not null to agreement_history record fields

Revision ID: a1b2c3d4e5f6
Revises: 30d78efe9773
Create Date: 2025-12-03 12:00:00.000000+00:00

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "30d78efe9773"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Step 1: Create indexes for query performance
    op.create_index(
        "ix_agreement_history_agreement_id_record", "agreement_history", ["agreement_id_record"], unique=False
    )
    op.create_index(
        "ix_agreement_history_budget_line_id_record", "agreement_history", ["budget_line_id_record"], unique=False
    )

    op.create_index(
        op.f("ix_agreement_history_version_agreement_id_record"),
        "agreement_history_version",
        ["agreement_id_record"],
        unique=False,
    )
    op.create_index(
        op.f("ix_agreement_history_version_budget_line_id_record"),
        "agreement_history_version",
        ["budget_line_id_record"],
        unique=False,
    )

    # Step 2: Add NOT NULL constraint to agreement_id_record only
    # Note: budget_line_id_record remains nullable (agreement-level events don't have budget lines)
    op.alter_column("agreement_history", "agreement_id_record", existing_type=sa.Integer(), nullable=False)

    # Drop the unused ops_event_id_record column
    # This field was never read/used and has thousands of NULL values in production
    # OpsEvents are never deleted, so the *_record pattern provides no value here
    op.drop_column("agreement_history", "ops_event_id_record")
    op.drop_column("agreement_history_version", "ops_event_id_record")


def downgrade() -> None:
    # Re-add the column if we need to rollback
    op.add_column("agreement_history", sa.Column("ops_event_id_record", sa.Integer(), nullable=True))
    op.add_column(
        "agreement_history_version", sa.Column("ops_event_id_record", sa.INTEGER(), autoincrement=False, nullable=True)
    )

    # Step 1: Restore nullable constraint on agreement_id_record
    op.alter_column("agreement_history", "agreement_id_record", existing_type=sa.Integer(), nullable=True)

    # Step 2: Drop indexes
    op.drop_index("ix_agreement_history_budget_line_id_record", table_name="agreement_history")
    op.drop_index("ix_agreement_history_agreement_id_record", table_name="agreement_history")
    op.drop_index(op.f("ix_agreement_history_version_budget_line_id_record"), table_name="agreement_history_version")
    op.drop_index(op.f("ix_agreement_history_version_agreement_id_record"), table_name="agreement_history_version")
