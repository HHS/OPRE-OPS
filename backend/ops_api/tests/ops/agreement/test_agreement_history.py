from datetime import datetime, timedelta

from sqlalchemy import select

from models import AgreementHistory, AgreementHistoryType, OpsEvent, OpsEventStatus, OpsEventType
from models.agreement_history import add_history_events
from ops_api.ops.services.agreement_messages import agreement_history_trigger

test_user_id = 503
test_user_name = "Amelia Popham"

timestamp = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S.%fZ")


def test_update_agreement_agreement_history_trigger(loaded_db, app_ctx):
    next_agreement_history_ops_event = loaded_db.get(OpsEvent, 32)
    agreement_history_trigger(next_agreement_history_ops_event, loaded_db)

    loaded_db.flush()  # Ensure items are visible to queries
    # Filter for history items created by this specific ops event
    agreement_history_list = (
        loaded_db.query(AgreementHistory)
        .where(AgreementHistory.ops_event_id == next_agreement_history_ops_event.id)
        .order_by(AgreementHistory.id)
        .all()
    )
    agreement_history_count = len(agreement_history_list)
    new_agreement_history_item = agreement_history_list[agreement_history_count - 1]
    new_agreement_history_item_2 = agreement_history_list[agreement_history_count - 2]

    assert new_agreement_history_item.history_type == AgreementHistoryType.AGREEMENT_UPDATED
    assert new_agreement_history_item.history_title == "Change to Description"
    assert (
        new_agreement_history_item.history_message
        == "Changes made to the OPRE budget spreadsheet changed the Agreement Description."
    )
    assert new_agreement_history_item_2.history_type == AgreementHistoryType.AGREEMENT_UPDATED
    assert new_agreement_history_item_2.history_title == "Change to Agreement Title"
    assert (
        new_agreement_history_item_2.history_message
        == "Changes made to the OPRE budget spreadsheet changed the agreement title from Interoperability "
        "Initiatives to Interoperability Initiatives Test."
    )

    next_agreement_history_ops_event_2 = loaded_db.get(OpsEvent, 33)
    agreement_history_trigger(next_agreement_history_ops_event_2, loaded_db)

    loaded_db.flush()  # Ensure items are visible to queries

    # Filter for history items created by this specific ops event
    agreement_history_list = (
        loaded_db.query(AgreementHistory)
        .where(AgreementHistory.ops_event_id == next_agreement_history_ops_event_2.id)
        .order_by(AgreementHistory.id)
        .all()
    )
    agreement_history_count = len(agreement_history_list)

    agreement_service_requirement_type_change = agreement_history_list[agreement_history_count - 1]
    product_service_code_change = agreement_history_list[agreement_history_count - 2]
    agreement_reason_change = agreement_history_list[agreement_history_count - 3]
    contract_type_change = agreement_history_list[agreement_history_count - 4]
    vendor_change = agreement_history_list[agreement_history_count - 5]

    assert agreement_service_requirement_type_change.history_type == AgreementHistoryType.AGREEMENT_UPDATED
    assert agreement_service_requirement_type_change.history_title == "Change to Service Requirement Type"
    assert (
        agreement_service_requirement_type_change.history_message
        == "Changes made to the OPRE budget spreadsheet changed the service requirement type from "
        "Non-Severable to Severable."
    )
    assert product_service_code_change.history_type == AgreementHistoryType.AGREEMENT_UPDATED
    assert product_service_code_change.history_title == "Change to Product Service Code"
    assert (
        product_service_code_change.history_message
        == "Changes made to the OPRE budget spreadsheet changed the product service code from Other "
        "Scientific and Technical Consulting Services to Convention and Trade Shows."
    )

    assert agreement_reason_change.history_type == AgreementHistoryType.AGREEMENT_UPDATED
    assert agreement_reason_change.history_title == "Change to Reason for Agreement"
    assert (
        agreement_reason_change.history_message
        == "Changes made to the OPRE budget spreadsheet changed the Reason for Agreement from New "
        "Requirement to Recompete and set the Incumbent to Vendor 3."
    )

    assert contract_type_change.history_type == AgreementHistoryType.AGREEMENT_UPDATED
    assert contract_type_change.history_title == "Change to Contract Type"
    assert (
        contract_type_change.history_message
        == "Changes made to the OPRE budget spreadsheet changed the contract type from Labor Hour to "
        "Cost Plus Fixed Fee."
    )

    assert vendor_change.history_type == AgreementHistoryType.AGREEMENT_UPDATED
    assert vendor_change.history_title == "Change to Vendor"
    assert (
        vendor_change.history_message
        == "Changes made to the OPRE budget spreadsheet changed the vendor from Vendor 3 to Vendor 1."
    )


