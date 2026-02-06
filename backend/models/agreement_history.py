from datetime import datetime, timezone
from enum import Enum, auto
from typing import List, Optional

from loguru import logger
from sqlalchemy import ForeignKey, Integer, Text
from sqlalchemy.dialects.postgresql import ENUM
from sqlalchemy.orm import Mapped, Session, mapped_column

from models import (
    CAN,
    Agreement,
    ResearchMethodology,
    OpsEvent,
    OpsEventStatus,
    OpsEventType,
    ProductServiceCode,
    SpecialTopic,
    User,
)
from models.base import BaseModel


class AgreementHistoryType(Enum):
    AGREEMENT_CREATED = auto()
    AGREEMENT_UPDATED = auto()
    AGREEMENT_DELETED = auto()
    BUDGET_LINE_ITEM_CREATED = auto()
    BUDGET_LINE_ITEM_UPDATED = auto()
    BUDGET_LINE_ITEM_DELETED = auto()
    CHANGE_REQUEST_CREATED = auto()
    CHANGE_REQUEST_UPDATED = auto()
    CHANGE_REQUEST_DELETED = auto()
    PROCUREMENT_SHOP_UPDATED = auto()
    PROCUREMENT_TRACKER_STEP_UPDATED = auto()
    SERVICE_COMPONENT_CREATED = auto()
    SERVICE_COMPONENT_UPDATED = auto()
    SERVICE_COMPONENT_DELETED = auto()


class AgreementHistory(BaseModel):
    __tablename__ = "agreement_history"

    id: Mapped[int] = BaseModel.get_pk_column()
    agreement_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("agreement.id", ondelete="SET NULL"), nullable=True
    )
    agreement_id_record: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    budget_line_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("budget_line_item.id", ondelete="SET NULL"), nullable=True
    )
    budget_line_id_record: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, index=True)
    ops_event_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("ops_event.id", ondelete="SET NULL"), nullable=True
    )
    history_title: Mapped[str]
    history_message: Mapped[str] = mapped_column(Text)
    timestamp: Mapped[str]
    history_type: Mapped[AgreementHistoryType] = mapped_column(ENUM(AgreementHistoryType), nullable=True)


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


