"""add delete agreement permission

Revision ID: 38e2556364d7
Revises: c9d0e1f2a3b4
Create Date: 2026-09-12 03:46:42.048527+00:00

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "38e2556364d7"
down_revision: Union[str, None] = "c9d0e1f2a3b4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


ROLES_TO_UPDATE = ["VIEWER_EDITOR", "REVIEWER_APPROVER", "BUDGET_TEAM"]


def upgrade() -> None:
    for role in ROLES_TO_UPDATE:
        op.execute(sa.text("""
                UPDATE ops.role
                SET permissions = array_append(permissions, 'DELETE_AGREEMENT')
                WHERE name = :role
                  AND NOT ('DELETE_AGREEMENT' = ANY(permissions))
                """).bindparams(role=role))


def downgrade() -> None:
    for role in ROLES_TO_UPDATE:
        op.execute(sa.text("""
                UPDATE ops.role
                SET permissions = array_remove(permissions, 'DELETE_AGREEMENT')
                WHERE name = :role
                """).bindparams(role=role))
