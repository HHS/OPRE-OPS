"""Add vendor_type to vendor table

Revision ID: d67e125881ac
Revises: 13d45ff8c225
Create Date: 2026-06-16 22:40:00.000000+00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd67e125881ac'
down_revision: Union[str, None] = '13d45ff8c225'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create enum type
    vendor_type_enum = sa.Enum(
        'SMALL_BUSINESS',
        'EIGHT_A',
        'HUBZONE',
        'WOMAN_OWNED',
        'VETERAN_OWNED',
        'SERVICE_DISABLED_VETERAN_OWNED',
        'LARGE_BUSINESS',
        'OTHER',
        name='vendortype'
    )
    vendor_type_enum.create(op.get_bind())

    # Add vendor_type column to main table
    op.add_column('vendor',
                  sa.Column('vendor_type', vendor_type_enum, nullable=True))

    # Add vendor_type column to version table (audit history)
    op.add_column('vendor_version',
                  sa.Column('vendor_type', sa.String(), autoincrement=False, nullable=True))


def downgrade() -> None:
    # Drop vendor_type column from version table
    op.drop_column('vendor_version', 'vendor_type')

    # Drop vendor_type column from main table
    op.drop_column('vendor', 'vendor_type')

    # Drop enum type
    sa.Enum(
        'SMALL_BUSINESS',
        'EIGHT_A',
        'HUBZONE',
        'WOMAN_OWNED',
        'VETERAN_OWNED',
        'SERVICE_DISABLED_VETERAN_OWNED',
        'LARGE_BUSINESS',
        'OTHER',
        name='vendortype'
    ).drop(op.get_bind())
