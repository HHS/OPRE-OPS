"""Removing can_lead from CANFiscalYear

Revision ID: d411fa4a071b
Revises: 4bbe5ac187f2
Create Date: 2024-07-15 14:41:53.232916+00:00

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'd411fa4a071b'
down_revision: Union[str, None] = '4bbe5ac187f2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('can_fiscal_year', 'can_lead')
    op.drop_column('can_fiscal_year_version', 'can_lead')
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('can_fiscal_year_version', sa.Column('can_lead', sa.VARCHAR(), autoincrement=False, nullable=True))
    op.add_column('can_fiscal_year', sa.Column('can_lead', sa.VARCHAR(), autoincrement=False, nullable=True))
    # ### end Alembic commands ###