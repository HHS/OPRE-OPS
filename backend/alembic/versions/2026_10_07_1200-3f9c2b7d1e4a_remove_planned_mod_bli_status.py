"""Remove PLANNED_MOD from budgetlineitemstatus enum (OPS-6356)

PLANNED_MOD was added in a8b9c1d2e3f4 (OPS-2280) and set by award approval until
PR #6216 removed that conversion without migrating existing rows. Those rows are
returned to PLANNED, then the value is dropped from the Postgres enum type.

The WHERE clauses compare status::text instead of the enum literal: from an empty
database, `alembic upgrade head` runs every migration in one transaction, and
Postgres rejects any use of an enum value added by ALTER TYPE ... ADD VALUE
(a8b9c1d2e3f4) in the same transaction.

Downgrade restores the enum value only. The PLANNED_MOD -> PLANNED data change is
not reversible: which rows were PLANNED_MOD is not recorded.

Revision ID: 3f9c2b7d1e4a
Revises: 38e2556364d7
Create Date: 2026-10-07 12:00:00.000000+00:00

"""

from typing import Sequence, Union

from alembic import op
from alembic_postgresql_enum import TableReference

# revision identifiers, used by Alembic.
revision: str = "3f9c2b7d1e4a"
down_revision: Union[str, None] = "38e2556364d7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("UPDATE ops.budget_line_item SET status = 'PLANNED' WHERE status::text = 'PLANNED_MOD'")
    op.execute("UPDATE ops.budget_line_item_version SET status = 'PLANNED' WHERE status::text = 'PLANNED_MOD'")
    op.sync_enum_values(
        enum_schema="ops",
        enum_name="budgetlineitemstatus",
        new_values=["DRAFT", "PLANNED", "IN_EXECUTION", "OBLIGATED"],
        affected_columns=[
            TableReference(table_schema="ops", table_name="budget_line_item", column_name="status"),
            TableReference(table_schema="ops", table_name="budget_line_item_version", column_name="status"),
        ],
        enum_values_to_rename=[],
    )


def downgrade() -> None:
    op.sync_enum_values(
        enum_schema="ops",
        enum_name="budgetlineitemstatus",
        new_values=["DRAFT", "PLANNED", "IN_EXECUTION", "OBLIGATED", "PLANNED_MOD"],
        affected_columns=[
            TableReference(table_schema="ops", table_name="budget_line_item", column_name="status"),
            TableReference(table_schema="ops", table_name="budget_line_item_version", column_name="status"),
        ],
        enum_values_to_rename=[],
    )
