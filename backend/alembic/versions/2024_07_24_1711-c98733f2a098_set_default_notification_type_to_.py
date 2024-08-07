"""Set default notification_type to NOTIFICATION

Revision ID: c98733f2a098
Revises: de9beb904925
Create Date: 2024-07-24 17:11:36.839644+00:00

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "c98733f2a098"
down_revision: Union[str, None] = "de9beb904925"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.alter_column(
        "notification",
        "notification_type",
        existing_type=postgresql.ENUM(
            "NOTIFICATION", "CHANGE_REQUEST_NOTIFICATION", name="notificationtype"
        ),
        server_default="NOTIFICATION",
        existing_nullable=False,
    )
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.alter_column(
        "notification",
        "notification_type",
        existing_type=postgresql.ENUM(
            "NOTIFICATION", "CHANGE_REQUEST_NOTIFICATION", name="notificationtype"
        ),
        server_default=None,
        existing_nullable=False,
    )
    # ### end Alembic commands ###
