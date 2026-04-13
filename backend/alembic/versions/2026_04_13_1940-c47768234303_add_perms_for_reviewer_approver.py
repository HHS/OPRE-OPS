"""add perms for reviewer approver

Revision ID: c47768234303
Revises: c9a1b2d3e4f5
Create Date: 2026-04-13 19:40:42.146668+00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c47768234303'
down_revision: Union[str, None] = 'c9a1b2d3e4f5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


NEW_PERMISSIONS = [
    "PUT_BUDGET_LINE_ITEM",
    "PATCH_BUDGET_LINE_ITEM",
    "POST_BUDGET_LINE_ITEM",
    "DELETE_BUDGET_LINE_ITEM",
    "PUT_SERVICES_COMPONENT",
    "PATCH_SERVICES_COMPONENT",
    "POST_SERVICES_COMPONENT",
    "DELETE_SERVICES_COMPONENT",
]


def upgrade() -> None:
    for perm in NEW_PERMISSIONS:
        op.execute(
            sa.text(
                """
                UPDATE ops.role
                SET permissions = array_append(permissions, :perm)
                WHERE name = 'REVIEWER_APPROVER'
                  AND NOT (:perm = ANY(permissions))
                """
            ).bindparams(perm=perm)
        )


def downgrade() -> None:
    for perm in NEW_PERMISSIONS:
        op.execute(
            sa.text(
                """
                UPDATE ops.role
                SET permissions = array_remove(permissions, :perm)
                WHERE name = 'REVIEWER_APPROVER'
                """
            ).bindparams(perm=perm)
        )
