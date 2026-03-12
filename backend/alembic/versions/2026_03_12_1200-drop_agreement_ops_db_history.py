"""Drop agreement_ops_db_history tables

Revision ID: a3b4c5d6e7f8
Revises: 7c7efdb9d2da
Create Date: 2026-03-12 12:00:00.000000+00:00

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "a3b4c5d6e7f8"
down_revision: Union[str, None] = "7c7efdb9d2da"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop the version table first (no FK dependencies)
    op.drop_index(
        op.f("ix_agreement_ops_db_history_version_transaction_id"),
        table_name="agreement_ops_db_history_version",
    )
    op.drop_index(
        op.f("ix_agreement_ops_db_history_version_operation_type"),
        table_name="agreement_ops_db_history_version",
    )
    op.drop_index(
        op.f("ix_agreement_ops_db_history_version_end_transaction_id"),
        table_name="agreement_ops_db_history_version",
    )
    op.drop_table("agreement_ops_db_history_version")

    # Drop the main table
    op.drop_table("agreement_ops_db_history")


def downgrade() -> None:
    # Recreate the main table
    op.create_table(
        "agreement_ops_db_history",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("agreement_id", sa.Integer(), nullable=True),
        sa.Column("ops_db_history_id", sa.Integer(), nullable=True),
        sa.Column("created_by", sa.Integer(), nullable=True),
        sa.Column("updated_by", sa.Integer(), nullable=True),
        sa.Column("created_on", sa.DateTime(), nullable=True),
        sa.Column("updated_on", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(
            ["created_by"],
            ["ops_user.id"],
        ),
        sa.ForeignKeyConstraint(
            ["ops_db_history_id"], ["ops_db_history.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["updated_by"],
            ["ops_user.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    # Recreate the version table
    op.create_table(
        "agreement_ops_db_history_version",
        sa.Column("id", sa.Integer(), autoincrement=False, nullable=False),
        sa.Column("agreement_id", sa.Integer(), autoincrement=False, nullable=True),
        sa.Column(
            "ops_db_history_id", sa.Integer(), autoincrement=False, nullable=True
        ),
        sa.Column("created_by", sa.Integer(), autoincrement=False, nullable=True),
        sa.Column("updated_by", sa.Integer(), autoincrement=False, nullable=True),
        sa.Column("created_on", sa.DateTime(), autoincrement=False, nullable=True),
        sa.Column("updated_on", sa.DateTime(), autoincrement=False, nullable=True),
        sa.Column(
            "transaction_id", sa.BigInteger(), autoincrement=False, nullable=False
        ),
        sa.Column("end_transaction_id", sa.BigInteger(), nullable=True),
        sa.Column("operation_type", sa.SmallInteger(), nullable=False),
        sa.PrimaryKeyConstraint("id", "transaction_id"),
    )
    op.create_index(
        op.f("ix_agreement_ops_db_history_version_end_transaction_id"),
        "agreement_ops_db_history_version",
        ["end_transaction_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_agreement_ops_db_history_version_operation_type"),
        "agreement_ops_db_history_version",
        ["operation_type"],
        unique=False,
    )
    op.create_index(
        op.f("ix_agreement_ops_db_history_version_transaction_id"),
        "agreement_ops_db_history_version",
        ["transaction_id"],
        unique=False,
    )