def test_update_add_remove_team_member_history_trigger(loaded_db, app_ctx):
    next_agreement_history_ops_event = loaded_db.get(OpsEvent, 34)
    agreement_history_trigger(next_agreement_history_ops_event, loaded_db)

    loaded_db.flush()  # Ensure items are visible to queries
    # Filter for history items created by this specific ops event
    agreement_history_list = (
        loaded_db.query(AgreementHistory)
        .where(AgreementHistory.ops_event_id == next_agreement_history_ops_event.id)
        .order_by(AgreementHistory.id)
        .all()
    )
    agreement_history_count = len(agreement_history_list)
    new_agreement_history_item = agreement_history_list[agreement_history_count - 1]
    new_agreement_history_item_2 = agreement_history_list[agreement_history_count - 2]
    new_agreement_history_item_3 = agreement_history_list[agreement_history_count - 3]

    assert new_agreement_history_item.history_type == AgreementHistoryType.AGREEMENT_UPDATED
    assert new_agreement_history_item.history_title == "Change to Team Members"
    assert new_agreement_history_item.history_message == "System Admin removed team member Niki Denmark."
    assert new_agreement_history_item_2.history_type == AgreementHistoryType.AGREEMENT_UPDATED
    assert new_agreement_history_item_2.history_title == "Change to Team Members"
    assert new_agreement_history_item_2.history_message == "System Admin added team member Amare Beza."
    assert new_agreement_history_item_3.history_type == AgreementHistoryType.AGREEMENT_UPDATED
    assert new_agreement_history_item_3.history_title == "Change to Team Members"
    assert new_agreement_history_item_3.history_message == "System Admin added team member Dave Director."


def test_update_bli_status_change_history_trigger(loaded_db, app_ctx):
    next_agreement_history_ops_event = loaded_db.get(OpsEvent, 35)
    agreement_history_trigger(next_agreement_history_ops_event, loaded_db)

    loaded_db.flush()  # Ensure items are visible to queries
    # Filter for history items created by this specific ops event
    agreement_history_list = (
        loaded_db.query(AgreementHistory)
        .where(AgreementHistory.ops_event_id == next_agreement_history_ops_event.id)
        .order_by(AgreementHistory.id)
        .all()
    )
    agreement_history_count = len(agreement_history_list)
    new_agreement_history_item = agreement_history_list[agreement_history_count - 1]

    assert new_agreement_history_item.history_type == AgreementHistoryType.CHANGE_REQUEST_CREATED
    assert new_agreement_history_item.history_title == "Status Change to Executing In Review"
    assert (
        new_agreement_history_item.history_message
        == "System Owner requested a status change on BL 15007 from Planned to Executing and it's currently "
        "In Review for approval."
    )


def test_update_bli_properties_change_history_trigger(loaded_db, app_ctx):
    next_agreement_history_ops_event = loaded_db.get(OpsEvent, 36)
    agreement_history_trigger(next_agreement_history_ops_event, loaded_db)

    loaded_db.flush()  # Ensure items are visible to queries
    # Filter for history items created by this specific ops event
    agreement_history_list = (
        loaded_db.query(AgreementHistory)
        .where(AgreementHistory.ops_event_id == next_agreement_history_ops_event.id)
        .order_by(AgreementHistory.id)
        .all()
    )
    agreement_history_count = len(agreement_history_list)
    new_agreement_history_item = agreement_history_list[agreement_history_count - 1]

    assert new_agreement_history_item.history_type == AgreementHistoryType.CHANGE_REQUEST_CREATED
    assert new_agreement_history_item.history_title == "Budget Change to CAN In Review"
    assert (
        new_agreement_history_item.history_message
        == "System Owner requested a budget change on BL 15008 from CAN G99XXX8 to CAN G99SHARED and it's "
        "currently In Review for approval."
    )

    amount_change_history_ops_event = loaded_db.get(OpsEvent, 37)
    agreement_history_trigger(amount_change_history_ops_event, loaded_db)

    loaded_db.flush()  # Ensure items are visible to queries
    # Filter for history items created by this specific ops event
    agreement_history_list = (
        loaded_db.query(AgreementHistory)
        .where(AgreementHistory.ops_event_id == amount_change_history_ops_event.id)
        .order_by(AgreementHistory.id)
        .all()
    )
    agreement_history_count = len(agreement_history_list)
    new_agreement_history_item = agreement_history_list[agreement_history_count - 1]

    assert new_agreement_history_item.history_type == AgreementHistoryType.CHANGE_REQUEST_CREATED
    assert new_agreement_history_item.history_title == "Budget Change to Amount In Review"
    assert (
        new_agreement_history_item.history_message
        == "System Owner requested a budget change on BL 15007 from $700,000.00 to $800,000.00 and it's "
        "currently In Review for approval."
    )

    obligated_by_change_history_ops_event = loaded_db.get(OpsEvent, 38)
    agreement_history_trigger(obligated_by_change_history_ops_event, loaded_db)

    loaded_db.flush()  # Ensure items are visible to queries
    # Filter for history items created by this specific ops event
    agreement_history_list = (
        loaded_db.query(AgreementHistory)
        .where(AgreementHistory.ops_event_id == obligated_by_change_history_ops_event.id)
        .order_by(AgreementHistory.id)
        .all()
    )
    agreement_history_count = len(agreement_history_list)
    new_agreement_history_item = agreement_history_list[agreement_history_count - 1]

    assert new_agreement_history_item.history_type == AgreementHistoryType.CHANGE_REQUEST_CREATED
    assert new_agreement_history_item.history_title == "Budget Change to Obligate By In Review"
    assert (
        new_agreement_history_item.history_message
        == "System Owner requested a budget change on BL 15007 from Obligate By on 06/13/2043 to 07/13/2043 "
        "and it's currently In Review for approval."
    )


