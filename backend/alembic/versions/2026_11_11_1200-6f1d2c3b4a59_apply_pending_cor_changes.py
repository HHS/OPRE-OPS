"""apply pending cor changes

#3269: a COR change on an Awarded agreement now applies when it's saved, and its ADMIN_CHANGE
contract modification edit only tracks that the contract still needs a modification. Edits
recorded under OPS-3153's earlier rule never changed the agreement's COR, so apply them now:
set the COR to each unattached edit's new value, and clear the Alternate COR when it's the
same person (as saving the change would). Data only; no schema change.

Only environments with ENABLE_MODIFIED_LOE_EDITS on (dev, staging) have such edits. The update
bypasses the ORM, so it writes no agreement history or version rows, and the old "Change to COR
Pending Contract Modification" history entries (which say the COR changes once the modification is
approved) are left as they were. An edit whose target user no longer exists is skipped.

Revision ID: 6f1d2c3b4a59
Revises: bacd8725cb2d
Create Date: 2026-11-11 12:00:00.000000+00:00

"""

from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "6f1d2c3b4a59"
down_revision: Union[str, None] = "bacd8725cb2d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# At most one unattached COR edit per agreement (ix_contract_modification_edit_one_pending_cor_change).
APPLY_PENDING_COR_CHANGES_SQL = """
UPDATE ops.agreement AS a
SET project_officer_id = (e.new_value #>> '{}')::integer,
    alternate_project_officer_id = CASE
        WHEN a.alternate_project_officer_id = (e.new_value #>> '{}')::integer THEN NULL
        ELSE a.alternate_project_officer_id
    END
FROM ops.contract_modification_edit AS e
WHERE e.agreement_id = a.id
  AND e.modification_type = 'ADMIN_CHANGE'
  AND e.field = 'project_officer_id'
  AND e.agreement_mod_id IS NULL
  AND jsonb_typeof(e.new_value) = 'number'
  AND a.project_officer_id IS DISTINCT FROM (e.new_value #>> '{}')::integer
  AND EXISTS (SELECT 1 FROM ops.ops_user AS u WHERE u.id = (e.new_value #>> '{}')::integer)
"""


def upgrade() -> None:
    op.execute(APPLY_PENDING_COR_CHANGES_SQL)


def downgrade() -> None:
    # The previous COR is still the edit's old_value, but the Alternate COR cleared above can't be
    # told apart from one cleared by a user, so this isn't reversed.
    pass
