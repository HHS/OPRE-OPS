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
    # Null out string ALN values before altering back to INTEGER[] — "93.086"
    # cannot be cast to integer, so any existing string data must be cleared first.
    op.execute("UPDATE grant_agreement SET aln_numbers = NULL")
    op.execute("UPDATE grant_agreement_version SET aln_numbers = NULL")
    op.alter_column(
        "grant_agreement",
        "aln_numbers",
        type_=postgresql.ARRAY(sa.Integer()),
        postgresql_using="aln_numbers::INTEGER[]",
    )
    op.alter_column(
        "grant_agreement_version",
        "aln_numbers",
        type_=postgresql.ARRAY(sa.Integer()),
        postgresql_using="aln_numbers::INTEGER[]",
    )
