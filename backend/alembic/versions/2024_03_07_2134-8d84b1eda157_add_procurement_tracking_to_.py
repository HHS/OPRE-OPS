"""Add PROCUREMENT_TRACKING to WorkflowAction Enum

Revision ID: 8d84b1eda157
Revises: 2f078ae6d0fb
Create Date: 2024-03-07 21:34:31.691526+00:00

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from models import WorkflowAction

# revision identifiers, used by Alembic.
revision: str = "8d84b1eda157"
down_revision: Union[str, None] = "2f078ae6d0fb"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# based on https://stackoverflow.com/a/70133547
enum_name = WorkflowAction.mro()[0].__name__.lower()
enum_keys_to_add = [
    WorkflowAction.PROCUREMENT_TRACKING.name,
]


def upgrade() -> None:
    for v in enum_keys_to_add:
        op.execute(f"ALTER TYPE {enum_name} ADD VALUE '{v}'")


def downgrade() -> None:
    for v in enum_keys_to_add:
        sql = f"""DELETE FROM pg_enum
                WHERE enumlabel = '{v}'
                AND enumtypid = (
                  SELECT oid FROM pg_type WHERE typname = '{enum_name}'
                )"""
        op.execute(sql)
