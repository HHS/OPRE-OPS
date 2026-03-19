"""Add PRE_AWARD_CONSENSUS_MEMO document type

Revision ID: c9a1b2d3e4f5
Revises: b5f3e9a8c4d1
Create Date: 2026-03-18 01:45:00.000000+00:00

"""
from typing import Sequence, Union

from alembic import op
from alembic_postgresql_enum import TableReference


# revision identifiers, used by Alembic.
revision: str = 'c9a1b2d3e4f5'
down_revision: Union[str, None] = 'b5f3e9a8c4d1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add PRE_AWARD_CONSENSUS_MEMO to the documenttype enum
    op.sync_enum_values(
        enum_schema="ops",
        enum_name="documenttype",
        new_values=[
            "CERTIFICATION_OF_FUNDING",
            "STATEMENT_OF_REQUIREMENTS",
            "ITAR_CHECKLIST_FOR_ALL_IT_PROCUREMENT_ACTIONS",
            "INDEPENDENT_GOVERNMENT_COST_ESTIMATE",
            "SECTION_508_EXCEPTION_DOCUMENTATION",
            "COR_NOMINATION_AND_CERTIFICATION_DOCUMENT",
            "PRE_AWARD_CONSENSUS_MEMO",
            "ADDITIONAL_DOCUMENT",
        ],
        affected_columns=[
            TableReference(table_schema="ops", table_name="document", column_name="document_type"),
            TableReference(table_schema="ops", table_name="document_version", column_name="document_type"),
        ],
        enum_values_to_rename=[],
    )


def downgrade() -> None:
    # Remove PRE_AWARD_CONSENSUS_MEMO from the documenttype enum
    op.sync_enum_values(
        enum_schema="ops",
        enum_name="documenttype",
        new_values=[
            "CERTIFICATION_OF_FUNDING",
            "STATEMENT_OF_REQUIREMENTS",
            "ITAR_CHECKLIST_FOR_ALL_IT_PROCUREMENT_ACTIONS",
            "INDEPENDENT_GOVERNMENT_COST_ESTIMATE",
            "SECTION_508_EXCEPTION_DOCUMENTATION",
            "COR_NOMINATION_AND_CERTIFICATION_DOCUMENT",
            "ADDITIONAL_DOCUMENT",
        ],
        affected_columns=[
            TableReference(table_schema="ops", table_name="document", column_name="document_type"),
            TableReference(table_schema="ops", table_name="document_version", column_name="document_type"),
        ],
        enum_values_to_rename=[],
    )
