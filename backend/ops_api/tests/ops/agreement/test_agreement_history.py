import pytest
from models import AgreementHistory, AgreementHistoryType, OpsEvent

from ops_api.ops.services.agreement_messages import agreement_history_trigger

test_user_id = 503
test_user_name = "Amelia Popham"


@pytest.mark.usefixtures("app_ctx")
def test_update_agreement_agreement_history_trigger(loaded_db):
    next_agreement_history_ops_event = loaded_db.get(OpsEvent, 32)
    agreement_history_trigger(next_agreement_history_ops_event, loaded_db)
    agreement_history_list = loaded_db.query(AgreementHistory).all()
    agreement_history_count = len(agreement_history_list)
    new_agreement_history_item = agreement_history_list[agreement_history_count - 1]
    new_agreement_history_item_2 = agreement_history_list[agreement_history_count - 2]

    assert (
        new_agreement_history_item.history_type
        == AgreementHistoryType.AGREEMENT_UPDATED
    )
    assert new_agreement_history_item.history_title == "Change to Description"
    assert (
        new_agreement_history_item.history_message
        == "Changes made to the OPRE budget spreadsheet changed the agreement description."
    )
    assert (
        new_agreement_history_item_2.history_type
        == AgreementHistoryType.AGREEMENT_UPDATED
    )
    assert new_agreement_history_item_2.history_title == "Change to Agreement Title"
    assert (
        new_agreement_history_item_2.history_message
        == "Changes made to the OPRE budget spreadsheet changed the agreement title from Interoperability "
        "Initiatives to Interoperability Initiatives Test."
    )

    next_agreement_history_ops_event_2 = loaded_db.get(OpsEvent, 33)
    agreement_history_trigger(next_agreement_history_ops_event_2, loaded_db)

    agreement_history_list = loaded_db.query(AgreementHistory).all()
    agreement_history_count = len(agreement_history_list)

    agreement_service_requirement_type_change = agreement_history_list[
        agreement_history_count - 1
    ]
    product_service_code_change = agreement_history_list[agreement_history_count - 2]
    agreement_reason_change = agreement_history_list[agreement_history_count - 3]
    contract_type_change = agreement_history_list[agreement_history_count - 4]
    vendor_change = agreement_history_list[agreement_history_count - 5]

    assert (
        agreement_service_requirement_type_change.history_type
        == AgreementHistoryType.AGREEMENT_UPDATED
    )
    assert (
        agreement_service_requirement_type_change.history_title
        == "Change to Service Requirement Type"
    )
    assert (
        agreement_service_requirement_type_change.history_message
        == "Changes made to the OPRE budget spreadsheet changed the service requirement type from "
        "Non-Severable to Severable."
    )
    assert (
        product_service_code_change.history_type
        == AgreementHistoryType.AGREEMENT_UPDATED
    )
    assert product_service_code_change.history_title == "Change to Product Service Code"
    assert (
        product_service_code_change.history_message
        == "Changes made to the OPRE budget spreadsheet changed the product service code from Other "
        "Scientific and Technical Consulting Services to Convention and Trade Shows."
    )

    assert (
        agreement_reason_change.history_type == AgreementHistoryType.AGREEMENT_UPDATED
    )
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


