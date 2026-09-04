"""Change aln_numbers from integer array to string array

Revision ID: c9d0e1f2a3b4
Revises: b8c9d0e1f2a3
Create Date: 2026-09-03 12:00:00.000000+00:00

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "c9d0e1f2a3b4"
down_revision: Union[str, None] = "b8c9d0e1f2a3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        "grant_agreement",
        "aln_numbers",
        type_=postgresql.ARRAY(sa.String()),
        postgresql_using="aln_numbers::VARCHAR[]",
    )
    op.alter_column(
        "grant_agreement_version",
        "aln_numbers",
        type_=postgresql.ARRAY(sa.String()),
        postgresql_using="aln_numbers::VARCHAR[]",
    )


def downgrade() -> None:
    # One-way migration: once string ALN values like "93.086" are written,
    # casting back to INTEGER[] would raise a PostgreSQL type error.
    # To downgrade, truncate or null out aln_numbers data first.
    raise NotImplementedError("Downgrade not supported: string ALN values cannot be cast back to INTEGER[]")
