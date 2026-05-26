"""add project_history table

Revision ID: d4f5a6b7c8e9
Revises: e9f8a7b6c5d4
Create Date: 2026-05-26 10:00:00.000000+00:00

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'd4f5a6b7c8e9'
down_revision: Union[str, None] = 'e9f8a7b6c5d4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


PROJECT_HISTORY_TYPE_VALUES = (
    'PROJECT_CREATED',
    'PROJECT_TITLE_EDITED',
    'PROJECT_SHORT_TITLE_EDITED',
    'PROJECT_DESCRIPTION_EDITED',
    'PROJECT_URL_EDITED',
    'PROJECT_TYPE_EDITED',
    'PROJECT_TEAM_LEADER_ADDED',
    'PROJECT_TEAM_LEADER_REMOVED',
)


def upgrade() -> None:
    sa.Enum(*PROJECT_HISTORY_TYPE_VALUES, name='projecthistorytype').create(op.get_bind())

    op.create_table(
        'project_history',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('project_id', sa.Integer(), nullable=True),
        sa.Column('project_id_record', sa.Integer(), nullable=False),
        sa.Column('ops_event_id', sa.Integer(), nullable=True),
        sa.Column('history_title', sa.String(), nullable=False),
        sa.Column('history_message', sa.Text(), nullable=False),
        sa.Column('timestamp', sa.String(), nullable=False),
        sa.Column(
            'history_type',
            postgresql.ENUM(*PROJECT_HISTORY_TYPE_VALUES, name='projecthistorytype', create_type=False),
            nullable=True,
        ),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.Column('updated_by', sa.Integer(), nullable=True),
        sa.Column('created_on', sa.DateTime(), nullable=True),
        sa.Column('updated_on', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['project_id'], ['project.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['ops_event_id'], ['ops_event.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['created_by'], ['ops_user.id']),
        sa.ForeignKeyConstraint(['updated_by'], ['ops_user.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(
        'ix_project_history_project_id_record',
        'project_history',
        ['project_id_record'],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index('ix_project_history_project_id_record', table_name='project_history')
    op.drop_table('project_history')
    sa.Enum(*PROJECT_HISTORY_TYPE_VALUES, name='projecthistorytype').drop(op.get_bind())
