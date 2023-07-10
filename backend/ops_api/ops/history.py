from collections import namedtuple
from enum import Enum
from types import NoneType

from flask import current_app
from flask_jwt_extended import verify_jwt_in_request
from flask_jwt_extended.exceptions import NoAuthorizationError
from models import OpsDBHistory, OpsDBHistoryType, OpsEvent, User
from sqlalchemy.cyextension.collections import IdentitySet
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import get_history
from sqlalchemy import inspect
from decimal import Decimal
from datetime import datetime, date
from ops_api.ops.utils.user import get_user_from_token


DbRecordAudit = namedtuple("DbRecordDiff", "table_name, base_table_name row_key original diff")


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
    row_key = "|".join([str(getattr(obj, pk)) for pk in obj.primary_keys])

    original = {}
    diff = {}

    for key in obj.columns:
        if key in obj.__dict__:
            hist = get_history(obj, key)
            if hist.unchanged:
                old_val = convert_for_jsonb(hist.unchanged[0])
                original[key] = old_val
            else:
                old_val = convert_for_jsonb(hist.deleted[0]) if hist.deleted else None
                new_val = convert_for_jsonb(hist.added[0]) if hist.added else None
                if old_val:
                    original[key] = old_val
                diff[key] = new_val

    return DbRecordAudit(table_name, base_table_name, row_key, original, diff)


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

    user: User | None = None
    try:
        token = verify_jwt_in_request()
        user = get_user_from_token(token[1] if token else None)
    except NoAuthorizationError:
        current_app.logger.warning("JWT is invalid")
    except Exception as e:
        # Is there's not a request, then a RuntimeError occurs
        print(f"Failed trying to get the user from the request. {type(e)}: {e}")

    for obj in objs:
        if not isinstance(obj, OpsEvent) and not isinstance(obj, OpsDBHistory):  # not interested in tracking these
            db_audit = build_audit(obj)
            ops_db = OpsDBHistory(
                event_type=event_type,
                event_details=obj.to_dict(),
                created_by=user.id if user else None,
                class_name=obj.__class__.__name__,
                table_name=db_audit.table_name,
                base_table_name=db_audit.base_table_name,
                row_key=db_audit.row_key,
                original=db_audit.original,
                diff=db_audit.diff
            )
            result.append(ops_db)
    return result
