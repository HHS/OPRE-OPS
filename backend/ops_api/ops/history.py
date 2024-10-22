import json
import logging

from flask import current_app
from flask_jwt_extended import current_user
from sqlalchemy.cyextension.collections import IdentitySet
from sqlalchemy.orm import Session

from models import (
    Agreement,
    AgreementChangeRequest,
    AgreementOpsDbHistory,
    BudgetLineItem,
    OpsDBHistory,
    OpsDBHistoryType,
    OpsEvent,
    build_audit,
)


def find_relationship_by_fk(obj, col_key):
    for rel in obj.__mapper__.relationships:
        for lcl in rel.local_columns:
            local_key = obj.__mapper__.get_property_by_column(lcl).key
            if local_key == col_key:
                # rel_obj = getattr(obj, rel.key)
                return rel
    return None


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