def test_agreement_history_change_request_approve_deny(loaded_db):
    next_agreement_history_ops_event = loaded_db.get(OpsEvent, 39)
    agreement_history_trigger(next_agreement_history_ops_event, loaded_db)

    loaded_db.flush()  # Ensure items are visible to queries
    # Filter for history items created by this specific ops event
    agreement_history_list = (
        loaded_db.query(AgreementHistory)
        .where(AgreementHistory.ops_event_id == next_agreement_history_ops_event.id)
        .order_by(AgreementHistory.id)
        .all()
    )
    agreement_history_count = len(agreement_history_list)
    new_agreement_history_item = agreement_history_list[agreement_history_count - 1]

    assert new_agreement_history_item.history_type == AgreementHistoryType.CHANGE_REQUEST_UPDATED
    assert new_agreement_history_item.history_title == "Status Change to Executing Approved"
    assert (
        new_agreement_history_item.history_message
        == "Director Derrek approved the status change on BL 15007 from Planned to Executing as requested "
        "by System Owner."
    )

    can_agreement_history_ops_event = loaded_db.get(OpsEvent, 40)
    agreement_history_trigger(can_agreement_history_ops_event, loaded_db)

    loaded_db.flush()  # Ensure items are visible to queries
    # Filter for history items created by this specific ops event
    agreement_history_list = (
        loaded_db.query(AgreementHistory)
        .where(AgreementHistory.ops_event_id == can_agreement_history_ops_event.id)
        .order_by(AgreementHistory.id)
        .all()
    )
    agreement_history_count = len(agreement_history_list)
    can_agreement_history_item = agreement_history_list[agreement_history_count - 1]

    assert can_agreement_history_item.history_type == AgreementHistoryType.CHANGE_REQUEST_UPDATED
    assert can_agreement_history_item.history_title == "Budget Change to CAN Declined"
    assert (
        can_agreement_history_item.history_message
        == "Dave Director declined the budget change on BL 15008 from CAN G99XXX8 to CAN G99SHARED as "
        "requested by System Owner."
    )

    can_agreement_history_ops_event = loaded_db.get(OpsEvent, 41)
    agreement_history_trigger(can_agreement_history_ops_event, loaded_db)

    loaded_db.flush()  # Ensure items are visible to queries
    # Filter for history items created by this specific ops event
    agreement_history_list = (
        loaded_db.query(AgreementHistory)
        .where(AgreementHistory.ops_event_id == can_agreement_history_ops_event.id)
        .order_by(AgreementHistory.id)
        .all()
    )
    agreement_history_count = len(agreement_history_list)
    can_agreement_history_item = agreement_history_list[agreement_history_count - 1]

    assert can_agreement_history_item.history_type == AgreementHistoryType.CHANGE_REQUEST_UPDATED
    assert can_agreement_history_item.history_title == "Budget Change to Amount Approved"
    assert (
        can_agreement_history_item.history_message
        == "Director Derrek approved the budget change on BL 15007 from $700,000.00 to $800,000.00 as "
        "requested by System Owner."
    )

    can_agreement_history_ops_event = loaded_db.get(OpsEvent, 42)
    agreement_history_trigger(can_agreement_history_ops_event, loaded_db)

    loaded_db.flush()  # Ensure items are visible to queries
    # Filter for history items created by this specific ops event
    agreement_history_list = (
        loaded_db.query(AgreementHistory)
        .where(AgreementHistory.ops_event_id == can_agreement_history_ops_event.id)
        .order_by(AgreementHistory.id)
        .all()
    )
    agreement_history_count = len(agreement_history_list)
    can_agreement_history_item = agreement_history_list[agreement_history_count - 1]

    assert can_agreement_history_item.history_type == AgreementHistoryType.CHANGE_REQUEST_UPDATED
    assert can_agreement_history_item.history_title == "Budget Change to Obligate By Approved"
    assert (
        can_agreement_history_item.history_message
        == "Director Derrek approved the budget change on BL 15007 from Obligate By on 06/13/2043 to "
        "07/13/2043 as requested by System Owner."
    )


def test_proc_shop_change_requests(loaded_db, app_ctx):
    proc_shop_agreement_history_ops_event = loaded_db.get(OpsEvent, 43)
    agreement_history_trigger(proc_shop_agreement_history_ops_event, loaded_db)

    loaded_db.flush()  # Ensure items are visible to queries
    # Filter for history items created by this specific ops event
    agreement_history_list = (
        loaded_db.query(AgreementHistory)
        .where(AgreementHistory.ops_event_id == proc_shop_agreement_history_ops_event.id)
        .order_by(AgreementHistory.id)
        .all()
    )
    agreement_history_count = len(agreement_history_list)
    proc_shop_change_request = agreement_history_list[agreement_history_count - 1]

    assert proc_shop_change_request.history_type == AgreementHistoryType.CHANGE_REQUEST_CREATED
    assert proc_shop_change_request.history_title == "Change to Procurement Shop In Review"
    assert (
        proc_shop_change_request.history_message
        == "System Owner requested a change on the Procurement Shop from GCS to IBC and it's currently "
        "In Review for approval. This would change the fee rate from 0% to 4.80% and the fee total from "
        "$0.00 to $48,000.00."
    )

    proc_shop_agreement_history_ops_event = loaded_db.get(OpsEvent, 44)
    agreement_history_trigger(proc_shop_agreement_history_ops_event, loaded_db)

    loaded_db.flush()  # Ensure items are visible to queries

    proc_shop_change_request = loaded_db.scalar(
        select(AgreementHistory)
        .where(AgreementHistory.ops_event_id == proc_shop_agreement_history_ops_event.id)
        .order_by(AgreementHistory.id.desc())
        .limit(1)
    )

    assert proc_shop_change_request.history_type == AgreementHistoryType.CHANGE_REQUEST_UPDATED
    assert proc_shop_change_request.history_title == "Change to Procurement Shop Approved"
    assert (
        proc_shop_change_request.history_message
        == "Director Derrek approved the change on the Procurement Shop from GCS to IBC as requested "
        "by System Owner. This changes the fee rate from 0% to 4.80% and the fee total from $0.00 to "
        "$48,000.00."
    )

    proc_shop_agreement_history_ops_event = loaded_db.get(OpsEvent, 45)
    agreement_history_trigger(proc_shop_agreement_history_ops_event, loaded_db)

    loaded_db.flush()  # Ensure items are visible to queries

    proc_shop_change_request = loaded_db.scalar(
        select(AgreementHistory)
        .where(AgreementHistory.ops_event_id == proc_shop_agreement_history_ops_event.id)
        .order_by(AgreementHistory.id.desc())
        .limit(1)
    )

    assert proc_shop_change_request.history_type == AgreementHistoryType.CHANGE_REQUEST_UPDATED
    assert proc_shop_change_request.history_title == "Change to Procurement Shop Declined"
    assert (
        proc_shop_change_request.history_message
        == "Director Derrek declined the change on the Procurement Shop from GCS to IBC as requested "
        "by System Owner."
    )


