"""add admin change modification edit type

OPS-3153: a COR change on an Awarded agreement is recorded as a pending ADMIN_CHANGE
contract modification edit. Adds the ADMIN_CHANGE modificationedittype value and a partial
unique index allowing one pending COR change per agreement.

Revision ID: bacd8725cb2d
Revises: 39dc6a6e0303
Create Date: 2026-11-04 15:00:00.000000+00:00

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from alembic_postgresql_enum import TableReference

# revision identifiers, used by Alembic.
revision: str = "bacd8725cb2d"
down_revision: Union[str, None] = "39dc6a6e0303"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

OLD_MODIFICATION_EDIT_TYPES = ["MODIFIED_LOE"]
NEW_MODIFICATION_EDIT_TYPES = OLD_MODIFICATION_EDIT_TYPES + ["ADMIN_CHANGE"]

PENDING_COR_INDEX = "ix_contract_modification_edit_one_pending_cor_change"


def _sync_modification_edit_types(values) -> None:
    op.sync_enum_values(
        enum_schema="ops",
        enum_name="modificationedittype",
        new_values=values,
        affected_columns=[
            TableReference(
                table_schema="ops", table_name="contract_modification_edit", column_name="modification_type"
            ),
            TableReference(
                table_schema="ops", table_name="contract_modification_edit_version", column_name="modification_type"
            ),
        ],
        enum_values_to_rename=[],
    )


def upgrade() -> None:
    _sync_modification_edit_types(NEW_MODIFICATION_EDIT_TYPES)
    # This index's WHERE clause compares against the modificationedittype enum, so a later
    # sync_enum_values on that type must list it in indexes_to_recreate.
    op.create_index(
        PENDING_COR_INDEX,
        "contract_modification_edit",
        ["agreement_id"],
        unique=True,
        postgresql_where=sa.text(
            "modification_type = 'ADMIN_CHANGE' AND field = 'project_officer_id' AND agreement_mod_id IS NULL"
        ),
    )


def downgrade() -> None:
    op.drop_index(PENDING_COR_INDEX, table_name="contract_modification_edit")
    # contract_mod_request_edits rows go with them (ON DELETE CASCADE).
    op.execute("DELETE FROM ops.contract_modification_edit WHERE modification_type = 'ADMIN_CHANGE'")
    op.execute("DELETE FROM ops.contract_modification_edit_version WHERE modification_type = 'ADMIN_CHANGE'")
    _sync_modification_edit_types(OLD_MODIFICATION_EDIT_TYPES)
