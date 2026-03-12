import os
import sys
import time
from datetime import datetime

import click
from dotenv import load_dotenv
from loguru import logger
from sqlalchemy import text
from sqlalchemy.orm import scoped_session, sessionmaker

from data_tools.src.common.db import init_db_from_config, setup_triggers
from data_tools.src.common.utils import get_config, get_or_create_sys_user
from models import (
    CAN,
    Agreement,
    AgreementHistory,
    AgreementHistoryType,
    AgreementOpsDbHistory,
    BudgetLineItem,
    OpsDBHistory,
    OpsDBHistoryType,
    OpsEvent,
    OpsEventStatus,
    OpsEventType,
    ServicesComponent,
    User,
    create_agreement_update_history_event,
    create_change_request_history_event,
)

load_dotenv(os.getenv("ENV_FILE", ".env"))

# Set the timezone to UTC
os.environ["TZ"] = "UTC"
time.tzset()

# logger configuration
format = (
    "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
    "<level>{level: <8}</level> | "
    "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | "
    "<level>{message}</level>"
)
# Configure logger with global level set to INFO by default
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
logger.remove()  # Remove default handlers
logger.configure(handlers=[{"sink": sys.stdout, "format": format, "level": LOG_LEVEL}])
logger.add(sys.stderr, format=format, level=LOG_LEVEL)


@click.command()
@click.option("--env", help="The environment to use.")
@click.option("--dry-run", is_flag=True, help="Enable dry run mode.")
def main(env: str, dry_run: bool):
    """
    Main function to update agreement history to new format by creating OpsEvent and AgreementHistory table rows.
    """
    logger.info("Starting update conversion of OpsDbHistory rows into OpsEvent and AgreementHistory rows.")

    script_config = get_config(env)
    db_engine, _ = init_db_from_config(script_config)

    if db_engine is None:
        logger.error("Failed to initialize the database engine.")
        sys.exit(1)

    with db_engine.connect() as conn:
        conn.execute(text("SELECT 1"))
        logger.info("Successfully connected to the database.")

    Session = scoped_session(sessionmaker(autocommit=False, autoflush=False, bind=db_engine))

    with Session() as session:
        sys_user = get_or_create_sys_user(session)
        logger.info(f"Retrieved system user: {sys_user.full_name} (ID: {sys_user.id})")
        setup_triggers(session, sys_user)
        update_agreement_history(session, sys_user, dry_run)

    logger.info("Update of Agreement History complete.")


def create_agreement_history_item(
    session, db_history_item: OpsDBHistory, sys_user: User, agreement_id: int, last_run_approved_cr: bool
):
    """
    Create a new AgreementHistory item from a DB history item. Returns a boolean corresponding to whether
    the item added was an approved change request.
    """

    event_user = session.get(User, db_history_item.created_by)
    updated_by_system_user = sys_user.id == event_user.id
    agreement = session.get(Agreement, agreement_id)
    agreement_exists = agreement is not None
    if db_history_item.event_type == OpsDBHistoryType.NEW:
        create_add_agreement_history_item(
            session, db_history_item, updated_by_system_user, event_user, agreement_id, agreement_exists
        )
    elif db_history_item.event_type == OpsDBHistoryType.UPDATED:
        last_run_approved_cr = create_update_agreement_history_item(
            session, db_history_item, sys_user, event_user, agreement_id, last_run_approved_cr, agreement_exists
        )
    elif db_history_item.event_type == OpsDBHistoryType.DELETED:
        create_delete_agreement_history_item(
            session, db_history_item, updated_by_system_user, event_user, agreement_id, agreement_exists
        )
    return last_run_approved_cr