def agreement_history_trigger_func(event: OpsEvent, session: Session, system_user: User, dry_run: bool = False):
    """
    Trigger function for handling agreement history events.
    :param event: The OpsEvent instance to handle.
    :param session: The database session to use.
    :param system_user: The system user to use for system-generated events.
    :param dry_run: If True, do not commit changes to the database. Default is False.
    """
    # Do not attempt to insert events into CAN History for failed or unknown status events
    if event.event_status == OpsEventStatus.FAILED or event.event_status == OpsEventStatus.UNKNOWN:
        return

    logger.debug(f"Handling event {event.event_type} with details: {event.event_details}")
    assert session is not None

    event_user = session.get(User, event.created_by)
    if event_user is None:
        # An event user should not every truly be None, but it can be in some test cases
        event_user = User(id=-1, full_name="Unknown User")
        logger.error(f"Event user for event {event.id} is None. Using placeholder user.")
    updated_by_system_user = system_user.id == event_user.id
    history_events = []
    match event.event_type:
        case OpsEventType.CREATE_BLI:
            history_events.append(
                AgreementHistory(
                    agreement_id=event.event_details["new_bli"]["agreement_id"],
                    agreement_id_record=event.event_details["new_bli"]["agreement_id"],
                    budget_line_id=event.event_details["new_bli"]["id"],
                    budget_line_id_record=event.event_details["new_bli"]["id"],
                    ops_event_id=event.id,
                    history_title="New Budget Line Added",
                    history_message=(
                        f"Changes made to the OPRE budget spreadsheet added new budget line {event.event_details['new_bli']['id']}."
                        if updated_by_system_user
                        else f"{event_user.full_name} added a new budget line {event.event_details['new_bli']['id']}."
                    ),
                    timestamp=event.created_on.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
                    history_type=AgreementHistoryType.BUDGET_LINE_ITEM_CREATED,
                )
            )
        case OpsEventType.UPDATE_BLI:
            history_events.extend(
                create_bli_update_history_events(event, event_user, updated_by_system_user, session, system_user)
            )
        case OpsEventType.DELETE_BLI:
            history_events.append(
                AgreementHistory(
                    agreement_id=event.event_details["deleted_bli"]["agreement_id"],
                    agreement_id_record=event.event_details["deleted_bli"]["agreement_id"],
                    budget_line_id=None,
                    budget_line_id_record=event.event_details["deleted_bli"]["id"],
                    ops_event_id=event.id,
                    history_title="Budget Line Deleted",
                    history_message=(
                        f"Changes made to the OPRE budget spreadsheet deleted the Draft BL {event.event_details['deleted_bli']['id']}."
                        if updated_by_system_user
                        else f"{event_user.full_name} deleted the Draft BL {event.event_details['deleted_bli']['id']}."
                    ),
                    timestamp=event.created_on.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
                    history_type=AgreementHistoryType.BUDGET_LINE_ITEM_DELETED,
                )
            )
        case OpsEventType.UPDATE_PROCUREMENT_SHOP:
            history_events.extend(create_proc_shop_fee_history_events(event, session, system_user, event_user))
        case OpsEventType.CREATE_NEW_AGREEMENT:
            history_events.append(
                AgreementHistory(
                    agreement_id=event.event_details["New Agreement"]["id"],
                    agreement_id_record=event.event_details["New Agreement"]["id"],
                    ops_event_id=event.id,
                    history_title="Agreement Created",
                    history_message=(
                        "Changes made to the OPRE budget spreadsheet created a new agreement."
                        if updated_by_system_user
                        else f"Agreement created by {event_user.full_name}."
                    ),
                    timestamp=event.created_on.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
                    history_type=AgreementHistoryType.AGREEMENT_CREATED,
                )
            )
        case OpsEventType.UPDATE_AGREEMENT:
            # Handle CAN Updates
            change_dict = event.event_details["agreement_updates"]["changes"]
            for key in change_dict.keys():
                history_item = create_agreement_update_history_event(
                    key,
                    change_dict[key]["old_value"],
                    change_dict[key]["new_value"],
                    event_user,
                    event.created_on.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
                    event.event_details["agreement_updates"]["owner_id"],
                    event.id,
                    session,
                    system_user,
                )
                if history_item:
                    history_events.append(history_item)
            if event.event_details["agreement_updates"].get("team_member_changes"):
                # Handle team member changes
                team_member_changes = event.event_details["agreement_updates"]["team_member_changes"]
                for item in team_member_changes.get("user_ids_added", []):
                    added_user_id = session.get(User, item)
                    history_events.append(
                        AgreementHistory(
                            agreement_id=event.event_details["agreement_updates"]["owner_id"],
                            agreement_id_record=event.event_details["agreement_updates"]["owner_id"],
                            ops_event_id=event.id,
                            history_title="Change to Team Members",
                            history_message=f"Team Member {added_user_id.full_name} added by {event_user.full_name}.",
                            timestamp=event.created_on.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
                            history_type=AgreementHistoryType.AGREEMENT_UPDATED,
                        )
                    )
                for item in team_member_changes.get("user_ids_removed", []):
                    removed_user_id = session.get(User, item)
                    history_events.append(
                        AgreementHistory(
                            agreement_id=event.event_details["agreement_updates"]["owner_id"],
                            agreement_id_record=event.event_details["agreement_updates"]["owner_id"],
                            ops_event_id=event.id,
                            history_title="Change to Team Members",
                            history_message=f"Team Member {removed_user_id.full_name} removed by {event_user.full_name}.",
                            timestamp=event.created_on.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
                            history_type=AgreementHistoryType.AGREEMENT_UPDATED,
                        )
                    )
            if event.event_details["agreement_updates"].get("special_topic_changes"):
                # Handle special topic changes
                special_topic_changes = event.event_details["agreement_updates"]["special_topic_changes"]
                for item in special_topic_changes.get("special_topics_ids_added", []):
                    added_special_topic = session.get(SpecialTopic, item)
                    history_events.append(
                        AgreementHistory(
                            agreement_id=event.event_details["agreement_updates"]["owner_id"],
                            agreement_id_record=event.event_details["agreement_updates"]["owner_id"],
                            ops_event_id=event.id,
                            history_title="Change to Special Topic/Population Studied",
                            history_message=f"{event_user.full_name} added Special Topic/Population Studied {added_special_topic.name}.",
                            timestamp=event.created_on.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
                            history_type=AgreementHistoryType.AGREEMENT_UPDATED,
                        )
                    )
                for item in special_topic_changes.get("special_topics_ids_removed", []):
                    removed_special_topic = session.get(SpecialTopic, item)
                    history_events.append(
                        AgreementHistory(
                            agreement_id=event.event_details["agreement_updates"]["owner_id"],
                            agreement_id_record=event.event_details["agreement_updates"]["owner_id"],
                            ops_event_id=event.id,
                            history_title="Change to Special Topic/Population Studied",
                            history_message=f"{event_user.full_name} removed Special Topic/Population Studied {removed_special_topic.name}.",
                            timestamp=event.created_on.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
                            history_type=AgreementHistoryType.AGREEMENT_UPDATED,
                        )
                    )
            if event.event_details["agreement_updates"].get("research_methodology_changes"):
                # Handle research methodology changes
                research_methodology_changes = event.event_details["agreement_updates"]["research_methodology_changes"]
                for item in research_methodology_changes.get("research_methodologies_ids_added", []):
                    added_research_methodology = session.get(ResearchMethodology, item)
                    history_events.append(
                        AgreementHistory(
                            agreement_id=event.event_details["agreement_updates"]["owner_id"],
                            agreement_id_record=event.event_details["agreement_updates"]["owner_id"],
                            ops_event_id=event.id,
                            history_title="Change to Research Methodologies",
                            history_message=f"{event_user.full_name} added Research Methodology {added_research_methodology.name}.",
                            timestamp=event.created_on.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
                            history_type=AgreementHistoryType.AGREEMENT_UPDATED,
                        )
                    )
                for item in research_methodology_changes.get("research_methodologies_ids_removed", []):
                    removed_research_methodology = session.get(ResearchMethodology, item)
                    history_events.append(
                        AgreementHistory(
                            agreement_id=event.event_details["agreement_updates"]["owner_id"],
                            agreement_id_record=event.event_details["agreement_updates"]["owner_id"],
                            ops_event_id=event.id,
                            history_title="Change to Research Methodologies",
                            history_message=f"{event_user.full_name} removed Research Methodology {removed_research_methodology.name}.",
                            timestamp=event.created_on.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
                            history_type=AgreementHistoryType.AGREEMENT_UPDATED,
                        )
                    )
        case OpsEventType.CREATE_CHANGE_REQUEST:
            change_request = event.event_details["change_request"]
            history_event = create_change_request_history_event(change_request, event, session, new_change_request=True)
            if history_event:
                history_events.append(history_event)
        case OpsEventType.UPDATE_CHANGE_REQUEST:
            change_request = event.event_details["change_request"]
            history_event = create_change_request_history_event(
                change_request, event, session, new_change_request=False
            )
            if history_event:
                history_events.append(history_event)
        case OpsEventType.CREATE_SERVICES_COMPONENT:
            history_events.append(
                AgreementHistory(
                    agreement_id=event.event_details["new_sc"]["agreement_id"],
                    agreement_id_record=event.event_details["new_sc"]["agreement_id"],
                    ops_event_id=event.id,
                    history_title="New Services Component Added",
                    history_message=(
                        f"Changes made to the OPRE budget spreadsheet added new services component {event.event_details['new_sc']['display_name']}."
                        if updated_by_system_user
                        else f"{event_user.full_name} added a new services component {event.event_details['new_sc']['display_name']}."
                    ),
                    timestamp=event.created_on.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
                    history_type=AgreementHistoryType.SERVICE_COMPONENT_CREATED,
                )
            )
        case OpsEventType.UPDATE_SERVICES_COMPONENT:
            history_events.extend(create_services_component_history_event(event, event_user, updated_by_system_user))
        case OpsEventType.DELETE_SERVICES_COMPONENT:
            history_events.append(
                AgreementHistory(
                    agreement_id=event.event_details["service_component"]["agreement_id"],
                    agreement_id_record=event.event_details["service_component"]["agreement_id"],
                    ops_event_id=event.id,
                    history_title="Services Component Deleted",
                    history_message=(
                        f"Changes made to the OPRE budget spreadsheet deleted services component {event.event_details['service_component']['display_name']}."
                        if updated_by_system_user
                        else f"{event_user.full_name} deleted services component {event.event_details['service_component']['display_name']}."
                    ),
                    timestamp=event.created_on.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
                    history_type=AgreementHistoryType.SERVICE_COMPONENT_DELETED,
                )
            )
        case OpsEventType.UPDATE_PROCUREMENT_TRACKER_STEP:
            history_event = create_procurement_tracker_step_update_history_event(event, event_user, session)
            if history_event:
                history_events.append(history_event)
    # Filter out any history_events that have agreement_id as None or agreement_id_record as None
    history_events = [
        event for event in history_events if event.agreement_id is not None and event.agreement_id_record is not None
    ]
    add_history_events(history_events, session)
    if not dry_run:
        session.commit()


