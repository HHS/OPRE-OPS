from datetime import datetime, timezone
from enum import Enum, auto
from importlib import simple
from typing import List, Optional

from loguru import logger
from sqlalchemy import ForeignKey, Integer, Text
from sqlalchemy.dialects.postgresql import ENUM
from sqlalchemy.orm import Mapped, Session, mapped_column

from models import (
    AgreementChangeRequest,
    BudgetLineItemChangeRequest,
    ChangeRequest,
    OpsEvent,
    OpsEventStatus,
    OpsEventType,
    ProductServiceCode,
    User,
)
from models.base import BaseModel


class AgreementHistoryType(Enum):
    AGREEMENT_UPDATED = auto()
    BUDGET_LINE_ITEM_CREATED = auto()
    BUDGET_LINE_ITEM_UPDATED = auto()
    BUDGET_LINE_ITEM_DELETED = auto()
    CHANGE_REQUEST_CREATED = auto()
    CHANGE_REQUEST_UPDATED = auto()

class AgreementHistory(BaseModel):
    __tablename__ = "agreement_history"

    id: Mapped[int] = BaseModel.get_pk_column()
    agreement_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("agreement.id"))
    budget_line_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("budget_line_item.id"))
    ops_event_id: Mapped[int] = mapped_column(Integer, ForeignKey("ops_event.id"))
    history_title: Mapped[str]
    history_message: Mapped[str] = mapped_column(Text)
    timestamp: Mapped[str]
    history_type: Mapped[AgreementHistoryType] = mapped_column(
        ENUM(AgreementHistoryType), nullable=True
    )

def format_fiscal_year(timestamp) -> int:
    """Convert the timestamp to {Fiscal Year}. The fiscal year is calendar year + 1 if the timestamp is october or later.
    This method can take either an iso format timestamp string or a datetime object"""
    current_fiscal_year = 0
    if isinstance(timestamp, str):
        parsed_timestamp = datetime.fromisoformat(timestamp[:-1]).astimezone(timezone.utc)
        current_fiscal_year = parsed_timestamp.year
        if parsed_timestamp.month >= 10:
            current_fiscal_year = parsed_timestamp.year + 1
    elif isinstance(timestamp, datetime):
        if timestamp.month >= 10:
            current_fiscal_year = timestamp.year + 1
        else:
            current_fiscal_year = timestamp.year

    return current_fiscal_year

def agreement_history_trigger_func(
    event: OpsEvent,
    session: Session,
    system_user: User,
):
    # Do not attempt to insert events into CAN History for failed or unknown status events
    if event.event_status == OpsEventStatus.FAILED or event.event_status == OpsEventStatus.UNKNOWN:
        return

    logger.debug(f"Handling event {event.event_type} with details: {event.event_details}")
    assert session is not None

    event_user = session.get(User, event.created_by)
    history_events = []
    match event.event_type:
        case OpsEventType.UPDATE_AGREEMENT:
            # Handle CAN Updates
            change_dict = event.event_details["agreement_updates"]["changes"]
            for key in change_dict.keys():
                history_items = create_agreement_update_history_event(
                    key,
                    change_dict[key]["old_value"],
                    change_dict[key]["new_value"],
                    event_user,
                    event.created_on.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
                    event.event_details["agreement_updates"]["owner_id"],
                    event.id,
                    session,
                    system_user
                )
                history_events.extend(history_items)
            if event.event_details["agreement_updates"].get("team_member_changes"):
                # Handle team member changes
                team_member_changes = event.event_details["agreement_updates"]["team_member_changes"]
                for item in team_member_changes.get("user_ids_added", []):
                    added_user_id = session.get(User, item)
                    history_events.append(AgreementHistory(
                        agreement_id=event.event_details["agreement_updates"]["owner_id"],
                        ops_event_id=event.id,
                        history_title="Team Member Added",
                        history_message=f"Team Member {added_user_id.full_name} added by {event_user.full_name}",
                        timestamp=event.created_on.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
                        history_type=AgreementHistoryType.AGREEMENT_UPDATED,
                    ))
                for item in team_member_changes.get("user_ids_removed", []):
                    removed_user_id = session.get(User, item)
                    history_events.append(AgreementHistory(
                        agreement_id=event.event_details["agreement_updates"]["owner_id"],
                        ops_event_id=event.id,
                        history_title="Team Member Removed",
                        history_message=f"Team Member {removed_user_id.full_name} removed by {event_user.full_name}",
                        timestamp=event.created_on.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
                        history_type=AgreementHistoryType.AGREEMENT_UPDATED,
                    ))
        case OpsEventType.CREATE_CHANGE_REQUEST:
            for change_request in event.event_details["change_requests"]:
                try:
                    property_changed = next(iter(change_request["requested_change_data"]), None)
                    if property_changed == "status":
                        title = f"Status Change to {fix_stringified_enum_values(change_request['requested_change_data']['status'])} In Review"
                        message= f"{event_user.full_name} requested a status change on BL {event.event_details['bli_id']} status changed from {fix_stringified_enum_values(change_request['requested_change_diff'][property_changed]['old'])} to {fix_stringified_enum_values(change_request['requested_change_diff'][property_changed]['new'])} and it's currently In Review for approval."
                    else:
                        title = f"Budget Change to {property_changed} In Review"
                        message= f"{event_user.full_name} requested a budget change on BL {event.event_details['bli_id']} {property_changed} changed from {fix_stringified_enum_values(change_request['requested_change_diff'][property_changed]['old'])} to {fix_stringified_enum_values(change_request['requested_change_diff'][property_changed]['new'])} and it's currently In Review for approval."
                    history_events.append(AgreementHistory(
                        agreement_id=change_request['agreement_id'],
                        ops_event_id=event.id,
                        history_title=title,
                        history_message=message,
                        timestamp=event.created_on.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
                        history_type=AgreementHistoryType.CHANGE_REQUEST_CREATED,
                    ))
                except Exception as e:
                    logger.error(f"Error processing change request: {e}")
        case OpsEventType.UPDATE_CHANGE_REQUEST:
            print("Hello")

            # iterate through change requests, get change_request_type and initialize an object with it. Then we can use some enum to string logic for pretty printing
    add_history_events(history_events, session)
    session.commit()

