"""add can funding details edited history type

Revision ID: 5bbc500dc6a1
Revises: a7c3f1e9b2d4
Create Date: 2026-08-07 05:53:26.415481+00:00

"""

from typing import Sequence, Union

from alembic import op
from alembic_postgresql_enum import TableReference

# revision identifiers, used by Alembic.
revision: str = "5bbc500dc6a1"
down_revision: Union[str, None] = "a7c3f1e9b2d4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.sync_enum_values(
        enum_schema="ops",
        enum_name="canhistorytype",
        new_values=[
            "CAN_DATA_IMPORT",
            "CAN_NICKNAME_EDITED",
            "CAN_DESCRIPTION_EDITED",
            "CAN_FUNDING_CREATED",
            "CAN_RECEIVED_CREATED",
            "CAN_FUNDING_EDITED",
            "CAN_RECEIVED_EDITED",
            "CAN_FUNDING_DELETED",
            "CAN_RECEIVED_DELETED",
            "CAN_PORTFOLIO_CREATED",
            "CAN_PORTFOLIO_DELETED",
            "CAN_PORTFOLIO_EDITED",
            "CAN_DIVISION_CREATED",
            "CAN_DIVISION_DELETED",
            "CAN_DIVISION_EDITED",
            "CAN_CARRY_FORWARD_CALCULATED",
            "CAN_FUNDING_DETAILS_EDITED",
        ],
        affected_columns=[
            TableReference(table_schema="ops", table_name="can_history", column_name="history_type"),
            TableReference(table_schema="ops", table_name="can_history_version", column_name="history_type"),
        ],
        enum_values_to_rename=[],
    )


def downgrade() -> None:
    op.sync_enum_values(
        enum_schema="ops",
        enum_name="canhistorytype",
        new_values=[
            "CAN_DATA_IMPORT",
            "CAN_NICKNAME_EDITED",
            "CAN_DESCRIPTION_EDITED",
            "CAN_FUNDING_CREATED",
            "CAN_RECEIVED_CREATED",
            "CAN_FUNDING_EDITED",
            "CAN_RECEIVED_EDITED",
            "CAN_FUNDING_DELETED",
            "CAN_RECEIVED_DELETED",
            "CAN_PORTFOLIO_CREATED",
            "CAN_PORTFOLIO_DELETED",
            "CAN_PORTFOLIO_EDITED",
            "CAN_DIVISION_CREATED",
            "CAN_DIVISION_DELETED",
            "CAN_DIVISION_EDITED",
            "CAN_CARRY_FORWARD_CALCULATED",
        ],
        affected_columns=[
            TableReference(table_schema="ops", table_name="can_history", column_name="history_type"),
            TableReference(table_schema="ops", table_name="can_history_version", column_name="history_type"),
        ],
        enum_values_to_rename=[],
    )
