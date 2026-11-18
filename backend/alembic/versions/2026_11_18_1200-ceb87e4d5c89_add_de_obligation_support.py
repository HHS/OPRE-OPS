"""add de-obligation support

OPS-6488: submitting a de-obligation request on an Obligated budget line. Adds the
DE_OBLIGATION modificationedittype value, the SUBMIT_DE_OBLIGATION opseventtype value, and a
requested_de_obligation_amount column on budget_line_item that the Agreement's totals net
against while the request is pending review. The real BudgetLineItem.amount is never mutated
by this; that's OPS-6489's job.

Revision ID: ceb87e4d5c89
Revises: 3581b3cbad42
Create Date: 2026-11-18 12:00:00.000000+00:00

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from alembic_postgresql_enum import TableReference
from alembic_postgresql_enum.sql_commands.indexes import TableIndex

# revision identifiers, used by Alembic.
revision: str = "ceb87e4d5c89"
down_revision: Union[str, None] = "3581b3cbad42"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

OLD_MODIFICATION_EDIT_TYPES = ["MODIFIED_LOE", "ADMIN_CHANGE"]
NEW_MODIFICATION_EDIT_TYPES = OLD_MODIFICATION_EDIT_TYPES + ["DE_OBLIGATION"]

# This index's WHERE clause compares against the modificationedittype enum (added by the
# ADMIN_CHANGE migration), so syncing that enum's values must pass it here or Postgres refuses
# to drop the old enum type's comparison operator ("other objects depend on it").
PENDING_COR_INDEX = TableIndex(
    name="ix_contract_modification_edit_one_pending_cor_change",
    definition=(
        "CREATE UNIQUE INDEX ix_contract_modification_edit_one_pending_cor_change "
        "ON ops.contract_modification_edit USING btree (agreement_id) "
        "WHERE ((modification_type = 'ADMIN_CHANGE'::modificationedittype) "
        "AND ((field)::text = 'project_officer_id'::text) AND (agreement_mod_id IS NULL))"
    ),
)

OLD_OPS_EVENT_TYPES = [
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
    "CREATE_GRANT_NUMBER",
    "UPDATE_GRANT_NUMBER",
    "DELETE_GRANT_NUMBER",
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
    "START_CONTRACT_MODIFICATION",
    "REVIEW_CONTRACT_MODIFICATION",
]
NEW_OPS_EVENT_TYPES = OLD_OPS_EVENT_TYPES + ["SUBMIT_DE_OBLIGATION"]


def _sync_modification_edit_types(values) -> None:
    op.sync_enum_values(
        enum_schema="ops",
        enum_name="modificationedittype",
        new_values=values,
        affected_columns=[
            TableReference(
                table_schema="ops", table_name="contract_modification_edit", column_name="modification_type"
            ),
            TableReference(
                table_schema="ops", table_name="contract_modification_edit_version", column_name="modification_type"
            ),
        ],
        enum_values_to_rename=[],
        indexes_to_recreate=[PENDING_COR_INDEX],
    )


def _sync_ops_event_types(values) -> None:
    op.sync_enum_values(
        enum_schema="ops",
        enum_name="opseventtype",
        new_values=values,
        affected_columns=[
            TableReference(table_schema="ops", table_name="ops_event", column_name="event_type"),
            TableReference(table_schema="ops", table_name="ops_event_version", column_name="event_type"),
        ],
        enum_values_to_rename=[],
    )


def upgrade() -> None:
    _sync_modification_edit_types(NEW_MODIFICATION_EDIT_TYPES)
    _sync_ops_event_types(NEW_OPS_EVENT_TYPES)
    op.add_column("budget_line_item", sa.Column("requested_de_obligation_amount", sa.Numeric(12, 2), nullable=True))
    op.add_column(
        "budget_line_item_version",
        sa.Column("requested_de_obligation_amount", sa.Numeric(12, 2), autoincrement=False, nullable=True),
    )


def downgrade() -> None:
    op.drop_column("budget_line_item_version", "requested_de_obligation_amount")
    op.drop_column("budget_line_item", "requested_de_obligation_amount")
    op.execute("DELETE FROM ops.ops_event WHERE event_type = 'SUBMIT_DE_OBLIGATION'")
    op.execute("DELETE FROM ops.ops_event_version WHERE event_type = 'SUBMIT_DE_OBLIGATION'")
    _sync_ops_event_types(OLD_OPS_EVENT_TYPES)
    # contract_mod_request_edits rows go with them (ON DELETE CASCADE).
    op.execute("DELETE FROM ops.contract_modification_edit WHERE modification_type = 'DE_OBLIGATION'")
    op.execute("DELETE FROM ops.contract_modification_edit_version WHERE modification_type = 'DE_OBLIGATION'")
    _sync_modification_edit_types(OLD_MODIFICATION_EDIT_TYPES)