def create_add_agreement_history_item(
    session,
    db_history_item: OpsDBHistory,
    updated_by_system_user: bool,
    event_user: User,
    agreement_id: int,
    agreement_exists: bool = True,
):
    """
    Create a new AgreementHistory item from a DB history item with the new event type.
    This is limited to when new objects are created
    """
    if db_history_item.class_name == "AgreementChangeRequest":
        ops_event = OpsEvent(
            event_type=OpsEventType.CREATE_CHANGE_REQUEST,
            event_status=OpsEventStatus.SUCCESS,
            event_details=db_history_item.event_details,
            created_by=db_history_item.created_by,
            created_on=db_history_item.created_on,
            updated_on=db_history_item.updated_on,
        )
        session.add(ops_event)
        # Flush so we get ops_event_id
        session.flush()
        agreement_history_item = create_change_request_history_event(
            db_history_item.event_details, ops_event, session, True
        )
        if not agreement_exists:
            agreement_history_item.agreement_id = None
        session.add(agreement_history_item)
        logger.info(f"Created AgreementHistory item for new change request on agreement {agreement_id}")
    elif "Agreement" in db_history_item.class_name:
        ops_event = OpsEvent(
            event_type=OpsEventType.CREATE_NEW_AGREEMENT,
            event_status=OpsEventStatus.SUCCESS,
            event_details=db_history_item.event_details,
            created_by=db_history_item.created_by,
            created_on=db_history_item.created_on,
            updated_on=db_history_item.updated_on,
        )
        session.add(ops_event)
        # Flush so we get ops_event_id
        session.flush()
        agreement_history_item = AgreementHistory(
            agreement_id=agreement_id if agreement_exists else None,
            agreement_id_record=agreement_id,
            ops_event_id=ops_event.id,
            history_title="Agreement Created",
            history_message=(
                "Changes made to the OPRE budget spreadsheet created a new agreement."
                if updated_by_system_user
                else f"{event_user.full_name} created a new agreement."
            ),
            timestamp=ops_event.created_on.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
            history_type=AgreementHistoryType.AGREEMENT_CREATED,
        )
        session.add(agreement_history_item)
        logger.info(f"Created AgreementHistory item for new agreement {agreement_id}")
    elif "BudgetLineItem" in db_history_item.class_name:
        ops_event = OpsEvent(
            event_type=OpsEventType.CREATE_BLI,
            event_status=OpsEventStatus.SUCCESS,
            event_details=db_history_item.event_details,
            created_by=db_history_item.created_by,
            created_on=db_history_item.created_on,
            updated_on=db_history_item.updated_on,
        )
        session.add(ops_event)
        # Flush so we get ops_event_id
        session.flush()
        bli_id = ops_event.event_details["id"]
        budget_line = session.get(BudgetLineItem, bli_id)
        agreement_history_item = AgreementHistory(
            agreement_id=agreement_id if agreement_exists else None,
            agreement_id_record=agreement_id,
            budget_line_id=bli_id if budget_line else None,
            ops_event_id=ops_event.id,
            history_title="New Budget Line Added",
            history_message=(
                f"Changes made to the OPRE budget spreadsheet added new budget line {bli_id}."
                if updated_by_system_user
                else f"{event_user.full_name} added a new budget line {bli_id}."
            ),
            timestamp=ops_event.created_on.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
            history_type=AgreementHistoryType.BUDGET_LINE_ITEM_CREATED,
        )
        session.add(agreement_history_item)
        logger.info(f"Created AgreementHistory item for new BLI {bli_id} on agreement {agreement_id}")


def _handle_change_request_update(session, db_history_item, agreement_id, agreement_exists):
    """Handle AgreementChangeRequest history updates. Returns True if the CR was APPROVED."""
    ops_event = OpsEvent(
        event_type=OpsEventType.UPDATE_CHANGE_REQUEST,
        event_status=OpsEventStatus.SUCCESS,
        event_details=db_history_item.event_details,
        created_by=db_history_item.created_by,
        created_on=db_history_item.created_on,
        updated_on=db_history_item.updated_on,
    )
    session.add(ops_event)
    session.flush()
    agreement_history_item = create_change_request_history_event(
        db_history_item.event_details, ops_event, session, False
    )
    if not agreement_exists:
        agreement_history_item.agreement_id = None
    session.add(agreement_history_item)
    logger.info(f"Created AgreementHistory item for updated change request on agreement {agreement_id}")
    return db_history_item.event_details.get("status") == "APPROVED"