@pytest.mark.usefixtures("app_ctx")
def test_update_add_remove_team_member_history_trigger(loaded_db):
    next_agreement_history_ops_event = loaded_db.get(OpsEvent, 34)
    agreement_history_trigger(next_agreement_history_ops_event, loaded_db)
    agreement_history_list = loaded_db.query(AgreementHistory).all()
    agreement_history_count = len(agreement_history_list)
    new_agreement_history_item = agreement_history_list[agreement_history_count - 1]
    new_agreement_history_item_2 = agreement_history_list[agreement_history_count - 2]
    new_agreement_history_item_3 = agreement_history_list[agreement_history_count - 3]

    assert (
        new_agreement_history_item.history_type
        == AgreementHistoryType.AGREEMENT_UPDATED
    )
    assert new_agreement_history_item.history_title == "Change to Team Members"
    assert (
        new_agreement_history_item.history_message
        == "Team Member Niki Denmark removed by System Admin."
    )
    assert (
        new_agreement_history_item_2.history_type
        == AgreementHistoryType.AGREEMENT_UPDATED
    )
    assert new_agreement_history_item_2.history_title == "Change to Team Members"
    assert (
        new_agreement_history_item_2.history_message
        == "Team Member Amare Beza added by System Admin."
    )
    assert (
        new_agreement_history_item_3.history_type
        == AgreementHistoryType.AGREEMENT_UPDATED
    )
    assert new_agreement_history_item_3.history_title == "Change to Team Members"
    assert (
        new_agreement_history_item_3.history_message
        == "Team Member Dave Director added by System Admin."
    )


@pytest.mark.usefixtures("app_ctx")
def test_update_bli_status_change_history_trigger(loaded_db):
    next_agreement_history_ops_event = loaded_db.get(OpsEvent, 35)
    agreement_history_trigger(next_agreement_history_ops_event, loaded_db)
    agreement_history_list = loaded_db.query(AgreementHistory).all()
    agreement_history_count = len(agreement_history_list)
    new_agreement_history_item = agreement_history_list[agreement_history_count - 1]

    assert (
        new_agreement_history_item.history_type
        == AgreementHistoryType.CHANGE_REQUEST_CREATED
    )
    assert (
        new_agreement_history_item.history_title
        == "Status Change to Executing In Review"
    )
    assert (
        new_agreement_history_item.history_message
        == "System Owner requested a status change on BL 15007 from Planned to Executing and it's currently "
        "In Review for approval."
    )


@pytest.mark.usefixtures("app_ctx")
def test_update_bli_properties_change_history_trigger(loaded_db):
    next_agreement_history_ops_event = loaded_db.get(OpsEvent, 36)
    agreement_history_trigger(next_agreement_history_ops_event, loaded_db)
    agreement_history_list = loaded_db.query(AgreementHistory).all()
    agreement_history_count = len(agreement_history_list)
    new_agreement_history_item = agreement_history_list[agreement_history_count - 1]

    assert (
        new_agreement_history_item.history_type
        == AgreementHistoryType.CHANGE_REQUEST_CREATED
    )
    assert new_agreement_history_item.history_title == "Budget Change to CAN In Review"
    assert (
        new_agreement_history_item.history_message
        == "System Owner requested a budget change on BL 15008 from CAN G99XXX8 to CAN G99SHARED and it's "
        "currently In Review for approval."
    )

    amount_change_history_ops_event = loaded_db.get(OpsEvent, 37)
    agreement_history_trigger(amount_change_history_ops_event, loaded_db)
    agreement_history_list = loaded_db.query(AgreementHistory).all()
    agreement_history_count = len(agreement_history_list)
    new_agreement_history_item = agreement_history_list[agreement_history_count - 1]

    assert (
        new_agreement_history_item.history_type
        == AgreementHistoryType.CHANGE_REQUEST_CREATED
    )
    assert (
        new_agreement_history_item.history_title == "Budget Change to Amount In Review"
    )
    assert (
        new_agreement_history_item.history_message
        == "System Owner requested a budget change on BL 15007 from $700,000.00 to $800,000.00 and it's "
        "currently In Review for approval."
    )

    obligated_by_change_history_ops_event = loaded_db.get(OpsEvent, 38)
    agreement_history_trigger(obligated_by_change_history_ops_event, loaded_db)
    agreement_history_list = loaded_db.query(AgreementHistory).all()
    agreement_history_count = len(agreement_history_list)
    new_agreement_history_item = agreement_history_list[agreement_history_count - 1]

    assert (
        new_agreement_history_item.history_type
        == AgreementHistoryType.CHANGE_REQUEST_CREATED
    )
    assert (
        new_agreement_history_item.history_title
        == "Budget Change to Obligate By In Review"
    )
    assert (
        new_agreement_history_item.history_message
        == "System Owner requested a budget change on BL 15007 from Obligate By on 06/13/2043 to 07/13/2043 "
        "and it's currently In Review for approval."
    )


