from enum import Enum

from sqlalchemy import Column, Index, String, desc
from sqlalchemy.dialects.postgresql import ENUM, JSONB

from .base import BaseModel


class OpsDBHistoryType(Enum):
    NEW = 1
    UPDATED = 2
    DELETED = 3
    ERROR = 4


class OpsDBHistory(BaseModel):
    __tablename__ = "ops_db_history"
    id = BaseModel.get_pk_column()
    event_type = Column(ENUM(OpsDBHistoryType))
    event_details = Column(JSONB)
    class_name = Column(String)
    row_key = Column(String)
    changes = Column(JSONB)


# index for typical change history queries to find all changes for a record (class+row_key), with recent first
index = Index(
    "idx_ops_db_history_class_name_row_key_created_on",
    OpsDBHistory.class_name,
    OpsDBHistory.row_key,
    desc(OpsDBHistory.created_on),
)
