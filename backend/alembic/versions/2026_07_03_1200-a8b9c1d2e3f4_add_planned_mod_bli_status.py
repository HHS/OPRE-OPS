"""Add PLANNED_MOD value to budgetlineitemstatus enum (OPS-2280)

Budget lines transitioning from PLANNED to OBLIGATED during award approval
get an intermediate PLANNED_MOD status to indicate they are part of an awarded
contract but were not in executing status at the time of award.

Revision ID: a8b9c1d2e3f4
Revises: d67e125881ac
Create Date: 2026-07-03 12:00:00.000000+00:00

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "a8b9c1d2e3f4"
down_revision: Union[str, None] = "d67e125881ac"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE budgetlineitemstatus ADD VALUE IF NOT EXISTS 'PLANNED_MOD'")


def downgrade() -> None:
    # Enum values cannot be removed in PostgreSQL without recreating the type.
    # This migration is intentionally forward-only.
    # To downgrade: manually update any PLANNED_MOD rows, recreate the enum
    # without PLANNED_MOD, and re-apply.
    pass
