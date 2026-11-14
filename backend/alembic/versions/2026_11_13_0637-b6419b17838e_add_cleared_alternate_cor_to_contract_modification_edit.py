"""add cleared alternate cor to contract modification edit

#3269: a COR change that promoted the Alternate COR also clears the Alternate COR. Declining the
contract modification reverts the COR, so the card now records which Alternate COR the change
cleared, to restore it. Adds a nullable column (and its version-table copy); no data changes.

Revision ID: b6419b17838e
Revises: 6f1d2c3b4a59
Create Date: 2026-11-13 06:37:45.707609+00:00

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "b6419b17838e"
down_revision: Union[str, None] = "6f1d2c3b4a59"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

COLUMN = "cleared_alternate_project_officer_id"
FOREIGN_KEY = "fk_contract_mod_edit_cleared_alternate_cor"


def upgrade() -> None:
    op.add_column("contract_modification_edit", sa.Column(COLUMN, sa.Integer(), nullable=True))
    op.create_foreign_key(FOREIGN_KEY, "contract_modification_edit", "ops_user", [COLUMN], ["id"])
    op.add_column(
        "contract_modification_edit_version",
        sa.Column(COLUMN, sa.Integer(), autoincrement=False, nullable=True),
    )


def downgrade() -> None:
    op.drop_column("contract_modification_edit_version", COLUMN)
    op.drop_constraint(FOREIGN_KEY, "contract_modification_edit", type_="foreignkey")
    op.drop_column("contract_modification_edit", COLUMN)