def create_change_request_history_event(
    change_request: dict, event: OpsEvent, session: Session, new_change_request: bool
) -> AgreementHistory:
    if change_request:
        property_changed = next(iter(change_request["requested_change_data"]), None)
        reviewer_user = session.get(User, change_request["reviewed_by_id"])
        if reviewer_user is None and change_request["status"] in [
            "APPROVED",
            "REJECTED",
        ]:
            reviewer_user = User(id=-1, full_name="Unknown User")
            logger.error(f"Reviewer user for change request {change_request['id']} is None. Using placeholder user.")
        change_request_status = "approved" if change_request["status"] == "APPROVED" else "declined"
        if property_changed == "status":
            title = f"Status Change to {fix_stringified_enum_values(change_request['requested_change_data']['status'])} {fix_stringified_enum_values(change_request['status'])}"
            if new_change_request:
                message = f"{change_request['created_by_user']['full_name']} requested a status change on BL {change_request['budget_line_item_id']} from {fix_stringified_enum_values(change_request['requested_change_diff'][property_changed]['old'])} to {fix_stringified_enum_values(change_request['requested_change_diff'][property_changed]['new'])} and it's currently In Review for approval."
            else:
                message = f"{reviewer_user.full_name} {change_request_status} the status change on BL {change_request['budget_line_item_id']} from {fix_stringified_enum_values(change_request['requested_change_diff'][property_changed]['old'])} to {fix_stringified_enum_values(change_request['requested_change_diff'][property_changed]['new'])} as requested by {change_request['created_by_user']['full_name']}."
        elif property_changed == "can_id":
            old_can = session.get(CAN, change_request["requested_change_diff"][property_changed]["old"])
            new_can = session.get(CAN, change_request["requested_change_diff"][property_changed]["new"])
            if old_can:
                old_can_number = f"CAN {old_can.number}"
            else:
                old_can_number = "None"
            if new_can:
                new_can_number = f"CAN {new_can.number}"
            else:
                new_can_number = "None"
            title = f"Budget Change to CAN {fix_stringified_enum_values(change_request['status'])}"
            if new_change_request:
                message = f"{change_request['created_by_user']['full_name']} requested a budget change on BL {change_request['budget_line_item_id']} from {old_can_number} to {new_can_number} and it's currently In Review for approval."
            else:
                message = f"{reviewer_user.full_name} {change_request_status} the budget change on BL {change_request['budget_line_item_id']} from {old_can_number} to {new_can_number} as requested by {change_request['created_by_user']['full_name']}."
        elif property_changed == "amount":
            old_amount = "{:,.2f}".format(change_request["requested_change_diff"][property_changed]["old"])
            new_amount = "{:,.2f}".format(change_request["requested_change_diff"][property_changed]["new"])
            title = f"Budget Change to Amount {fix_stringified_enum_values(change_request['status'])}"
            if new_change_request:
                message = f"{change_request['created_by_user']['full_name']} requested a budget change on BL {change_request['budget_line_item_id']} from ${old_amount} to ${new_amount} and it's currently In Review for approval."
            else:
                message = f"{reviewer_user.full_name} {change_request_status} the budget change on BL {change_request['budget_line_item_id']} from ${old_amount} to ${new_amount} as requested by {change_request['created_by_user']['full_name']}."
        elif property_changed == "date_needed":
            old_date_value = change_request["requested_change_diff"][property_changed]["old"]
            new_date_value = change_request["requested_change_diff"][property_changed]["new"]
            if old_date_value is None or old_date_value == "":
                old_date = "None"
            else:
                old_date = datetime.strftime(datetime.strptime(old_date_value, "%Y-%m-%d"), "%m/%d/%Y")
            if new_date_value is None or new_date_value == "":
                new_date = "None"
            else:
                new_date = datetime.strftime(datetime.strptime(new_date_value, "%Y-%m-%d"), "%m/%d/%Y")
            title = f"Budget Change to Obligate By {fix_stringified_enum_values(change_request['status'])}"
            if new_change_request:
                message = f"{change_request['created_by_user']['full_name']} requested a budget change on BL {change_request['budget_line_item_id']} from Obligate By on {old_date} to {new_date} and it's currently In Review for approval."
            else:
                message = f"{reviewer_user.full_name} {change_request_status} the budget change on BL {change_request['budget_line_item_id']} from Obligate By on {old_date} to {new_date} as requested by {change_request['created_by_user']['full_name']}."
        elif property_changed == "awarding_entity_id":
            from models import Agreement as test
            from models import ProcurementShop

            old_proc_shop = session.get(
                ProcurementShop,
                change_request["requested_change_diff"][property_changed]["old"],
            )
            new_proc_shop = session.get(
                ProcurementShop,
                change_request["requested_change_diff"][property_changed]["new"],
            )
            agreement = session.get(test, change_request["agreement_id"])
            old_proc_shop_abbr = "TBD"
            new_proc_shop_abbr = "TBD"
            old_proc_shop_fee_total = 0
            new_proc_shop_fee_total = 0
            old_proc_shop_fee_percentage = (
                old_proc_shop.fee_percentage if old_proc_shop and old_proc_shop.fee_percentage else 0
            )
            new_proc_shop_fee_percentage = (
                new_proc_shop.fee_percentage if new_proc_shop and new_proc_shop.fee_percentage else 0
            )
            if old_proc_shop:
                old_proc_shop_abbr = old_proc_shop.abbr
                old_proc_shop_fee_total = (
                    sum([(item.amount * (old_proc_shop.fee_percentage / 100)) for item in agreement.budget_line_items])
                    if agreement
                    else 0
                )
            if new_proc_shop:
                new_proc_shop_abbr = new_proc_shop.abbr
                new_proc_shop_fee_total = (
                    sum([(item.amount * (new_proc_shop.fee_percentage / 100)) for item in agreement.budget_line_items])
                    if agreement
                    else 0
                )

            old_proc_shop_fee_total_str = "{:,.2f}".format(old_proc_shop_fee_total)
            new_proc_shop_fee_total_str = "{:,.2f}".format(new_proc_shop_fee_total)
            title = f"Change to Procurement Shop {fix_stringified_enum_values(change_request['status'])}"
            if new_change_request:
                message = f"{change_request['created_by_user']['full_name']} requested a change on the Procurement Shop from {old_proc_shop_abbr} to {new_proc_shop_abbr} and it's currently In Review for approval. This would change the fee rate from {old_proc_shop.fee_percentage if old_proc_shop.fee_percentage > 0 else "0"}% to {new_proc_shop.fee_percentage if new_proc_shop.fee_percentage > 0 else "0"}% and the fee total from ${old_proc_shop_fee_total_str} to ${new_proc_shop_fee_total_str}."
            else:
                message = (
                    f"{reviewer_user.full_name} {change_request_status} the change on the Procurement Shop from {old_proc_shop_abbr} to {new_proc_shop_abbr} as requested by {change_request['created_by_user']['full_name']}."
                    + (
                        f" This changes the fee rate from {old_proc_shop_fee_percentage if old_proc_shop_fee_percentage > 0 else "0"}% to {new_proc_shop_fee_percentage if new_proc_shop_fee_percentage > 0 else "0"}% and the fee total from ${old_proc_shop_fee_total_str} to ${new_proc_shop_fee_total_str}."
                        if change_request["status"] == "APPROVED"
                        else ""
                    )
                )
    agreement_id = change_request["agreement_id"]
    agreement = session.get(Agreement, agreement_id)
    return AgreementHistory(
        agreement_id=agreement_id if agreement else None,
        agreement_id_record=agreement_id,
        ops_event_id=event.id,
        history_title=title,
        history_message=message,
        timestamp=event.created_on.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
        history_type=(
            AgreementHistoryType.CHANGE_REQUEST_CREATED
            if new_change_request
            else AgreementHistoryType.CHANGE_REQUEST_UPDATED
        ),
    )


