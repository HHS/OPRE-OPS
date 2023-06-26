from collections import namedtuple
from enum import Enum
from types import NoneType

from flask import current_app
from models import OpsDBHistory, OpsDBHistoryType, OpsEvent
from sqlalchemy.cyextension.collections import IdentitySet
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import get_history
from sqlalchemy import inspect
import json
from decimal import Decimal
from datetime import datetime, date


DbRecordAudit = namedtuple("DbRecordDiff", "table_name, base_table_name row_key original diff changes")


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
    return str(value)


def build_audit(obj) -> DbRecordAudit:
    table_name = obj.__table__.name
    mapper = inspect(obj.__class__)
    base_mapper = mapper.base_mapper
    base_table_name = base_mapper.mapped_table.name
    # row_key = obj.id
    row_key = "|".join([str(getattr(obj, pk)) for pk in obj.primary_keys])
    print(f"{table_name=}, {base_table_name=}, {row_key}")

    original = {}
    diff = {}
    changes = {}

    for key in obj.columns:
        if key in obj.__dict__:
            # if key in ["amount", "status", "date_needed", "created_on", "updated_on"]:
            #     continue
            # if key not in ["id", "line_description", "comments", "agreement_id", "can_id", "psc_fee_amount", "created_by"]:
            #     continue
            # print(key)
            hist = get_history(obj, key)
            if hist.unchanged:
                old_val = convert_for_jsonb(hist.unchanged[0])
                original[key] = old_val
                # print(f"-->{key}:, {old_val=}, {type(old_val)=}")
            else:
                old_val = convert_for_jsonb(hist.deleted[0]) if hist.deleted else None
                new_val = convert_for_jsonb(hist.added[0]) if hist.added else None
                if old_val:
                    original[key] = old_val
                diff[key] = new_val
                changes[key] = {"from": old_val, "to": new_val}
                # print(f"-->{key}, {old_val=}, {type(old_val)=}, {new_val=}, {type(new_val)=}")

    print("~~~>original:", json.dumps(original, indent=2, default=str))
    print("~~~>diff:", json.dumps(diff, indent=2, default=str))
    print("~~~>changes:", json.dumps(changes, indent=2, default=str))
    print("~~~>to_dict:", json.dumps(obj.to_dict(), indent=2, default=str))
    # hack to make JSON work with DB/ORM until that's sorted out
    # TODO: make the dict something that can serialize to PG without this
    # and also prevent decimals getting from ending up with quotes when it's the old value
    # History(added=[415114.0], unchanged=(), deleted=[Decimal('628334.00')])
    # "amount": {
    #     "from": "628334.00",
    #     "to": 415114.0
    #   }
    # those dicts ^ results in "QueuePool limit of size 5 overflow 10 reached, connection timed out"
    # print("~~~hack to make JSON work~~~~~~~")
    # original = json.loads(json.dumps(original, default=str))
    # diff = json.loads(json.dumps(diff, default=str))
    # changes = json.loads(json.dumps(changes, default=str))
    # print("~~~~>original:", json.dumps(original, indent=2, default=str))
    # print("~~~~>diff:", json.dumps(diff, indent=2, default=str))
    # print("~~~~>changes:", json.dumps(changes, indent=2, default=str))

    return DbRecordAudit(table_name, base_table_name, row_key, original, diff, changes)


def track_db_history_before(session: Session):
    session.add_all(add_obj_to_db_history(session.deleted, OpsDBHistoryType.DELETED))
    # session.add_all(add_obj_to_db_history(session.new, OpsDBHistoryType.NEW))
    session.add_all(add_obj_to_db_history(session.dirty, OpsDBHistoryType.UPDATED))


def track_db_history_after(session: Session):
    session.add_all(add_obj_to_db_history(session.new, OpsDBHistoryType.NEW))


def track_db_history_catch_errors(exception_context):
    ops_db = OpsDBHistory(
        event_type=OpsDBHistoryType.ERROR,
        event_details={
            "statement": exception_context.statement,
            "parameters": exception_context.parameters,
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
        if not isinstance(obj, OpsEvent) and not isinstance(obj, OpsDBHistory):  # not interested in tracking these
            db_audit = build_audit(obj)
            ops_db = OpsDBHistory(
                event_type=event_type,
                event_details=obj.to_dict(),
                created_by=obj.created_by,
                table_name=db_audit.table_name,
                base_table_name=db_audit.base_table_name,
                row_key=db_audit.row_key,
                original=db_audit.original,
                diff=db_audit.diff,
                changes=db_audit.changes
            )
            result.append(ops_db)
    return result