def create_agreement_update_history_event(
    property_name, old_value, new_value, updated_by_user, updated_on, agreement_id, ops_event_id, session, sys_user
):
    """A method that generates a CANHistory event for an updated property. In the case where the updated property is not one
    that has been designed for, it will instead be logged and None will be returned from the method."""

    # updated_by_sys_user = sys_user.id == updated_by_user.id

    # current_fiscal_year = format_fiscal_year(updated_on)
    event_history = []
    simple_property_names = ["name", "contract_number", "task_order_number", "po_number", "acquisition_type", "contract_type", "support_contacts", "service_requirement_type", "contract_category", "psc_contract_specialist"]
    if property_name in simple_property_names:
        old_value_str = fix_stringified_enum_values(old_value)
        new_value_str = fix_stringified_enum_values(new_value)
        event_history.append(AgreementHistory(
            agreement_id=agreement_id,
            ops_event_id=ops_event_id,
            history_title=f"Change to {get_agreement_property_display_name(property_name, True)}",
            history_message=f"{updated_by_user.full_name} changed the {get_agreement_property_display_name(property_name, False)} from {old_value_str} to {new_value_str}",
            timestamp=updated_on,
            history_type=AgreementHistoryType.AGREEMENT_UPDATED,
        ))
    else:
        match property_name:
            case "description":
                event_history.append(AgreementHistory(
                    agreement_id=agreement_id,
                    ops_event_id=ops_event_id,
                    history_title="Change to Description",
                    history_message=f"{updated_by_user.full_name} changed the description",
                    timestamp=updated_on,
                    history_type=AgreementHistoryType.AGREEMENT_UPDATED,
                ))
            case "vendor_id":
                from models import Vendor as vendor
                old_vendor = session.get(vendor, old_value)
                new_vendor = session.get(vendor, new_value)
                if old_vendor and new_vendor:
                    event_history.append(AgreementHistory(
                        agreement_id=agreement_id,
                        ops_event_id=ops_event_id,
                        history_title="Change to Vendor",
                        history_message=f"{updated_by_user.full_name} changed the vendor from {old_vendor.name} to {new_vendor.name}",
                        timestamp=updated_on,
                        history_type=AgreementHistoryType.AGREEMENT_UPDATED,
                    ))
            case "product_service_code_id":
                old_product_service_code = session.get(ProductServiceCode, old_value)
                new_product_service_code = session.get(ProductServiceCode, new_value)
                if old_product_service_code and new_product_service_code:
                    event_history.append(AgreementHistory(
                        agreement_id=agreement_id,
                        ops_event_id=ops_event_id,
                        history_title="Change to Product Service Code",
                        history_message=f"{updated_by_user.full_name} changed the product service code from {old_product_service_code.name} to {new_product_service_code.name}",
                        timestamp=updated_on,
                        history_type=AgreementHistoryType.AGREEMENT_UPDATED,
                    ))
            case _:
                logger.info(f"{property_name} changed by {updated_by_user.full_name} from {old_value} to {new_value}")

    return event_history