def test_proc_shop_updates(loaded_db, app_ctx):
    # Test changes to procurement shop that don't require change requests
    proc_shop_agreement_history_ops_event = loaded_db.get(OpsEvent, 46)
    agreement_history_trigger(proc_shop_agreement_history_ops_event, loaded_db)

    loaded_db.flush()  # Ensure items are visible to queries
    # Filter for history items created by this specific ops event
    agreement_history_list = (
        loaded_db.query(AgreementHistory)
        .where(AgreementHistory.ops_event_id == proc_shop_agreement_history_ops_event.id)
        .order_by(AgreementHistory.id)
        .all()
    )
    agreement_history_count = len(agreement_history_list)
    proc_shop_change_request = agreement_history_list[agreement_history_count - 1]

    assert proc_shop_change_request.history_type == AgreementHistoryType.AGREEMENT_UPDATED
    assert proc_shop_change_request.history_title == "Change to Procurement Shop"
    assert (
        proc_shop_change_request.history_message
        == "Changes made to the OPRE budget spreadsheet changed the Procurement Shop from NIH to IBC. "
        "This changes the fee rate from 0.50% to 4.80% and the fee total from $0.00 to $0.00."
    )


def test_proc_shop_fee_changes(loaded_db, app_ctx):
    # Test changes to procurement shop that don't require change requests
    proc_shop_agreement_history_ops_event = loaded_db.get(OpsEvent, 47)
    agreement_history_trigger(proc_shop_agreement_history_ops_event, loaded_db)

    loaded_db.flush()  # Ensure items are visible to queries
    # Filter for history items created by this specific ops event
    agreement_history_list = (
        loaded_db.query(AgreementHistory)
        .where(AgreementHistory.ops_event_id == proc_shop_agreement_history_ops_event.id)
        .order_by(AgreementHistory.id)
        .all()
    )
    agreement_history_count = len(agreement_history_list)
    proc_shop_change_request = agreement_history_list[agreement_history_count - 1]

    assert proc_shop_change_request.history_type == AgreementHistoryType.PROCUREMENT_SHOP_UPDATED
    assert proc_shop_change_request.history_title == "Change to Procurement Shop Fee Rate"
    assert (
        proc_shop_change_request.history_message == "Steve Tekell changed the current fee rate for GCS from 0% to 6.0%."
    )


def test_agreement_history_create_bli(loaded_db, app_ctx):
    next_agreement_history_ops_event = loaded_db.get(OpsEvent, 48)
    agreement_history_trigger(next_agreement_history_ops_event, loaded_db)

    loaded_db.flush()  # Ensure items are visible to queries
    # Filter for history items created by this specific ops event
    agreement_history_list = (
        loaded_db.query(AgreementHistory)
        .where(AgreementHistory.ops_event_id == next_agreement_history_ops_event.id)
        .order_by(AgreementHistory.id)
        .all()
    )
    agreement_history_count = len(agreement_history_list)
    new_agreement_history_item = agreement_history_list[agreement_history_count - 1]

    assert new_agreement_history_item.history_type == AgreementHistoryType.BUDGET_LINE_ITEM_CREATED
    assert new_agreement_history_item.history_title == "New Budget Line Added"
    assert new_agreement_history_item.history_message == "Steve Tekell added a new budget line 16041."


def test_agreement_history_create_agreement(loaded_db, app_ctx):
    next_agreement_history_ops_event = loaded_db.get(OpsEvent, 49)
    agreement_history_trigger(next_agreement_history_ops_event, loaded_db)

    loaded_db.flush()  # Ensure items are visible to queries
    # Filter for history items created by this specific ops event
    agreement_history_list = (
        loaded_db.query(AgreementHistory)
        .where(AgreementHistory.ops_event_id == next_agreement_history_ops_event.id)
        .order_by(AgreementHistory.id)
        .all()
    )
    agreement_history_count = len(agreement_history_list)
    new_agreement_history_item = agreement_history_list[agreement_history_count - 1]

    assert new_agreement_history_item.history_type == AgreementHistoryType.AGREEMENT_CREATED
    assert new_agreement_history_item.history_title == "Agreement Created"
    assert new_agreement_history_item.history_message == "Agreement created by Steve Tekell."