def create_agreement_update_history_event(
    property_name,
    old_value,
    new_value,
    updated_by_user,
    updated_on,
    agreement_id,
    ops_event_id,
    session,
    sys_user,
) -> AgreementHistory:
    """A method that generates an AgreementHistory event for an updated property. In the case where the updated property is not one
    that has been designed for, it will instead be logged and None will be returned from the method.
    """
    from models import Agreement

    updated_by_system_user = sys_user.id == updated_by_user.id
    agreement = session.get(Agreement, agreement_id)
    simple_property_names = [
        "name",
        "contract_number",
        "task_order_number",
        "po_number",
        "acquisition_type",
        "contract_type",
        "support_contacts",
        "service_requirement_type",
        "contract_category",
        "psc_contract_specialist",
    ]
    if property_name in simple_property_names:
        old_value_str = fix_stringified_enum_values(old_value)
        new_value_str = fix_stringified_enum_values(new_value)
        return AgreementHistory(
            agreement_id=get_agreement_id_from_agreement(agreement),
            agreement_id_record=agreement_id,
            ops_event_id=ops_event_id,
            history_title=f"Change to {get_agreement_property_display_name(property_name, True)}",
            history_message=(
                f"Changes made to the OPRE budget spreadsheet changed the {get_agreement_property_display_name(property_name, False)} from {old_value_str} to {new_value_str}."
                if updated_by_system_user
                else f"{updated_by_user.full_name} changed the {get_agreement_property_display_name(property_name, False)} from {old_value_str} to {new_value_str}."
            ),
            timestamp=updated_on,
            history_type=AgreementHistoryType.AGREEMENT_UPDATED,
        )
    else:
        match property_name:
            case "description":
                return AgreementHistory(
                    agreement_id=get_agreement_id_from_agreement(agreement),
                    agreement_id_record=agreement_id,
                    ops_event_id=ops_event_id,
                    history_title="Change to Description",
                    history_message=(
                        f"Changes made to the OPRE budget spreadsheet changed the agreement description."
                        if updated_by_system_user
                        else f"{updated_by_user.full_name} edited the agreement description."
                    ),
                    timestamp=updated_on,
                    history_type=AgreementHistoryType.AGREEMENT_UPDATED,
                )
            case "notes":
                return AgreementHistory(
                    agreement_id=get_agreement_id_from_agreement(agreement),
                    agreement_id_record=agreement_id,
                    ops_event_id=ops_event_id,
                    history_title="Change to Notes",
                    history_message=(
                        f"Changes made to the OPRE budget spreadsheet changed the notes."
                        if updated_by_system_user
                        else f"{updated_by_user.full_name} changed the notes."
                    ),
                    timestamp=updated_on,
                    history_type=AgreementHistoryType.AGREEMENT_UPDATED,
                )
            case "vendor_id":
                from models import Vendor as vendor

                old_vendor = session.get(vendor, old_value)
                new_vendor = session.get(vendor, new_value)
                old_vendor_name = "None"
                new_vendor_name = "None"
                if old_vendor:
                    old_vendor_name = old_vendor.name
                if new_vendor:
                    new_vendor_name = new_vendor.name

                return AgreementHistory(
                    agreement_id=get_agreement_id_from_agreement(agreement),
                    agreement_id_record=agreement_id,
                    ops_event_id=ops_event_id,
                    history_title="Change to Vendor",
                    history_message=(
                        f"Changes made to the OPRE budget spreadsheet changed the vendor from {old_vendor_name} to {new_vendor_name}."
                        if updated_by_system_user
                        else f"{updated_by_user.full_name} changed the vendor from {old_vendor_name} to {new_vendor_name}."
                    ),
                    timestamp=updated_on,
                    history_type=AgreementHistoryType.AGREEMENT_UPDATED,
                )
            case "product_service_code_id":
                old_product_service_code = session.get(ProductServiceCode, old_value)
                new_product_service_code = session.get(ProductServiceCode, new_value)
                old_psc_name = "None"
                new_psc_name = "None"
                if old_product_service_code:
                    old_psc_name = old_product_service_code.name
                if new_product_service_code:
                    new_psc_name = new_product_service_code.name
                return AgreementHistory(
                    agreement_id=get_agreement_id_from_agreement(agreement),
                    agreement_id_record=agreement_id,
                    ops_event_id=ops_event_id,
                    history_title="Change to Product Service Code",
                    history_message=(
                        f"Changes made to the OPRE budget spreadsheet changed the product service code from {old_psc_name} to {new_psc_name}."
                        if updated_by_system_user
                        else f"{updated_by_user.full_name} changed the product service code from {old_psc_name} to {new_psc_name}."
                    ),
                    timestamp=updated_on,
                    history_type=AgreementHistoryType.AGREEMENT_UPDATED,
                )
            case "project_officer_id":
                old_po_name = "TBD"
                new_po_name = "TBD"
                if old_value:
                    old_po = session.get(User, old_value)
                    old_po_name = old_po.full_name if old_po else "TBD"
                if new_value:
                    new_po = session.get(User, new_value)
                    new_po_name = new_po.full_name if new_po else "TBD"
                return AgreementHistory(
                    agreement_id=get_agreement_id_from_agreement(agreement),
                    agreement_id_record=agreement_id,
                    ops_event_id=ops_event_id,
                    history_title="Change to COR",
                    history_message=(
                        f"Changes made to the OPRE budget spreadsheet changed the COR from {old_po_name} to {new_po_name}."
                        if updated_by_system_user
                        else f"{updated_by_user.full_name} changed the COR from {old_po_name} to {new_po_name}."
                    ),
                    timestamp=updated_on,
                    history_type=AgreementHistoryType.AGREEMENT_UPDATED,
                )
            case "alternate_project_officer_id":
                old_po_name = "TBD"
                new_po_name = "TBD"
                if old_value:
                    old_po = session.get(User, old_value)
                    old_po_name = old_po.full_name if old_po else "TBD"
                if new_value:
                    new_po = session.get(User, new_value)
                    new_po_name = new_po.full_name if new_po else "TBD"
                return AgreementHistory(
                    agreement_id=get_agreement_id_from_agreement(agreement),
                    agreement_id_record=agreement_id,
                    ops_event_id=ops_event_id,
                    history_title="Change to Alternate COR",
                    history_message=(
                        f"Changes made to the OPRE budget spreadsheet changed the Alternate COR from {old_po_name} to {new_po_name}."
                        if updated_by_system_user
                        else f"{updated_by_user.full_name} changed the Alternate COR from {old_po_name} to {new_po_name}."
                    ),
                    timestamp=updated_on,
                    history_type=AgreementHistoryType.AGREEMENT_UPDATED,
                )
            case "awarding_entity_id":
                from models import ProcurementShop

                old_proc_shop = session.get(ProcurementShop, old_value)
                new_proc_shop = session.get(ProcurementShop, new_value)
                agreement = session.get(Agreement, agreement_id)

                old_proc_shop_fee_total = 0
                new_proc_shop_fee_total = 0
                old_proc_shop_fee_percentage = 0
                new_proc_shop_fee_percentage = 0
                old_proc_shop_abbr = "TBD"
                new_proc_shop_abbr = "TBD"
                if old_proc_shop:
                    old_proc_shop_abbr = old_proc_shop.abbr
                    old_proc_shop_fee_percentage = old_proc_shop.fee_percentage
                    old_proc_shop_fee_total = (
                        sum(
                            [
                                (item.amount * (old_proc_shop.fee_percentage / 100))
                                for item in agreement.budget_line_items
                            ]
                        )
                        if agreement
                        else 0
                    )
                if new_proc_shop:
                    new_proc_shop_abbr = new_proc_shop.abbr
                    new_proc_shop_fee_percentage = new_proc_shop.fee_percentage
                    new_proc_shop_fee_total = (
                        sum(
                            [
                                (item.amount * (new_proc_shop.fee_percentage / 100))
                                for item in agreement.budget_line_items
                            ]
                        )
                        if agreement
                        else 0
                    )
                old_proc_shop_fee_total_str = "{:,.2f}".format(old_proc_shop_fee_total)
                new_proc_shop_fee_total_str = "{:,.2f}".format(new_proc_shop_fee_total)
                fee_change_effect_text = f"This changes the fee rate from {old_proc_shop_fee_percentage if old_proc_shop_fee_percentage > 0 else "0"}% to {new_proc_shop_fee_percentage if new_proc_shop_fee_percentage > 0 else "0"}% and the fee total from ${old_proc_shop_fee_total_str} to ${new_proc_shop_fee_total_str}."
                title = f"Change to Procurement Shop"
                message = (
                    f"Changes made to the OPRE budget spreadsheet changed the Procurement Shop from {old_proc_shop_abbr} to {new_proc_shop_abbr}. {fee_change_effect_text}"
                    if updated_by_system_user
                    else f"{updated_by_user.full_name} changed the Procurement Shop from {old_proc_shop_abbr} to {new_proc_shop_abbr}. {fee_change_effect_text}"
                )
                return AgreementHistory(
                    agreement_id=get_agreement_id_from_agreement(agreement),
                    agreement_id_record=agreement_id,
                    ops_event_id=ops_event_id,
                    history_title=title,
                    history_message=message,
                    timestamp=updated_on,
                    history_type=AgreementHistoryType.AGREEMENT_UPDATED,
                )
            case "requesting_agency_id" | "servicing_agency_id":
                from models import AgreementAgency

                old_agency = session.get(AgreementAgency, old_value)
                old_agency_name = old_agency.name if old_agency else "None"
                new_agency = session.get(AgreementAgency, new_value)
                new_agency_name = new_agency.name if new_agency else "None"

                agency_type_string = (
                    "Requesting Agency" if property_name == "requesting_agency_id" else "Servicing Agency"
                )
                return AgreementHistory(
                    agreement_id=get_agreement_id_from_agreement(agreement),
                    agreement_id_record=agreement_id,
                    ops_event_id=ops_event_id,
                    history_title=f"Change to {agency_type_string}",
                    history_message=(
                        f"Changes made to the OPRE budget spreadsheet changed the {agency_type_string} from {old_agency_name} to {new_agency_name}."
                        if updated_by_system_user
                        else f"{updated_by_user.full_name} changed the {agency_type_string} from {old_agency_name} to {new_agency_name}."
                    ),
                    timestamp=updated_on,
                    history_type=AgreementHistoryType.AGREEMENT_UPDATED,
                )
            case "agreement_reason":
                old_value_str = fix_stringified_enum_values(old_value)
                new_value_str = fix_stringified_enum_values(new_value)
                history_message = (
                    f"Changes made to the OPRE budget spreadsheet changed the Reason for Agreement from {old_value_str} to {new_value_str}."
                    if updated_by_system_user
                    else f"{updated_by_user.full_name} changed the Reason for Agreement from {old_value_str} to {new_value_str}."
                )
                if new_value == "RECOMPETE":
                    incumbent_name = "None"
                    if agreement and agreement.vendor:
                        incumbent_name = agreement.vendor.name

                    history_message = (
                        f"Changes made to the OPRE budget spreadsheet changed the Reason for Agreement from {old_value_str} to {new_value_str} and set the Incumbent to {incumbent_name}."
                        if updated_by_system_user
                        else f"{updated_by_user.full_name} changed the Reason for Agreement from {old_value_str} to {new_value_str} and set the Incumbent to {incumbent_name}."
                    )

                return AgreementHistory(
                    agreement_id=get_agreement_id_from_agreement(agreement),
                    agreement_id_record=agreement_id,
                    ops_event_id=ops_event_id,
                    history_title="Change to Reason for Agreement",
                    history_message=history_message,
                    timestamp=updated_on,
                    history_type=AgreementHistoryType.AGREEMENT_UPDATED,
                )
            case _:
                logger.info(f"{property_name} changed by {updated_by_user.full_name} from {old_value} to {new_value}")
                return None