def _build_team_member_history_events(team_members, agreement_id, ops_event_id, event_user, timestamp):
    """Build AgreementHistory items for team member additions and removals."""
    events = []
    for action, title in [("added", "Team Member Added"), ("removed", "Team Member Removed")]:
        for member in team_members.get(action, []):
            verb = "added by" if action == "added" else "removed by"
            events.append(
                (
                    member["id"],
                    AgreementHistory(
                        agreement_id=agreement_id,
                        agreement_id_record=agreement_id,
                        ops_event_id=ops_event_id,
                        history_title=title,
                        history_message=None,  # set below after user lookup
                        timestamp=timestamp,
                        history_type=AgreementHistoryType.AGREEMENT_UPDATED,
                    ),
                    verb,
                )
            )
    return events


def _handle_agreement_update(session, db_history_item, event_user, agreement_id, agreement_exists, system_user):
    """Handle Agreement field and team member history updates."""
    ops_event = OpsEvent(
        event_type=OpsEventType.UPDATE_AGREEMENT,
        event_status=OpsEventStatus.SUCCESS,
        event_details=db_history_item.event_details,
        created_by=db_history_item.created_by,
        created_on=db_history_item.created_on,
        updated_on=db_history_item.updated_on,
    )
    session.add(ops_event)
    session.flush()
    timestamp = db_history_item.created_on.strftime("%Y-%m-%dT%H:%M:%S.%fZ")
    db_history_changes = db_history_item.changes
    for key in db_history_changes.keys():
        if key == "team_members":
            pending = _build_team_member_history_events(
                db_history_changes[key], agreement_id, ops_event.id, event_user, timestamp
            )
            for user_id, event, verb in pending:
                user = session.get(User, user_id)
                event.history_message = f"Team Member {user.full_name} {verb} {event_user.full_name}."
                if not agreement_exists:
                    event.agreement_id = None
                session.add(event)
        else:
            agreement_history_item = create_agreement_update_history_event(
                key,
                db_history_changes[key]["old"],
                db_history_changes[key]["new"],
                event_user,
                timestamp,
                agreement_id,
                ops_event.id,
                session,
                system_user,
            )
            if agreement_history_item:
                if not agreement_exists:
                    agreement_history_item.agreement_id = None
                session.add(agreement_history_item)
        logger.info(f"Created AgreementHistory item for updated agreement {agreement_id} field {key}")


def _handle_bli_update(session, db_history_item, system_user, event_user, agreement_exists):
    """Handle BudgetLineItem history updates."""
    ops_event = OpsEvent(
        event_type=OpsEventType.UPDATE_BLI,
        event_status=OpsEventStatus.SUCCESS,
        event_details=db_history_item.event_details,
        created_by=db_history_item.created_by,
        created_on=db_history_item.created_on,
        updated_on=db_history_item.updated_on,
    )
    session.add(ops_event)
    session.flush()
    bli_id = ops_event.event_details["id"]
    agreement_id = ops_event.event_details.get("agreement_id", None)
    budget_line = session.get(BudgetLineItem, bli_id)
    agreement = session.get(Agreement, agreement_id) if agreement_id else None
    updated_by_system_user = system_user.id == event_user.id
    db_history_changes = db_history_item.changes
    for key in db_history_changes.keys():
        agreement_history_item = create_bli_update_history_event(
            agreement,
            budget_line,
            bli_id,
            key,
            db_history_changes[key]["old"],
            db_history_changes[key]["new"],
            event_user,
            db_history_item.created_on.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
            agreement_id,
            ops_event.id,
            session,
            updated_by_system_user,
        )
        if agreement_history_item:
            if not agreement_exists:
                agreement_history_item.agreement_id = None
            session.add(agreement_history_item)
        logger.info(f"Created AgreementHistory item for updated BLI {bli_id} on agreement {agreement_id} field {key}")