def test_agreement_history_change_request_approve_deny(loaded_db):
    next_agreement_history_ops_event = loaded_db.get(OpsEvent, 39)
    agreement_history_trigger(next_agreement_history_ops_event, loaded_db)
    agreement_history_list = loaded_db.query(AgreementHistory).all()
    agreement_history_count = len(agreement_history_list)
    new_agreement_history_item = agreement_history_list[agreement_history_count - 1]

    assert (
        new_agreement_history_item.history_type
        == AgreementHistoryType.CHANGE_REQUEST_UPDATED
    )
    assert (
        new_agreement_history_item.history_title
        == "Status Change to Executing Approved"
    )
    assert (
        new_agreement_history_item.history_message
        == "Director Derrek approved the status change on BL 15007 from Planned to Executing as requested "
        "by System Owner."
    )

    can_agreement_history_ops_event = loaded_db.get(OpsEvent, 40)
    agreement_history_trigger(can_agreement_history_ops_event, loaded_db)
    agreement_history_list = loaded_db.query(AgreementHistory).all()
    agreement_history_count = len(agreement_history_list)
    can_agreement_history_item = agreement_history_list[agreement_history_count - 1]

    assert (
        can_agreement_history_item.history_type
        == AgreementHistoryType.CHANGE_REQUEST_UPDATED
    )
    assert can_agreement_history_item.history_title == "Budget Change to CAN Declined"
    assert (
        can_agreement_history_item.history_message
        == "Dave Director declined the budget change on BL 15008 from CAN G99XXX8 to CAN G99SHARED as "
        "requested by System Owner."
    )

    can_agreement_history_ops_event = loaded_db.get(OpsEvent, 41)
    agreement_history_trigger(can_agreement_history_ops_event, loaded_db)
    agreement_history_list = loaded_db.query(AgreementHistory).all()
    agreement_history_count = len(agreement_history_list)
    can_agreement_history_item = agreement_history_list[agreement_history_count - 1]

    assert (
        can_agreement_history_item.history_type
        == AgreementHistoryType.CHANGE_REQUEST_UPDATED
    )
    assert (
        can_agreement_history_item.history_title == "Budget Change to Amount Approved"
    )
    assert (
        can_agreement_history_item.history_message
        == "Director Derrek approved the budget change on BL 15007 from $700,000.00 to $800,000.00 as "
        "requested by System Owner."
    )

    can_agreement_history_ops_event = loaded_db.get(OpsEvent, 42)
    agreement_history_trigger(can_agreement_history_ops_event, loaded_db)
    agreement_history_list = loaded_db.query(AgreementHistory).all()
    agreement_history_count = len(agreement_history_list)
    can_agreement_history_item = agreement_history_list[agreement_history_count - 1]

    assert (
        can_agreement_history_item.history_type
        == AgreementHistoryType.CHANGE_REQUEST_UPDATED
    )
    assert (
        can_agreement_history_item.history_title
        == "Budget Change to Obligate By Approved"
    )
    assert (
        can_agreement_history_item.history_message
        == "Director Derrek approved the budget change on BL 15007 from Obligate By on 06/13/2043 to "
        "07/13/2043 as requested by System Owner."
    )


