"""make User.division optional

Revision ID: ff7132d9d0c0
Revises: 95e0429b780a
Create Date: 2024-03-28 20:23:16.030357+00:00

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'ff7132d9d0c0'
down_revision: Union[str, None] = '95e0429b780a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.alter_column('user', 'division',
               existing_type=sa.INTEGER(),
               nullable=True)
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.alter_column('user', 'division',
               existing_type=sa.INTEGER(),
               nullable=False)
    # ### end Alembic commands ###
