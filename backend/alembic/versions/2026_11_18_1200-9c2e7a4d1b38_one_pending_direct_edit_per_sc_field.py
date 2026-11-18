"""one pending direct edit per services component field

OPS-3268: a Services Component's period-of-performance edit on an Awarded agreement is now
recorded as a pending ``contract_modification_edit`` row keyed by (services_component_id, field).
Adds a partial unique index, the SC counterpart of
``ix_contract_modification_edit_one_pending_bli_field``, so a double-click/retry fails fast instead
of inserting two pending rows for the same field.

Until now the SC's own pending rows were only "services_component_create" and "delete" (one per
SC). Any duplicate pending rows for the same (services_component_id, field) are dropped first,
keeping the newest, so the index can be created.


Revision ID: 9c2e7a4d1b38
Revises: 3581b3cbad42
Create Date: 2026-11-18 12:00:00.000000+00:00

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "9c2e7a4d1b38"
down_revision: Union[str, None] = "3581b3cbad42"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

PENDING_SC_FIELD_INDEX = "ix_contract_modification_edit_one_pending_sc_field"
# Literal SQL throughout (no interpolation into sa.text), like the BLI migration.
PENDING_SC_ROW = sa.text(
    "agreement_mod_id IS NULL AND services_component_id IS NOT NULL AND budget_line_item_id IS NULL"
)


def upgrade() -> None:
    # Rows already attached to a modification (agreement_mod_id set) are history and must survive.
    op.execute(sa.text("""
            DELETE FROM contract_modification_edit cme
            USING (
                SELECT id, ROW_NUMBER() OVER (
                    PARTITION BY services_component_id, field
                    ORDER BY requested_on DESC NULLS LAST, id DESC
                ) AS rn
                FROM contract_modification_edit
                WHERE agreement_mod_id IS NULL
                  AND services_component_id IS NOT NULL
                  AND budget_line_item_id IS NULL
            ) ranked
            WHERE cme.id = ranked.id AND ranked.rn > 1
            """))

    op.create_index(
        PENDING_SC_FIELD_INDEX,
        "contract_modification_edit",
        ["services_component_id", "field"],
        unique=True,
        postgresql_where=PENDING_SC_ROW,
    )


def downgrade() -> None:
    op.drop_index(PENDING_SC_FIELD_INDEX, table_name="contract_modification_edit")