@pytest.mark.usefixtures("app_ctx")
def test_proc_shop_change_requests(loaded_db):
    proc_shop_agreement_history_ops_event = loaded_db.get(OpsEvent, 43)
    agreement_history_trigger(proc_shop_agreement_history_ops_event, loaded_db)
    agreement_history_list = loaded_db.query(AgreementHistory).all()
    agreement_history_count = len(agreement_history_list)
    proc_shop_change_request = agreement_history_list[agreement_history_count - 1]

    assert (
        proc_shop_change_request.history_type
        == AgreementHistoryType.CHANGE_REQUEST_CREATED
    )
    assert (
        proc_shop_change_request.history_title == "Change to Procurement Shop In Review"
    )
    assert (
        proc_shop_change_request.history_message
        == "System Owner requested a change on the Procurement Shop from GCS to IBC and it's currently "
        "In Review for approval. This would change the fee rate from 0% to 4.80% and the fee total from "
        "$0.00 to $48,000.00."
    )

    proc_shop_agreement_history_ops_event = loaded_db.get(OpsEvent, 44)
    agreement_history_trigger(proc_shop_agreement_history_ops_event, loaded_db)
    agreement_history_list = loaded_db.query(AgreementHistory).all()
    agreement_history_count = len(agreement_history_list)
    proc_shop_change_request = agreement_history_list[agreement_history_count - 1]

    assert (
        proc_shop_change_request.history_type
        == AgreementHistoryType.CHANGE_REQUEST_UPDATED
    )
    assert (
        proc_shop_change_request.history_title == "Change to Procurement Shop Approved"
    )
    assert (
        proc_shop_change_request.history_message
        == "Director Derrek approved the change on the Procurement Shop from GCS to IBC as requested "
        "by System Owner. This changes the fee rate from 0% to 4.80% and the fee total from $0.00 to "
        "$48,000.00."
    )

    proc_shop_agreement_history_ops_event = loaded_db.get(OpsEvent, 45)
    agreement_history_trigger(proc_shop_agreement_history_ops_event, loaded_db)
    agreement_history_list = loaded_db.query(AgreementHistory).all()
    agreement_history_count = len(agreement_history_list)
    proc_shop_change_request = agreement_history_list[agreement_history_count - 1]

    assert (
        proc_shop_change_request.history_type
        == AgreementHistoryType.CHANGE_REQUEST_UPDATED
    )
    assert (
        proc_shop_change_request.history_title == "Change to Procurement Shop Declined"
    )
    assert (
        proc_shop_change_request.history_message
        == "Director Derrek declined the change on the Procurement Shop from GCS to IBC as requested "
        "by System Owner."
    )


@pytest.mark.usefixtures("app_ctx")
def test_proc_shop_updates(loaded_db):
    # Test changes to procurement shop that don't require change requests
    proc_shop_agreement_history_ops_event = loaded_db.get(OpsEvent, 46)
    agreement_history_trigger(proc_shop_agreement_history_ops_event, loaded_db)
    agreement_history_list = loaded_db.query(AgreementHistory).all()
    agreement_history_count = len(agreement_history_list)
    proc_shop_change_request = agreement_history_list[agreement_history_count - 1]

    assert (
        proc_shop_change_request.history_type == AgreementHistoryType.AGREEMENT_UPDATED
    )
    assert proc_shop_change_request.history_title == "Change to Procurement Shop"
    assert (
        proc_shop_change_request.history_message
        == "Changes made to the OPRE budget spreadsheet changed the Procurement Shop from NIH to IBC. "
        "This changes the fee rate from 0.50% to 4.80% and the fee total from $0.00 to $0.00."
    )


@pytest.mark.usefixtures("app_ctx")
def test_proc_shop_fee_changes(loaded_db):
    # Test changes to procurement shop that don't require change requests
    proc_shop_agreement_history_ops_event = loaded_db.get(OpsEvent, 47)
    agreement_history_trigger(proc_shop_agreement_history_ops_event, loaded_db)
    agreement_history_list = loaded_db.query(AgreementHistory).all()
    agreement_history_count = len(agreement_history_list)
    proc_shop_change_request = agreement_history_list[agreement_history_count - 1]

    assert (
        proc_shop_change_request.history_type
        == AgreementHistoryType.PROCUREMENT_SHOP_UPDATED
    )
    assert (
        proc_shop_change_request.history_title == "Change to Procurement Shop Fee Rate"
    )
    assert (
        proc_shop_change_request.history_message
        == "Steve Tekell changed the current fee rate for GCS from 0% to 6.0%."
    )


