from enum import Enum

import sqlalchemy as sa
from sqlalchemy import Index
from sqlalchemy.dialects.postgresql import JSONB

from .base import BaseModel


class OpsDBHistoryType(Enum):
    NEW = 1
    UPDATED = 2
    DELETED = 3
    ERROR = 4


class OpsDBHistory(BaseModel):
    __tablename__ = "ops_db_history"
    id = BaseModel.get_pk_column()
    event_type = sa.Column(sa.Enum(OpsDBHistoryType))
    event_details = sa.Column(JSONB)
    class_name = sa.Column(sa.String)
    row_key = sa.Column(sa.String)
    changes = sa.Column(JSONB)


# index for typical change history queries to find all changes for a record (class+row_key), with recent first
index = Index(
    "idx_ops_db_history_class_name_row_key_created_on",
    OpsDBHistory.class_name,
    OpsDBHistory.row_key,
    sa.desc(OpsDBHistory.created_on),
)
