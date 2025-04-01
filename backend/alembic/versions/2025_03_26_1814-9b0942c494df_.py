"""empty message

Revision ID: 9b0942c494df
Revises: f8b2a2a8b484, 486929593d89
Create Date: 2025-03-26 18:14:25.131014+00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9b0942c494df'
down_revision: Union[str, None] = ('f8b2a2a8b484', '486929593d89')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