@pytest.mark.usefixtures("app_ctx")
def test_agreement_history_create_bli(loaded_db):
    next_agreement_history_ops_event = loaded_db.get(OpsEvent, 48)
    agreement_history_trigger(next_agreement_history_ops_event, loaded_db)
    agreement_history_list = loaded_db.query(AgreementHistory).all()
    agreement_history_count = len(agreement_history_list)
    new_agreement_history_item = agreement_history_list[agreement_history_count - 1]

    assert (
        new_agreement_history_item.history_type
        == AgreementHistoryType.BUDGET_LINE_ITEM_CREATED
    )
    assert new_agreement_history_item.history_title == "New Budget Line Added"
    assert (
        new_agreement_history_item.history_message
        == "Steve Tekell added a new budget line 16041."
    )


@pytest.mark.usefixtures("app_ctx")
def test_agreement_history_create_agreement(loaded_db):
    next_agreement_history_ops_event = loaded_db.get(OpsEvent, 49)
    agreement_history_trigger(next_agreement_history_ops_event, loaded_db)
    agreement_history_list = loaded_db.query(AgreementHistory).all()
    agreement_history_count = len(agreement_history_list)
    new_agreement_history_item = agreement_history_list[agreement_history_count - 1]

    assert (
        new_agreement_history_item.history_type
        == AgreementHistoryType.AGREEMENT_CREATED
    )
    assert new_agreement_history_item.history_title == "Agreement Created"
    assert (
        new_agreement_history_item.history_message
        == "Agreement created by Steve Tekell."
    )


@pytest.mark.usefixtures("app_ctx")
def test_agreement_history_services_components(loaded_db):
    next_agreement_history_ops_event = loaded_db.get(OpsEvent, 50)
    agreement_history_trigger(next_agreement_history_ops_event, loaded_db)
    agreement_history_list = loaded_db.query(AgreementHistory).all()
    agreement_history_count = len(agreement_history_list)
    new_agreement_history_item = agreement_history_list[agreement_history_count - 1]

    assert (
        new_agreement_history_item.history_type
        == AgreementHistoryType.SERVICE_COMPONENT_CREATED
    )
    assert new_agreement_history_item.history_title == "New Services Component Added"
    assert (
        new_agreement_history_item.history_message
        == "Changes made to the OPRE budget spreadsheet added new services component OSC3."
    )

    next_agreement_history_ops_event = loaded_db.get(OpsEvent, 51)
    agreement_history_trigger(next_agreement_history_ops_event, loaded_db)
    agreement_history_list = loaded_db.query(AgreementHistory).all()
    agreement_history_count = len(agreement_history_list)
    new_agreement_history_item = agreement_history_list[agreement_history_count - 1]

    assert (
        new_agreement_history_item.history_type
        == AgreementHistoryType.SERVICE_COMPONENT_DELETED
    )
    assert new_agreement_history_item.history_title == "Services Component Deleted"
    assert (
        new_agreement_history_item.history_message
        == "Changes made to the OPRE budget spreadsheet deleted services component OSC4."
    )

    next_agreement_history_ops_event = loaded_db.get(OpsEvent, 52)
    agreement_history_trigger(next_agreement_history_ops_event, loaded_db)
    agreement_history_list = loaded_db.query(AgreementHistory).all()
    agreement_history_count = len(agreement_history_list)
    first_agreement_item = agreement_history_list[agreement_history_count - 1]
    second_agreement_item = agreement_history_list[agreement_history_count - 2]
    third_agreement_item = agreement_history_list[agreement_history_count - 3]
    fourth_agreement_item = agreement_history_list[agreement_history_count - 4]

    assert (
        first_agreement_item.history_type
        == AgreementHistoryType.SERVICE_COMPONENT_UPDATED
    )
    assert first_agreement_item.history_title == "Change to Services Component"
    assert (
        first_agreement_item.history_message
        == "Changes made to the OPRE budget spreadsheet changed the description for Services Component SC22."
    )

    assert (
        second_agreement_item.history_type
        == AgreementHistoryType.SERVICE_COMPONENT_UPDATED
    )
    assert second_agreement_item.history_title == "Change to Services Component"
    assert (
        second_agreement_item.history_message
        == "Changes made to the OPRE budget spreadsheet changed the Period of Performance - End date for "
        "Services Component SC22 from 06/30/2024 to 07/15/2054."
    )

    assert (
        third_agreement_item.history_type
        == AgreementHistoryType.SERVICE_COMPONENT_UPDATED
    )
    assert third_agreement_item.history_title == "Change to Services Component"
    assert (
        third_agreement_item.history_message
        == "Changes made to the OPRE budget spreadsheet changed the Optional Services Component 22 to "
        "Services Component 22."
    )

    assert (
        fourth_agreement_item.history_type
        == AgreementHistoryType.SERVICE_COMPONENT_UPDATED
    )
    assert fourth_agreement_item.history_title == "Change to Services Component"
    assert (
        fourth_agreement_item.history_message
        == "Changes made to the OPRE budget spreadsheet changed the component number for Services Component "
        "SC22 from 99 to 22."
    )


