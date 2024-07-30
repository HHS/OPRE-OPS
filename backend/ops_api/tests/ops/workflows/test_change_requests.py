import datetime
from decimal import Decimal

import pytest
from flask import url_for

from models import (
    AgreementChangeRequest,
    AgreementReason,
    AgreementType,
    BudgetLineItem,
    BudgetLineItemChangeRequest,
    BudgetLineItemStatus,
    ChangeRequest,
    ChangeRequestNotification,
    ChangeRequestStatus,
    ChangeRequestType,
    ContractAgreement,
    ContractType,
    Division,
    ServiceRequirementType,
)
from ops_api.ops.resources.agreement_history import find_agreement_histories
from ops_api.ops.utils.procurement_tracker_helper import delete_procurement_tracker

test_no_perms_user_id = 506

# ---=== CHANGE REQUESTS ===---


@pytest.mark.usefixtures("app_ctx")
def test_change_request(auth_client, app):
    session = app.db_session
    change_request = ChangeRequest()
    change_request.created_by = 1
    change_request.requested_change_data = {"foo": "bar"}
    session.add(change_request)
    session.commit()

    assert change_request.id is not None
    new_change_request_id = change_request.id
    change_request = session.get(ChangeRequest, new_change_request_id)
    assert change_request.change_request_type == ChangeRequestType.CHANGE_REQUEST

    session.delete(change_request)
    session.commit()


@pytest.mark.usefixtures("app_ctx")
def test_agreement_change_request(auth_client, app):
    session = app.db_session
    change_request = AgreementChangeRequest()
    change_request.agreement_id = 1
    change_request.created_by = 1
    change_request.requested_change_data = {"foo": "bar"}
    session.add(change_request)
    session.commit()

    assert change_request.id is not None
    new_change_request_id = change_request.id
    change_request = session.get(ChangeRequest, new_change_request_id)
    assert change_request.change_request_type == ChangeRequestType.AGREEMENT_CHANGE_REQUEST

    session.delete(change_request)
    session.commit()


@pytest.mark.usefixtures("app_ctx")
def test_budget_line_item_change_request(auth_client, app, test_bli):
    session = app.db_session
    change_request = BudgetLineItemChangeRequest()
    change_request.budget_line_item_id = test_bli.id
    change_request.agreement_id = 1
    change_request.created_by = 1
    change_request.requested_change_data = {"foo": "bar"}
    session.add(change_request)
    session.commit()

    assert change_request.id is not None
    new_change_request_id = change_request.id
    change_request: ChangeRequest = session.get(ChangeRequest, new_change_request_id)
    assert change_request.change_request_type == ChangeRequestType.BUDGET_LINE_ITEM_CHANGE_REQUEST

    session.delete(change_request)
    session.commit()


