"""remove total_fiscal_year_funding from CANFiscalYear

Revision ID: 8edb8ea8b14f
Revises: 24b03bb1a7fd
Create Date: 2024-06-05 15:04:46.065025+00:00

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = '8edb8ea8b14f'
down_revision: Union[str, None] = '24b03bb1a7fd'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.alter_column('agreement', 'name',
               existing_type=sa.VARCHAR(),
               comment=None,
               existing_comment='In MAPS this was PROJECT.PROJECT_TITLE',
               existing_nullable=False)
    op.alter_column('agreement_version', 'name',
               existing_type=sa.VARCHAR(),
               comment=None,
               existing_comment='In MAPS this was PROJECT.PROJECT_TITLE',
               existing_nullable=True,
               autoincrement=False)
    op.alter_column('can', 'managing_portfolio_id',
               existing_type=sa.INTEGER(),
               nullable=False)
    op.drop_column('can_fiscal_year', 'total_fiscal_year_funding')
    op.drop_column('can_fiscal_year_version', 'total_fiscal_year_funding')
    op.alter_column('services_component', 'number',
               existing_type=sa.INTEGER(),
               nullable=False)
    op.alter_column('services_component', 'optional',
               existing_type=sa.BOOLEAN(),
               nullable=False)
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.alter_column('services_component', 'optional',
               existing_type=sa.BOOLEAN(),
               nullable=True)
    op.alter_column('services_component', 'number',
               existing_type=sa.INTEGER(),
               nullable=True)
    op.add_column('can_fiscal_year_version', sa.Column('total_fiscal_year_funding', sa.NUMERIC(precision=12, scale=2), autoincrement=False, nullable=True))
    op.add_column('can_fiscal_year', sa.Column('total_fiscal_year_funding', sa.NUMERIC(precision=12, scale=2), autoincrement=False, nullable=True))
    op.alter_column('can', 'managing_portfolio_id',
               existing_type=sa.INTEGER(),
               nullable=True)
    op.alter_column('agreement_version', 'name',
               existing_type=sa.VARCHAR(),
               comment='In MAPS this was PROJECT.PROJECT_TITLE',
               existing_nullable=True,
               autoincrement=False)
    op.alter_column('agreement', 'name',
               existing_type=sa.VARCHAR(),
               comment='In MAPS this was PROJECT.PROJECT_TITLE',
               existing_nullable=False)
    # ### end Alembic commands ###
