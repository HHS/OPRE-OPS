"""Adding service component name column to bli and sc for sort

Revision ID: 608b001a0415
Revises: 4d428009ff2a
Create Date: 2025-05-14 19:30:41.207629+00:00

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = '608b001a0415'
down_revision: Union[str, None] = '4d428009ff2a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('budget_line_item', sa.Column('service_component_name_for_sort', sa.String(), nullable=True))
    op.add_column('budget_line_item_version', sa.Column('service_component_name_for_sort', sa.String(), autoincrement=False, nullable=True))
    op.add_column('services_component', sa.Column('display_name_for_sort', sa.String(), nullable=True))
    op.add_column('services_component_version', sa.Column('display_name_for_sort', sa.String(), autoincrement=False, nullable=True))
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('services_component_version', 'display_name_for_sort')
    op.drop_column('services_component', 'display_name_for_sort')
    op.drop_column('budget_line_item_version', 'service_component_name_for_sort')
    op.drop_column('budget_line_item', 'service_component_name_for_sort')
    # ### end Alembic commands ###
