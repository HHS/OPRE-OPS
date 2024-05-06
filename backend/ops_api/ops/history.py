import json
import logging
from collections import namedtuple
from datetime import date, datetime
from decimal import Decimal
from enum import Enum
from types import NoneType

from flask import current_app
from flask_jwt_extended import current_user
from sqlalchemy import inspect
from sqlalchemy.cyextension.collections import IdentitySet
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import get_history

from models import (
    Agreement,
    AgreementChangeRequest,
    AgreementOpsDbHistory,
    BaseModel,
    BudgetLineItem,
    OpsDBHistory,
    OpsDBHistoryType,
    OpsEvent,
)

DbRecordAudit = namedtuple("DbRecordAudit", "row_key changes")


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


def find_relationship_by_fk(obj, col_key):
    for rel in obj.__mapper__.relationships:
        for lcl in rel.local_columns:
            local_key = obj.__mapper__.get_property_by_column(lcl).key
            if local_key == col_key:
                # rel_obj = getattr(obj, rel.key)
                return rel
    return None


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


def track_db_history_before(session: Session):
    session.add_all(add_obj_to_db_history(session.deleted, OpsDBHistoryType.DELETED))
    session.add_all(add_obj_to_db_history(session.dirty, OpsDBHistoryType.UPDATED))


def track_db_history_after(session: Session):
    session.add_all(add_obj_to_db_history(session.new, OpsDBHistoryType.NEW))


def track_db_history_catch_errors(exception_context):
    # Avoid JSON serialization error with exception_context.parameters by safely converting first
    # Otherwise, if there are objects in exception_context.parameters that SQLAlchemy can't convert to JSON
    # then it can spawn another error which comes back to here which spawns another error, etc
    params_json = json.dumps(exception_context.parameters, default=str)
    params_obj = json.loads(params_json)

    ops_db = OpsDBHistory(
        event_type=OpsDBHistoryType.ERROR,
        event_details={
            "statement": exception_context.statement,
            "parameters": params_obj,
            "original_exception": f"{exception_context.original_exception}",
            "sqlalchemy_exception": f"{exception_context.sqlalchemy_exception}",
        },
    )
    with Session(current_app.engine) as session:
        session.add(ops_db)
        session.commit()
        current_app.logger.error(f"SQLAlchemy error added to {OpsDBHistory.__tablename__} with id {ops_db.id}")


def add_obj_to_db_history(objs: IdentitySet, event_type: OpsDBHistoryType):
    result = []

    for obj in objs:
        if not isinstance(obj, (OpsEvent, OpsDBHistory, AgreementOpsDbHistory)):  # not interested in tracking these
            db_audit = build_audit(obj, event_type)
            if event_type == OpsDBHistoryType.UPDATED and not db_audit.changes:
                logging.info(
                    f"No changes found for {obj.__class__.__name__} with row_key={db_audit.row_key}, "
                    f"an OpsDBHistory record will not be created for this UPDATED event."
                )
                continue

            ops_db = OpsDBHistory(
                event_type=event_type,
                event_details=obj.to_dict(),
                created_by=current_user.id if current_user else None,
                class_name=obj.__class__.__name__,
                row_key=db_audit.row_key,
                changes=db_audit.changes,
            )

            result.append(ops_db)

            result += create_agreement_history_relations(obj, ops_db)

    return result


def create_agreement_history_relations(obj, ops_db) -> list[AgreementOpsDbHistory]:
    objs = []
    if isinstance(obj, Agreement):
        agreement_ops_db_history = AgreementOpsDbHistory(
            agreement_id=obj.id,
            ops_db_history=ops_db,
        )
        objs.append(agreement_ops_db_history)
    elif isinstance(obj, (BudgetLineItem, AgreementChangeRequest)):
        agreement_ops_db_history = AgreementOpsDbHistory(
            agreement_id=obj.agreement_id,
            ops_db_history=ops_db,
        )
        objs.append(agreement_ops_db_history)
    return objs
