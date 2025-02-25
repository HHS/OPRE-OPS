"""updating CAN Funding Source enum

Revision ID: 6e35b193a666
Revises: 0536c9a5d32e
Create Date: 2025-01-21 06:19:03.550866+00:00

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from alembic_postgresql_enum import TableReference

# revision identifiers, used by Alembic.
revision: str = '6e35b193a666'
down_revision: Union[str, None] = '0536c9a5d32e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.sync_enum_values(
        enum_schema='ops',
        enum_name='canfundingsource',
        new_values=['OPRE', 'ACF', 'ACF_MOU', 'HHS', 'OTHER'],
        affected_columns=[TableReference(table_schema='ops', table_name='can_funding_details', column_name='funding_source'), TableReference(table_schema='ops', table_name='can_funding_details_version', column_name='funding_source')],
        enum_values_to_rename=[],
    )
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.sync_enum_values(
        enum_schema='ops',
        enum_name='canfundingsource',
        new_values=['OPRE', 'ACF', 'HHS'],
        affected_columns=[TableReference(table_schema='ops', table_name='can_funding_details', column_name='funding_source'), TableReference(table_schema='ops', table_name='can_funding_details_version', column_name='funding_source')],
        enum_values_to_rename=[],
    )
    # ### end Alembic commands ###