def test_agreement_history_services_components(loaded_db, app_ctx):
    next_agreement_history_ops_event = loaded_db.get(OpsEvent, 50)
    agreement_history_trigger(next_agreement_history_ops_event, loaded_db)

    loaded_db.flush()  # Ensure items are visible to queries
    # Filter for history items created by this specific ops event
    agreement_history_list = (
        loaded_db.query(AgreementHistory)
        .where(AgreementHistory.ops_event_id == next_agreement_history_ops_event.id)
        .order_by(AgreementHistory.id)
        .all()
    )
    agreement_history_count = len(agreement_history_list)
    new_agreement_history_item = agreement_history_list[agreement_history_count - 1]

    assert new_agreement_history_item.history_type == AgreementHistoryType.SERVICE_COMPONENT_CREATED
    assert new_agreement_history_item.history_title == "New Services Component Added"
    assert (
        new_agreement_history_item.history_message
        == "Changes made to the OPRE budget spreadsheet added new services component OSC3."
    )

    next_agreement_history_ops_event = loaded_db.get(OpsEvent, 51)
    agreement_history_trigger(next_agreement_history_ops_event, loaded_db)

    loaded_db.flush()  # Ensure items are visible to queries
    # Filter for history items created by this specific ops event
    agreement_history_list = (
        loaded_db.query(AgreementHistory)
        .where(AgreementHistory.ops_event_id == next_agreement_history_ops_event.id)
        .order_by(AgreementHistory.id)
        .all()
    )
    agreement_history_count = len(agreement_history_list)
    new_agreement_history_item = agreement_history_list[agreement_history_count - 1]

    assert new_agreement_history_item.history_type == AgreementHistoryType.SERVICE_COMPONENT_DELETED
    assert new_agreement_history_item.history_title == "Services Component Deleted"
    assert (
        new_agreement_history_item.history_message
        == "Changes made to the OPRE budget spreadsheet deleted services component OSC4."
    )

    next_agreement_history_ops_event = loaded_db.get(OpsEvent, 52)
    agreement_history_trigger(next_agreement_history_ops_event, loaded_db)

    loaded_db.flush()  # Ensure items are visible to queries
    # Filter for history items created by this specific ops event
    agreement_history_list = (
        loaded_db.query(AgreementHistory)
        .where(AgreementHistory.ops_event_id == next_agreement_history_ops_event.id)
        .order_by(AgreementHistory.id)
        .all()
    )
    agreement_history_count = len(agreement_history_list)
    first_agreement_item = agreement_history_list[agreement_history_count - 1]
    second_agreement_item = agreement_history_list[agreement_history_count - 2]
    third_agreement_item = agreement_history_list[agreement_history_count - 3]
    fourth_agreement_item = agreement_history_list[agreement_history_count - 4]

    assert first_agreement_item.history_type == AgreementHistoryType.SERVICE_COMPONENT_UPDATED
    assert first_agreement_item.history_title == "Change to Services Component"
    assert (
        first_agreement_item.history_message
        == "Changes made to the OPRE budget spreadsheet changed the description for Services Component SC22."
    )

    assert second_agreement_item.history_type == AgreementHistoryType.SERVICE_COMPONENT_UPDATED
    assert second_agreement_item.history_title == "Change to Services Component"
    assert (
        second_agreement_item.history_message
        == "Changes made to the OPRE budget spreadsheet changed the Period of Performance - End date for "
        "Services Component SC22 from 06/30/2024 to 07/15/2054."
    )

    assert third_agreement_item.history_type == AgreementHistoryType.SERVICE_COMPONENT_UPDATED
    assert third_agreement_item.history_title == "Change to Services Component"
    assert (
        third_agreement_item.history_message
        == "Changes made to the OPRE budget spreadsheet changed the Optional Services Component 22 to "
        "Services Component 22."
    )

    assert fourth_agreement_item.history_type == AgreementHistoryType.SERVICE_COMPONENT_UPDATED
    assert fourth_agreement_item.history_title == "Change to Services Component"
    assert (
        fourth_agreement_item.history_message
        == "Changes made to the OPRE budget spreadsheet changed the component number for Services Component "
        "SC22 from 99 to 22."
    )


def test_agreement_history_bli_deletion(loaded_db, app_ctx):
    next_agreement_history_ops_event = loaded_db.get(OpsEvent, 64)
    agreement_history_trigger(next_agreement_history_ops_event, loaded_db)

    loaded_db.flush()  # Ensure items are visible to queries
    # Filter for history items created by this specific ops event
    agreement_history_list = (
        loaded_db.query(AgreementHistory)
        .where(AgreementHistory.ops_event_id == next_agreement_history_ops_event.id)
        .order_by(AgreementHistory.id)
        .all()
    )
    agreement_history_count = len(agreement_history_list)
    new_agreement_history_item = agreement_history_list[agreement_history_count - 1]

    assert new_agreement_history_item.history_type == AgreementHistoryType.BUDGET_LINE_ITEM_DELETED
    assert new_agreement_history_item.history_title == "Budget Line Deleted"
    assert new_agreement_history_item.history_message == "Steve Tekell deleted the Draft BL 16044."


