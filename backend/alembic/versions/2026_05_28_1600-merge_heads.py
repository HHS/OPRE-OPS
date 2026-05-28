"""Merge heads: step 6 award fields and patch research project permission

Revision ID: merge_heads_001
Revises: 318743cad509, e9f8a7b6c5d4
Create Date: 2026-05-28 16:00:00.000000+00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'merge_heads_001'
down_revision: Union[str, tuple[str, str]] = ('318743cad509', 'e9f8a7b6c5d4')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # This is a merge migration - no schema changes needed
    pass


def downgrade() -> None:
    # This is a merge migration - no schema changes needed
    pass
