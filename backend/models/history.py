from collections import namedtuple
from datetime import date, datetime
from decimal import Decimal
from enum import Enum
from types import NoneType

from sqlalchemy import Column, Index, String, desc, inspect
from sqlalchemy.dialects.postgresql import ENUM, JSONB
from sqlalchemy.orm.attributes import get_history

from .base import BaseModel

DbRecordAudit = namedtuple("DbRecordAudit", "row_key changes")

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


def build_audit(obj, event_type: OpsDBHistoryType) -> DbRecordAudit:  # noqa: C901
    row_key = "|".join([str(getattr(obj, pk.name)) for pk in inspect(obj.__table__).primary_key.columns.values()])

    changes = {}

    mapper = obj.__mapper__

    # collect changes in column values
    auditable_columns = list(filter(lambda c: c.key in obj.__dict__, mapper.columns))
    for col in auditable_columns:
        key = col.key
        hist = get_history(obj, key)
        if hist.has_changes():
            # this assumes columns are primitives, not lists
            old_val = convert_for_jsonb(hist.deleted[0]) if hist.deleted else None
            new_val = convert_for_jsonb(hist.added[0]) if hist.added else None
            # exclude Enums that didn't really change
            if hist.deleted and isinstance(hist.deleted[0], Enum) and old_val == new_val:
                continue
            if event_type == OpsDBHistoryType.NEW:
                if new_val:
                    changes[key] = {
                        "new": new_val,
                    }
            else:
                changes[key] = {
                    "new": new_val,
                    "old": old_val,
                }

    # collect changes in relationships, such as agreement.team_members
    # limit this to relationships that aren't being logged as their own Classes
    # and only include them on the editable side
    auditable_relationships = list(
        filter(
            lambda rel: rel.secondary is not None and not rel.viewonly,
            mapper.relationships,
        )
    )

    for relationship in auditable_relationships:
        key = relationship.key
        hist = get_history(obj, key)
        if hist.has_changes():
            related_class_name = (
                relationship.argument if isinstance(relationship.argument, str) else relationship.argument.__name__
            )
            changes[key] = {
                "collection_of": related_class_name,
                "added": convert_for_jsonb(hist.added),
            }
            if event_type != OpsDBHistoryType.NEW:
                changes[key]["deleted"] = convert_for_jsonb(hist.deleted)
    return DbRecordAudit(row_key, changes)


def convert_for_jsonb(value):
    if isinstance(value, (str, bool, int, float, NoneType)):
        return value
    if isinstance(value, Enum):
        return value.name
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, date):
        return value.isoformat()
    if isinstance(value, BaseModel):
        if callable(getattr(value, "to_slim_dict", None)):
            return value.to_slim_dict()
        return value.to_dict()
    if isinstance(value, (list, tuple)):
        return [convert_for_jsonb(item) for item in value]
    return str(value)