def create_update_agreement_history_item(
    session,
    db_history_item: OpsDBHistory,
    system_user: User,
    event_user: User,
    agreement_id: int,
    last_run_approved_cr: bool,
    agreement_exists: bool = True,
) -> bool:
    """
    Create a new AgreementHistory item from a DB history item with the new event type.
    This is limited to when new objects are updated.
    Returns whether an approved change request was created or not
    """
    if db_history_item.class_name == "AgreementChangeRequest":
        return _handle_change_request_update(session, db_history_item, agreement_id, agreement_exists)
    elif "Agreement" in db_history_item.class_name:
        if not last_run_approved_cr:
            _handle_agreement_update(session, db_history_item, event_user, agreement_id, agreement_exists, system_user)
        return False
    elif "BudgetLineItem" in db_history_item.class_name:
        _handle_bli_update(session, db_history_item, system_user, event_user, agreement_exists)
        return False


def create_delete_agreement_history_item(
    session,
    db_history_item: OpsDBHistory,
    updated_by_system_user: bool,
    event_user: User,
    agreement_id: int,
    agreement_exists: bool = True,
):
    """
    Create a new AgreementHistory item from a DB history item with the new event type.
    This is limited to when new objects are deleted
    """
    if "BudgetLineItem" in db_history_item.class_name:
        ops_event = OpsEvent(
            event_type=OpsEventType.DELETE_BLI,
            event_status=OpsEventStatus.SUCCESS,
            event_details=db_history_item.event_details,
            created_by=db_history_item.created_by,
            created_on=db_history_item.created_on,
            updated_on=db_history_item.updated_on,
        )
        session.add(ops_event)
        # Flush so we get ops_event_id
        session.flush()
        bli_id = ops_event.event_details["id"]
        budget_line = session.get(BudgetLineItem, bli_id)
        agreement_history_item = AgreementHistory(
            agreement_id=agreement_id if agreement_exists else None,
            agreement_id_record=agreement_id,
            budget_line_id=bli_id if budget_line else None,
            budget_line_id_record=bli_id,
            ops_event_id=ops_event.id,
            history_title="Budget Line Deleted",
            history_message=(
                f"Changes made to the OPRE budget spreadsheet deleted the draft BL {bli_id}."
                if updated_by_system_user
                else f"{event_user.full_name} deleted the draft BL {bli_id}."
            ),
            timestamp=ops_event.created_on.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
            history_type=AgreementHistoryType.BUDGET_LINE_ITEM_DELETED,
        )
        session.add(agreement_history_item)
        logger.info(f"Created AgreementHistory item for deleted BLI {bli_id} on agreement {agreement_id}")


def update_agreement_history(session, sys_user: User, dry_run: bool):
    """
    Update agreement history to new format by creating OpsEvent and AgreementHistory table rows.
    """
    try:
        agreement_ops_db_history = session.query(AgreementOpsDbHistory).all()
        last_item_approved_cr = False
        for agreement_db_history in agreement_ops_db_history:
            agreement_id = agreement_db_history.agreement_id
            ops_db_history_list = (
                session.query(OpsDBHistory).filter(OpsDBHistory.id == agreement_db_history.ops_db_history_id).all()
            )
            for db_history_item in ops_db_history_list:
                last_item_approved_cr = create_agreement_history_item(
                    session, db_history_item, sys_user, agreement_id, last_item_approved_cr
                )
        if dry_run:
            logger.info("Dry run mode enabled, rolling back changes.")
            session.rollback()
        else:
            session.commit()
    except Exception as e:
        logger.error(f"Error creating AgreementHistory: {e}")
        session.rollback()
        raise


def _format_bli_change_message(updated_by_system_user, event_user, change_desc, bli_id, old_val, new_val):
    """Format a BLI change message depending on whether the system user or a named user made the change."""
    if updated_by_system_user:
        return (
            f"Changes made to the OPRE budget spreadsheet changed the {change_desc}"
            f" for BL {bli_id} from {old_val} to {new_val}."
        )
    return f"{event_user.full_name} changed the {change_desc} for BL {bli_id} from {old_val} to {new_val}."


