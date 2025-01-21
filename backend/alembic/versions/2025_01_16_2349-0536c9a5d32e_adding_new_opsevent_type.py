"""adding new OpsEvent type

Revision ID: 0536c9a5d32e
Revises: 52bf070f396e
Create Date: 2025-01-16 23:49:02.783289+00:00

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from alembic_postgresql_enum import TableReference

# revision identifiers, used by Alembic.
revision: str = '0536c9a5d32e'
down_revision: Union[str, None] = '52bf070f396e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.sync_enum_values(
        enum_schema='ops',
        enum_name='opseventtype',
        new_values=['CREATE_BLI', 'UPDATE_BLI', 'DELETE_BLI', 'SEND_BLI_FOR_APPROVAL', 'CREATE_PROJECT', 'CREATE_NEW_AGREEMENT', 'UPDATE_AGREEMENT', 'DELETE_AGREEMENT', 'CREATE_NEW_CAN', 'UPDATE_CAN', 'DELETE_CAN', 'CREATE_CAN_FUNDING_RECEIVED', 'UPDATE_CAN_FUNDING_RECEIVED', 'DELETE_CAN_FUNDING_RECEIVED', 'CREATE_CAN_FUNDING_BUDGET', 'UPDATE_CAN_FUNDING_BUDGET', 'DELETE_CAN_FUNDING_BUDGET', 'CREATE_CAN_FUNDING_DETAILS', 'UPDATE_CAN_FUNDING_DETAILS', 'DELETE_CAN_FUNDING_DETAILS', 'ACKNOWLEDGE_NOTIFICATION', 'CREATE_BLI_PACKAGE', 'UPDATE_BLI_PACKAGE', 'CREATE_SERVICES_COMPONENT', 'UPDATE_SERVICES_COMPONENT', 'DELETE_SERVICES_COMPONENT', 'CREATE_PROCUREMENT_ACQUISITION_PLANNING', 'UPDATE_PROCUREMENT_ACQUISITION_PLANNING', 'DELETE_PROCUREMENT_ACQUISITION_PLANNING', 'CREATE_DOCUMENT', 'UPDATE_DOCUMENT', 'LOGIN_ATTEMPT', 'LOGOUT', 'IDLE_LOGOUT', 'GET_USER_DETAILS', 'CREATE_USER', 'UPDATE_USER', 'DEACTIVATE_USER'],
        affected_columns=[TableReference(table_schema='ops', table_name='ops_event', column_name='event_type'), TableReference(table_schema='ops', table_name='ops_event_version', column_name='event_type')],
        enum_values_to_rename=[],
    )
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.sync_enum_values(
        enum_schema='ops',
        enum_name='opseventtype',
        new_values=['CREATE_BLI', 'UPDATE_BLI', 'DELETE_BLI', 'SEND_BLI_FOR_APPROVAL', 'CREATE_PROJECT', 'CREATE_NEW_AGREEMENT', 'UPDATE_AGREEMENT', 'DELETE_AGREEMENT', 'CREATE_NEW_CAN', 'UPDATE_CAN', 'DELETE_CAN', 'CREATE_CAN_FUNDING_RECEIVED', 'UPDATE_CAN_FUNDING_RECEIVED', 'DELETE_CAN_FUNDING_RECEIVED', 'CREATE_CAN_FUNDING_BUDGET', 'UPDATE_CAN_FUNDING_BUDGET', 'DELETE_CAN_FUNDING_BUDGET', 'CREATE_CAN_FUNDING_DETAILS', 'UPDATE_CAN_FUNDING_DETAILS', 'DELETE_CAN_FUNDING_DETAILS', 'ACKNOWLEDGE_NOTIFICATION', 'CREATE_BLI_PACKAGE', 'UPDATE_BLI_PACKAGE', 'CREATE_SERVICES_COMPONENT', 'UPDATE_SERVICES_COMPONENT', 'DELETE_SERVICES_COMPONENT', 'CREATE_PROCUREMENT_ACQUISITION_PLANNING', 'UPDATE_PROCUREMENT_ACQUISITION_PLANNING', 'DELETE_PROCUREMENT_ACQUISITION_PLANNING', 'CREATE_DOCUMENT', 'UPDATE_DOCUMENT', 'LOGIN_ATTEMPT', 'LOGOUT', 'GET_USER_DETAILS', 'CREATE_USER', 'UPDATE_USER', 'DEACTIVATE_USER'],
        affected_columns=[TableReference(table_schema='ops', table_name='ops_event', column_name='event_type'), TableReference(table_schema='ops', table_name='ops_event_version', column_name='event_type')],
        enum_values_to_rename=[],
    )
    # ### end Alembic commands ###