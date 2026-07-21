"""add grant_number_id to grant budget line item

Revision ID: f2a3b4c5d6e7
Revises: e1f2a3b4c5d6
Create Date: 2026-07-21 17:30:00.000000+00:00

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "f2a3b4c5d6e7"
down_revision: Union[str, None] = "e1f2a3b4c5d6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # grant_number_id lives on the grant_budget_line_item subclass (not the base
    # budget_line_item), because a grant number only applies to grant BLIs.
    op.add_column(
        "grant_budget_line_item",
        sa.Column("grant_number_id", sa.Integer(), nullable=True),
    )
    op.create_foreign_key(
        "grant_budget_line_item_grant_number_id_fkey",
        "grant_budget_line_item",
        "grant_number",
        ["grant_number_id"],
        ["id"],
        ondelete="SET NULL",
    )
    # Version/history table gets the column too, but no FK (matches continuum pattern).
    op.add_column(
        "grant_budget_line_item_version",
        sa.Column("grant_number_id", sa.Integer(), autoincrement=False, nullable=True),
    )


def downgrade() -> None:
    op.drop_column("grant_budget_line_item_version", "grant_number_id")
    op.drop_constraint(
        "grant_budget_line_item_grant_number_id_fkey",
        "grant_budget_line_item",
        type_="foreignkey",
    )
    op.drop_column("grant_budget_line_item", "grant_number_id")
