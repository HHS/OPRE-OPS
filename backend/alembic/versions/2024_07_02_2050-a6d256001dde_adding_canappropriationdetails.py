"""Adding CANAppropriationDetails

Revision ID: a6d256001dde
Revises: 186e5faae7ee
Create Date: 2024-07-02 20:50:08.271447+00:00

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'a6d256001dde'
down_revision: Union[str, None] = '186e5faae7ee'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('can_appropriation_details_version',
    sa.Column('id', sa.Integer(), autoincrement=False, nullable=False),
    sa.Column('appropriation_prefix', sa.String(), autoincrement=False, nullable=True),
    sa.Column('appropriation_postfix', sa.String(), autoincrement=False, nullable=True),
    sa.Column('appropriation_year', sa.String(), autoincrement=False, nullable=True),
    sa.Column('created_by', sa.Integer(), autoincrement=False, nullable=True),
    sa.Column('updated_by', sa.Integer(), autoincrement=False, nullable=True),
    sa.Column('created_on', sa.DateTime(), autoincrement=False, nullable=True),
    sa.Column('updated_on', sa.DateTime(), autoincrement=False, nullable=True),
    sa.Column('transaction_id', sa.BigInteger(), autoincrement=False, nullable=False),
    sa.Column('end_transaction_id', sa.BigInteger(), nullable=True),
    sa.Column('operation_type', sa.SmallInteger(), nullable=False),
    sa.PrimaryKeyConstraint('id', 'transaction_id')
    )
    op.create_index(op.f('ix_can_appropriation_details_version_end_transaction_id'), 'can_appropriation_details_version', ['end_transaction_id'], unique=False)
    op.create_index(op.f('ix_can_appropriation_details_version_operation_type'), 'can_appropriation_details_version', ['operation_type'], unique=False)
    op.create_index(op.f('ix_can_appropriation_details_version_transaction_id'), 'can_appropriation_details_version', ['transaction_id'], unique=False)
    op.create_table('can_appropriation_details',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('appropriation_prefix', sa.String(), nullable=True),
    sa.Column('appropriation_postfix', sa.String(), nullable=True),
    sa.Column('appropriation_year', sa.String(), nullable=True),
    sa.Column('created_by', sa.Integer(), nullable=True),
    sa.Column('updated_by', sa.Integer(), nullable=True),
    sa.Column('created_on', sa.DateTime(), nullable=True),
    sa.Column('updated_on', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['created_by'], ['ops_user.id'], ),
    sa.ForeignKeyConstraint(['updated_by'], ['ops_user.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('can_appropriation_details')
    op.drop_index(op.f('ix_can_appropriation_details_version_transaction_id'), table_name='can_appropriation_details_version')
    op.drop_index(op.f('ix_can_appropriation_details_version_operation_type'), table_name='can_appropriation_details_version')
    op.drop_index(op.f('ix_can_appropriation_details_version_end_transaction_id'), table_name='can_appropriation_details_version')
    op.drop_table('can_appropriation_details_version')
    # ### end Alembic commands ###