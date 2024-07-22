"""merge f8ef3a3d90d7 and a4a04f1f868e

Revision ID: 479d7630e94c
Revises: a4a04f1f868e, f8ef3a3d90d7
Create Date: 2024-07-22 12:46:09.018140+00:00

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = '479d7630e94c'
down_revision: Union[str, None] = ('a4a04f1f868e', 'f8ef3a3d90d7')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
