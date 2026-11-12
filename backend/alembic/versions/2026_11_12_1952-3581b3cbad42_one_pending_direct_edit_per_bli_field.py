"""one pending direct edit per budget line field

OPS-3268: a double-click/retry on a direct-apply budget line edit could insert two pending
``contract_modification_edit`` rows for the same (budget_line_item_id, field), orphaning one
with no ``agreement_mod_id`` and letting it later resurface with a stale ``old_value``. Adds a
partial unique index so the second concurrent insert fails fast instead.

Revision ID: 3581b3cbad42
Revises: bacd8725cb2d
Create Date: 2026-11-12 19:52:00.000000+00:00

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "3581b3cbad42"
down_revision: Union[str, None] = "bacd8725cb2d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

PENDING_BLI_FIELD_INDEX = "ix_contract_modification_edit_one_pending_bli_field"


def upgrade() -> None:
    op.create_index(
        PENDING_BLI_FIELD_INDEX,
        "contract_modification_edit",
        ["budget_line_item_id", "field"],
        unique=True,
        postgresql_where=sa.text("agreement_mod_id IS NULL AND budget_line_item_id IS NOT NULL"),
    )


def downgrade() -> None:
    op.drop_index(PENDING_BLI_FIELD_INDEX, table_name="contract_modification_edit")
