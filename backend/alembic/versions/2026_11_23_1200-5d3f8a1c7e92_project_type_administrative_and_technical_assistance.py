"""rename ADMINISTRATIVE_AND_SUPPORT project type to ADMINISTRATIVE, add TECHNICAL_ASSISTANCE

The client renamed the "Administrative and Support" project type to "Administrative" and added a
third type, "Technical Assistance".

* ``projecttype`` enum: ``ADMINISTRATIVE_AND_SUPPORT`` is renamed in place to ``ADMINISTRATIVE``
  (metadata-only; no rows are rewritten, so ``project_version`` rows keep their stored values and
  simply read as the new name), and ``TECHNICAL_ASSISTANCE`` is added.
* ``technical_assistance_project`` (+ ``_version``) joined-table subclass of ``project``, mirroring
  ``administrative_and_support_project``. The administrative table keeps its name.

Downgrade: Postgres cannot drop an enum value, so ``TECHNICAL_ASSISTANCE`` stays in the type. Live
technical assistance projects are converted to administrative projects first, because the previous
code has no way to represent them. ``project_version`` rows are left untouched.

Revision ID: 5d3f8a1c7e92
Revises: ceb87e4d5c89
Create Date: 2026-11-23 12:00:00.000000+00:00

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "5d3f8a1c7e92"
down_revision: Union[str, None] = "ceb87e4d5c89"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

TABLE = "technical_assistance_project"
VERSION_TABLE = "technical_assistance_project_version"


def upgrade() -> None:
    op.execute("ALTER TYPE projecttype RENAME VALUE 'ADMINISTRATIVE_AND_SUPPORT' TO 'ADMINISTRATIVE'")
    op.execute("ALTER TYPE projecttype ADD VALUE IF NOT EXISTS 'TECHNICAL_ASSISTANCE'")

    op.create_table(
        TABLE,
        sa.Column("id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["id"], ["project.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        VERSION_TABLE,
        sa.Column("id", sa.Integer(), autoincrement=False, nullable=False),
        sa.Column("transaction_id", sa.BigInteger(), autoincrement=False, nullable=False),
        sa.Column("end_transaction_id", sa.BigInteger(), nullable=True),
        sa.Column("operation_type", sa.SmallInteger(), nullable=False),
        sa.PrimaryKeyConstraint("id", "transaction_id"),
    )
    op.create_index(op.f(f"ix_{VERSION_TABLE}_end_transaction_id"), VERSION_TABLE, ["end_transaction_id"])
    op.create_index(op.f(f"ix_{VERSION_TABLE}_operation_type"), VERSION_TABLE, ["operation_type"])
    op.create_index(op.f(f"ix_{VERSION_TABLE}_transaction_id"), VERSION_TABLE, ["transaction_id"])


def downgrade() -> None:
    # The old code has no technical assistance type: fold live TA projects into administrative.
    op.execute("INSERT INTO administrative_and_support_project (id) SELECT id FROM technical_assistance_project")
    op.execute("UPDATE project SET project_type = 'ADMINISTRATIVE' WHERE project_type = 'TECHNICAL_ASSISTANCE'")

    op.drop_index(op.f(f"ix_{VERSION_TABLE}_transaction_id"), table_name=VERSION_TABLE)
    op.drop_index(op.f(f"ix_{VERSION_TABLE}_operation_type"), table_name=VERSION_TABLE)
    op.drop_index(op.f(f"ix_{VERSION_TABLE}_end_transaction_id"), table_name=VERSION_TABLE)
    op.drop_table(VERSION_TABLE)
    op.drop_table(TABLE)

    op.execute("ALTER TYPE projecttype RENAME VALUE 'ADMINISTRATIVE' TO 'ADMINISTRATIVE_AND_SUPPORT'")
