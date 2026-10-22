"""add contract_modification_edit

OPS-3072 (AC9): table for approved edits on Awarded agreements that require a contract
modification, plus the START_CONTRACT_MODIFICATION event and CONTRACT_MODIFICATION_STARTED
agreement history types. Autogenerate also reported unrelated pre-existing drift
(vendor_version, project_history indexes, procurement_tracker_step); that was removed.

Revision ID: 158fdbfa2907
Revises: 7486206382be
Create Date: 2026-10-20 19:08:19.130154+00:00

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from alembic_postgresql_enum import TableReference
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "158fdbfa2907"
down_revision: Union[str, None] = "7486206382be"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


OLD_EVENT_TYPES = [
    "CREATE_BLI",
    "UPDATE_BLI",
    "DELETE_BLI",
    "SEND_BLI_FOR_APPROVAL",
    "CREATE_PROJECT",
    "UPDATE_PROJECT",
    "GET_AGREEMENT",
    "CREATE_NEW_AGREEMENT",
    "UPDATE_AGREEMENT",
    "DELETE_AGREEMENT",
    "CREATE_NEW_CAN",
    "UPDATE_CAN",
    "DELETE_CAN",
    "CREATE_CAN_FUNDING_RECEIVED",
    "UPDATE_CAN_FUNDING_RECEIVED",
    "DELETE_CAN_FUNDING_RECEIVED",
    "CREATE_CAN_FUNDING_BUDGET",
    "UPDATE_CAN_FUNDING_BUDGET",
    "DELETE_CAN_FUNDING_BUDGET",
    "CREATE_CAN_FUNDING_DETAILS",
    "UPDATE_CAN_FUNDING_DETAILS",
    "DELETE_CAN_FUNDING_DETAILS",
    "ACKNOWLEDGE_NOTIFICATION",
    "CREATE_BLI_PACKAGE",
    "UPDATE_BLI_PACKAGE",
    "CREATE_SERVICES_COMPONENT",
    "UPDATE_SERVICES_COMPONENT",
    "DELETE_SERVICES_COMPONENT",
    "CREATE_PROCUREMENT_ACQUISITION_PLANNING",
    "UPDATE_PROCUREMENT_ACQUISITION_PLANNING",
    "DELETE_PROCUREMENT_ACQUISITION_PLANNING",
    "CREATE_DOCUMENT",
    "UPDATE_DOCUMENT",
    "LOGIN_ATTEMPT",
    "LOGOUT",
    "IDLE_LOGOUT",
    "GET_USER_DETAILS",
    "CREATE_USER",
    "UPDATE_USER",
    "DEACTIVATE_USER",
    "CREATE_PORTFOLIO_URL",
    "UPDATE_PORTFOLIO_URL",
    "DELETE_PORTFOLIO_URL",
    "CREATE_CHANGE_REQUEST",
    "UPDATE_CHANGE_REQUEST",
    "DELETE_CHANGE_REQUEST",
    "CREATE_PROCUREMENT_SHOP",
    "UPDATE_PROCUREMENT_SHOP",
    "DELETE_PROCUREMENT_SHOP",
    "CREATE_ROLE",
    "UPDATE_ROLE",
    "DELETE_ROLE",
    "CREATE_USER_SESSION",
    "UPDATE_USER_SESSION",
    "DELETE_USER_SESSION",
    "CREATE_PROCUREMENT_TRACKER",
    "UPDATE_PROCUREMENT_TRACKER",
    "DELETE_PROCUREMENT_TRACKER",
    "UPDATE_PROCUREMENT_TRACKER_STEP",
    "CREATE_PROCUREMENT_ACTION",
    "UPDATE_PROCUREMENT_ACTION",
    "DELETE_PROCUREMENT_ACTION",
    "CREATE_GRANT_NUMBER",
    "UPDATE_GRANT_NUMBER",
    "DELETE_GRANT_NUMBER",
]
NEW_EVENT_TYPES = OLD_EVENT_TYPES + ["START_CONTRACT_MODIFICATION"]

OLD_HISTORY_TYPES = [
    "AGREEMENT_CREATED",
    "AGREEMENT_UPDATED",
    "AGREEMENT_DELETED",
    "BUDGET_LINE_ITEM_CREATED",
    "BUDGET_LINE_ITEM_UPDATED",
    "BUDGET_LINE_ITEM_DELETED",
    "CHANGE_REQUEST_CREATED",
    "CHANGE_REQUEST_UPDATED",
    "CHANGE_REQUEST_DELETED",
    "PROCUREMENT_SHOP_UPDATED",
    "PROCUREMENT_TRACKER_STEP_UPDATED",
    "SERVICE_COMPONENT_CREATED",
    "SERVICE_COMPONENT_UPDATED",
    "SERVICE_COMPONENT_DELETED",
    "GRANT_NUMBER_CREATED",
    "GRANT_NUMBER_UPDATED",
    "GRANT_NUMBER_DELETED",
]
NEW_HISTORY_TYPES = OLD_HISTORY_TYPES + ["CONTRACT_MODIFICATION_STARTED"]


def _sync_enums(event_types, history_types) -> None:
    op.sync_enum_values(
        enum_schema="ops",
        enum_name="opseventtype",
        new_values=event_types,
        affected_columns=[
            TableReference(table_schema="ops", table_name="ops_event", column_name="event_type"),
            TableReference(table_schema="ops", table_name="ops_event_version", column_name="event_type"),
        ],
        enum_values_to_rename=[],
    )
    op.sync_enum_values(
        enum_schema="ops",
        enum_name="agreementhistorytype",
        new_values=history_types,
        affected_columns=[
            TableReference(table_schema="ops", table_name="agreement_history", column_name="history_type"),
            TableReference(table_schema="ops", table_name="agreement_history_version", column_name="history_type"),
        ],
        enum_values_to_rename=[],
    )


def upgrade() -> None:
    sa.Enum("MODIFIED_LOE", name="modificationedittype").create(op.get_bind())
    op.create_table(
        "contract_modification_edit_version",
        sa.Column("id", sa.Integer(), autoincrement=False, nullable=False),
        sa.Column("agreement_id", sa.Integer(), autoincrement=False, nullable=True),
        sa.Column(
            "modification_type",
            postgresql.ENUM("MODIFIED_LOE", name="modificationedittype", create_type=False),
            autoincrement=False,
            nullable=True,
        ),
        sa.Column("change_request_id", sa.Integer(), autoincrement=False, nullable=True),
        sa.Column("budget_line_item_id", sa.Integer(), autoincrement=False, nullable=True),
        sa.Column("field", sa.String(), autoincrement=False, nullable=True),
        sa.Column("old_value", postgresql.JSONB(astext_type=sa.Text()), autoincrement=False, nullable=True),
        sa.Column("new_value", postgresql.JSONB(astext_type=sa.Text()), autoincrement=False, nullable=True),
        sa.Column("requested_by_id", sa.Integer(), autoincrement=False, nullable=True),
        sa.Column("requested_on", sa.DateTime(), autoincrement=False, nullable=True),
        sa.Column("approved_by_id", sa.Integer(), autoincrement=False, nullable=True),
        sa.Column("approved_on", sa.DateTime(), autoincrement=False, nullable=True),
        sa.Column("agreement_mod_id", sa.Integer(), autoincrement=False, nullable=True),
        sa.Column("created_by", sa.Integer(), autoincrement=False, nullable=True),
        sa.Column("updated_by", sa.Integer(), autoincrement=False, nullable=True),
        sa.Column("created_on", sa.DateTime(), autoincrement=False, nullable=True),
        sa.Column("updated_on", sa.DateTime(), autoincrement=False, nullable=True),
        sa.Column("transaction_id", sa.BigInteger(), autoincrement=False, nullable=False),
        sa.Column("end_transaction_id", sa.BigInteger(), nullable=True),
        sa.Column("operation_type", sa.SmallInteger(), nullable=False),
        sa.PrimaryKeyConstraint("id", "transaction_id"),
    )
    op.create_index(
        op.f("ix_contract_modification_edit_version_agreement_id"),
        "contract_modification_edit_version",
        ["agreement_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_contract_modification_edit_version_agreement_mod_id"),
        "contract_modification_edit_version",
        ["agreement_mod_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_contract_modification_edit_version_end_transaction_id"),
        "contract_modification_edit_version",
        ["end_transaction_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_contract_modification_edit_version_operation_type"),
        "contract_modification_edit_version",
        ["operation_type"],
        unique=False,
    )
    op.create_index(
        op.f("ix_contract_modification_edit_version_transaction_id"),
        "contract_modification_edit_version",
        ["transaction_id"],
        unique=False,
    )
    op.create_table(
        "contract_modification_edit",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("agreement_id", sa.Integer(), nullable=False),
        sa.Column(
            "modification_type",
            postgresql.ENUM("MODIFIED_LOE", name="modificationedittype", create_type=False),
            nullable=False,
        ),
        sa.Column("change_request_id", sa.Integer(), nullable=True),
        sa.Column("budget_line_item_id", sa.Integer(), nullable=True),
        sa.Column("field", sa.String(), nullable=False),
        sa.Column("old_value", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("new_value", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("requested_by_id", sa.Integer(), nullable=True),
        sa.Column("requested_on", sa.DateTime(), nullable=True),
        sa.Column("approved_by_id", sa.Integer(), nullable=True),
        sa.Column("approved_on", sa.DateTime(), nullable=True),
        sa.Column("agreement_mod_id", sa.Integer(), nullable=True),
        sa.Column("created_by", sa.Integer(), nullable=True),
        sa.Column("updated_by", sa.Integer(), nullable=True),
        sa.Column("created_on", sa.DateTime(), nullable=True),
        sa.Column("updated_on", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["agreement_id"], ["agreement.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["agreement_mod_id"], ["agreement_mod.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(
            ["approved_by_id"],
            ["ops_user.id"],
        ),
        sa.ForeignKeyConstraint(["change_request_id"], ["change_request.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(
            ["created_by"],
            ["ops_user.id"],
        ),
        sa.ForeignKeyConstraint(
            ["requested_by_id"],
            ["ops_user.id"],
        ),
        sa.ForeignKeyConstraint(
            ["updated_by"],
            ["ops_user.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_contract_modification_edit_agreement_id"), "contract_modification_edit", ["agreement_id"], unique=False
    )
    op.create_index(
        op.f("ix_contract_modification_edit_agreement_mod_id"),
        "contract_modification_edit",
        ["agreement_mod_id"],
        unique=False,
    )

    _sync_enums(NEW_EVENT_TYPES, NEW_HISTORY_TYPES)


def downgrade() -> None:
    op.execute("DELETE FROM ops.agreement_history WHERE history_type = 'CONTRACT_MODIFICATION_STARTED'")
    op.execute("DELETE FROM ops.agreement_history_version WHERE history_type = 'CONTRACT_MODIFICATION_STARTED'")
    op.execute("DELETE FROM ops.ops_event WHERE event_type = 'START_CONTRACT_MODIFICATION'")
    op.execute("DELETE FROM ops.ops_event_version WHERE event_type = 'START_CONTRACT_MODIFICATION'")
    _sync_enums(OLD_EVENT_TYPES, OLD_HISTORY_TYPES)

    op.drop_index(op.f("ix_contract_modification_edit_agreement_mod_id"), table_name="contract_modification_edit")
    op.drop_index(op.f("ix_contract_modification_edit_agreement_id"), table_name="contract_modification_edit")
    op.drop_table("contract_modification_edit")
    op.drop_index(
        op.f("ix_contract_modification_edit_version_transaction_id"), table_name="contract_modification_edit_version"
    )
    op.drop_index(
        op.f("ix_contract_modification_edit_version_operation_type"), table_name="contract_modification_edit_version"
    )
    op.drop_index(
        op.f("ix_contract_modification_edit_version_end_transaction_id"),
        table_name="contract_modification_edit_version",
    )
    op.drop_index(
        op.f("ix_contract_modification_edit_version_agreement_mod_id"), table_name="contract_modification_edit_version"
    )
    op.drop_index(
        op.f("ix_contract_modification_edit_version_agreement_id"), table_name="contract_modification_edit_version"
    )
    op.drop_table("contract_modification_edit_version")
    sa.Enum("MODIFIED_LOE", name="modificationedittype").drop(op.get_bind())
