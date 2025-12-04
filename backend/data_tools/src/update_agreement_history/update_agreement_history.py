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
                f"Changes made to the OPRE budget spreadsheet created a new agreement."
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
        ops_event = OpsEvent(
            event_type=OpsEventType.UPDATE_CHANGE_REQUEST,
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
            db_history_item.event_details, ops_event, session, False
        )
        if not agreement_exists:
            agreement_history_item.agreement_id = None
        session.add(agreement_history_item)
        logger.info(f"Created AgreementHistory item for updated change request on agreement {agreement_id}")
        # return true if this was an approved change request because it will be followed by an agreement update we SHOULDN'T log
        return db_history_item.event_details.get("status") == "APPROVED"
    elif "Agreement" in db_history_item.class_name:
        # Only generate event if previous run was not an approved change request
        if not last_run_approved_cr:
            ops_event = OpsEvent(
                event_type=OpsEventType.UPDATE_AGREEMENT,
                event_status=OpsEventStatus.SUCCESS,
                event_details=db_history_item.event_details,
                created_by=db_history_item.created_by,
                created_on=db_history_item.created_on,
                updated_on=db_history_item.updated_on,
            )
            session.add(ops_event)

            # Flush so we get ops_event_id
            session.flush()
            db_history_changes = db_history_item.changes
            for key in db_history_changes.keys():
                if key == "team_members":
                    history_events = []
                    team_members = db_history_changes[key]
                    for team_member in team_members.get("added", []):
                        added_user_id = session.get(User, team_member["id"])
                        history_events.append(
                            AgreementHistory(
                                agreement_id=agreement_id,
                                agreement_id_record=agreement_id,
                                ops_event_id=ops_event.id,
                                history_title="Team Member Added",
                                history_message=f"Team Member {added_user_id.full_name} added by {event_user.full_name}.",
                                timestamp=db_history_item.created_on.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
                                history_type=AgreementHistoryType.AGREEMENT_UPDATED,
                            )
                        )
                    for team_member in team_members.get("removed", []):
                        removed_user_id = session.get(User, team_member["id"])
                        history_events.append(
                            AgreementHistory(
                                agreement_id=agreement_id,
                                agreement_id_record=agreement_id,
                                ops_event_id=ops_event.id,
                                history_title="Team Member Removed",
                                history_message=f"Team Member {removed_user_id.full_name} removed by {event_user.full_name}.",
                                timestamp=db_history_item.created_on.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
                                history_type=AgreementHistoryType.AGREEMENT_UPDATED,
                            )
                        )
                    for event in history_events:
                        if not agreement_exists:
                            event.agreement_id = None
                        session.add(event)
                else:
                    agreement_history_item = create_agreement_update_history_event(
                        key,
                        db_history_changes[key]["old"],
                        db_history_changes[key]["new"],
                        event_user,
                        db_history_item.created_on.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
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
        return False
    elif "BudgetLineItem" in db_history_item.class_name:
        ops_event = OpsEvent(
            event_type=OpsEventType.UPDATE_BLI,
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
            logger.info(
                f"Created AgreementHistory item for updated BLI {bli_id} on agreement {agreement_id} field {key}"
            )
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
    history_title = f""
    history_message = f""
    if key == "can_id":
        old_can_number = "None"
        new_can_number = "None"
        old_can = session.get(CAN, old_value)
        new_can = session.get(CAN, new_value)
        if old_can:
            old_can_number = f"CAN {old_can.number}"
        if new_can:
            new_can_number = f"CAN {new_can.number}"
        history_title = "Change to CAN"
        if updated_by_system_user:
            history_message = f"Changes made to the OPRE budget spreadsheet changed the CAN for BL {bli_id} from {old_can_number} to {new_can_number}."
        else:
            history_message = (
                f"{event_user.full_name} changed the CAN for BL {bli_id} from {old_can_number} to {new_can_number}."
            )
    elif key == "date_needed":
        history_title = "Change to Obligate By"
        old_date = "None"
        new_date = "None"
        if old_value:
            old_date = datetime.strftime(datetime.strptime(old_value, "%Y-%m-%d"), "%m/%d/%Y")
        if new_value:
            new_date = datetime.strftime(datetime.strptime(new_value, "%Y-%m-%d"), "%m/%d/%Y")
        if updated_by_system_user:
            history_message = f"Changes made to the OPRE budget spreadsheet changed the Obligate By date for BL {bli_id} from {old_date} to {new_date}."
        else:
            history_message = (
                f"{event_user.full_name} changed the Obligate By date for BL {bli_id} from {old_date} to {new_date}."
            )
    elif key == "amount":
        old_value_float = float(old_value)
        new_value_float = float(new_value)
        old_value_str = "{:,.2f}".format(old_value_float)
        new_value_str = "{:,.2f}".format(new_value_float)
        history_title = "Change to Amount"
        if updated_by_system_user:
            history_message = f"Changes made to the OPRE budget spreadsheet changed the amount for BL {bli_id} from ${old_value_str} to ${new_value_str}."
        else:
            history_message = (
                f"{event_user.full_name} changed the amount for BL {bli_id} from ${old_value_str} to ${new_value_str}."
            )

    elif key == "line_description":
        history_title = "Change to Line Description"
        if updated_by_system_user:
            history_message = (
                f"Changes made to the OPRE budget spreadsheet changed the line description for BL {bli_id}."
            )
        else:
            history_message = f"{event_user.full_name} changed the line description for BL {bli_id}."
    elif key == "services_component_id":
        old_services_component = session.get(ServicesComponent, old_value) if old_value else None
        new_services_component = session.get(ServicesComponent, new_value) if new_value else None
        old_sc_name = old_services_component.display_name if old_services_component else "None"
        new_sc_name = new_services_component.display_name if new_services_component else "None"
        history_title = "Change to Services Component"
        if updated_by_system_user:
            history_message = f"Changes made to the OPRE budget spreadsheet changed the services component for BL {bli_id} from {old_sc_name} to {new_sc_name}."
        else:
            history_message = f"{event_user.full_name} changed the services component for BL {bli_id} from {old_sc_name} to {new_sc_name}."
    if history_title and history_message:
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