@pytest.mark.usefixtures("app_ctx")
def test_agreement_history_bli_deletion(loaded_db):
    next_agreement_history_ops_event = loaded_db.get(OpsEvent, 64)
    agreement_history_trigger(next_agreement_history_ops_event, loaded_db)
    agreement_history_list = loaded_db.query(AgreementHistory).all()
    agreement_history_count = len(agreement_history_list)
    new_agreement_history_item = agreement_history_list[agreement_history_count - 1]

    assert (
        new_agreement_history_item.history_type
        == AgreementHistoryType.BUDGET_LINE_ITEM_DELETED
    )
    assert new_agreement_history_item.history_title == "Budget Line Deleted"
    assert (
        new_agreement_history_item.history_message
        == "Steve Tekell deleted the Draft BL 16044."
    )


@pytest.mark.usefixtures("app_ctx")
def test_agreement_history_draft_bli_change(loaded_db):
    # 5 total events to test for
    next_agreement_history_ops_event = loaded_db.get(OpsEvent, 63)
    agreement_history_trigger(next_agreement_history_ops_event, loaded_db)
    agreement_history_list = loaded_db.query(AgreementHistory).all()
    agreement_history_count = len(agreement_history_list)
    new_agreement_history_item = agreement_history_list[agreement_history_count - 1]

    assert (
        new_agreement_history_item.history_type
        == AgreementHistoryType.BUDGET_LINE_ITEM_UPDATED
    )
    assert new_agreement_history_item.history_title == "Change to Services Component"
    assert (
        new_agreement_history_item.history_message
        == "Steve Tekell changed the services component for BL 16043 from SC1 to SC2."
    )

    new_agreement_history_item = agreement_history_list[agreement_history_count - 2]

    assert (
        new_agreement_history_item.history_type
        == AgreementHistoryType.BUDGET_LINE_ITEM_UPDATED
    )
    assert new_agreement_history_item.history_title == "Change to Line Description"
    assert (
        new_agreement_history_item.history_message
        == "Steve Tekell changed the line description for BL 16043."
    )

    new_agreement_history_item = agreement_history_list[agreement_history_count - 3]

    assert (
        new_agreement_history_item.history_type
        == AgreementHistoryType.BUDGET_LINE_ITEM_UPDATED
    )
    assert new_agreement_history_item.history_title == "Change to Obligate By"
    assert (
        new_agreement_history_item.history_message
        == "Steve Tekell changed the Obligate By date for BL 16043 from 09/24/2025 to 09/26/2025."
    )

    new_agreement_history_item = agreement_history_list[agreement_history_count - 4]

    assert (
        new_agreement_history_item.history_type
        == AgreementHistoryType.BUDGET_LINE_ITEM_UPDATED
    )
    assert new_agreement_history_item.history_title == "Change to CAN"
    assert (
        new_agreement_history_item.history_message
        == "Steve Tekell changed the CAN for BL 16043 from CAN G1183CE to CAN G990136."
    )

    new_agreement_history_item = agreement_history_list[agreement_history_count - 5]

    assert (
        new_agreement_history_item.history_type
        == AgreementHistoryType.BUDGET_LINE_ITEM_UPDATED
    )
    assert new_agreement_history_item.history_title == "Change to Amount"
    assert (
        new_agreement_history_item.history_message
        == "Steve Tekell changed the amount for BL 16043 from $12,345.00 to $23,435.00."
    )


