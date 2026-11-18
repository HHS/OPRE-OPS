"""one pending direct edit per budget line field

OPS-3268: a double-click/retry on a direct-apply budget line edit could insert two pending
``contract_modification_edit`` rows for the same (budget_line_item_id, field), orphaning one
with no ``agreement_mod_id`` and letting it later resurface with a stale ``old_value``. Adds a
partial unique index so the second concurrent insert fails fast instead.

Before the index can be created, any existing duplicate pending rows for the same
(budget_line_item_id, field) -- e.g. two approved change requests for the same field, approved
before this constraint existed -- are merged the same way ``record_direct_edit`` merges a pending
edit today: keep the oldest row's ``old_value``, the newest row's ``new_value``, drop every other
row in the group, and drop the merged row entirely if the merge nets to no change.

Revision ID: 3581b3cbad42
Revises: b6419b17838e
Create Date: 2026-11-12 19:52:00.000000+00:00

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "3581b3cbad42"
down_revision: Union[str, None] = "b6419b17838e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

PENDING_BLI_FIELD_INDEX = "ix_contract_modification_edit_one_pending_bli_field"

# Grouped by (budget_line_item_id, field), among pending (agreement_mod_id IS NULL) direct-edit
# rows: the oldest row's old_value, the newest row's new_value and id, per group with >1 row.
_MERGE_DUPLICATE_GROUPS_SQL = """
    CREATE TEMP TABLE pending_bli_field_merge AS
    SELECT
        budget_line_item_id,
        field,
        (ARRAY_AGG(old_value ORDER BY requested_on ASC NULLS FIRST, id ASC))[1] AS oldest_old_value,
        (ARRAY_AGG(new_value ORDER BY requested_on DESC NULLS LAST, id DESC))[1] AS newest_new_value,
        (ARRAY_AGG(id ORDER BY requested_on DESC NULLS LAST, id DESC))[1] AS keep_id
    FROM contract_modification_edit
    WHERE agreement_mod_id IS NULL AND budget_line_item_id IS NOT NULL
    GROUP BY budget_line_item_id, field
    HAVING COUNT(*) > 1
"""


def upgrade() -> None:
    op.execute(sa.text(_MERGE_DUPLICATE_GROUPS_SQL))
    # Drop every pending row in a duplicate group except the one being kept. Rows already attached
    # to a modification (agreement_mod_id set) are history, not duplicates, and must survive.
    op.execute(sa.text("""
            DELETE FROM contract_modification_edit cme
            USING pending_bli_field_merge m
            WHERE cme.budget_line_item_id = m.budget_line_item_id
              AND cme.field = m.field
              AND cme.agreement_mod_id IS NULL
              AND cme.id != m.keep_id
            """))
    # Merge the kept row: oldest old_value, newest new_value (already its own, since keep_id is
    # the newest row -- only old_value needs overwriting).
    op.execute(sa.text("""
            UPDATE contract_modification_edit cme
            SET old_value = m.oldest_old_value
            FROM pending_bli_field_merge m
            WHERE cme.id = m.keep_id
            """))
    # A merge that nets to no change isn't recorded (matches record_direct_edit's net-zero rule).
    op.execute(sa.text("""
            DELETE FROM contract_modification_edit cme
            USING pending_bli_field_merge m
            WHERE cme.id = m.keep_id
              AND cme.old_value = cme.new_value
            """))
    op.execute(sa.text("DROP TABLE pending_bli_field_merge"))

    op.create_index(
        PENDING_BLI_FIELD_INDEX,
        "contract_modification_edit",
        ["budget_line_item_id", "field"],
        unique=True,
        postgresql_where=sa.text("agreement_mod_id IS NULL AND budget_line_item_id IS NOT NULL"),
    )


def downgrade() -> None:
    op.drop_index(PENDING_BLI_FIELD_INDEX, table_name="contract_modification_edit")
