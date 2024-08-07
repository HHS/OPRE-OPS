"""Removing purpose column from CAN model

Revision ID: 1d92818fa69b
Revises: a6d256001dde
Create Date: 2024-07-10 18:33:17.319065+00:00

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = '1d92818fa69b'
down_revision: Union[str, None] = 'a6d256001dde'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('can', 'purpose')
    op.drop_column('can_version', 'purpose')
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('can_version', sa.Column('purpose', sa.VARCHAR(), autoincrement=False, nullable=True))
    op.add_column('can', sa.Column('purpose', sa.VARCHAR(), autoincrement=False, nullable=True))
    # ### end Alembic commands ###
