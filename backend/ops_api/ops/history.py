import logging
from collections import namedtuple
from datetime import date, datetime
from decimal import Decimal
from enum import Enum
from types import NoneType

from flask import current_app
from flask_jwt_extended import verify_jwt_in_request
from flask_jwt_extended.exceptions import NoAuthorizationError
from models import OpsDBHistory, OpsDBHistoryType, OpsEvent, User, Agreement, BaseModel
from ops_api.ops.utils.user import get_user_from_token
from sqlalchemy.cyextension.collections import IdentitySet
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import get_history

DbRecordAudit = namedtuple("DbRecordAudit", "row_key original diff hist_changes")


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


def build_audit(obj) -> DbRecordAudit:
    row_key = "|".join([str(getattr(obj, pk)) for pk in obj.primary_keys])
    print(f"\n~~~~~~{obj.__class__.__name__}: {row_key}~~~~~~")

    original = {}
    diff = {}
    hist_changes = {}

    mapper = obj.__mapper__

    for col in mapper.columns:
        key = col.key
        if key in obj.__dict__:
            hist = get_history(obj, key)
            if hist.has_changes():
                hist_changes[key] = {
                    "added": convert_for_jsonb(hist.added),
                    "deleted": convert_for_jsonb(hist.deleted),
                }
                # this assumes columns are primitives, not lists
                old_val = convert_for_jsonb(hist.deleted[0]) if hist.deleted else None
                new_val = convert_for_jsonb(hist.added[0]) if hist.added else None
                if old_val:
                    original[key] = old_val
                diff[key] = new_val
            else:
                old_val = convert_for_jsonb(hist.unchanged[0]) if hist.unchanged[0] else None
                original[key] = old_val

    # need to include some relationships, such as agreement.team_members, which won't be logged as separate objects
    for relationship in obj.__mapper__.relationships:
        # print(f"relationship.key: {relationship.key}, in_dict: {relationship in obj.__dict__}, in_dict2: {relationship.key in obj.__dict__}, {relationship.secondary=}")
        key = relationship.key
        # limit this to relationships that aren't being logged as their own Classes
        # and only include them on the editable side
        # if key in obj.__dict__ and relationship.secondary is not None:
        if relationship.secondary is not None and not relationship.viewonly:
            hist = get_history(obj, key)
            if hist.has_changes():
                print(f"rel changes: {key=}")
                hist_changes[key] = {
                    "added": convert_for_jsonb(hist.added),
                    "deleted": convert_for_jsonb(hist.deleted),
                }
                old_val = convert_for_jsonb(hist.unchanged + hist.deleted) if hist.unchanged or hist.deleted else None
                new_val = convert_for_jsonb(hist.unchanged + hist.added) if hist.unchanged or hist.added else None
                original[key] = old_val
                diff[key] = new_val
            else:
                print(f"rel NO changes: {key=}")
                old_val = convert_for_jsonb(hist.unchanged) if hist.unchanged else None
                original[key] = old_val
        else:
            hist = get_history(obj, key)
            if hist.has_changes():
                print(f"!!!!Untracked changes to {relationship.key=}")
    return DbRecordAudit(row_key, original, diff, hist_changes)


def track_db_history_before(session: Session):
    session.add_all(add_obj_to_db_history(session.deleted, OpsDBHistoryType.DELETED))
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

    # Get the current user for setting created_by.  This depends on there being a web request with a valid JWT.
    # If a user cannot be obtained, it will still add the history record without the user.id
    user: User | None = None
    try:
        token = verify_jwt_in_request()
        user = get_user_from_token(token[1] if token else None)
    except NoAuthorizationError:
        current_app.logger.warning("JWT is invalid")
    except Exception as e:
        # Is there's not a request, then a RuntimeError occurs
        current_app.logger.info(f"Failed trying to get the user from the request. {type(e)}: {e}")

    for obj in objs:
        if not isinstance(obj, OpsEvent) and not isinstance(obj, OpsDBHistory):  # not interested in tracking these
            db_audit = build_audit(obj)
            if event_type == OpsDBHistoryType.UPDATED and not db_audit.hist_changes:
                logging.info(f"No changes found for {obj.__class__.__name__} with row_key={db_audit.row_key}, "
                             f"an OpsDBHistory record will not be created for this UPDATED event.")
                continue
            agreement_id = getattr(obj, 'agreement_id', None)
            if isinstance(obj, Agreement):
                agreement_id = obj.id

            ops_db = OpsDBHistory(
                event_type=event_type,
                event_details=obj.to_dict(),
                created_by=user.id if user else None,
                class_name=obj.__class__.__name__,
                row_key=db_audit.row_key,
                original=db_audit.original,
                diff=db_audit.diff,
                hist_changes=db_audit.hist_changes,
                agreement_id=agreement_id,
            )
            result.append(ops_db)
            print("~~~~~~~~~~~~~~~~~~\n")
    return result
