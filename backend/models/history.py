from enum import Enum
from typing import Any

import sqlalchemy as sa
from sqlalchemy import Index
from sqlalchemy.dialects.postgresql import JSONB
from typing_extensions import override

from .base import BaseModel


class OpsDBHistoryType(Enum):
    NEW = 1
    UPDATED = 2
    DELETED = 3
    ERROR = 4


class OpsDBHistory(BaseModel):
    __tablename__ = "ops_db_history"
    id = sa.Column(sa.Integer, sa.Identity(), primary_key=True)
    event_type = sa.Column(sa.Enum(OpsDBHistoryType))
    event_details = sa.Column(JSONB)
    class_name = sa.Column(sa.String)
    row_key = sa.Column(sa.String)
    original = sa.Column(JSONB)
    diff = sa.Column(JSONB)

    @override
    def to_dict(self) -> dict[str, Any]:
        d: dict[str, Any] = super().to_dict()

        d.update(
            {
                "event_type": self.event_type.name if self.event_type else None,
            }
        )

        return d


# index for typical change history queries to find all changes for a record (class+row_key), with recent first
index = Index('idx_ops_db_history_class_name_row_key_created_on', OpsDBHistory.class_name, OpsDBHistory.row_key,
              sa.desc(OpsDBHistory.created_on))