@pytest.mark.usefixtures("app_ctx")
def test_budget_line_item_patch_with_budgets_change_requests(auth_client, app, loaded_db, test_admin_user, test_can):
    session = app.db_session
    agreement_id = 1

    # initialize hist count
    hists = find_agreement_histories(agreement_id, limit=100)
    prev_hist_count = len(hists)

    #  create PLANNED BLI
    bli = BudgetLineItem(
        line_description="Grant Expenditure GA999",
        agreement_id=1,
        can_id=test_can.id,
        amount=111.11,
        status=BudgetLineItemStatus.PLANNED,
        created_by=test_admin_user.id,
    )
    session.add(bli)
    session.commit()
    assert bli.id is not None
    bli_id = bli.id

    # verify agreement history added
    hists = find_agreement_histories(agreement_id, limit=100)
    hist_count = len(hists)
    assert hist_count == prev_hist_count + 1
    prev_hist_count = hist_count

    #  submit PATCH BLI which triggers a budget change requests
    data = {"amount": 222.22, "can_id": 501, "date_needed": "2032-02-02"}
    response = auth_client.patch(url_for("api.budget-line-items-item", id=bli_id), json=data)
    assert response.status_code == 202
    resp_json = response.json
    assert "change_requests_in_review" in resp_json
    change_requests_in_review = resp_json["change_requests_in_review"]
    assert len(change_requests_in_review) == 3

    # verify agreement history added for 3 change requests
    hists = find_agreement_histories(agreement_id, limit=100)
    hist_count = len(hists)
    assert hist_count == prev_hist_count + 3
    prev_hist_count = hist_count

    can_id_change_request_id = None
    change_request_ids = []
    for change_request in change_requests_in_review:
        assert "id" in change_request
        change_request_id = change_request["id"]
        change_request_ids.append(change_request_id)
        assert change_request["change_request_type"] == ChangeRequestType.BUDGET_LINE_ITEM_CHANGE_REQUEST.name
        assert change_request["budget_line_item_id"] == bli_id
        assert change_request["has_budget_change"] is True
        assert change_request["has_status_change"] is False
        assert "requested_change_data" in change_request
        requested_change_data = change_request["requested_change_data"]
        assert "requested_change_diff" in change_request
        requested_change_diff = change_request["requested_change_diff"]
        assert requested_change_diff.keys() == requested_change_data.keys()
        if "amount" in requested_change_data:
            assert requested_change_data["amount"] == 222.22
            assert requested_change_diff["amount"]["old"] == 111.11
            assert requested_change_diff["amount"]["new"] == 222.22
        if "date_needed" in requested_change_data:
            assert requested_change_data["date_needed"] == "2032-02-02"
            assert requested_change_diff["date_needed"]["old"] is None
            assert requested_change_diff["date_needed"]["new"] == "2032-02-02"
        if "can_id" in requested_change_data:
            assert can_id_change_request_id is None
            can_id_change_request_id = change_request_id
            assert requested_change_data["can_id"] == 501
            assert requested_change_diff["can_id"]["old"] == 500
            assert requested_change_diff["can_id"]["new"] == 501
    assert can_id_change_request_id is not None

    # verify the BLI was not updated yet
    bli = session.get(BudgetLineItem, bli_id)
    assert str(bli.amount) == "111.11"
    assert bli.amount == Decimal("111.11")
    assert bli.can_id == 500
    assert bli.date_needed is None
    assert len(bli.change_requests_in_review) == len(change_request_ids)
    assert bli.in_review is True

    # verify the change requests and in_review are in the BLI
    response = auth_client.get(url_for("api.budget-line-items-item", id=bli_id))
    assert response.status_code == 200
    resp_json = response.json
    assert "change_requests_in_review" in resp_json
    assert len(resp_json["change_requests_in_review"]) == 3
    assert "in_review" in resp_json
    assert resp_json["in_review"] is True

    # verify the change requests and in_review are in the agreement's BLIs
    response = auth_client.get(url_for("api.agreements-item", id=bli.agreement_id))
    assert response.status_code == 200
    resp_json = response.json
    assert "budget_line_items" in resp_json
    ag_blis = resp_json["budget_line_items"]
    ag_bli = next((bli for bli in ag_blis if bli["id"] == bli_id), None)
    assert ag_bli is not None
    assert "in_review" in ag_bli
    assert ag_bli["in_review"] is True
    assert "change_requests_in_review" in ag_bli
    assert len(ag_bli["change_requests_in_review"]) == 3
    ag_bli_other = next((bli for bli in ag_blis if bli["id"] != bli_id), None)
    assert "in_review" in ag_bli_other
    assert ag_bli_other["in_review"] is False
    assert "change_requests_in_review" in ag_bli
    assert ag_bli_other["change_requests_in_review"] is None

    # verify managing_division
    for change_request in change_requests_in_review:
        assert "managing_division_id" in change_request
        assert change_request["managing_division_id"] == 5

    # review the change requests, reject the can_id change request and approve the others
    for change_request in change_requests_in_review:
        change_request_id = change_request["id"]
        can_request = "can_id" in change_request["requested_change_data"]
        action = "REJECT" if can_request else "APPROVE"
        data = {"change_request_id": change_request_id, "action": action}
        response = auth_client.post(url_for("api.change-request-review-list"), json=data)
        assert response.status_code == 200

    # verify agreement history added for 3 reviews and 2 approved updates
    hists = find_agreement_histories(agreement_id, limit=100)
    hist_count = len(hists)
    assert hist_count == prev_hist_count + 5
    prev_hist_count = hist_count

    # verify the BLI was updated
    bli = session.get(BudgetLineItem, bli_id)
    assert bli.amount == Decimal("222.22")
    assert bli.can_id == 500  # can_id change request was rejected
    assert bli.date_needed == datetime.date(2032, 2, 2)
    assert bli.change_requests_in_review is None
    assert bli.in_review is False

    # verify delete cascade
    session.delete(bli)
    session.commit()
    for change_request_id in change_request_ids:
        change_request = session.get(BudgetLineItemChangeRequest, change_request_id)
        assert change_request is None
    bli = session.get(BudgetLineItem, bli_id)
    assert bli is None

    # verify agreement history added for 1 BLI delete (cascading CR deletes are not tracked)
    hists = find_agreement_histories(agreement_id, limit=100)
    hist_count = len(hists)
    assert hist_count == prev_hist_count + 1