def _bli_can_change(old_value, new_value, session, bli_id, event_user, updated_by_system_user):
    old_can = session.get(CAN, old_value)
    new_can = session.get(CAN, new_value)
    old_can_number = f"CAN {old_can.number}" if old_can else "None"
    new_can_number = f"CAN {new_can.number}" if new_can else "None"
    msg = _format_bli_change_message(updated_by_system_user, event_user, "CAN", bli_id, old_can_number, new_can_number)
    return "Change to CAN", msg


def _bli_date_needed_change(old_value, new_value, bli_id, event_user, updated_by_system_user):
    old_date = datetime.strftime(datetime.strptime(old_value, "%Y-%m-%d"), "%m/%d/%Y") if old_value else "None"
    new_date = datetime.strftime(datetime.strptime(new_value, "%Y-%m-%d"), "%m/%d/%Y") if new_value else "None"
    msg = _format_bli_change_message(updated_by_system_user, event_user, "Obligate By date", bli_id, old_date, new_date)
    return "Change to Obligate By", msg


def _bli_amount_change(old_value, new_value, bli_id, event_user, updated_by_system_user):
    old_value_str = "{:,.2f}".format(float(old_value))
    new_value_str = "{:,.2f}".format(float(new_value))
    msg = _format_bli_change_message(
        updated_by_system_user, event_user, "amount", bli_id, f"${old_value_str}", f"${new_value_str}"
    )
    return "Change to Amount", msg


def _bli_line_description_change(bli_id, event_user, updated_by_system_user):
    if updated_by_system_user:
        msg = f"Changes made to the OPRE budget spreadsheet changed the line description for BL {bli_id}."
    else:
        msg = f"{event_user.full_name} changed the line description for BL {bli_id}."
    return "Change to Line Description", msg


def _bli_services_component_change(old_value, new_value, session, bli_id, event_user, updated_by_system_user):
    old_sc = session.get(ServicesComponent, old_value) if old_value else None
    new_sc = session.get(ServicesComponent, new_value) if new_value else None
    old_sc_name = old_sc.display_name if old_sc else "None"
    new_sc_name = new_sc.display_name if new_sc else "None"
    msg = _format_bli_change_message(
        updated_by_system_user, event_user, "services component", bli_id, old_sc_name, new_sc_name
    )
    return "Change to Services Component", msg


def create_bli_update_history_event(
    agreement,
    bli,
    bli_id,
    key,
    old_value,
    new_value,
    event_user,
    timestamp,
    agreement_id,
    ops_event_id,
    session,
    updated_by_system_user: bool,
):
    """
    Create a new AgreementHistory item for BudgetLineItem updates.
    """
    handler_args = (old_value, new_value, bli_id, event_user, updated_by_system_user)
    result = None
    if key == "can_id":
        result = _bli_can_change(old_value, new_value, session, bli_id, event_user, updated_by_system_user)
    elif key == "date_needed":
        result = _bli_date_needed_change(*handler_args)
    elif key == "amount":
        result = _bli_amount_change(*handler_args)
    elif key == "line_description":
        result = _bli_line_description_change(bli_id, event_user, updated_by_system_user)
    elif key == "services_component_id":
        result = _bli_services_component_change(
            old_value, new_value, session, bli_id, event_user, updated_by_system_user
        )

    if result:
        history_title, history_message = result
        return AgreementHistory(
            agreement_id=agreement_id if agreement else None,
            agreement_id_record=agreement_id,
            budget_line_id=bli_id if bli else None,
            budget_line_id_record=bli_id,
            ops_event_id=ops_event_id,
            history_title=history_title,
            history_message=history_message,
            timestamp=timestamp,
            history_type=AgreementHistoryType.BUDGET_LINE_ITEM_UPDATED,
        )
    else:
        logger.warning(
            f"Could not create AgreementHistory item for updated BLI {bli_id} on agreement {agreement_id} field {key}"
        )
        return None


if __name__ == "__main__":
    main()
