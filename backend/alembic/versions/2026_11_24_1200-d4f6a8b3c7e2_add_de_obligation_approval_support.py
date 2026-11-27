"""add de-obligation approval support

OPS-6489: approving a de-obligation contract modification. Adds the DE_OBLIGATION modtype value
(for a request that is de-obligation edits only) and an original_obligated_amount column on
budget_line_item, set once -- to the amount before any de-obligation -- the first time a line's
de-obligation is approved. Lets the original amount and the cumulative total de-obligated to date
stay viewable, and lets CAN funding calculations keep summing the original amount instead of the
shrinking one, once amount itself is reduced in place by the approval.

Revision ID: d4f6a8b3c7e2
Revises: ceb87e4d5c89
Create Date: 2026-11-24 12:00:00.000000+00:00

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from alembic_postgresql_enum import TableReference

# revision identifiers, used by Alembic.
revision: str = "d4f6a8b3c7e2"
down_revision: Union[str, None] = "ceb87e4d5c89"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

OLD_MOD_TYPES = ["NEW", "ADMIN", "AMOUNT_TBD", "AS_IS", "REPLACEMENT_AMOUNT_FINAL", "MODIFIED_LOE"]
NEW_MOD_TYPES = OLD_MOD_TYPES + ["DE_OBLIGATION"]


def _sync_mod_types(values) -> None:
    op.sync_enum_values(
        enum_schema="ops",
        enum_name="modtype",
        new_values=values,
        affected_columns=[
            TableReference(table_schema="ops", table_name="agreement_mod", column_name="mod_type"),
            TableReference(table_schema="ops", table_name="agreement_mod_version", column_name="mod_type"),
        ],
        enum_values_to_rename=[],
    )


def upgrade() -> None:
    _sync_mod_types(NEW_MOD_TYPES)
    op.add_column("budget_line_item", sa.Column("original_obligated_amount", sa.Numeric(12, 2), nullable=True))
    op.add_column(
        "budget_line_item_version",
        sa.Column("original_obligated_amount", sa.Numeric(12, 2), autoincrement=False, nullable=True),
    )


def downgrade() -> None:
    op.drop_column("budget_line_item_version", "original_obligated_amount")
    op.drop_column("budget_line_item", "original_obligated_amount")
    op.execute("UPDATE ops.agreement_mod SET mod_type = NULL WHERE mod_type = 'DE_OBLIGATION'")
    op.execute("UPDATE ops.agreement_mod_version SET mod_type = NULL WHERE mod_type = 'DE_OBLIGATION'")
    _sync_mod_types(OLD_MOD_TYPES)
