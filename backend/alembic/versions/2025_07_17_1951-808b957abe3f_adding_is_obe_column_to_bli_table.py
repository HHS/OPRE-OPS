"""adding_is_obe_column_to_bli_table

Revision ID: 808b957abe3f
Revises: cac354dc41f5
Create Date: 2025-07-17 19:51:29.573469+00:00

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = '808b957abe3f'
down_revision: Union[str, None] = 'cac354dc41f5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('budget_line_item', sa.Column('is_obe', sa.Boolean(), nullable=True))
    op.add_column('budget_line_item_version', sa.Column('is_obe', sa.Boolean(), autoincrement=False, nullable=True))
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('budget_line_item_version', 'is_obe')
    op.drop_column('budget_line_item', 'is_obe')
    # ### end Alembic commands ###