@pytest.mark.usefixtures("app_ctx")
def test_change_request_list(auth_client, app, test_user, test_admin_user, test_bli):
    session = app.db_session

    # verify no change request in list to review for this user
    response = auth_client.get(url_for("api.change-request-list"))
    assert response.status_code == 200
    assert len(response.json) == 0

    # create a change request
    change_request1 = BudgetLineItemChangeRequest()
    change_request1.status = ChangeRequestStatus.IN_REVIEW
    change_request1.budget_line_item_id = test_bli.id
    change_request1.agreement_id = 1
    change_request1.created_by = test_user.id
    change_request1.managing_division_id = 1
    change_request1.requested_change_data = {"key": "value"}
    session.add(change_request1)
    session.commit()

    # verify no change request in the list to review for this user
    response = auth_client.get(url_for("api.change-request-list"))
    assert response.status_code == 200
    assert len(response.json) == 0

    # change division#1 director and division#2 deputy directory to this test user
    division1: Division = session.get(Division, 1)
    division1.division_director_id = test_admin_user.id
    session.add(division1)
    division2: Division = session.get(Division, 2)
    division2.deputy_division_director_id = test_admin_user.id
    session.add(division2)
    session.commit()

    # verify there is one change request in the list to review for this user
    response = auth_client.get(url_for("api.change-request-list"))
    assert response.status_code == 200
    assert len(response.json) == 1
    cr1 = response.json[0]
    assert "has_budget_change" in cr1
    assert not cr1["has_status_change"]
    assert "has_status_change" in cr1
    assert not cr1["has_status_change"]

    # create a change request for division#2
    change_request2 = BudgetLineItemChangeRequest()
    change_request2.status = ChangeRequestStatus.IN_REVIEW
    change_request2.budget_line_item_id = 15001
    change_request2.agreement_id = 1
    change_request2.requested_change_data = {"key": "value"}
    change_request2.created_by = test_user.id
    change_request2.managing_division_id = 2
    session.add(change_request2)
    session.commit()

    # verify there is two change requests in the list to review for this user
    response = auth_client.get(url_for("api.change-request-list"))
    assert response.status_code == 200
    assert len(response.json) == 2

    # review (approve/reject) the change requests
    change_request1.status = ChangeRequestStatus.APPROVED
    change_request2.status = ChangeRequestStatus.REJECTED
    session.add(change_request1)
    session.add(change_request2)
    session.commit()

    # verify no change request in the list to review for this user
    response = auth_client.get(url_for("api.change-request-list"))
    assert response.status_code == 200
    assert len(response.json) == 0

    # cleanup
    division1.division_director_id = 522
    session.add(division1)
    division2.division_director_id = 520
    session.add(division2)
    session.delete(change_request1)
    session.delete(change_request2)
    session.commit()