def test_agreement_history_draft_bli_change(loaded_db, app_ctx):
    # 5 total events to test for
    next_agreement_history_ops_event = loaded_db.get(OpsEvent, 63)
    agreement_history_trigger(next_agreement_history_ops_event, loaded_db)

    loaded_db.flush()  # Ensure items are visible to queries
    # Filter for history items created by this specific ops event
    agreement_history_list = (
        loaded_db.query(AgreementHistory)
        .where(AgreementHistory.ops_event_id == next_agreement_history_ops_event.id)
        .order_by(AgreementHistory.id)
        .all()
    )
    agreement_history_count = len(agreement_history_list)
    new_agreement_history_item = agreement_history_list[agreement_history_count - 1]

    assert new_agreement_history_item.history_type == AgreementHistoryType.BUDGET_LINE_ITEM_UPDATED
    assert new_agreement_history_item.history_title == "Change to Services Component"
    assert (
        new_agreement_history_item.history_message
        == "Steve Tekell changed the services component for BL 16043 from SC1 to SC2."
    )

    new_agreement_history_item = agreement_history_list[agreement_history_count - 2]

    assert new_agreement_history_item.history_type == AgreementHistoryType.BUDGET_LINE_ITEM_UPDATED
    assert new_agreement_history_item.history_title == "Change to Line Description"
    assert new_agreement_history_item.history_message == "Steve Tekell changed the line description for BL 16043."

    new_agreement_history_item = agreement_history_list[agreement_history_count - 3]

    assert new_agreement_history_item.history_type == AgreementHistoryType.BUDGET_LINE_ITEM_UPDATED
    assert new_agreement_history_item.history_title == "Change to Obligate By"
    assert (
        new_agreement_history_item.history_message
        == "Steve Tekell changed the Obligate By date for BL 16043 from 09/24/2025 to 09/26/2025."
    )

    new_agreement_history_item = agreement_history_list[agreement_history_count - 4]

    assert new_agreement_history_item.history_type == AgreementHistoryType.BUDGET_LINE_ITEM_UPDATED
    assert new_agreement_history_item.history_title == "Change to CAN"
    assert (
        new_agreement_history_item.history_message
        == "Steve Tekell changed the CAN for BL 16043 from CAN G1183CE to CAN G990136."
    )

    new_agreement_history_item = agreement_history_list[agreement_history_count - 5]

    assert new_agreement_history_item.history_type == AgreementHistoryType.BUDGET_LINE_ITEM_UPDATED
    assert new_agreement_history_item.history_title == "Change to Amount"
    assert (
        new_agreement_history_item.history_message
        == "Steve Tekell changed the amount for BL 16043 from $12,345.00 to $23,435.00."
    )


def test_agreement_history_cor_and_reason_changes(loaded_db, app_ctx):
    # 5 total events to test for
    next_agreement_history_ops_event = loaded_db.get(OpsEvent, 65)
    agreement_history_trigger(next_agreement_history_ops_event, loaded_db)

    loaded_db.flush()  # Ensure items are visible to queries
    # Filter for history items created by this specific ops event
    agreement_history_list = (
        loaded_db.query(AgreementHistory)
        .where(AgreementHistory.ops_event_id == next_agreement_history_ops_event.id)
        .order_by(AgreementHistory.id)
        .all()
    )
    agreement_history_count = len(agreement_history_list)
    new_agreement_history_item = agreement_history_list[agreement_history_count - 1]

    assert new_agreement_history_item.history_type == AgreementHistoryType.AGREEMENT_UPDATED
    assert new_agreement_history_item.history_title == "Change to Alternate COR"
    assert (
        new_agreement_history_item.history_message == "Steve Tekell changed the Alternate COR from TBD to Amy Madigan."
    )

    new_agreement_history_item = agreement_history_list[agreement_history_count - 2]

    assert new_agreement_history_item.history_type == AgreementHistoryType.AGREEMENT_UPDATED
    assert new_agreement_history_item.history_title == "Change to COR"
    assert new_agreement_history_item.history_message == "Steve Tekell changed the COR from Amelia Popham to TBD."

    new_agreement_history_item = agreement_history_list[agreement_history_count - 3]

    assert new_agreement_history_item.history_type == AgreementHistoryType.AGREEMENT_UPDATED
    assert new_agreement_history_item.history_title == "Change to Reason for Agreement"
    assert (
        new_agreement_history_item.history_message
        == "Steve Tekell changed the Reason for Agreement from New Requirement to Recompete and set the Incumbent to Vendor 3."
    )


def test_agreement_history_agreement_agency_changes(loaded_db, app_ctx):
    # 5 total events to test for
    next_agreement_history_ops_event = loaded_db.get(OpsEvent, 66)
    agreement_history_trigger(next_agreement_history_ops_event, loaded_db)

    loaded_db.flush()  # Ensure items are visible to queries
    # Filter for history items created by this specific ops event
    agreement_history_list = (
        loaded_db.query(AgreementHistory)
        .where(AgreementHistory.ops_event_id == next_agreement_history_ops_event.id)
        .order_by(AgreementHistory.id)
        .all()
    )
    agreement_history_count = len(agreement_history_list)
    new_agreement_history_item = agreement_history_list[agreement_history_count - 1]

    assert new_agreement_history_item.history_type == AgreementHistoryType.AGREEMENT_UPDATED
    assert new_agreement_history_item.history_title == "Change to Requesting Agency"
    assert (
        new_agreement_history_item.history_message
        == "Steve Tekell changed the Requesting Agency from Administration for Children and Families to Requesting Agency Inc."
    )

    new_agreement_history_item = agreement_history_list[agreement_history_count - 2]

    assert new_agreement_history_item.history_type == AgreementHistoryType.AGREEMENT_UPDATED
    assert new_agreement_history_item.history_title == "Change to Servicing Agency"
    assert (
        new_agreement_history_item.history_message
        == "Steve Tekell changed the Servicing Agency from Another Federal Agency to Servicing Federal Agency."
    )