@pytest.mark.usefixtures("app_ctx")
def test_agreement_history_cor_and_reason_changes(loaded_db):
    # 5 total events to test for
    next_agreement_history_ops_event = loaded_db.get(OpsEvent, 65)
    agreement_history_trigger(next_agreement_history_ops_event, loaded_db)
    agreement_history_list = loaded_db.query(AgreementHistory).all()
    agreement_history_count = len(agreement_history_list)
    new_agreement_history_item = agreement_history_list[agreement_history_count - 1]

    assert (
        new_agreement_history_item.history_type
        == AgreementHistoryType.AGREEMENT_UPDATED
    )
    assert new_agreement_history_item.history_title == "Change to Alternate COR"
    assert (
        new_agreement_history_item.history_message
        == "Steve Tekell changed the Alternate COR from TBD to Amy Madigan."
    )

    new_agreement_history_item = agreement_history_list[agreement_history_count - 2]

    assert (
        new_agreement_history_item.history_type
        == AgreementHistoryType.AGREEMENT_UPDATED
    )
    assert new_agreement_history_item.history_title == "Change to COR"
    assert (
        new_agreement_history_item.history_message
        == "Steve Tekell changed the COR from Amelia Popham to TBD."
    )

    new_agreement_history_item = agreement_history_list[agreement_history_count - 3]

    assert (
        new_agreement_history_item.history_type
        == AgreementHistoryType.AGREEMENT_UPDATED
    )
    assert new_agreement_history_item.history_title == "Change to Reason for Agreement"
    assert (
        new_agreement_history_item.history_message
        == "Steve Tekell changed the Reason for Agreement from New Requirement to Recompete and set the Incumbent to Vendor 3."
    )


@pytest.mark.usefixtures("app_ctx")
def test_agreement_history_agreement_agency_changes(loaded_db):
    # 5 total events to test for
    next_agreement_history_ops_event = loaded_db.get(OpsEvent, 66)
    agreement_history_trigger(next_agreement_history_ops_event, loaded_db)
    agreement_history_list = loaded_db.query(AgreementHistory).all()
    agreement_history_count = len(agreement_history_list)
    new_agreement_history_item = agreement_history_list[agreement_history_count - 1]

    assert (
        new_agreement_history_item.history_type
        == AgreementHistoryType.AGREEMENT_UPDATED
    )
    assert new_agreement_history_item.history_title == "Change to Requesting Agency"
    assert (
        new_agreement_history_item.history_message
        == "Steve Tekell changed the Requesting Agency from Administration for Children and Families to Requesting Agency Inc."
    )

    new_agreement_history_item = agreement_history_list[agreement_history_count - 2]

    assert (
        new_agreement_history_item.history_type
        == AgreementHistoryType.AGREEMENT_UPDATED
    )
    assert new_agreement_history_item.history_title == "Change to Servicing Agency"
    assert (
        new_agreement_history_item.history_message
        == "Steve Tekell changed the Servicing Agency from Another Federal Agency to Servicing Federal Agency."
    )
