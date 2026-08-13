"""Replace aln_number string field with aln_numbers integer array

Revision ID: b8c9d0e1f2a3
Revises: 5bbc500dc6a1
Create Date: 2026-08-04 13:00:00.000000+00:00

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "b8c9d0e1f2a3"
down_revision: Union[str, None] = "5bbc500dc6a1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_column("grant_agreement", "aln_number")
    op.add_column("grant_agreement", sa.Column("aln_numbers", postgresql.ARRAY(sa.Integer()), nullable=True))
    op.drop_column("grant_agreement_version", "aln_number")
    op.add_column(
        "grant_agreement_version",
        sa.Column("aln_numbers", postgresql.ARRAY(sa.Integer()), autoincrement=False, nullable=True),
    )


def downgrade() -> None:
    op.drop_column("grant_agreement_version", "aln_numbers")
    op.add_column(
        "grant_agreement_version",
        sa.Column("aln_number", sa.String(), autoincrement=False, nullable=True),
    )
    op.drop_column("grant_agreement", "aln_numbers")
    op.add_column("grant_agreement", sa.Column("aln_number", sa.String(), nullable=True))
