"""Adding invoice line number to BLI

Revision ID: 728fdb666cb2
Revises: 5d3916a592a6
Create Date: 2024-07-16 20:49:54.757515+00:00

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = '728fdb666cb2'
down_revision: Union[str, None] = '5d3916a592a6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('contract_agreement', sa.Column('invoice_line_nbr', sa.Integer(), nullable=True))
    op.add_column('contract_agreement_version', sa.Column('invoice_line_nbr', sa.Integer(), autoincrement=False, nullable=True))
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('contract_agreement_version', 'invoice_line_nbr')
    op.drop_column('contract_agreement', 'invoice_line_nbr')
    # ### end Alembic commands ###