def test_agreement_history_research_methodologies_and_special_topics(loaded_db, app_ctx):
    # clean up existing AgreementHistory entries before this test
    loaded_db.query(AgreementHistory).delete()
    loaded_db.flush()

    # 4 total events to test for
    next_agreement_history_ops_event = loaded_db.get(OpsEvent, 67)
    agreement_history_trigger(next_agreement_history_ops_event, loaded_db)

    loaded_db.flush()  # Ensure items are visible to queries
    # Filter for history items created by this specific ops event
    agreement_history_list = (
        loaded_db.query(AgreementHistory)
        .where(AgreementHistory.ops_event_id == next_agreement_history_ops_event.id)
        .order_by(AgreementHistory.id)
        .all()
    )
    agreement_history_count = len(agreement_history_list)
    new_agreement_history_item = agreement_history_list[agreement_history_count - 1]

    assert new_agreement_history_item.history_type == AgreementHistoryType.AGREEMENT_UPDATED
    assert new_agreement_history_item.history_title == "Change to Research Methodologies"
    assert new_agreement_history_item.history_message == "Steve Tekell removed Research Methodology Impact Study."

    new_agreement_history_item = agreement_history_list[agreement_history_count - 2]

    assert new_agreement_history_item.history_type == AgreementHistoryType.AGREEMENT_UPDATED
    assert new_agreement_history_item.history_title == "Change to Research Methodologies"
    assert (
        new_agreement_history_item.history_message == "Steve Tekell added Research Methodology Knowledge Development."
    )

    new_agreement_history_item = agreement_history_list[agreement_history_count - 3]

    assert new_agreement_history_item.history_type == AgreementHistoryType.AGREEMENT_UPDATED
    assert new_agreement_history_item.history_title == "Change to Special Topic/Population Studied"
    assert (
        new_agreement_history_item.history_message
        == "Steve Tekell removed Special Topic/Population Studied Special Topic 1."
    )

    new_agreement_history_item = agreement_history_list[agreement_history_count - 4]

    assert new_agreement_history_item.history_type == AgreementHistoryType.AGREEMENT_UPDATED
    assert new_agreement_history_item.history_title == "Change to Special Topic/Population Studied"
    assert (
        new_agreement_history_item.history_message
        == "Steve Tekell added Special Topic/Population Studied Special Topic 3."
    )


def test_agreement_history_acquisition_planning_step(loaded_db, app_ctx):
    # clean up existing AgreementHistory entries before this test
    loaded_db.query(AgreementHistory).delete()
    loaded_db.flush()

    next_agreement_history_ops_event = loaded_db.get(OpsEvent, 68)
    agreement_history_trigger(next_agreement_history_ops_event, loaded_db)

    loaded_db.flush()  # Ensure items are visible to queries
    # Filter for history items created by this specific ops event
    agreement_history_list = (
        loaded_db.query(AgreementHistory)
        .where(AgreementHistory.ops_event_id == next_agreement_history_ops_event.id)
        .order_by(AgreementHistory.id)
        .all()
    )
    agreement_history_count = len(agreement_history_list)
    new_agreement_history_item = agreement_history_list[agreement_history_count - 1]

    assert new_agreement_history_item.history_type == AgreementHistoryType.PROCUREMENT_TRACKER_STEP_UPDATED
    assert new_agreement_history_item.history_title == "Acquisition Planning Complete"
    assert (
        new_agreement_history_item.history_message
        == "User Demo completed Step 1: Acquisition Planning and the pre-solicitation package has been sent to the Procurement Shop for review."
    )


def test_add_history_events_prevents_duplicates_in_same_batch(loaded_db):
    """Test that add_history_events prevents duplicate events in the same batch."""
    event1 = AgreementHistory(
        agreement_id=1,
        agreement_id_record=1,
        ops_event_id=None,  # NULL to avoid FK constraint
        history_title="Test Event",
        history_message="This is a test message",
        timestamp=timestamp,
        history_type=AgreementHistoryType.AGREEMENT_CREATED,
    )

    event2 = AgreementHistory(
        agreement_id=1,
        agreement_id_record=1,
        ops_event_id=None,  # NULL to avoid FK constraint
        history_title="Test Event",
        history_message="This is a test message",
        timestamp=timestamp,
        history_type=AgreementHistoryType.AGREEMENT_CREATED,
    )

    # Get initial count
    initial_count = loaded_db.query(AgreementHistory).filter(AgreementHistory.agreement_id_record == 1).count()

    # Add both events in the same batch
    add_history_events([event1, event2], loaded_db)
    loaded_db.flush()

    # Check that only one was added (duplicate detected)
    final_count = loaded_db.query(AgreementHistory).filter(AgreementHistory.agreement_id_record == 1).count()

    assert final_count == initial_count + 1, "Should only add one event, duplicate should be prevented"


def test_add_history_events_prevents_duplicates_from_database(loaded_db, app_ctx):
    """Test that add_history_events prevents duplicates that already exist in the database."""
    # Add first event
    event1 = AgreementHistory(
        agreement_id=1,
        agreement_id_record=1,
        history_title="Test Event DB",
        history_message="This is a test message for DB dedup",
        timestamp=timestamp,
        history_type=AgreementHistoryType.AGREEMENT_UPDATED,
    )

    add_history_events([event1], loaded_db)
    loaded_db.commit()

    initial_count = loaded_db.query(AgreementHistory).filter(AgreementHistory.agreement_id_record == 1).count()

    # Try to add duplicate
    event2 = AgreementHistory(
        agreement_id=1,
        agreement_id_record=1,
        history_title="Test Event DB",
        history_message="This is a test message for DB dedup",
        timestamp=timestamp,
        history_type=AgreementHistoryType.AGREEMENT_UPDATED,
    )

    add_history_events([event2], loaded_db)
    loaded_db.flush()

    final_count = loaded_db.query(AgreementHistory).filter(AgreementHistory.agreement_id_record == 1).count()

    assert final_count == initial_count, "Should not add duplicate that exists in DB"


