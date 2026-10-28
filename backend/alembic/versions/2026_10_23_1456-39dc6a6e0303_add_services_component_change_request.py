"""add services component change request

OPS-6440 (AC6): Services Component add change requests on Awarded agreements.
Adds the SERVICES_COMPONENT_CHANGE_REQUEST change request type, change_request.services_component_id
(with a partial unique index allowing one in-review SC change request per SC),
services_component.awaiting_add_approval, and contract_modification_edit.services_component_id.
Autogenerate also reported unrelated pre-existing drift (vendor_version, notification and
project_history indexes, procurement_tracker_step FKs, opseventtype ordering); that was removed.

Revision ID: 39dc6a6e0303
Revises: a73a897bb0db
Create Date: 2026-10-23 14:56:41.000000+00:00

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from alembic_postgresql_enum import TableReference

# revision identifiers, used by Alembic.
revision: str = "39dc6a6e0303"
down_revision: Union[str, None] = "a73a897bb0db"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

OLD_CHANGE_REQUEST_TYPES = [
    "CHANGE_REQUEST",
    "AGREEMENT_CHANGE_REQUEST",
    "BUDGET_LINE_ITEM_CHANGE_REQUEST",
]
NEW_CHANGE_REQUEST_TYPES = OLD_CHANGE_REQUEST_TYPES + ["SERVICES_COMPONENT_CHANGE_REQUEST"]


def _sync_change_request_types(values) -> None:
    op.sync_enum_values(
        enum_schema="ops",
        enum_name="changerequesttype",
        new_values=values,
        affected_columns=[
            TableReference(table_schema="ops", table_name="change_request", column_name="change_request_type"),
            TableReference(table_schema="ops", table_name="change_request_version", column_name="change_request_type"),
        ],
        enum_values_to_rename=[],
    )


def upgrade() -> None:
    _sync_change_request_types(NEW_CHANGE_REQUEST_TYPES)

    op.add_column("change_request", sa.Column("services_component_id", sa.Integer(), nullable=True))
    op.create_index(
        op.f("ix_change_request_services_component_id"), "change_request", ["services_component_id"], unique=False
    )
    op.create_foreign_key(
        "fk_change_request_services_component_id",
        "change_request",
        "services_component",
        ["services_component_id"],
        ["id"],
        ondelete="SET NULL",
    )
    # This index's WHERE clause compares against the changerequesttype enum, so a later
    # sync_enum_values on that type must list it in indexes_to_recreate.
    op.create_index(
        "ix_change_request_one_in_review_per_services_component",
        "change_request",
        ["services_component_id"],
        unique=True,
        postgresql_where=sa.text("status = 'IN_REVIEW' AND change_request_type = 'SERVICES_COMPONENT_CHANGE_REQUEST'"),
    )
    op.add_column(
        "change_request_version",
        sa.Column("services_component_id", sa.Integer(), autoincrement=False, nullable=True),
    )
    op.create_index(
        op.f("ix_change_request_version_services_component_id"),
        "change_request_version",
        ["services_component_id"],
        unique=False,
    )

    op.add_column(
        "services_component",
        sa.Column("awaiting_add_approval", sa.Boolean(), server_default="false", nullable=False),
    )
    op.add_column(
        "services_component_version",
        sa.Column("awaiting_add_approval", sa.Boolean(), server_default="false", autoincrement=False, nullable=True),
    )

    op.add_column("contract_modification_edit", sa.Column("services_component_id", sa.Integer(), nullable=True))
    op.add_column(
        "contract_modification_edit_version",
        sa.Column("services_component_id", sa.Integer(), autoincrement=False, nullable=True),
    )


def downgrade() -> None:
    op.drop_column("contract_modification_edit_version", "services_component_id")
    op.drop_column("contract_modification_edit", "services_component_id")

    op.drop_column("services_component_version", "awaiting_add_approval")
    op.drop_column("services_component", "awaiting_add_approval")

    op.drop_index(op.f("ix_change_request_version_services_component_id"), table_name="change_request_version")
    op.drop_column("change_request_version", "services_component_id")
    op.drop_index("ix_change_request_one_in_review_per_services_component", table_name="change_request")
    op.drop_constraint("fk_change_request_services_component_id", "change_request", type_="foreignkey")
    op.drop_index(op.f("ix_change_request_services_component_id"), table_name="change_request")
    op.drop_column("change_request", "services_component_id")

    op.execute("DELETE FROM ops.change_request WHERE change_request_type = 'SERVICES_COMPONENT_CHANGE_REQUEST'")
    op.execute("DELETE FROM ops.change_request_version WHERE change_request_type = 'SERVICES_COMPONENT_CHANGE_REQUEST'")
    _sync_change_request_types(OLD_CHANGE_REQUEST_TYPES)