def add_history_events(events: List[AgreementHistory], session):
    '''Add a list of AgreementHistory events to the database session. First check that there are not any matching events already in the database to prevent duplicates.'''
    for event in events:
        agreement_history_items = session.query(AgreementHistory).where(AgreementHistory.ops_event_id == event.ops_event_id).all()
        duplicate_found = False
        for item in agreement_history_items:
            if item.timestamp == event.timestamp and item.history_type == event.history_type and item.history_message == event.history_message and item.fiscal_year == event.fiscal_year:
                # enough fields match that we're willing to say this is a duplicate.
                duplicate_found = True
                break

        # If no duplicate of the event was found, add it to the database session.
        if not duplicate_found:
            session.add(event)

def get_agreement_property_display_name(property_name: str, in_title: bool) -> str:
    """Get the display name for a given agreement property."""
    title_display_names = {
        "name": "Name",
        "notes": "Notes",
        "description": "Description",
        "vendor_id": "Vendor",
        "product_service_code_id": "Product Service Code",
        "contract_number": "Contract Number",
        "task_order_number": "Task Order Number",
        "po_number": "Purchase Order Number",
        "acquisition_type": "Acquisition Type",
        "contract_type": "Contract Type",
        "support_contacts": "Support Contacts",
        "service_requirement_type": "Service Requirement Type",
        "contract_category": "Contract Category",
        "psc_contract_specialist": "PSC Contract Specialist"
    }

    message_display_names = {
        "name": "name",
        "notes": "notes",
        "description": "description",
        "vendor_id": "vendor",
        "product_service_code_id": "product service code",
        "contract_number": "contract number",
        "task_order_number": "task order number",
        "po_number": "purchase order number",
        "acquisition_type": "acquisition type",
        "contract_type": "contract type",
        "support_contacts": "support contacts",
        "service_requirement_type": "service requirement type",
        "contract_category": "contract category",
        "psc_contract_specialist": "PSC contract specialist"
    }
    return title_display_names.get(property_name, property_name) if in_title else message_display_names.get(property_name, property_name)


def fix_stringified_enum_values(value: str) -> str:
    """Fix stringified enum values to a human-readable format. Any values outside of small subset will be returned as is."""
    expected_enum_dict = {
        # Service Requirement Types
        "SEVERABLE": "Severable",
        "NON_SEVERABLE": "Non-Severable",
        # Acquisition Types
        "FIRM_FIXED_PRICE": "Firm Fixed Price",
        "TIME_AND_MATERIALS": "Time and Materials",
        "LABOR_HOUR": "Labor Hour",
        "COST_PLUS_FIXED_FEE": "Cost Plus Fixed Fee",
        "COST_PLUS_AWARD_FEE": "Cost Plus Award Fee",
        "HYBRID": "Hybrid",
        # Agreement Type
        "CONTRACT": "Contract",
        "GRANT": "Grant",
        "DIRECT_OBLIGATION": "Direct Obligation",
        "IAA": "IAA",
        "IAA_AA": "IAA AA",
        "MISCELLANEOUS": "Miscellaneous",
        # Mod Types
        "NEW": "New",
        "ADMIN": "Admin",
        "AMOUNT_TBD": "Amount TBD",
        "AS_IS": "As Is",
        "REPLACEMENT_AMOUNT_FINAL": "Replacement Amount Final",
        # Agreement Reason
        "NEW_REQ": "New Requirement",
        "RECOMPETE": "Recompete",
        "LOGICAL_FOLLOW_ON": "Logical Follow-On",
        # Contract Category
        "RESEARCH": "Research",
        "SERVICE": "Service",
        # Acquisition Type
        "GSA_SCHEDULE": "GSA Schedule",
        "TASK_ORDER": "Task Order",
        "FULL_AND_OPEN": "Full and Open",
        # IAA Direction Type
        "INCOMING": "Incoming",
        "OUTGOING": "Outgoing",

        ## Change Request Types
        # Change Request Statuses
        "IN_REVIEW": "In Review",
        "APPROVED": "Approved",
        "REJECTED": "Rejected",

        ## Budget Line Item Types
        # Budget Line Item Statuses
        "DRAFT": "Draft",
        "PLANNED": "Planned",
        "IN_EXECUTION": "In Execution",
        "OBLIGATED": "Obligated",
    }
    expected_enum_keys = expected_enum_dict.keys()
    if value in expected_enum_keys:
        return expected_enum_dict[value]
    return value
