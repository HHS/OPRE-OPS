"""add grant number

Revision ID: e1f2a3b4c5d6
Revises: c1d2e3f4a5b6
Create Date: 2026-07-16 14:00:00.000000+00:00

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from alembic_postgresql_enum import TableReference

# revision identifiers, used by Alembic.
revision: str = "e1f2a3b4c5d6"
down_revision: Union[str, None] = "c1d2e3f4a5b6"
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
]

NEW_EVENT_TYPES = OLD_EVENT_TYPES + [
    "CREATE_GRANT_NUMBER",
    "UPDATE_GRANT_NUMBER",
    "DELETE_GRANT_NUMBER",
]

GRANT_NUMBER_PERMISSIONS = [
    "GET_GRANT_NUMBER",
    "POST_GRANT_NUMBER",
    "PUT_GRANT_NUMBER",
    "PATCH_GRANT_NUMBER",
    "DELETE_GRANT_NUMBER",
]


def upgrade() -> None:
    op.create_table(
        "grant_number",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("number", sa.Integer(), nullable=False),
        sa.Column("description", sa.String(), nullable=True),
        sa.Column("period_start", sa.Date(), nullable=True),
        sa.Column("period_end", sa.Date(), nullable=True),
        sa.Column("agreement_id", sa.Integer(), nullable=False),
        sa.Column("created_by", sa.Integer(), nullable=True),
        sa.Column("updated_by", sa.Integer(), nullable=True),
        sa.Column("created_on", sa.DateTime(), nullable=True),
        sa.Column("updated_on", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["agreement_id"], ["agreement.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["created_by"], ["ops_user.id"]),
        sa.ForeignKeyConstraint(["updated_by"], ["ops_user.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_grant_number_unique",
        "grant_number",
        ["agreement_id", "number"],
        unique=True,
    )

    op.create_table(
        "grant_number_version",
        sa.Column("id", sa.Integer(), autoincrement=False, nullable=False),
        sa.Column("number", sa.Integer(), autoincrement=False, nullable=True),
        sa.Column("description", sa.String(), autoincrement=False, nullable=True),
        sa.Column("period_start", sa.Date(), autoincrement=False, nullable=True),
        sa.Column("period_end", sa.Date(), autoincrement=False, nullable=True),
        sa.Column("agreement_id", sa.Integer(), autoincrement=False, nullable=True),
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
        "ix_grant_number_version_end_transaction_id",
        "grant_number_version",
        ["end_transaction_id"],
        unique=False,
    )
    op.create_index(
        "ix_grant_number_version_operation_type",
        "grant_number_version",
        ["operation_type"],
        unique=False,
    )
    op.create_index(
        "ix_grant_number_version_transaction_id",
        "grant_number_version",
        ["transaction_id"],
        unique=False,
    )

    op.sync_enum_values(
        enum_schema="ops",
        enum_name="opseventtype",
        new_values=NEW_EVENT_TYPES,
        affected_columns=[
            TableReference(table_schema="ops", table_name="ops_event", column_name="event_type"),
            TableReference(table_schema="ops", table_name="ops_event_version", column_name="event_type"),
        ],
        enum_values_to_rename=[],
    )

    # Grant every role that currently holds the matching *_SERVICES_COMPONENT permission
    # the equivalent *_GRANT_NUMBER permission, computed live from each role's permissions
    # array rather than a hardcoded role-name list, so this stays correct even if roles are
    # added/changed independently of this migration.
    for gn_perm in GRANT_NUMBER_PERMISSIONS:
        sc_perm = gn_perm.replace("GRANT_NUMBER", "SERVICES_COMPONENT")
        op.execute(sa.text("""
                UPDATE ops.role
                SET permissions = array_append(permissions, :gn_perm)
                WHERE :sc_perm = ANY(permissions)
                  AND NOT (:gn_perm = ANY(permissions))
                """).bindparams(gn_perm=gn_perm, sc_perm=sc_perm))


def downgrade() -> None:
    for perm in GRANT_NUMBER_PERMISSIONS:
        op.execute(sa.text("""
                UPDATE ops.role
                SET permissions = array_remove(permissions, :perm)
                """).bindparams(perm=perm))

    op.sync_enum_values(
        enum_schema="ops",
        enum_name="opseventtype",
        new_values=OLD_EVENT_TYPES,
        affected_columns=[
            TableReference(table_schema="ops", table_name="ops_event", column_name="event_type"),
            TableReference(table_schema="ops", table_name="ops_event_version", column_name="event_type"),
        ],
        enum_values_to_rename=[],
    )

    op.drop_index("ix_grant_number_version_transaction_id", table_name="grant_number_version")
    op.drop_index("ix_grant_number_version_operation_type", table_name="grant_number_version")
    op.drop_index("ix_grant_number_version_end_transaction_id", table_name="grant_number_version")
    op.drop_table("grant_number_version")

    op.drop_index("ix_grant_number_unique", table_name="grant_number")
    op.drop_table("grant_number")
