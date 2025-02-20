"""add more attributes to grants

Revision ID: b5d03aa79d12
Revises: 8c9a30d8d6b4
Create Date: 2025-02-20 22:07:01.324115+00:00

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'b5d03aa79d12'
down_revision: Union[str, None] = '8c9a30d8d6b4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('grant_agreement', sa.Column('total_funding', sa.Numeric(precision=12, scale=2), nullable=True))
    op.add_column('grant_agreement', sa.Column('number_of_years', sa.Integer(), nullable=True))
    op.add_column('grant_agreement', sa.Column('number_of_grants', sa.Integer(), nullable=True))
    op.alter_column('grant_agreement', 'foa',
               existing_type=sa.VARCHAR(),
               nullable=True)
    op.add_column('grant_agreement_version', sa.Column('total_funding', sa.Numeric(precision=12, scale=2), autoincrement=False, nullable=True))
    op.add_column('grant_agreement_version', sa.Column('number_of_years', sa.Integer(), autoincrement=False, nullable=True))
    op.add_column('grant_agreement_version', sa.Column('number_of_grants', sa.Integer(), autoincrement=False, nullable=True))
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('grant_agreement_version', 'number_of_grants')
    op.drop_column('grant_agreement_version', 'number_of_years')
    op.drop_column('grant_agreement_version', 'total_funding')
    op.alter_column('grant_agreement', 'foa',
               existing_type=sa.VARCHAR(),
               nullable=False)
    op.drop_column('grant_agreement', 'number_of_grants')
    op.drop_column('grant_agreement', 'number_of_years')
    op.drop_column('grant_agreement', 'total_funding')
    # ### end Alembic commands ###