def get_agreement_id_from_agreement(agreement: Agreement) -> int | None:
    """A helper function to get the agreement ID from an Agreement object, returning None if the agreement is None."""
    if agreement:
        return agreement.id
    return None


def create_proc_shop_fee_history_events(event: OpsEvent, session: Session, system_user: User, event_user: User):
    from models import ProcurementShop

    fee_change_dict = event.event_details["proc_shop_fee"]["changes"]
    history_events = []
    for key in fee_change_dict:
        if key == "fee":
            old_value = fee_change_dict[key]["old_value"] if fee_change_dict[key]["old_value"] != 0.0 else 0
            new_value = fee_change_dict[key]["new_value"] if fee_change_dict[key]["new_value"] != 0.0 else 0
            proc_shop_id = event.event_details["proc_shop_fee"]["owner_id"]
            proc_shop = session.get(ProcurementShop, proc_shop_id)
            proc_shop_abbr = proc_shop.abbr if proc_shop else "TBD"
            updated_by_system_user = system_user.id == event_user.id
            # find all agreements that are using the procurement shop
            matching_agreements = session.query(Agreement).where(Agreement.awarding_entity_id == proc_shop_id).all()
            for agreement in matching_agreements:
                history_events.append(
                    AgreementHistory(
                        agreement_id=agreement.id,
                        agreement_id_record=agreement.id,
                        ops_event_id=event.id,
                        history_title="Change to Procurement Shop Fee Rate",
                        history_message=(
                            f"Changes made to the OPRE budget spreadsheet changed the current fee rate for {proc_shop_abbr} from {old_value}% to {new_value}%."
                            if updated_by_system_user
                            else f"{event_user.full_name} changed the current fee rate for {proc_shop_abbr} from {old_value}% to {new_value}%."
                        ),
                        timestamp=event.created_on.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
                        history_type=AgreementHistoryType.PROCUREMENT_SHOP_UPDATED,
                    )
                )
    return history_events