@pytest.mark.usefixtures("app_ctx")
def test_budget_line_item_patch_with_status_change_requests(auth_client, app, loaded_db, test_admin_user):
    session = app.db_session
    agreement_id = 1

    # initialize hist count
    response = auth_client.get(url_for("api.agreement-history-group", id=agreement_id, limit=100))
    assert response.status_code in [200, 404]
    prev_hist_count = len(response.json) if response.status_code == 200 else 0

    #  create DRAFT BLI with missing required fields
    bli = BudgetLineItem(
        line_description="Grant Expenditure GA999",
        agreement_id=agreement_id,
        status=BudgetLineItemStatus.DRAFT,
        created_by=test_admin_user.id,
    )
    session.add(bli)
    session.commit()
    assert bli.id is not None
    bli_id = bli.id
    assert agreement_id == bli.agreement_id

    # verify agreement history added
    response = auth_client.get(url_for("api.agreement-history-group", id=agreement_id, limit=100))
    assert response.status_code == 200
    hist_count = len(response.json)
    assert hist_count == prev_hist_count + 1
    prev_hist_count = hist_count

    #  submit PATCH BLI which is rejected due to missing required fields
    data = {"status": "PLANNED", "requestor_notes": "Notes from the requestor"}
    response = auth_client.patch(url_for("api.budget-line-items-item", id=bli_id), json=data)
    assert response.status_code == 400
    assert "_schema" in response.json
    assert len(response.json["_schema"]) == 3

    # make the BLI valid for status change
    bli.can_id = 500
    bli.amount = 111.11
    bli.date_needed = datetime.date(2032, 2, 2)
    session.add(bli)
    session.commit()

    # verify agreement history added
    response = auth_client.get(url_for("api.agreement-history-group", id=agreement_id, limit=100))
    assert response.status_code == 200
    hist_count = len(response.json)
    assert hist_count == prev_hist_count + 1
    prev_hist_count = hist_count

    #  submit PATCH BLI which triggers a change request for status change
    response = auth_client.patch(url_for("api.budget-line-items-item", id=bli_id), json=data)

    assert response.status_code == 202
    resp_json = response.json
    assert "change_requests_in_review" in resp_json
    change_requests_in_review = resp_json["change_requests_in_review"]
    assert len(change_requests_in_review) == 1
    change_request = change_requests_in_review[0]
    change_request_id = change_request["id"]
    assert change_request["change_request_type"] == ChangeRequestType.BUDGET_LINE_ITEM_CHANGE_REQUEST.name
    assert change_request["budget_line_item_id"] == bli_id
    assert change_request["has_budget_change"] is False
    assert change_request["has_status_change"] is True
    assert "requested_change_data" in change_request
    requested_change_data = change_request["requested_change_data"]
    assert "requested_change_diff" in change_request
    requested_change_diff = change_request["requested_change_diff"]
    assert requested_change_diff.keys() == requested_change_data.keys()
    assert requested_change_data["status"] == "PLANNED"
    assert requested_change_diff["status"]["old"] == "DRAFT"
    assert requested_change_diff["status"]["new"] == "PLANNED"
    assert "managing_division_id" in change_request
    assert change_request["managing_division_id"] == 5
    assert change_request["requestor_notes"] == data["requestor_notes"]

    # # verify agreement history added for 1 change request
    response = auth_client.get(url_for("api.agreement-history-group", id=agreement_id, limit=100))
    assert response.status_code == 200
    hist_count = len(response.json)
    assert hist_count == prev_hist_count + 1
    prev_hist_count = hist_count

    # verify the change request and in_review are in the BLI
    response = auth_client.get(url_for("api.budget-line-items-item", id=bli_id))
    assert response.status_code == 200
    resp_json = response.json
    assert "change_requests_in_review" in resp_json
    assert len(resp_json["change_requests_in_review"]) == 1
    assert "in_review" in resp_json
    assert resp_json["in_review"] is True

    # verify the change request and in_review are in the agreement's BLIs
    response = auth_client.get(url_for("api.agreements-item", id=agreement_id))
    assert response.status_code == 200
    resp_json = response.json
    assert "budget_line_items" in resp_json
    ag_blis = resp_json["budget_line_items"]
    ag_bli = next((bli for bli in ag_blis if bli["id"] == bli_id), None)
    assert ag_bli is not None
    assert "in_review" in ag_bli
    assert ag_bli["in_review"] is True
    assert "change_requests_in_review" in ag_bli
    assert len(ag_bli["change_requests_in_review"]) == 1
    ag_bli_other = next((bli for bli in ag_blis if bli["id"] != bli_id), None)
    assert "in_review" in ag_bli_other
    assert ag_bli_other["in_review"] is False
    assert "change_requests_in_review" in ag_bli
    assert ag_bli_other["change_requests_in_review"] is None

    # approve the change request
    data = {"change_request_id": change_request_id, "action": "APPROVE", "reviewer_notes": "Notes from the reviewer"}
    response = auth_client.post(url_for("api.change-request-review-list"), json=data)
    assert response.status_code == 200

    # query Notification to find the ChangeRequestNotification for the approval sent to the submitter
    notification = (
        loaded_db.query(ChangeRequestNotification)
        .filter_by(change_request_id=change_request_id, recipient_id=change_request["created_by"])
        .first()
    )
    assert notification is not None
    print(notification.message)
    assert notification.change_request.id == change_request_id

    # verify agreement history added for 1 review and 1 update
    response = auth_client.get(url_for("api.agreement-history-group", id=agreement_id, limit=100))
    hist_count = len(response.json)
    assert hist_count == prev_hist_count + 2
    prev_hist_count = hist_count

    # verify the change request was updated
    change_request = session.get(BudgetLineItemChangeRequest, change_request_id)
    assert change_request.status == ChangeRequestStatus.APPROVED
    assert change_request.reviewer_notes == data["reviewer_notes"]

    # verify the BLI was updated
    bli = session.get(BudgetLineItem, bli_id)
    assert bli.status == BudgetLineItemStatus.PLANNED
    assert bli.change_requests_in_review is None
    assert bli.in_review is False

    # verify delete cascade
    session.delete(bli)
    session.commit()
    change_request = session.get(BudgetLineItemChangeRequest, change_request_id)
    assert change_request is None
    bli = session.get(BudgetLineItem, bli_id)
    assert bli is None

    # verify agreement history added for 1 BLI delete (cascading CR deletes are not tracked)
    response = auth_client.get(url_for("api.agreement-history-group", id=agreement_id, limit=100))
    assert response.status_code == 200
    hist_count = len(response.json)
    assert hist_count == prev_hist_count + 1