def test_add_history_events_allows_different_messages(loaded_db, app_ctx):
    """Test that events with different messages are not considered duplicates."""
    event1 = AgreementHistory(
        agreement_id=1,
        agreement_id_record=1,
        history_title="Test Event",
        history_message="Message 1",
        timestamp=timestamp,
        history_type=AgreementHistoryType.AGREEMENT_UPDATED,
    )

    event2 = AgreementHistory(
        agreement_id=1,
        agreement_id_record=1,
        history_title="Test Event",
        history_message="Message 2",  # Different message
        timestamp=timestamp,
        history_type=AgreementHistoryType.AGREEMENT_UPDATED,
    )

    initial_count = loaded_db.query(AgreementHistory).filter(AgreementHistory.agreement_id_record == 1).count()

    add_history_events([event1, event2], loaded_db)
    loaded_db.flush()

    final_count = loaded_db.query(AgreementHistory).filter(AgreementHistory.agreement_id_record == 1).count()

    assert final_count == initial_count + 2, "Should add both events with different messages"


def test_add_history_events_allows_different_types(loaded_db, app_ctx):
    """Test that events with different types are not considered duplicates."""
    event1 = AgreementHistory(
        agreement_id=1,
        agreement_id_record=1,
        history_title="Test Event",
        history_message="Same message",
        timestamp=timestamp,
        history_type=AgreementHistoryType.AGREEMENT_CREATED,  # Different type
    )

    event2 = AgreementHistory(
        agreement_id=1,
        agreement_id_record=1,
        history_title="Test Event",
        history_message="Same message",
        timestamp=timestamp,
        history_type=AgreementHistoryType.AGREEMENT_UPDATED,  # Different type
    )

    initial_count = loaded_db.query(AgreementHistory).filter(AgreementHistory.agreement_id_record == 1).count()

    add_history_events([event1, event2], loaded_db)
    loaded_db.flush()

    final_count = loaded_db.query(AgreementHistory).filter(AgreementHistory.agreement_id_record == 1).count()

    assert final_count == initial_count + 2, "Should add both events with different types"


def test_add_history_events_allows_events_outside_time_window(loaded_db, app_ctx):
    """Test that events outside the 1-minute time window are not considered duplicates."""
    base_time = datetime.utcnow()
    timestamp1 = base_time.strftime("%Y-%m-%dT%H:%M:%S.%fZ")
    # Event 2 minutes later (outside 1-minute window)
    timestamp2 = (base_time + timedelta(minutes=2)).strftime("%Y-%m-%dT%H:%M:%S.%fZ")

    event1 = AgreementHistory(
        agreement_id=1,
        agreement_id_record=1,
        history_title="Test Event",
        history_message="Same message",
        timestamp=timestamp1,
        history_type=AgreementHistoryType.AGREEMENT_UPDATED,
    )

    event2 = AgreementHistory(
        agreement_id=1,
        agreement_id_record=1,
        history_title="Test Event",
        history_message="Same message",
        timestamp=timestamp2,
        history_type=AgreementHistoryType.AGREEMENT_UPDATED,
    )

    initial_count = loaded_db.query(AgreementHistory).filter(AgreementHistory.agreement_id_record == 1).count()

    add_history_events([event1, event2], loaded_db)
    loaded_db.flush()

    final_count = loaded_db.query(AgreementHistory).filter(AgreementHistory.agreement_id_record == 1).count()

    assert final_count == initial_count + 2, "Should add both events outside time window"


def test_add_history_events_deduplicates_with_different_ops_event_ids(loaded_db, app_ctx):
    """Test that duplicates with different ops_event_ids are still caught."""

    event_1 = OpsEvent(event_type=OpsEventType.CREATE_BLI, event_status=OpsEventStatus.SUCCESS, event_details={})
    event_2 = OpsEvent(event_type=OpsEventType.CREATE_BLI, event_status=OpsEventStatus.SUCCESS, event_details={})
    loaded_db.add_all([event_1, event_2])
    loaded_db.commit()

    # Same content but different ops_event_ids
    event1 = AgreementHistory(
        agreement_id=1,
        agreement_id_record=1,
        ops_event_id=event_1.id,  # Different
        history_title="Test Event",
        history_message="Duplicate message",
        timestamp=timestamp,
        history_type=AgreementHistoryType.BUDGET_LINE_ITEM_CREATED,
    )

    event2 = AgreementHistory(
        agreement_id=1,
        agreement_id_record=1,
        ops_event_id=event_2.id,  # Different
        history_title="Test Event",
        history_message="Duplicate message",
        timestamp=timestamp,
        history_type=AgreementHistoryType.BUDGET_LINE_ITEM_CREATED,
    )

    initial_count = loaded_db.query(AgreementHistory).filter(AgreementHistory.agreement_id_record == 1).count()

    add_history_events([event1, event2], loaded_db)
    loaded_db.flush()

    final_count = loaded_db.query(AgreementHistory).filter(AgreementHistory.agreement_id_record == 1).count()

    assert final_count == initial_count + 1, "Should deduplicate even with different ops_event_ids"

    # Clean up
    loaded_db.delete(event_1)
    loaded_db.delete(event_2)
    loaded_db.commit()
