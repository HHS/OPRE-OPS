"""add PATCH_RESEARCH_PROJECT permission to roles

Revision ID: e9f8a7b6c5d4
Revises: b9c8d7e6f5a4
Create Date: 2026-05-06 14:00:00.000000+00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e9f8a7b6c5d4'
down_revision: Union[str, None] = 'b9c8d7e6f5a4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

ROLES_TO_UPDATE = ['SYSTEM_OWNER', 'VIEWER_EDITOR', 'REVIEWER_APPROVER', 'BUDGET_TEAM']
PERMISSION = 'PATCH_RESEARCH_PROJECT'


def upgrade() -> None:
    for role_name in ROLES_TO_UPDATE:
        op.execute(
            sa.text(
                """
                UPDATE ops.role
                SET permissions = array_append(permissions, :perm)
                WHERE name = :role_name
                  AND NOT (:perm = ANY(permissions))
                """
            ).bindparams(perm=PERMISSION, role_name=role_name)
        )


def downgrade() -> None:
    for role_name in ROLES_TO_UPDATE:
        op.execute(
            sa.text(
                """
                UPDATE ops.role
                SET permissions = array_remove(permissions, :perm)
                WHERE name = :role_name
                """
            ).bindparams(perm=PERMISSION, role_name=role_name)
        )