@pytest.mark.usefixtures("app_ctx", "loaded_db")
def test_status_change_request_creates_procurement_workflow(
    auth_client, loaded_db, test_admin_user, test_can, test_project
):
    # create Agreement
    agreement = ContractAgreement(
        name="CTXX12399",
        description="test contract",
        agreement_reason=AgreementReason.NEW_REQ,
        contract_type=ContractType.FIRM_FIXED_PRICE,
        service_requirement_type=ServiceRequirementType.SEVERABLE,
        product_service_code_id=2,
        agreement_type=AgreementType.CONTRACT,
        procurement_shop_id=1,
        project_officer_id=test_admin_user.id,
        project_id=test_project.id,
        created_by=test_admin_user.id,
    )
    loaded_db.add(agreement)
    loaded_db.commit()
    assert agreement.id is not None
    agreement_id = agreement.id
    assert agreement.procurement_tracker_id is None

    # create DRAFT BLI
    bli = BudgetLineItem(
        agreement_id=agreement_id,
        can_id=test_can.id,
        amount=123456.78,
        status=BudgetLineItemStatus.PLANNED,
        date_needed=datetime.date(2043, 1, 1),
    )
    loaded_db.add(bli)
    loaded_db.commit()
    assert bli.id is not None
    bli_id = bli.id
    assert bli.agreement.procurement_tracker_id is None

    #  submit PATCH BLI which creates change request for status change
    data = {"status": "IN_EXECUTION"}
    response = auth_client.patch(url_for("api.budget-line-items-item", id=bli_id), json=data)
    assert response.status_code == 202
    assert "change_requests_in_review" in response.json
    change_requests_in_review = response.json["change_requests_in_review"]
    assert len(change_requests_in_review) == 1
    change_request = change_requests_in_review[0]
    change_request_id = change_request["id"]

    # approve the change request
    data = {"change_request_id": change_request_id, "action": "APPROVE", "reviewer_notes": "Notes from the reviewer"}
    response = auth_client.post(url_for("api.change-request-review-list"), json=data)
    assert response.status_code == 200

    bli = loaded_db.get(BudgetLineItem, bli_id)
    assert bli is not None
    assert bli.status == BudgetLineItemStatus.IN_EXECUTION
    assert bli.agreement.procurement_tracker_id is not None

    # cleanup
    delete_procurement_tracker(bli.agreement_id)
    loaded_db.delete(bli)
    loaded_db.delete(agreement)
    loaded_db.commit()


@pytest.mark.usefixtures("app_ctx")
def test_change_request_review_authz(no_perms_auth_client, app, test_user, test_bli):
    session = app.db_session

    # create a change request
    change_request1 = BudgetLineItemChangeRequest()
    change_request1.status = ChangeRequestStatus.IN_REVIEW
    change_request1.budget_line_item_id = test_bli.id
    change_request1.agreement_id = 1
    change_request1.created_by = test_user.id
    change_request1.managing_division_id = 1
    change_request1.requested_change_data = {"key": "value"}
    session.add(change_request1)
    session.commit()

    assert change_request1.id is not None
    change_request_id = change_request1.id

    # verify access denied for use with no permissions (no roles) and not a DD or DDD
    data = {"change_request_id": change_request_id, "action": "APPROVE"}
    response = no_perms_auth_client.post(url_for("api.change-request-review-list"), json=data)
    assert response.status_code == 401  # The app is using 401 where it should be 403s

    # make user a DD of the managing division
    division: Division = session.get(Division, 1)
    division.division_director_id = test_no_perms_user_id
    session.add(division)
    session.commit()

    # verify access now granted
    data = {"change_request_id": change_request_id, "action": "APPROVE"}
    response = no_perms_auth_client.post(url_for("api.change-request-review-list"), json=data)
    assert response.status_code == 200