def create_bli_update_history_events(
    event: OpsEvent,
    event_user: User,
    updated_by_system_user: bool,
    session: Session,
    system_user: User,
):
    from models import BudgetLineItem

    bli_change_dict = event.event_details["bli_updates"]["changes"]
    history_events = []
    bli_id = event.event_details["bli"]["id"]
    agreement_id = event.event_details["bli"]["agreement_id"]
    bli = session.get(BudgetLineItem, bli_id)
    agreement = session.get(Agreement, agreement_id)
    for key in bli_change_dict:
        old_value = bli_change_dict[key]["old_value"]
        new_value = bli_change_dict[key]["new_value"]
        history_title = ""
        history_message = ""
        if key == "can_id":
            old_can = session.get(CAN, old_value)
            new_can = session.get(CAN, new_value)
            old_can_name = "None"
            new_can_name = "None"
            if old_can:
                old_can_name = f"CAN {old_can.number}"
            if new_can:
                new_can_name = f"CAN {new_can.number}"
            history_title = "Change to CAN"
            if updated_by_system_user:
                history_message = f"Changes made to the OPRE budget spreadsheet changed the CAN for BL {bli_id} from {old_can_name} to {new_can_name}."
            else:
                history_message = (
                    f"{event_user.full_name} changed the CAN for BL {bli_id} from {old_can_name} to {new_can_name}."
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
                history_message = f"{event_user.full_name} changed the Obligate By date for BL {bli_id} from {old_date} to {new_date}."
        elif key == "amount":
            old_value_float = float(old_value)
            new_value_float = float(new_value)
            old_value_str = "{:,.2f}".format(old_value_float)
            new_value_str = "{:,.2f}".format(new_value_float)
            history_title = "Change to Amount"
            if updated_by_system_user:
                history_message = f"Changes made to the OPRE budget spreadsheet changed the amount for BL {bli_id} from ${old_value_str} to ${new_value_str}."
            else:
                history_message = f"{event_user.full_name} changed the amount for BL {bli_id} from ${old_value_str} to ${new_value_str}."

        elif key == "line_description":
            history_title = "Change to Line Description"
            if updated_by_system_user:
                history_message = (
                    f"Changes made to the OPRE budget spreadsheet changed the line description for BL {bli_id}."
                )
            else:
                history_message = f"{event_user.full_name} changed the line description for BL {bli_id}."
        elif key == "service_component_name_for_sort":
            history_title = "Change to Services Component"
            if updated_by_system_user:
                history_message = f"Changes made to the OPRE budget spreadsheet changed the services component for BL {bli_id} from {old_value} to {new_value}."
            else:
                history_message = f"{event_user.full_name} changed the services component for BL {bli_id} from {old_value} to {new_value}."
        if history_title and history_message:
            history_events.append(
                AgreementHistory(
                    agreement_id=agreement_id if agreement else None,
                    agreement_id_record=agreement_id,
                    budget_line_id=bli_id if bli else None,
                    budget_line_id_record=bli_id,
                    ops_event_id=event.id,
                    history_title=history_title,
                    history_message=history_message,
                    timestamp=event.created_on.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
                    history_type=AgreementHistoryType.BUDGET_LINE_ITEM_UPDATED,
                )
            )
    return history_events


def create_services_component_history_event(event: OpsEvent, event_user: User, system_user_created_event: bool):
    sc_change_dict = event.event_details["services_component_updates"]["changes"]
    history_events = []
    for key in sc_change_dict:
        old_value = sc_change_dict[key]["old_value"]
        new_value = sc_change_dict[key]["new_value"]
        if key == "number" or key == "sub_component":
            if system_user_created_event:
                history_message = f"Changes made to the OPRE budget spreadsheet changed the {get_services_component_property_display_name(key)} for Services Component {event.event_details['services_component_updates']['sc_display_name']} from {old_value} to {new_value}."
            else:
                history_message = f"{event_user.full_name} changed the {get_services_component_property_display_name(key)} for Services Component {event.event_details['services_component_updates']['sc_display_name']} from {old_value} to {new_value}."
        elif key == "period_start" or key == "period_end":
            if old_value is None or old_value == "":
                old_value = "None"
            else:
                old_date = datetime.strftime(datetime.strptime(old_value, "%Y-%m-%d"), "%m/%d/%Y")
            if new_value is None or new_value == "":
                new_value = "None"
            else:
                new_date = datetime.strftime(datetime.strptime(new_value, "%Y-%m-%d"), "%m/%d/%Y")
            if system_user_created_event:
                history_message = f"Changes made to the OPRE budget spreadsheet changed the {get_services_component_property_display_name(key)} for Services Component {event.event_details['services_component_updates']['sc_display_name']} from {old_date} to {new_date}."
            else:
                history_message = f"{event_user.full_name} changed the {get_services_component_property_display_name(key)} for Services Component {event.event_details['services_component_updates']['sc_display_name']} from {old_date} to {new_date}."
        elif key == "description":
            if system_user_created_event:
                history_message = f"Changes made to the OPRE budget spreadsheet changed the description for Services Component {event.event_details['services_component_updates']['sc_display_name']}."
            else:
                history_message = f"{event_user.full_name} changed the description for Services Component {event.event_details['services_component_updates']['sc_display_name']}."
        elif key == "optional":
            if old_value == False:
                if system_user_created_event:
                    history_message = f"Changes made to the OPRE budget spreadsheet changed the Services Component {event.event_details['services_component_updates']['sc_display_number']} for Services Component {event.event_details['services_component_updates']['sc_display_name']} to Optional Services Component {event.event_details['services_component_updates']['sc_display_number']}."
                else:
                    history_message = f"{event_user.full_name} changed the Services Component {event.event_details['services_component_updates']['sc_display_number']} to Optional Services Component {event.event_details['services_component_updates']['sc_display_number']}."
            else:
                if system_user_created_event:
                    history_message = f"Changes made to the OPRE budget spreadsheet changed the Optional Services Component {event.event_details['services_component_updates']['sc_display_number']} to Services Component {event.event_details['services_component_updates']['sc_display_number']}."
                else:
                    history_message = f"{event_user.full_name} changed the Optional Services Component {event.event_details['services_component_updates']['sc_display_number']} to Services Component {event.event_details['services_component_updates']['sc_display_number']}."
        else:
            continue  # Skip any keys that are not handled
        history_events.append(
            AgreementHistory(
                agreement_id=event.event_details["services_component_updates"]["owner_id"],
                agreement_id_record=event.event_details["services_component_updates"]["owner_id"],
                ops_event_id=event.id,
                history_title="Change to Services Component",
                history_message=history_message,
                timestamp=event.created_on.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
                history_type=AgreementHistoryType.SERVICE_COMPONENT_UPDATED,
            )
        )
    return history_events


def create_procurement_tracker_step_update_history_event(
    event: OpsEvent,
    event_user: User,
    session: Session,
) -> AgreementHistory | None:
    from models import ProcurementTracker, ProcurementTrackerStepStatus, ProcurementTrackerStepType

    """A method that generates an AgreementHistory event for an updated procurement tracker step."""
    procurement_tracker_step = event.event_details["procurement_tracker_step"]
    updates = event.event_details["procurement_tracker_step_updates"]["changes"]
    if "status" not in updates:
        return None  # Only create history event for status changes
    procurement_tracker = session.get(ProcurementTracker, procurement_tracker_step["procurement_tracker_id"])
    new_value = updates["status"]["new_value"]
    step_type = procurement_tracker_step["step_type"]
    if new_value != str(ProcurementTrackerStepStatus.COMPLETED):
        return None  # Only create history event when step is marked as completed

    history_title = ""
    history_message = ""
    if step_type == str(ProcurementTrackerStepType.ACQUISITION_PLANNING):
        history_title = "Acquisition Planning Complete"
        history_message = f"{event_user.full_name} completed Step 1: Acquisition Planning and the pre-solicitation package has been sent to the Procurement Shop for review."
    else:
        return None  # Only Acquisition Planning step is supported right now

    return AgreementHistory(
        agreement_id=procurement_tracker.agreement_id,
        agreement_id_record=procurement_tracker.agreement_id,
        ops_event_id=event.id,
        history_title=history_title,
        history_message=history_message,
        timestamp=event.created_on.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
        history_type=AgreementHistoryType.PROCUREMENT_TRACKER_STEP_UPDATED,
    )


def add_history_events(events: List[AgreementHistory], session: Session) -> None:
    """Add a list of AgreementHistory events to the database session.
    First check that there are not any matching events already in the database to prevent duplicates.
    """
    for event in events:
        agreement_history_items = (
            session.query(AgreementHistory)
            .where(AgreementHistory.agreement_id_record == event.agreement_id_record)
            .all()
        )

        # Also check items already added to session in this batch (not yet committed)
        for item in session.new:
            if isinstance(item, AgreementHistory) and item.agreement_id_record == event.agreement_id_record:
                agreement_history_items.append(item)

        duplicate_found = False
        for item in agreement_history_items:
            if (
                is_timespan_within_one_minute(event.timestamp, item.timestamp)
                and item.history_type == event.history_type
                and item.history_message == event.history_message
            ):
                # enough fields match that we're willing to say this is a duplicate.
                duplicate_found = True
                break

        # If no duplicate of the event was found, add it to the database session.
        if not duplicate_found:
            session.add(event)


def get_agreement_property_display_name(property_name: str, in_title: bool) -> str:
    """Get the display name for a given agreement property."""
    title_display_names = {
        "name": "Agreement Title",
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
        "psc_contract_specialist": "PSC Contract Specialist",
        "agreement_reason": "Agreement Reason",
    }

    message_display_names = {
        "name": "agreement title",
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
        "psc_contract_specialist": "PSC contract specialist",
        "agreement_reason": "Reason for Agreement",
    }
    return (
        title_display_names.get(property_name, property_name)
        if in_title
        else message_display_names.get(property_name, property_name)
    )


def is_timespan_within_one_minute(datetime_to_check: str, reference_datetime: str) -> bool:
    """Check if two ISO format timespan strings are within one minute of each other."""
    try:
        datetime_to_check_dt = datetime.fromisoformat(datetime_to_check.replace("Z", "+00:00"))
        reference_datetime_dt = datetime.fromisoformat(reference_datetime.replace("Z", "+00:00"))
        difference = abs((datetime_to_check_dt - reference_datetime_dt).total_seconds())
        return difference <= 60  # 60 seconds in a minute
    except ValueError as e:
        logger.error(f"Error parsing timespan strings: {e}")
        return False


def get_services_component_property_display_name(property_name: str) -> str:
    """Get the display name for a given services component property."""
    services_component_display_names = {
        "number": "component number",
        "period_start": "Period of Performance - Start date",
        "period_end": "Period of Performance - End date",
        "description": "description",
        "sub_component": "sub-component",
        "optional": "optional",
    }
    return services_component_display_names.get(property_name, property_name)


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
        # Change Request Types
        # Change Request Statuses
        "IN_REVIEW": "In Review",
        "APPROVED": "Approved",
        # wording of rejected change requests is that they are 'Declined'
        "REJECTED": "Declined",
        # Budget Line Item Types
        # Budget Line Item Statuses
        "DRAFT": "Draft",
        "PLANNED": "Planned",
        "IN_EXECUTION": "Executing",
        "OBLIGATED": "Obligated",
    }
    expected_enum_keys = expected_enum_dict.keys()
    if value in expected_enum_keys:
        return expected_enum_dict[value]
    return value
